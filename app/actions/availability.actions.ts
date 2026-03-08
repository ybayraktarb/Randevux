"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"

interface SlotParams {
    businessId: string
    date: string // YYYY-MM-DD
    staffBusinessId: string | "ANY"
    serviceIds: string[]
}

export interface TimeSlot {
    time: string
    status: "available" | "booked" | "break"
}

/**
 * Müşteri için müsait randevu saatlerini hesaplar.
 * Buffer time ve personel bazlı özel süreleri dikkate alır.
 */
export async function getAvailableSlotsAction(params: SlotParams) {
    try {
        const supabase = await createClient()
        const { businessId, date, staffBusinessId, serviceIds } = params

        // 1. İşletme genel kapalı gün kontrolü
        const { data: isClosed } = await supabase
            .from("business_closed_dates")
            .select("id")
            .eq("business_id", businessId)
            .eq("date", date)
            .maybeSingle()

        if (isClosed) return { success: true, slots: [] }

        // 3. Gün bilgilerini çöz (Timezone hatasını önlemek için manuel parçala)
        // new Date(date) bazen yerel saat dilimine göre bir önceki günü verebilir.
        const [year, month, day] = date.split("-").map(Number)
        const dateObj = new Date(year, month - 1, day)
        const dayOfWeek = dateObj.getDay()

        // 3. İlgili personelleri belirle (ANY ise hizmeti verebilen herkesi al)
        let staffIds: string[] = []
        if (staffBusinessId === "ANY") {
            const { data: capableStaff } = await supabase
                .from("staff_services")
                .select("staff_business_id")
                .in("service_id", serviceIds)
                .eq("is_active", true)

            if (!capableStaff) return { success: true, slots: [] }

            // Sadece tüm hizmetleri verebilenleri filtrele (client-side filter for simplicity)
            const staffSvcCount: Record<string, number> = {}
            capableStaff.forEach(s => {
                staffSvcCount[s.staff_business_id] = (staffSvcCount[s.staff_business_id] || 0) + 1
            })
            staffIds = Object.keys(staffSvcCount).filter(id => staffSvcCount[id] === serviceIds.length)
        } else {
            staffIds = [staffBusinessId]
        }

        if (staffIds.length === 0) return { success: true, slots: [] }

        // 4. Verileri paralel çek
        const [
            servicesRes,
            staffServicesRes,
            workTemplatesRes,
            breaksRes,
            appointmentsRes,
            leavesRes
        ] = await Promise.all([
            supabase.from("services").select("id, base_duration_minutes, buffer_time_minutes").in("id", serviceIds),
            supabase.from("staff_services").select("staff_business_id, service_id, custom_duration_minutes").in("staff_business_id", staffIds).in("service_id", serviceIds),
            supabase.from("work_schedule_templates").select("*").in("staff_business_id", staffIds).eq("day_of_week", dayOfWeek).eq("is_working", true),
            supabase.from("break_schedules").select("*").in("staff_business_id", staffIds).eq("day_of_week", dayOfWeek),
            supabase.from("appointments").select("staff_business_id, start_time, end_time").in("staff_business_id", staffIds).eq("appointment_date", date).not("status", "in", '("İptal", "Gelmedi")'),
            supabase.from("leave_requests").select("staff_business_id, request_type, start_time, end_time").in("staff_business_id", staffIds).eq("date", date).eq("status", "approved")
        ])

        // 5. Her personel için toplam süreyi ve buffer'ı hesapla
        const slots: TimeSlot[] = []
        const nowMs = new Date().getTime()
        const isToday = date === new Date().toISOString().split("T")[0]

        // Helper: Time string to minutes
        const toMin = (t: string) => {
            const [h, m] = t.split(":").map(Number)
            return h * 60 + m
        }
        // Helper: Minutes to time string
        const toStr = (m: number) => {
            const h = Math.floor(m / 60)
            const min = m % 60
            return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
        }

        // Çalışma saatleri sınırlarını bul
        let earliestStart = 24 * 60
        let latestEnd = 0
        workTemplatesRes.data?.forEach(w => {
            earliestStart = Math.min(earliestStart, toMin(w.start_time))
            latestEnd = Math.max(latestEnd, toMin(w.end_time))
        })

        if (earliestStart >= latestEnd) return { success: true, slots: [] }

        // 15 dakikalık adımlarla tara
        for (let time = earliestStart; time < latestEnd; time += 15) {
            // Bugün ise geçmiş saatleri atla
            if (isToday) {
                const slotTime = new Date(`${date}T${toStr(time)}:00`).getTime()
                if (slotTime < nowMs + 30 * 60 * 1000) continue // En az 30 dk sonrası için izin ver
            }

            let slotAvailable = false

            for (const sId of staffIds) {
                // Bu personelin bu hizmetler için toplam süresi (custom duration varsa o)
                let staffTotalDuration = 0
                let totalBuffer = 0

                serviceIds.forEach(svcId => {
                    const svc = servicesRes.data?.find(s => s.id === svcId)
                    const staffSvc = staffServicesRes.data?.find(ss => ss.staff_business_id === sId && ss.service_id === svcId)
                    staffTotalDuration += staffSvc?.custom_duration_minutes || svc?.base_duration_minutes || 30
                    totalBuffer += svc?.buffer_time_minutes || 0
                })

                const fullSlotNeeded = staffTotalDuration + totalBuffer

                // Personelin çalışma saatleri uygun mu?
                const template = workTemplatesRes.data?.find(w => w.staff_business_id === sId)
                if (!template) continue
                if (time < toMin(template.start_time) || time + fullSlotNeeded > toMin(template.end_time)) continue

                // İzin kontrolü
                const hasFullLeave = leavesRes.data?.some(l => l.staff_business_id === sId && l.request_type === "full_day")
                if (hasFullLeave) continue
                const partialLeave = leavesRes.data?.find(l => l.staff_business_id === sId && l.request_type === "partial")
                if (partialLeave && Math.max(time, toMin(partialLeave.start_time!)) < Math.min(time + fullSlotNeeded, toMin(partialLeave.end_time!))) continue

                // Mola kontrolü
                const hitBreak = breaksRes.data?.some(b => b.staff_business_id === sId && Math.max(time, toMin(b.start_time)) < Math.min(time + fullSlotNeeded, toMin(b.end_time)))
                if (hitBreak) continue

                // Randevu çakışma kontrolü
                const hitApt = appointmentsRes.data?.some(a => a.staff_business_id === sId && Math.max(time, toMin(a.start_time)) < Math.min(time + fullSlotNeeded, toMin(a.end_time)))
                if (hitApt) continue

                // Eğer buraya kadar geldiyse bu personel musait
                slotAvailable = true
                break
            }

            slots.push({
                time: toStr(time),
                status: slotAvailable ? "available" : "booked"
            })
        }

        return { success: true, slots }
    } catch (err: any) {
        console.error("Availability Engine Error:", JSON.stringify(err, null, 2))
        Sentry.captureException(err)
        return { success: false, error: "Müsaitlik bilgisi alınamadı." }
    }
}
