"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export interface UserProfile {
    name: string
    email: string
    phone: string | null
    avatarUrl: string | null
}

export interface UseCurrentUserReturn {
    loading: boolean
    error: string | null
    user: User | null
    profile: UserProfile | null
    businessName: string | null
}

export function useCurrentUser(): UseCurrentUserReturn {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [businessName, setBusinessName] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        let cancelled = false

        async function fetchUser() {
            try {
                setLoading(true)
                setError(null)

                // 1. Auth user
                const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
                if (authError || !authUser) {
                    if (!cancelled) {
                        setUser(null)
                        setProfile(null)
                        setBusinessName(null)
                        setLoading(false)
                    }
                    return
                }
                if (!cancelled) setUser(authUser)

                // 2. Profile from users table
                const { data: profileData, error: profileError } = await supabase
                    .from("users")
                    .select("name, email, phone, avatar_url")
                    .eq("id", authUser.id)
                    .maybeSingle()

                if (profileError) {
                    if (!cancelled) setError("Profil bilgileri alınamadı.")
                }

                if (!cancelled && profileData) {
                    setProfile({
                        name: profileData.name || authUser.user_metadata?.name || "",
                        email: profileData.email || authUser.email || "",
                        phone: profileData.phone || null,
                        avatarUrl: profileData.avatar_url || null,
                    })
                } else if (!cancelled) {
                    // Fallback to auth metadata
                    setProfile({
                        name: authUser.user_metadata?.name || "",
                        email: authUser.email || "",
                        phone: null,
                        avatarUrl: null,
                    })
                }

                // 3. Check if patron (business_owners)
                const { data: ownerData } = await supabase
                    .from("business_owners")
                    .select("business_id")
                    .eq("user_id", authUser.id)
                    .maybeSingle()

                if (ownerData?.business_id) {
                    const { data: biz } = await supabase
                        .from("businesses")
                        .select("name")
                        .eq("id", ownerData.business_id)
                        .maybeSingle()
                    if (!cancelled) setBusinessName(biz?.name || null)
                } else {
                    // 4. Check if staff (staff_business)
                    const { data: staffData } = await supabase
                        .from("staff_business")
                        .select("business_id")
                        .eq("user_id", authUser.id)
                        .eq("is_active", true)
                        .maybeSingle()

                    if (staffData?.business_id) {
                        const { data: biz } = await supabase
                            .from("businesses")
                            .select("name")
                            .eq("id", staffData.business_id)
                            .maybeSingle()
                        if (!cancelled) setBusinessName(biz?.name || null)
                    } else {
                        if (!cancelled) setBusinessName(null)
                    }
                }
            } catch {
                if (!cancelled) setError("Kullanıcı bilgileri alınırken hata oluştu.")
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchUser()

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    fetchUser()
                } else {
                    setUser(null)
                    setProfile(null)
                    setBusinessName(null)
                    setLoading(false)
                }
            }
        )

        return () => {
            cancelled = true
            subscription.unsubscribe()
        }
    }, [])

    return { loading, error, user, profile, businessName }
}
