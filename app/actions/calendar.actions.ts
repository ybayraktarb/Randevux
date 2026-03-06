"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"

export interface StaffResource {
    id: string
    name: string
    role?: string
    avatar_url?: string
}

export interface CalendarAppointment {
    id: string
    start_time: string
    end_time: string
    status: string
    customer_name: string
    service_name: string
    staff_business_id: string
    is_vip: boolean
    total_duration_minutes: number
    services: { name: string, duration: number, buffer: number }[]
}

export async function getCalendarGridDataAction(businessId: string, date: string) {
    try {
        const supabase = await createClient()

        // 1. Get Day of Week (0-6, JS style)
        const d = new Date(date)
        const dayOfWeek = d.getDay()

        // 2. Fetch Business Hours, Closed Dates, Staff and Appointments
        const [hoursRes, closedRes, staffRes, aptsRes, schedulesRes, leavesRes, breaksRes] = await Promise.all([
            supabase.from("business_hours").select("day_of_week, open_time, close_time, is_open").eq("business_id", businessId).eq("day_of_week", dayOfWeek).maybeSingle(),
            supabase.from("business_closed_dates").select("date, reason").eq("business_id", businessId).eq("date", date).maybeSingle(),
            supabase.from("staff_business").select(`
                id,
                role,
                user:users!staff_business_user_id_fkey(name, avatar_url)
            `).eq("business_id", businessId).eq("is_active", true),
            supabase.from("appointments").select(`
                id,
                start_time,
                end_time,
                status,
                staff_business_id,
                customer:business_customers(
                    is_vip,
                    user:users(name)
                ),
                services:appointment_services(
                    service:services(name),
                    duration_snapshot,
                    buffer_snapshot
                )
            `).eq("business_id", businessId).eq("appointment_date", date).neq("status", "İptal"),
            supabase.from("work_schedule_templates").select("staff_business_id, day_of_week, start_time, end_time, is_working").eq("day_of_week", dayOfWeek),
            supabase.from("leave_requests").select("staff_business_id, date, start_time, end_time, request_type, status").eq("date", date).eq("status", "approved"),
            supabase.from("break_schedules").select("staff_business_id, day_of_week, start_time, end_time, label").eq("day_of_week", dayOfWeek)
        ])

        if (staffRes.error) throw staffRes.error
        if (aptsRes.error) throw aptsRes.error

        const staffIds = (staffRes.data || []).map((s: any) => s.id)

        // Filter schedules, leaves, and breaks for the current staff in this business
        const staffSchedules = (schedulesRes.data || []).filter(s => staffIds.includes(s.staff_business_id))
        const staffLeaves = (leavesRes.data || []).filter(l => staffIds.includes(l.staff_business_id))
        const staffBreaks = (breaksRes.data || []).filter(b => staffIds.includes(b.staff_business_id))

        const staffList: StaffResource[] = (staffRes.data || []).map(s => {
            const u = Array.isArray(s.user) ? s.user[0] : s.user
            return {
                id: s.id,
                name: u?.name || "Bilinmiyor",
                role: s.role,
                avatar_url: u?.avatar_url
            }
        })

        const appointments: CalendarAppointment[] = (aptsRes.data || []).map(a => {
            const custArr = Array.isArray(a.customer) ? a.customer[0] : a.customer
            const userArr = Array.isArray(custArr?.user) ? custArr.user[0] : custArr?.user
            let isVip = false
            let custName = "?"
            if (custArr) {
                isVip = custArr.is_vip || false
                custName = userArr?.name || "?"
            }

            const svcs = Array.isArray(a.services) ? a.services : []
            const formattedServices = svcs.map((s: any) => ({
                name: Array.isArray(s.service) ? s.service[0]?.name : s.service?.name || "Hizmet",
                duration: s.duration_snapshot,
                buffer: s.buffer_snapshot
            }))

            const firstSvc = formattedServices[0]
            const svcName = firstSvc?.name || "Hizmet"
            const totalDuration = formattedServices.reduce((sum, s) => sum + (s.duration || 0) + (s.buffer || 0), 0)

            return {
                id: a.id,
                start_time: a.start_time,
                end_time: a.end_time,
                status: a.status,
                staff_business_id: a.staff_business_id,
                customer_name: custName,
                service_name: svcName,
                is_vip: isVip,
                total_duration_minutes: totalDuration,
                services: formattedServices
            }
        })

        return {
            success: true,
            staff: staffList,
            appointments,
            businessHours: hoursRes.data || null,
            isClosed: !!closedRes.data,
            staffSchedules,
            staffLeaves,
            staffBreaks
        }
    } catch (err: any) {
        console.error("Calendar fetch error:", err)
        Sentry.captureException(err)
        return { success: false, error: err.message || "Takvim verisi alınamadı." }
    }
}

export async function getMonthDensityAction(businessId: string, year: number, month: number) {
    try {
        const supabase = await createClient()

        // Calculate start and end of the month
        const startDate = new Date(year, month, 1).toISOString().split('T')[0]
        const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

        const { data, error } = await supabase
            .from("appointments")
            .select("appointment_date")
            .eq("business_id", businessId)
            .gte("appointment_date", startDate)
            .lte("appointment_date", endDate)
            .neq("status", "İptal")

        if (error) throw error

        // Count appointments per day
        const counts: Record<string, number> = {}
        data.forEach(item => {
            counts[item.appointment_date] = (counts[item.appointment_date] || 0) + 1
        })

        return { success: true, counts }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message, counts: {} }
    }
}
