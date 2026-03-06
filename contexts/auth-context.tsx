"use client"

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserRole, getDashboardPath, type UserRole } from "@/lib/supabase/roles"
import type { User } from "@supabase/supabase-js"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
    name: string
    email: string
    phone: string | null
    avatarUrl: string | null
}

export interface AuthState {
    loading: boolean
    error: string | null
    user: User | null
    profile: UserProfile | null
    businessName: string | null
    role: UserRole | null
    dashboardPath: string | null
}

// ─── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
    loading: true,
    error: null,
    user: null,
    profile: null,
    businessName: null,
    role: null,
    dashboardPath: null,
})

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        loading: true,
        error: null,
        user: null,
        profile: null,
        businessName: null,
        role: null,
        dashboardPath: null,
    })

    const supabase = createClient()

    const fetchAuth = useCallback(async (cancelled: { value: boolean }) => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            // 1. Auth user (seri — user id gerekmeden diğerleri başlatılamaz)
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

            if (authError || !authUser) {
                if (!cancelled.value) {
                    setState({
                        loading: false,
                        error: null,
                        user: null,
                        profile: null,
                        businessName: null,
                        role: null,
                        dashboardPath: null,
                    })
                }
                return
            }

            // 2-4. Tüm profile/role/business sorguları paralel
            const [profileResult, ownerResult, roleResult] = await Promise.all([
                // 2. Profil (users tablosu)
                supabase
                    .from("users")
                    .select("name, email, phone, avatar_url")
                    .eq("id", authUser.id)
                    .maybeSingle(),

                // 3. İşletme sahibi mi? (business_owners)
                supabase
                    .from("business_owners")
                    .select("business_id, business:businesses(name)")
                    .eq("user_id", authUser.id)
                    .maybeSingle(),

                // 4. Rol (getUserRole kendi içinde 3 sorguyu Promise.all yapar)
                getUserRole(supabase, authUser.id),
            ])

            if (cancelled.value) return

            // Profil
            const pd = profileResult.data
            const profile: UserProfile = pd
                ? {
                    name: pd.name || authUser.user_metadata?.name || "",
                    email: pd.email || authUser.email || "",
                    phone: pd.phone || null,
                    avatarUrl: pd.avatar_url || null,
                }
                : {
                    name: authUser.user_metadata?.name || "",
                    email: authUser.email || "",
                    phone: null,
                    avatarUrl: null,
                }

            // İşletme adı: önce owner'dan bak, yoksa staff_business'dan
            let businessName: string | null = null
            const ownerRow = ownerResult.data
            if (ownerRow?.business_id) {
                // business join'i owner sorgusunda zaten geldi
                const biz = (ownerRow as any).business
                businessName = (Array.isArray(biz) ? biz[0]?.name : biz?.name) || null
            } else {
                // Personel mi?
                const { data: staffData } = await supabase
                    .from("staff_business")
                    .select("business:businesses(name)")
                    .eq("user_id", authUser.id)
                    .eq("is_active", true)
                    .maybeSingle()
                if (!cancelled.value && staffData) {
                    const biz = (staffData as any).business
                    businessName = (Array.isArray(biz) ? biz[0]?.name : biz?.name) || null
                }
            }

            if (cancelled.value) return

            const role = roleResult
            setState({
                loading: false,
                error: null,
                user: authUser,
                profile,
                businessName,
                role,
                dashboardPath: getDashboardPath(role),
            })
        } catch (err) {
            console.error("[AuthProvider] fetchAuth error:", err)
            if (!cancelled.value) {
                setState(prev => ({
                    ...prev,
                    loading: false,
                    error: "Kullanıcı bilgileri alınırken hata oluştu.",
                }))
            }
        }
    }, [supabase])

    useEffect(() => {
        const cancelled = { value: false }
        fetchAuth(cancelled)

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    fetchAuth(cancelled)
                } else {
                    if (!cancelled.value) {
                        setState({
                            loading: false,
                            error: null,
                            user: null,
                            profile: null,
                            businessName: null,
                            role: null,
                            dashboardPath: null,
                        })
                    }
                }
            }
        )

        return () => {
            cancelled.value = true
            subscription.unsubscribe()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

// ─── Hook ────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthState {
    return useContext(AuthContext)
}
