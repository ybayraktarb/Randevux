import { NextResponse } from "next/server"
import { createCustomerRepositories } from "@randevux/shared"
import { createMobileRequestContext } from "@/lib/supabase/mobile-server"

export async function GET(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const repositories = createCustomerRepositories(supabase)
  const result = await repositories.notifications.list(user.id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

export async function PATCH(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ success: false, error: { message: "Notification id required." } }, { status: 400 })
  }

  const repositories = createCustomerRepositories(supabase)
  const result = await repositories.notifications.markAsRead(id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
