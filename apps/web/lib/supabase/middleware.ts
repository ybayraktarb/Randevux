import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getUserRole, getDashboardPath } from "@/lib/supabase/roles" // EKLENDI

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
    //    /book/:business_id → QR / link ile gelen genel randevu sayfası (login gereksiz)
    const publicRoutes = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/auth/callback", "/book", "/randevu-al", "/isletme"]
    const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))

    // 2. Dashboard Routes (role eşlemesi)
    const authRoutes = ["/login", "/register"]
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // Tüm rollere ait korumalı yolların ön eklerini tanımlıyoruz
    const routeRoleMap = [
        // Admin Yolları
        { prefix: "/admin-dashboard", role: "super_admin" },
        // Patron (İşletme Sahibi) Yolları
        { prefix: "/patron-dashboard", role: "patron" },
        { prefix: "/randevular", role: "patron" },
        { prefix: "/personel", role: "patron" },
        { prefix: "/hizmetler", role: "patron" },
        { prefix: "/takvim", role: "patron" },
        { prefix: "/musteriler", role: "patron" },
        { prefix: "/urunler", role: "patron" },
        { prefix: "/finans", role: "patron" },
        { prefix: "/ayarlar", role: "patron" },
        // Personel Yolları
        { prefix: "/personel-panel", role: "personel" },
        { prefix: "/personel-randevular", role: "personel" },
        { prefix: "/izin", role: "personel" },
        { prefix: "/personel-ayarlar", role: "personel" },
        // Müşteri Yolları
        { prefix: "/musteri-panel", role: "musteri" },
        { prefix: "/randevularim", role: "musteri" },
        { prefix: "/profil", role: "musteri" },
    ]
    
    // Geçerli pathname'in (veya alt yapısının) tanımlı route prefix'lerinden birine uyup uymadığını kontrol et.
    // Örneğin pathname = "/ayarlar/ek" ise -> "/ayarlar" route kuralını baz al.
    // pathname tam eşleşecek veya tam olarak prefix + "/" ile başlayacak (e.g. /ayarlar veya /ayarlar/...).
    const matchingRoute = routeRoleMap.find(
        (route) => pathname === route.prefix || pathname.startsWith(route.prefix + "/")
    )

    // Logic 1: Giriş yapmamış kullanıcı public olmayan sayfaya erişemez
    if (!user && !isPublicRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/login"
        return NextResponse.redirect(url)
    }

    // Logic 2: Giriş yapmış kullanıcı — role kontrolü
    if (user) {
        // KALDIRILDI: const { getUserRole, getDashboardPath } = await import("@/lib/supabase/roles")
        let role = await getUserRole(supabase, user)

        const correctPath = getDashboardPath(role)

        // Login/register sayfasına erişmeye çalışırsa doğru dashboard'a yönlendir
        if (isAuthRoute) {
            return NextResponse.redirect(new URL(correctPath, request.url))
        }

        // Yanlış role ait bir korumalı sayfaya erişmeye çalışıyorsa kendi ana paneline yönlendir
        if (matchingRoute && matchingRoute.role !== role) {
            return NextResponse.redirect(new URL(correctPath, request.url))
        }
    }

    return supabaseResponse
}
