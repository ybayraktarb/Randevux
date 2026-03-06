import dynamic from "next/dynamic"

const BookingFlow = dynamic(
    () => import("@/components/randevux/booking-flow").then(m => ({ default: m.BookingFlow })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <span className="text-muted-foreground">Yükleniyor...</span>
            </div>
        ),
    }
)

export default function RandevuAlPage() {
    return <BookingFlow />
}
