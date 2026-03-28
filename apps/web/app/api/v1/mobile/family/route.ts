import { NextResponse } from "next/server"
import { createCustomerRepositories } from "@randesk/shared"
import { createMobileRequestContext } from "@/lib/supabase/mobile-server"

async function getAuthedRepositories(request: Request) {
  const { supabase, user } = await createMobileRequestContext(request)
  if (!supabase || !user) return null

  return {
    user,
    repositories: createCustomerRepositories(supabase)
  }
}

export async function GET(request: Request) {
  const ctx = await getAuthedRepositories(request)
  if (!ctx) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })

  const result = await ctx.repositories.familyProfiles.list(ctx.user.id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}

export async function POST(request: Request) {
  const ctx = await getAuthedRepositories(request)
  if (!ctx) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })

  const body = await request.json()
  const result = await ctx.repositories.familyProfiles.add(ctx.user.id, body)
  return NextResponse.json(result, { status: result.success ? 201 : 400 })
}

export async function DELETE(request: Request) {
  const ctx = await getAuthedRepositories(request)
  if (!ctx) return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ success: false, error: { message: "Family profile id required." } }, { status: 400 })
  }

  const result = await ctx.repositories.familyProfiles.remove(id)
  return NextResponse.json(result, { status: result.success ? 200 : 400 })
}
