"use client"

import { AppShellLayout } from "@/src/modules/core/components/app-shell-layout"
import { musteriNav } from "@/lib/nav-config"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { ErrorBoundary } from "@/src/modules/core/components/error-boundary"
import { RoleGuard } from "@/src/modules/core/components/role-guard"

export default function MusteriLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile } = useCurrentUser()

    return (
        <RoleGuard requiredRole="musteri">
            <AppShellLayout
                role="musteri"
                navItems={musteriNav}
                userName={profile?.name || "Müşteri"}
                userBadge="Müşteri"
            >
                <ErrorBoundary>{children}</ErrorBoundary>
            </AppShellLayout>
        </RoleGuard>
    )
}
