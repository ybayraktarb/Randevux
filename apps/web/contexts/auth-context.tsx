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
    globalRole: "super_admin" | "user"
}

export interface BusinessInfo {
    id: string
    name: string
}

export interface AuthState {
    loading: boolean
    error: string | null
    user: User | null
    profile: UserProfile | null
    /** Aktif işletme adı (self-contained kullanım için korundu) */
    businessName: string | null
    /** Aktif işletme ID'si */
    businessId: string | null
    /** Patron'un tüm işletmeleri — çok işletme UI için hazır */
    businesses: BusinessInfo[]
    role: UserRole | null
    dashboardPath: string | null
    subscriptionStatus: string | null
}

// ─── Context ────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthState>({
    loading: true,
    error: null,
    user: null,
    profile: null,
    businessName: null,
    businessId: null,
    businesses: [],
    role: null,
    dashboardPath: null,
    subscriptionStatus: null,
})

// ─── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        loading: true,
        error: null,
        user: null,
        profile: null,
        businessName: null,
        businessId: null,
        businesses: [],
        role: null,
        dashboardPath: null,
        subscriptionStatus: null,
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
                        businessId: null,
                        businesses: [],
                        role: null,
                        dashboardPath: null,
                        subscriptionStatus: null,
                    })
                }
                return
            }

            // 2-4. Profil + tüm işletmeler + rol — paralel
            const [profileResult, ownersResult, roleResult] = await Promise.all([
                // Profil: global_role dahil (migration 036)
                supabase
                    .from("users")
                    .select("name, email, phone, avatar_url, global_role")
                    .eq("id", authUser.id)
                    .maybeSingle(),

                // Patron'un TÜM işletmeleri (maybeSingle → select, çok işletme desteği)
                supabase
                    .from("business_owners")
                    .select("business_id, business:businesses(id, name)")
                    .eq("user_id", authUser.id),

                // Rol tespiti
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
                    globalRole: (pd.global_role as "super_admin" | "user") ?? "user",
                }
                : {
                    name: authUser.user_metadata?.name || "",
                    email: authUser.email || "",
                    phone: null,
                    avatarUrl: null,
                    globalRole: "user",
                }

            // İşletme listesi (patron için)
            let businesses: BusinessInfo[] = []
            let businessId: string | null = null
            let businessName: string | null = null

            const ownersData = ownersResult.data ?? []
            if (ownersData.length > 0) {
                businesses = ownersData
                    .map((row: any) => {
                        const biz = Array.isArray(row.business) ? row.business[0] : row.business
                        return biz ? { id: biz.id, name: biz.name } : null
                    })
                    .filter(Boolean) as BusinessInfo[]

                // İlk işletmeyi aktif seç (ileriki sürümde kullanıcı seçebilir)
                if (businesses.length > 0) {
                    businessId = businesses[0].id
                    businessName = businesses[0].name
                }
            } else {
                // Personel mi?
                const { data: staffData } = await supabase
                    .from("staff_business")
                    .select("business_id, business:businesses(id, name)")
                    .eq("user_id", authUser.id)
                    .eq("is_active", true)
                    .maybeSingle()

                if (!cancelled.value && staffData) {
                    businessId = staffData.business_id
                    const biz = (staffData as any).business
                    businessName = (Array.isArray(biz) ? biz[0]?.name : biz?.name) || null
                }
            }

            if (cancelled.value) return

            setState({
                loading: false,
                error: null,
                user: authUser,
                profile,
                businessName,
                businessId,
                businesses,
                role: roleResult,
                dashboardPath: getDashboardPath(roleResult),
                subscriptionStatus: null, // Birazdan güncelleyeceğiz
            })

            // 5. Abonelik Durumu (Eğer işletme varsa)
            if (businessId && !cancelled.value) {
                const { data: subData } = await supabase
                    .from("subscriptions")
                    .select("status")
                    .eq("business_id", businessId)
                    .maybeSingle()
                
                if (!cancelled.value && subData) {
                    setState(prev => ({ ...prev, subscriptionStatus: subData.status }))
                }
            }
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
                            businessId: null,
                            businesses: [],
                            role: null,
                            dashboardPath: null,
                            subscriptionStatus: null,
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
