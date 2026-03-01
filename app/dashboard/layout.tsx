import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserRole } from "@/lib/supabase/roles"
import { ClientDashboardLayout } from "@/components/randevux/dashboard-layout"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Role Control (Sadece Patron veya Personel bu Layout'u görebilir)
    // Şimdilik Personel ve Patronu aynı layout'tan sokup UI'da ayırabiliriz 
    // veya Personeli ayrı bir /staff klasörüne alabiliriz. Biz şimdilik Patron hedefliyoruz.
    const role = await getUserRole(supabase, user.id)

    if (role === "super_admin") {
        redirect("/super-admin")
    }

    if (role === "musteri") {
        redirect("/")
    }

    return (
        <ClientDashboardLayout user={user} role={role}>
            {children}
        </ClientDashboardLayout>
    )
}
