"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ShieldX, CreditCard } from "lucide-react"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import type { UserRole } from "@/lib/supabase/roles"

interface RoleGuardProps {
    /** Yalnızca bu role sahip kullanıcılar içeriği görebilir */
    requiredRole: UserRole
    children: React.ReactNode
}

/**
 * Kimlik doğrulama + rol yetkilendirmesi + abonelik kontrolü için merkezi guard bileşeni.
 *
 * Davranış:
 *  1. Yükleniyor → Spinner
 *  2. Giriş yapılmamış → /login yönlendirmesi
 *  3. Giriş yapılmış ama yanlış rol → 403 Erişim Engellendi ekranı
 *  4. Patron/Personel + abonelik süresi dolmuş (past_due) → Abonelik Kilidi ekranı
 *  5. Her şey yolunda → children render edilir
 */
export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
    const { loading, user, role, subscriptionStatus } = useCurrentUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [loading, user, router])

    // 1. Yükleniyor
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    // 2. Giriş yapılmamış — useEffect yönlendirecek, null ile flash'ı engelle
    if (!user) return null

    // 3. Yanlış rol → 403
    if (role !== requiredRole) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
                <div className="flex size-24 items-center justify-center rounded-3xl bg-red-50">
                    <ShieldX className="size-12 text-red-400" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Erişim Engellendi</h1>
                    <p className="mt-2 text-sm font-bold text-gray-400">
                        Bu sayfayı görüntülemek için gerekli yetkiye sahip değilsiniz.
                    </p>
                </div>
                <button
                    onClick={() => router.push("/")}
                    className="rounded-2xl bg-primary px-6 py-3 text-sm font-black text-white tracking-widest uppercase transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
                >
                    Ana Sayfaya Dön
                </button>
            </div>
        )
    }

    // 4. Abonelik süresi dolmuş (past_due) → Patron ve Personel için tam ekran kilit
    //    Müşteri ve Admin rolleri abonelik durumundan etkilenmez.
    const isSubscriptionLocked =
        subscriptionStatus === "past_due" &&
        (requiredRole === "patron" || requiredRole === "personel")

    if (isSubscriptionLocked) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background">
                <div className="flex size-24 items-center justify-center rounded-3xl bg-amber-50">
                    <CreditCard className="size-12 text-amber-400" />
                </div>
                <div className="text-center px-4 max-w-md">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Abonelik Süresi Doldu</h1>
                    <p className="mt-2 text-sm font-bold text-gray-500">
                        Hesabınıza erişmek için aboneliğinizi yenilemeniz gerekmektedir.
                        Paketinizi yükseltmek için iletişime geçin.
                    </p>
                </div>
                {requiredRole === "patron" && (
                    <button
                        onClick={() => router.push("/patron-dashboard")}
                        className="rounded-2xl bg-amber-500 px-6 py-3 text-sm font-black text-white tracking-widest uppercase transition-all hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/20"
                    >
                        Paketi Yükselt
                    </button>
                )}
                {requiredRole === "personel" && (
                    <p className="text-xs font-bold text-gray-400">
                        Lütfen işletme yöneticinizle iletişime geçin.
                    </p>
                )}
            </div>
        )
    }

    // 5. Her şey yolunda → içeriği göster
    return <>{children}</>
}
