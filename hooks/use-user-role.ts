"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { getUserRole, getDashboardPath, type UserRole } from "@/lib/supabase/roles"

export interface UseUserRoleReturn {
    loading: boolean
    role: UserRole | null
    dashboardPath: string | null
}

export function useUserRole(): UseUserRoleReturn {
    const [loading, setLoading] = useState(true)
    const [role, setRole] = useState<UserRole | null>(null)
    const [dashboardPath, setDashboardPath] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        let cancelled = false

        async function fetchRole() {
            try {
                setLoading(true)
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error || !user) {
                    if (!cancelled) {
                        setRole(null)
                        setDashboardPath(null)
                    }
                    return
                }
                const userRole = await getUserRole(supabase, user.id)
                if (!cancelled) {
                    setRole(userRole)
                    setDashboardPath(getDashboardPath(userRole))
                }
            } catch {
                if (!cancelled) {
                    setRole(null)
                    setDashboardPath(null)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        fetchRole()

        return () => {
            cancelled = true
        }
    }, [])

    return { loading, role, dashboardPath }
}
