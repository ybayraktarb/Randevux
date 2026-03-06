"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"

export type DashboardStats = {
    totalRevenue: number
    totalAppointments: number
    noShowCount: number
    pendingApprovals: number
    totalCustomers: number
    vipCount: number
    weeklyRevenue: { week: string; revenue: number }[]
    staffPerformance: { name: string; count: number; percent: number }[]
}

export async function getDashboardStatsAction(businessId: string) {
    try {
        const supabase = await createClient()
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        // Start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]

        // 1. Fetch appointments for the month
        const { data: monthApts, error: aptError } = await supabase
            .from("appointments")
            .select("id, status, total_price, staff_business_id")
            .eq("business_id", businessId)
            .gte("appointment_date", startOfMonth)

        if (aptError) throw aptError

        const allApts = monthApts || []

        // Summary counts
        const totalAppointments = allApts.length
        const noShowCount = allApts.filter(a => a.status === "Gelmedi").length
        const pendingApprovals = allApts.filter(a => a.status === "Bekliyor").length
        const totalRevenue = allApts
            .filter(a => a.status === "Tamamlandı")
            .reduce((sum, a) => sum + (Number(a.total_price) || 0), 0)

        // 2. Fetch customer stats
        const { data: custData } = await supabase
            .from("business_customers")
            .select("id, is_vip")
            .eq("business_id", businessId)

        const totalCustomers = custData?.length || 0
        const vipCount = custData?.filter(c => c.is_vip).length || 0

        // 3. Weekly breakdown (last 4 weeks)
        const weeklyRevenue: { week: string; revenue: number }[] = []
        for (let i = 3; i >= 0; i--) {
            const weekLabel = `H${4 - i}`
            // Simplified: group by approx 7 day chunks
            const weekRev = allApts
                .filter(a => a.status === "Tamamlandı")
                .reduce((sum, a) => sum + (Number(a.total_price) || 0) / 4, 0) // Approximation for now
            weeklyRevenue.push({ week: weekLabel, revenue: Math.round(weekRev) })
        }

        // 3. Staff performance
        const { data: staffData } = await supabase
            .from("staff_business")
            .select("id, user:users(name)")
            .eq("business_id", businessId)
            .eq("is_active", true)

        const maxApts = Math.max(1, totalAppointments)
        const staffPerformance = (staffData || []).map(s => {
            const usr = Array.isArray(s.user) ? s.user[0] : s.user
            const count = allApts.filter(a => a.staff_business_id === s.id).length
            return {
                name: usr?.name || "?",
                count,
                percent: Math.round((count / maxApts) * 100)
            }
        })

        return {
            success: true,
            data: {
                totalRevenue,
                totalAppointments,
                noShowCount,
                pendingApprovals,
                totalCustomers,
                vipCount,
                weeklyRevenue,
                staffPerformance
            } as DashboardStats
        }
    } catch (err) {
        Sentry.captureException(err)
        return { success: false, error: "İstatistikler yüklenemedi." }
    }
}
