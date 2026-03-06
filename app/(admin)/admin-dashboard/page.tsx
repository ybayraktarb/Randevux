import dynamic from "next/dynamic"

const SuperAdmin = dynamic(
    () => import("@/components/randevux/super-admin/index").then(m => ({ default: m.SuperAdmin })),
    {
        loading: () => (
            <div className="flex items-center justify-center p-8">
                <span className="text-muted-foreground">Yükleniyor...</span>
            </div>
        ),
    }
)

export default function AdminDashboardPage() {
    return <SuperAdmin />
}
