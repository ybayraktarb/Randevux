import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// NOTE: Google/Apple providers must be enabled in Supabase Dashboard → Auth → Providers
// Google: provide Client ID + Client Secret from Google Cloud Console
// Apple: provide Service ID + Secret Key from Apple Developer Portal

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Determine the user's role and redirect to the correct dashboard
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { getUserRole, getDashboardPath } = await import("@/lib/supabase/roles")
                const role = await getUserRole(supabase, user.id)
                const dashboardPath = getDashboardPath(role)
                return NextResponse.redirect(new URL(dashboardPath, origin))
            }
        }
    }

    // If something went wrong, redirect to login with an error
    return NextResponse.redirect(new URL("/login?error=auth_failed", origin))
}
