"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/validations/action-types"
import type { BookingData, CreateBookingInput } from "../types"

export async function getBookingDataAction(businessId: string): Promise<ActionResult<BookingData>> {
    try {
        const supabase = await createClient()

        // Paraell fetch services, staff and their service mappings
        const [servicesRes, staffRes, staffServicesRes, businessRes, businessHoursRes] = await Promise.all([
            supabase
                .from("services")
                .select("*")
                .eq("business_id", businessId)
                .eq("is_active", true),
            supabase
                .from("staff_business")
                .select(`
          id,
          is_active,
          expertise_level,
          calendar_color,
          user:users(id, name, avatar_url)
        `)
                .eq("business_id", businessId)
                .eq("is_active", true),
            supabase
                .from("staff_services")
                .select("staff_business_id, service_id")
                .eq("is_active", true),
            supabase
                .from("businesses")
                .select("name")
                .eq("id", businessId)
                .single(),
            supabase
                .from("business_hours")
                .select("*")
                .eq("business_id", businessId)
        ])

        if (servicesRes.error) {
            Sentry.captureException(servicesRes.error, { tags: { module: 'booking', action: 'getBookingDataAction', errorType: 'ServicesFetchError' } })
            throw servicesRes.error
        }
        if (staffRes.error) {
            Sentry.captureException(staffRes.error, { tags: { module: 'booking', action: 'getBookingDataAction', errorType: 'StaffFetchError' } })
            throw staffRes.error
        }
        if (businessRes.error) {
            Sentry.captureException(businessRes.error, { tags: { module: 'booking', action: 'getBookingDataAction', errorType: 'BusinessFetchError' } })
            throw businessRes.error
        }

        // Create a map of staff to their service IDs
        const staffSvcMap: Record<string, string[]> = {}
        if (staffServicesRes.data) {
            staffServicesRes.data.forEach((ss: any) => {
                if (!staffSvcMap[ss.staff_business_id]) staffSvcMap[ss.staff_business_id] = []
                staffSvcMap[ss.staff_business_id].push(ss.service_id)
            })
        }

        // Format staff data for easier consumption
        const formattedStaff = await Promise.all(staffRes.data.map(async (s: any) => {
            if (!s.user) {
                console.warn(`Staff record ${s.id} has no accessible user data (RLS issue?)`)
            }

            // Optional: Fetch simple rating for customer view
            // In a high-traffic app, we'd cache this or store it on the staff profile
            let averageRating = 0
            const { data: reviews } = await supabase
                .from("business_reviews")
                .select("rating")
                .in("appointment_id", (
                    await supabase
                        .from("appointments")
                        .select("id")
                        .eq("staff_business_id", s.id)
                ).data?.map(a => a.id) || [])

            if (reviews && reviews.length > 0) {
                averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            }

            return {
                id: s.id,
                name: s.user?.name || "İsimsiz Personel",
                avatar_url: s.user?.avatar_url,
                serviceIds: staffSvcMap[s.id] || [],
                expertiseLevel: s.expertise_level,
                calendarColor: s.calendar_color,
                averageRating: Number(averageRating.toFixed(1))
            }
        }))

        return {
            success: true,
            data: {
                businessName: businessRes.data.name,
                businessHours: businessHoursRes.data || [],
                services: servicesRes.data,
                staffList: formattedStaff
            }
        }
    } catch (err: unknown) {
        Sentry.captureException(err, { tags: { module: 'booking', action: 'getBookingDataAction' } })
        const message = err instanceof Error ? err.message : "Randevu verileri alınamadı."
        return { success: false, error: { message } }
    }
}

export async function createBookingAction(data: CreateBookingInput): Promise<ActionResult<{ appointmentId: string }>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        // Verify user exists in public.users to prevent FK issues
        const { data: userExists } = await supabase
            .from("users")
            .select("id")
            .eq("id", user.id)
            .single()

        if (!userExists) {
            Sentry.captureMessage(`createBookingAction: User ${user.id} not found in public.users table`, { tags: { module: 'booking', action: 'createBookingAction' } })
            throw new Error("Kullanıcı profili bulunamadı. Lütfen destekle iletişime geçin.")
        }

        // 1. Calculate end time
        const [hh, mm] = data.startTime.split(":").map(Number)
        const startMinutes = hh * 60 + mm
        const endMinutes = startMinutes + data.totalDuration
        const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
        const endMM = String(endMinutes % 60).padStart(2, "0")

        const startTimeStr = `${data.startTime}:00`
        const endTimeStr = `${endHH}:${endMM}:00`

        // 2. Insert Appointment
        const aptData = {
            business_id: data.businessId,
            customer_user_id: user.id,
            staff_business_id: data.staffBusinessId,
            appointment_date: data.appointmentDate,
            start_time: startTimeStr,
            end_time: endTimeStr,
            total_price: data.totalPrice,
            total_duration_minutes: data.totalDuration,
            customer_note: data.customerNote || "",
            status: "Bekliyor"
        }

        const { data: apt, error: aptError } = await supabase
            .from("appointments")
            .insert(aptData)
            .select("id")
            .single()

        if (aptError) {
            Sentry.captureException(aptError, { tags: { module: 'booking', action: 'createBookingAction', step: 'AppointmentInsertError' } })
            throw aptError
        }

        // 3. Insert Appointment Services (Snapshots)
        const { data: services } = await supabase
            .from("services")
            .select("*")
            .in("id", data.serviceIds)

        if (!services) throw new Error("Hizmet bilgileri alınamadı.")

        const aptServices = services.map(s => ({
            appointment_id: apt.id,
            service_id: s.id,
            price_snapshot: s.base_price,
            duration_snapshot: s.base_duration_minutes,
            buffer_snapshot: s.buffer_time_minutes || 0
        }))

        const { error: svcError } = await supabase
            .from("appointment_services")
            .insert(aptServices)

        if (svcError) {
            Sentry.captureException(svcError, { tags: { module: 'booking', action: 'createBookingAction', step: 'AppointmentServicesInsertError' } })
            throw svcError
        }

        revalidatePath("/randevularim", "page")

        return { success: true, data: { appointmentId: apt.id } }
    } catch (err: unknown) {
        Sentry.captureException(err, { tags: { module: 'booking', action: 'createBookingAction' } })
        const message = err instanceof Error ? err.message : "Randevu kaydedilirken bir hata oluştu."
        return { success: false, error: { message } }
    }
}
