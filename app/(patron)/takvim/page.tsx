import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CalendarShifts } from "@/components/randevux/calendar-shifts"

export const metadata = {
    title: "Takvim & Vardiyalar - Randevuxx",
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
        <div className="w-full flex-col p-4 md:p-6 lg:p-8">
            <CalendarShifts />
        </div>
    )
}
