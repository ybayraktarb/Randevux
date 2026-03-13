import { NextResponse } from "next/server"
import { AppointmentService } from "@/src/modules/appointments/services/appointment.service"
import { createClient } from "@/lib/supabase/server"

/**
 * REST API Endpoint for Mobile Apps & External Integrations
 * Mimarinin en büyük gücü: Aynı servisi (AppointmentService) API Route'da da kullanıyoruz.
 * POST /api/v1/appointments
 */
export async function POST(request: Request) {
    try {
        // 1. Yetki Kontrolü (Token/Session)
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // Not: Gerçek bir dış API'de JWT Bearer token ile kontrol edilebilir.
        if (authError || !user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        }

        // 2. Veriyi Al ve İşle
        const body = await request.json()
        
        // 3. İşi Devret! Geri kalan her şeyi AppointmentService halleder (Validasyon dahil)
        const result = await AppointmentService.createAppointment(body)

        if (!result.success) {
             return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result, { status: 201 })

    } catch (error: any) {
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}
