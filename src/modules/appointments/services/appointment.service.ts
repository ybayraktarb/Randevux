import * as Sentry from "@sentry/nextjs"
import { createClient as createServerClient } from "@supabase/supabase-js"
import {
    createManualAppointmentSchema,
    cancelAppointmentSchema,
    updateAppointmentStatusSchema,
    type CreateManualAppointmentInput,
    type CancelAppointmentInput,
    type UpdateAppointmentStatusInput
} from "@/shared/types/appointment.types"
import { calculateTimeRange } from "@/shared/utils/date"

/**
 * Appointment Service (Saf İş Mantığı)
 * Actions veya API Routes bu sınıfı/fonksiyonları kullanır. HTTP Request objesi bilmez.
 */
export class AppointmentService {
    // Tüm business logic admin client üzerinden çalışır (Güvenlik kontrolleri oncesinde action/api'de yapilmis olmali)
    private static supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    static async createAppointment(input: CreateManualAppointmentInput): Promise<{ success: boolean; appointmentId?: string; error?: { message: string } }> {
        try {
            // 1. Validate Input using shared Zod schema
            const data = createManualAppointmentSchema.parse(input)

            const totalDurationWithoutBuffer = data.services.reduce((sum: number, s: any) => sum + s.base_duration_minutes, 0)
            const totalBuffer = data.services.reduce((sum: number, s: any) => sum + (s.buffer_time_minutes || 0), 0)
            const totalDuration = totalDurationWithoutBuffer + totalBuffer
            const totalPrice = data.services.reduce((sum: number, s: any) => sum + Number(s.base_price), 0)

            // Parse start/end times via Utility
            const { startTimeStr, endTimeStr } = calculateTimeRange(data.time, totalDuration)

            // 2. Overlap Çakışma Kontrolü (Business Logic)
            const { data: existingApts, error: checkError } = await this.supabaseAdmin
                .from("appointments")
                .select("id")
                .eq("staff_business_id", data.staffId)
                .eq("appointment_date", data.date)
                .neq("status", "İptal")
                .neq("status", "Gelmedi")
                .filter("start_time", "lt", endTimeStr)
                .filter("end_time", "gt", startTimeStr)
                .maybeSingle()

            if (checkError) throw checkError
            if (existingApts) {
                return { success: false, error: { message: "Personelin bu saatte başka bir randevusu bulunmaktadır." } }
            }

            // 3. Guest Customer Logic
            let finalCustomerId = data.customerId || null

            if (!finalCustomerId && data.guestName && data.guestPhone) {
                const { data: existingCust } = await this.supabaseAdmin
                    .from("business_customers")
                    .select("id")
                    .eq("business_id", data.businessId)
                    .eq("phone", data.guestPhone)
                    .maybeSingle()

                if (!existingCust) {
                    await this.supabaseAdmin.from("business_customers").insert({
                        business_id: data.businessId,
                        first_name: data.guestName.split(" ")[0] || "",
                        last_name: data.guestName.split(" ").slice(1).join(" ") || "",
                        phone: data.guestPhone,
                    })
                }
            }

            // 4. Veritabanı Kayıt İşlemi
            const { data: aptData, error: insertError } = await this.supabaseAdmin.from("appointments").insert({
                business_id: data.businessId,
                customer_user_id: finalCustomerId,
                guest_name: data.guestName,
                guest_phone: data.guestPhone,
                staff_business_id: data.staffId,
                appointment_date: data.date,
                start_time: startTimeStr,
                end_time: endTimeStr,
                status: "Onaylandı",
                total_price: totalPrice,
                total_duration_minutes: totalDuration,
                customer_note: "",
            }).select("id").single()

            if (insertError) throw insertError

            // 5. Hizmetleri Ekleme
            if (aptData) {
                const aptServices = data.services.map((s: any) => ({
                    appointment_id: aptData.id,
                    service_id: s.id,
                    price_snapshot: Number(s.base_price),
                    duration_snapshot: s.base_duration_minutes,
                    buffer_snapshot: s.buffer_time_minutes || 0,
                }))
                const { error: svcError } = await this.supabaseAdmin.from("appointment_services").insert(aptServices)
                if (svcError) throw svcError
            }

            return { success: true, appointmentId: aptData?.id }

        } catch (err: unknown) {
            console.error("[AppointmentService] Create Error:", err)
            Sentry.captureException(err)
            const message = err instanceof Error ? err.message : "Randevu eklenirken bilinmeyen bir hata oluştu."
            return { success: false, error: { message } }
        }
    }

