"use client"

import { AppShellLayout } from "@/src/modules/core/components/app-shell-layout"
import { patronNav } from "@/lib/nav-config"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { ErrorBoundary } from "@/src/modules/core/components/error-boundary"
import { RoleGuard } from "@/src/modules/core/components/role-guard"

export default function PatronLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile, businessName } = useCurrentUser()

    return (
        <RoleGuard requiredRole="patron">
            <AppShellLayout
                role="patron"
                navItems={patronNav}
                userName={profile?.name || "Patron"}
                userBadge="Patron"
                businessName={businessName || undefined}
            >
                <ErrorBoundary>{children}</ErrorBoundary>
            </AppShellLayout>
        </RoleGuard>
    )
}
