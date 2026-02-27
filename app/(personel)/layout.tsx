"use client"

import { useRouter } from "next/navigation"
import { AppShellLayout } from "@/components/randevux/app-shell-layout"
import { personelNav } from "@/lib/nav-config"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { ErrorBoundary } from "@/components/randevux/error-boundary"

export default function PersonelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading, user, profile, businessName } = useCurrentUser()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login")
        }
    }, [loading, user, router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user) return null

    return (
        <AppShellLayout
            role="personel"
            navItems={personelNav}
            userName={profile?.name || "Personel"}
            userBadge="Personel"
            businessName={businessName || undefined}
        >
            <ErrorBoundary>{children}</ErrorBoundary>
        </AppShellLayout>
    )
}
