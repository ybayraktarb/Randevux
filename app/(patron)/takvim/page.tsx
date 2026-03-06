import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CommandCenterCalendar } from "@/components/randevux/command-center-calendar"

export const metadata = {
    title: "Takvim (Komuta Merkezi) - Randevuxx",
}

export default async function TakvimPage() {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()

    if (!authData?.user) {
        redirect("/login")
    }

    const { data: ownerData } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", authData.user.id)
        .maybeSingle()

    if (!ownerData) {
        redirect("/dashboard")
    }

    return (
        <div className="w-full flex-col gap-6 p-4 md:p-6 lg:p-8">
            <CommandCenterCalendar businessId={ownerData.business_id} />
        </div>
    )
}
