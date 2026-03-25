import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FinanceDashboard } from "@/src/modules/finance/components/finance-dashboard"
import { FeatureGate } from "@/src/modules/admin/components/feature-gate"
import { Wallet } from "lucide-react"

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

            <FeatureGate 
                businessId={ownerData.business_id} 
                featureKey="finance_module"
                fallback={
                    <div className="flex flex-col items-center justify-center p-20 text-center gap-4 bg-muted/30 rounded-3xl my-8 border border-border">
                        <div className="size-16 rounded-3xl bg-primary/10 flex items-center justify-center shadow-inner">
                            <Wallet className="size-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Özellik Paketinize Dahil Değil</h2>
                        <p className="text-muted-foreground text-sm max-w-md">
                            Finans ve muhasebe özelliklerini kullanmak için Ayarlar &gt; Abonelik & Fatura sekmesinden eklentiyi işletmenize ekleyebilirsiniz.
                        </p>
                    </div>
                }
            >
                <FinanceDashboard businessId={ownerData.business_id} />
            </FeatureGate>
        </div>
    )
}
