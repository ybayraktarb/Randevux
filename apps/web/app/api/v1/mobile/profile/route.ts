import { NextResponse } from "next/server"
import { createCustomerRepositories } from "@randesk/shared"
import { createMobileRequestContext } from "@/lib/supabase/mobile-server"

export async function GET(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const repositories = createCustomerRepositories(supabase)
  const result = await repositories.customerProfile.getProfile(user.id)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

export async function PUT(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const body = await request.json()
  const repositories = createCustomerRepositories(supabase)
  const result = await repositories.customerProfile.updateProfile(user.id, body)

  if (result.success && body?.name) {
    await supabase.auth.updateUser({ data: { name: body.name } })
  }

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
