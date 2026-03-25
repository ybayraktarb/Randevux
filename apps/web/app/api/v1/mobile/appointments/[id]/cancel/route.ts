import { NextResponse } from "next/server"
import { AppointmentService } from "@/src/modules/appointments/services/appointment.service"
import { createMobileRequestContext } from "@/lib/supabase/mobile-server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, business_id, customer_user_id")
    .eq("id", id)
    .maybeSingle()

  if (appointmentError || !appointment || appointment.customer_user_id !== user.id) {
    return NextResponse.json({ success: false, error: { message: "Appointment not found." } }, { status: 404 })
  }

  const result = await AppointmentService.cancelAppointment(
    {
      appointmentId: appointment.id,
      businessId: appointment.business_id,
      reason: body?.reason
    },
    "customer"
  )

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
