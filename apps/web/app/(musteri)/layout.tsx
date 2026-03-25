"use client"

import { useRouter } from "next/navigation"
import { AppShellLayout } from "@/src/modules/core/components/app-shell-layout"
import { musteriNav } from "@/lib/nav-config"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { Loader2 } from "lucide-react"
import { useEffect } from "react"
import { ErrorBoundary } from "@/src/modules/core/components/error-boundary"

export default function MusteriLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { loading, user, profile } = useCurrentUser()
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
            role="musteri"
            navItems={musteriNav}
            userName={profile?.name || "Müşteri"}
            userBadge="Müşteri"
        >
            <ErrorBoundary>{children}</ErrorBoundary>
        </AppShellLayout>
    )
}
