import { NextResponse } from "next/server"
import { createCustomerRepositories } from "@randesk/shared"
import { createMobileRequestContext } from "@/lib/supabase/mobile-server"

export async function GET(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })
  }

  const repositories = createCustomerRepositories(supabase)
  const result = await repositories.customerProfile.getDashboardData(user.id)

  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
