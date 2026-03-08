import { notFound } from "next/navigation"
import { getBookingDataAction } from "@/app/actions/booking.actions"
import { BookingWizard } from "@/components/booking/BookingWizard"

interface BookingPageProps {
    params: Promise<{
        business_id: string
    }>
}

export default async function BookingPage({ params }: BookingPageProps) {
    const { business_id } = await params

    const res = await getBookingDataAction(business_id)

    if (!res.success || !res.data) {
        return notFound()
    }

    return (
        <main className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            {/* Premium Gradient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.05),transparent),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.05),transparent)] pointer-events-none" />

            <BookingWizard
                businessId={business_id}
                businessName={res.data.businessName}
                initialServices={res.data.services as any}
                initialStaff={res.data.staffList as any}
            />
        </main>
    )
}