    static async cancelAppointment(input: CancelAppointmentInput, initiatorRole: "staff" | "customer"): Promise<{ success: boolean; error?: { message: string } }> {
        try {
            // 1. Zod Validate
            const data = cancelAppointmentSchema.parse(input)
            const now = new Date()

            // 2. İş kuralları: İptal Politikası (Buffer) Kontrolü
            const { data: apt, error: aptError } = await this.supabaseAdmin
                .from("appointments")
                .select("appointment_date, start_time, status, businesses(cancellation_buffer_minutes)")
                .eq("id", data.appointmentId)
                .single()

            if (aptError || !apt) throw new Error("Randevu bulunamadı.")
            if (apt.status === "İptal") return { success: true } // Already cancelled

            const business = (apt as any).businesses
            const bufferMinutes = business?.cancellation_buffer_minutes || 0

            const aptDateTime = new Date(`${apt.appointment_date}T${apt.start_time}`)
            const diffMs = aptDateTime.getTime() - now.getTime()
            const diffMins = diffMs / (1000 * 60)

            // Staff/Owner can always cancel, customers must respect buffer
            if (initiatorRole === "customer" && diffMins < bufferMinutes) {
                return {
                    success: false,
                    error: { message: `İptal politikası gereği randevuya ${bufferMinutes} dakikadan az kala iptal edilemez.` }
                }
            }

            // 3. Status Update
            const { error: updateError } = await this.supabaseAdmin
                .from("appointments")
                .update({
                    status: "İptal",
                    cancelled_by: initiatorRole,
                    cancelled_at: now.toISOString(),
                    cancellation_reason: data.reason || ""
                })
                .eq("id", data.appointmentId)

            if (updateError) throw updateError

            return { success: true }

        } catch (err: unknown) {
             console.error("[AppointmentService] Cancel Error:", err)
             Sentry.captureException(err)
             const message = err instanceof Error ? err.message : "İptal işlemi başarısız oldu."
             return { success: false, error: { message } }
        }
    }

    static async updateAppointmentStatus(input: UpdateAppointmentStatusInput, initiatorRole: "staff" | "patron" | "system", initiatorUserId?: string): Promise<{ success: boolean; error?: { message: string } }> {
        try {
            const data = updateAppointmentStatusSchema.parse(input)
            const now = new Date().toISOString()

            const statusMap: Record<string, string> = {
                "pending": "Bekliyor",
                "confirmed": "Onaylandı",
                "completed": "Tamamlandı",
                "cancelled": "İptal",
                "no_show": "Gelmedi"
            }

            const mappedStatus = statusMap[data.status] || data.status
            const updatePayload: Record<string, any> = { status: mappedStatus, updated_at: now }

            if (mappedStatus === "Onaylandı") {
                updatePayload.confirmed_at = now
            } else if (mappedStatus === "Tamamlandı") {
                updatePayload.completed_at = now
            } else if (mappedStatus === "İptal") {
                updatePayload.cancelled_by = initiatorRole
                updatePayload.cancelled_at = now
            }

            const { error: updateError } = await this.supabaseAdmin
                .from("appointments")
                .update(updatePayload)
                .eq("id", data.appointmentId)
                .eq("business_id", data.businessId)

            if (updateError) throw updateError

            // Handle no_show_record if marked as no_show
            if (mappedStatus === "Gelmedi" && initiatorUserId) {
                const { data: staffRow } = await this.supabaseAdmin
                    .from("staff_business")
                    .select("id")
                    .eq("business_id", data.businessId)
                    .eq("user_id", initiatorUserId)
                    .maybeSingle()

                if (staffRow) {
                    await this.supabaseAdmin.from("no_show_records").insert({
                        appointment_id: data.appointmentId,
                        marked_by_staff_business_id: staffRow.id,
                    })
                }
            }

            return { success: true }
        } catch (err: unknown) {
             console.error("[AppointmentService] Update Status Error:", err)
             Sentry.captureException(err)
             const message = err instanceof Error ? err.message : "Durum güncellenirken bir hata oluştu."
             return { success: false, error: { message } }
        }
    }

    static async getDetails(appointmentId: string): Promise<{ success: boolean; data?: any; error?: { message: string } }> {
        try {
            const { data, error } = await this.supabaseAdmin
                .from("appointments")
                .select(`
                    *,
                    businesses (id, name, address, phone, cancellation_buffer_minutes, lat, lng),
                    staff_business (id, users (name)),
                    appointment_services (id, price_snapshot, duration_snapshot, services (name))
                `)
                .eq("id", appointmentId)
                .single()

            if (error) throw error
            return { success: true, data }
        } catch (err: unknown) {
            Sentry.captureException(err)
            const message = err instanceof Error ? err.message : "Detaylar yüklenemedi."
            return { success: false, error: { message } }
        }
    }
}
