import dynamic from "next/dynamic"

const AppointmentManagement = dynamic(
    () => import("@/components/randevux/appointment-management").then(m => ({ default: m.AppointmentManagement })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <span className="text-muted-foreground">Yükleniyor...</span>
            </div>
        ),
    }
)

export default function RandevularPage() {
    return <AppointmentManagement />
}
