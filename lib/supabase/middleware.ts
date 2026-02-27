import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do NOT remove auth.getUser()
    // It refreshes the session token and keeps the user logged in.
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // 1. Public Routes (whitelist) — giriş yapmadan erişilebilir
    const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/auth/callback"]
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

    // 2. Dashboard Routes (role eşlemesi)
    const authRoutes = ["/login", "/register"]
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    const dashboardRoutes = [
        { path: "/admin-dashboard", role: "super_admin" },
        { path: "/patron-dashboard", role: "patron" },
        { path: "/personel-panel", role: "personel" },
        { path: "/musteri-panel", role: "musteri" },
    ]
    const currentDashboard = dashboardRoutes.find((d) => pathname.startsWith(d.path))

    // Logic 1: Giriş yapmamış kullanıcı public olmayan sayfaya erişemez
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    // Logic 2: Giriş yapmış kullanıcı — role kontrolü
    if (user) {
        const { getUserRole, getDashboardPath } = await import("@/lib/supabase/roles")
        let role = await getUserRole(supabase, user.id)

        const correctPath = getDashboardPath(role)

        // Login/register sayfasına erişmeye çalışırsa doğru dashboard'a yönlendir
        if (isAuthRoute) {
            return NextResponse.redirect(new URL(correctPath, request.url))
        }

        // Yanlış dashboard'a erişmeye çalışırsa doğru olana yönlendir
        if (currentDashboard && currentDashboard.role !== role) {
            return NextResponse.redirect(new URL(correctPath, request.url))
        }
    }

    return supabaseResponse
}
