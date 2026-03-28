"use client"

import { AppShellLayout } from "@/src/modules/core/components/app-shell-layout"
import { personelNav } from "@/lib/nav-config"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { ErrorBoundary } from "@/src/modules/core/components/error-boundary"
import { RoleGuard } from "@/src/modules/core/components/role-guard"

export default function PersonelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile, businessName } = useCurrentUser()

    return (
        <RoleGuard requiredRole="personel">
            <AppShellLayout
                role="personel"
                navItems={personelNav}
                userName={profile?.name || "Personel"}
                userBadge="Personel"
                businessName={businessName || undefined}
            >
                <ErrorBoundary>{children}</ErrorBoundary>
            </AppShellLayout>
        </RoleGuard>
    )
}
