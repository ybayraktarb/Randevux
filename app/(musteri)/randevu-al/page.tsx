import { getBookingDataAction } from "@/src/modules/appointments/actions/booking.actions"
import { BookingWizard } from "@/components/booking/BookingWizard"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { RxButton } from "@/src/modules/core/components/rx-button"

export default async function RandevuAlPage({
    searchParams
}: {
    searchParams: Promise<{ business_id?: string }>
}) {
    const businessId = (await searchParams).business_id

    if (!businessId) {
        return (
            <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
                <div className="size-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="size-10 text-amber-500" />
                </div>
                <h1 className="text-2xl font-black mb-4">İşletme Belirtilmedi</h1>
                <p className="text-muted-foreground mb-8">
                    Randevu alabilmek için önce bir işletme seçmelisiniz.
                </p>
                <Link href="/">
                    <RxButton className="rounded-full px-8">Keşfet'e Dön</RxButton>
                </Link>
            </div>
        )
    }

    const res = await getBookingDataAction(businessId)

    if (!res.success || !res.data) {
        return (
            <div className="container max-w-2xl mx-auto py-20 px-4 text-center">
                <div className="size-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="size-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-black mb-4">Hata Oluştu</h1>
                <p className="text-muted-foreground mb-8">
                    İşletme bilgileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
                </p>
                <Link href="/">
                    <RxButton className="rounded-full px-8">Ana Sayfaya Dön</RxButton>
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF]">
            <BookingWizard
                businessId={businessId}
                businessName={res.data.businessName}
                businessHours={res.data.businessHours}
                initialServices={res.data.services}
                initialStaff={res.data.staffList}
            />
        </div>
    )
}
