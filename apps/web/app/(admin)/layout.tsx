"use client"

import { RoleGuard } from "@/src/modules/core/components/role-guard"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <RoleGuard requiredRole="super_admin">
            {children}
        </RoleGuard>
    )
}
