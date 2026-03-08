"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"

export async function getBookingDataAction(businessId: string) {
    try {
        const supabase = await createClient()

        // Paraell fetch services and staff
        const [servicesRes, staffRes, businessRes] = await Promise.all([
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
          user:users(id, name, avatar_url),
          staff_services(service_id)
        `)
                .eq("business_id", businessId)
                .eq("is_active", true),
            supabase
                .from("businesses")
                .select("name")
                .eq("id", businessId)
                .single()
        ])

        if (servicesRes.error) {
            console.error("Booking Flow - Services Fetch Error:", JSON.stringify(servicesRes.error, null, 2))
            throw servicesRes.error
        }
        if (staffRes.error) {
            console.error("Booking Flow - Staff Fetch Error:", JSON.stringify(staffRes.error, null, 2))
            throw staffRes.error
        }
        if (businessRes.error) {
            console.error("Booking Flow - Business Fetch Error:", JSON.stringify(businessRes.error, null, 2))
            throw businessRes.error
        }

        // Format staff data for easier consumption
        const formattedStaff = staffRes.data.map((s: any) => {
            if (!s.user) {
                console.warn(`Staff record ${s.id} has no accessible user data (RLS issue?)`)
            }
            return {
                id: s.id,
                name: s.user?.name || "İsimsiz Personel",
                avatar_url: s.user?.avatar_url,
                serviceIds: s.staff_services?.map((ss: any) => ss.service_id) || []
            }
        })

        console.log(`getBookingDataAction: Found ${servicesRes.data.length} services and ${formattedStaff.length} staff members.`)

        return {
            success: true,
            data: {
                businessName: businessRes.data.name,
                services: servicesRes.data,
                staffList: formattedStaff
            }
        }
    } catch (err: any) {
        console.error("getBookingDataAction Error:", err)
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}

export async function createBookingAction(data: {
    businessId: string
    staffBusinessId: string
    serviceIds: string[]
    appointmentDate: string // YYYY-MM-DD
    startTime: string // HH:mm
    totalPrice: number
    totalDuration: number
    customerNote?: string
    familyProfileId?: string | null
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        // 1. Calculate end time
        const [hh, mm] = data.startTime.split(":").map(Number)
        const startMinutes = hh * 60 + mm
        const endMinutes = startMinutes + data.totalDuration
        const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
        const endMM = String(endMinutes % 60).padStart(2, "0")

        const startTimeStr = `${data.startTime}:00`
        const endTimeStr = `${endHH}:${endMM}:00`

        // 2. Insert Appointment
        const { data: apt, error: aptError } = await supabase
            .from("appointments")
            .insert({
                business_id: data.businessId,
                customer_user_id: user.id,
                staff_business_id: data.staffBusinessId,
                appointment_date: data.appointmentDate,
                start_time: startTimeStr,
                end_time: endTimeStr,
                total_price: data.totalPrice,
                total_duration_minutes: data.totalDuration,
                customer_note: data.customerNote || "",
                status: "pending" // CustomersUsually start as pending or confirmed based on business settings
            })
            .select("id")
            .single()

        if (aptError) throw aptError

        // 3. Insert Appointment Services (Snapshots)
        // Fetch service details for snapshots
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

        if (svcError) throw svcError

        revalidatePath("/(customer)/randevularim", "page")

        return { success: true, appointmentId: apt.id }
    } catch (err: any) {
        console.error("createBookingAction Error:", err)
        Sentry.captureException(err)
        return { success: false, error: err.message }
    }
}
