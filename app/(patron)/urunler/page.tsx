import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProductManagement } from "@/src/modules/inventory/components/product-management"

export const metadata = {
    title: "Ürün & Stok Yönetimi - Randevuxx",
}

export default async function UrunlerPage() {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user) {
        redirect("/login")
    }

    // Sadece patron erisebilir
    const { data: ownerData } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", authData.user.id)
        .maybeSingle()

    if (!ownerData) {
        redirect("/dashboard")
    }

    return (
        <div className="flex w-full flex-col gap-6 p-6 md:p-10">
            <div className="mb-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Ürün & Stok Yönetimi
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                    Satışını yaptığınız ürünleri yönetin, stok durumlarını takip edin ve envanter loglarını inceleyin.
                </p>
            </div>

            <ProductManagement businessId={ownerData.business_id} />
        </div>
    )
}
