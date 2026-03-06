import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FinanceDashboard } from "@/components/randevux/finance-dashboard"

export const metadata = {
    title: "Finans & Muhasebe - Randevuxx",
}

export default async function FinansPage() {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user) {
        redirect("/login")
    }

    // Sadece patron erisebilir (Basit kontrol)
    const { data: ownerData } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", authData.user.id)
        .maybeSingle()

    if (!ownerData) {
        redirect("/dashboard") // Yetkisiz ise normal dashboard'a at
    }

    return (
        <div className="flex w-full flex-col gap-6 p-6 md:p-10">
            <div className="mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Finans ve Muhasebe
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    İşletmenizin kasa hareketlerini, giderlerini, personel maaş/prim hak edişlerini yönetin.
                </p>
            </div>

            <FinanceDashboard businessId={ownerData.business_id} />
        </div>
    )
}
