"use server"

import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"
import * as Sentry from "@sentry/nextjs"

/**
 * Yaklaşan randevuları kontrol eder ve hatırlatıcı bildirimi oluşturur.
 * (Cron job simülasyonu)
 */
export async function checkUpcomingAppointmentsAction(businessId: string) {
    try {
        const supabase = await createClient()

        // 1. Gelecek 24 saat içindeki randevuları bul
        const now = new Date()
        const tomorrow = new Date(now.getTime() + (24 * 60 * 60 * 1000))

        const { data: appointments, error } = await supabase
            .from("appointments")
            .select(`
                id,
                appointment_date,
                start_time,
                customer_user_id,
                business:businesses(name)
            `)
            .eq("business_id", businessId)
            .eq("status", "Onaylandı")
            .gte("appointment_date", now.toISOString().split('T')[0])
            .lte("appointment_date", tomorrow.toISOString().split('T')[0])

        if (error) throw error
        if (!appointments || appointments.length === 0) return { success: true, count: 0 }

        let sentCount = 0

        for (const apt of appointments) {
            // Randevu vakti kontrolü (Tam olarak 24 saatten az mı?)
            const aptTime = new Date(`${apt.appointment_date}T${apt.start_time}`)
            const diffHours = (aptTime.getTime() - now.getTime()) / (1000 * 60 * 60)

            if (diffHours > 0 && diffHours <= 24) {
                // Daha önce hatırlatıcı gönderildi mi kontrol et (Basit check: notification tablosunda var mı?)
                const { data: existing } = await supabase
                    .from("notifications")
                    .select("id")
                    .eq("user_id", apt.customer_user_id)
                    .eq("type", "reminder")
                    .eq("related_id", apt.id)
                    .maybeSingle()

                if (!existing) {
                    const businessName = (apt.business as any)?.name || "İşletme"
                    await createNotification(supabase, {
                        userId: apt.customer_user_id,
                        type: "reminder",
                        title: "Randevu Hatırlatması ⏰",
                        body: `Yarın saat ${apt.start_time.substring(0, 5)}'de ${businessName} işletmesindeki randevunuzu unutmayın!`,
                        relatedId: apt.id,
                        relatedType: "appointment"
                    })
                    sentCount++
                }
            }
        }

        return { success: true, count: sentCount }
    } catch (error) {
        Sentry.captureException(error)
        return { success: false, error: "Hatırlatıcılar kontrol edilemedi." }
    }
}
