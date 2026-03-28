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
    serviceUtilization: { name: string; count: number; revenue: number }[]
    staffEfficiency: { name: string; completionRate: number; totalHours: number }[]
}

export async function getDashboardStatsAction(businessId: string) {
    try {
        const supabase = await createClient()
        const today = new Date()
        const todayStr = today.toISOString().split("T")[0]

        // Start of current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]

        // 1. Fetch appointments for the month with services
        const { data: monthApts, error: aptError } = await supabase
            .from("appointments")
            .select("id, status, total_price, staff_business_id, total_duration_minutes, services:appointment_services(service:services(name), price_snapshot)")
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
            const weekRev = allApts
                .filter(a => a.status === "Tamamlandı")
                .reduce((sum, a) => sum + (Number(a.total_price) || 0) / 4, 0)
            weeklyRevenue.push({ week: weekLabel, revenue: Math.round(weekRev) })
        }

        // 4. Service Utilization
        const svcMap: Record<string, { count: number; revenue: number }> = {}
        allApts.forEach(apt => {
            const svcs = Array.isArray(apt.services) ? apt.services : [apt.services]
            svcs.forEach((as: any) => {
                const svc = Array.isArray(as.service) ? as.service[0] : as.service
                if (svc?.name) {
                    if (!svcMap[svc.name]) svcMap[svc.name] = { count: 0, revenue: 0 }
                    svcMap[svc.name].count++
                    svcMap[svc.name].revenue += Number(as.price_snapshot) || 0
                }
            })
        })
        const serviceUtilization = Object.entries(svcMap)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // 5. Staff Performance & Efficiency
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

        const staffEfficiency = (staffData || []).map(s => {
            const usr = Array.isArray(s.user) ? s.user[0] : s.user
            const staffApts = allApts.filter(a => a.staff_business_id === s.id)
            const completed = staffApts.filter(a => a.status === "Tamamlandı").length
            const totalHours = staffApts
                .filter(a => a.status === "Tamamlandı")
                .reduce((sum, a) => sum + (a.total_duration_minutes || 0) / 60, 0)

            return {
                name: usr?.name || "?",
                completionRate: staffApts.length > 0 ? Math.round((completed / staffApts.length) * 100) : 0,
                totalHours: Math.round(totalHours * 10) / 10
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
                staffPerformance,
                serviceUtilization,
                staffEfficiency
            } as DashboardStats
        }
    } catch (err: any) {
        Sentry.captureException(err, { 
            tags: { module: 'core', action: 'getDashboardStatsAction' }, 
            extra: { 
                code: err?.code, 
                details: err?.details, 
                hint: err?.hint 
            } 
        })
        return { success: false, error: "İstatistikler yüklenemedi." }
    }
}
