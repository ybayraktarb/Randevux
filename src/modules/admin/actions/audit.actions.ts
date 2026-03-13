"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"
import { logAudit } from "@/lib/audit"

type AuditAction = "viewed" | "created" | "updated" | "deleted" | "onboarded"

/**
 * Server-side audit log action.
 * userId, server'da auth.getUser() ile doğrulanıyor — client manipüle edemez.
 */
export async function logAuditAction(params: {
    action: AuditAction
    targetTable: string
    targetId?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            Sentry.captureMessage("logAuditAction: Unauthorized attempt", "warning")
            return { success: false, error: "Unauthorized" }
        }

        await logAudit(supabase, {
            userId: user.id,
            ...params,
        })
        return { success: true }
    } catch (error) {
        Sentry.captureException(error, {
            tags: { action: "logAuditAction" },
        })
        return { success: false, error: "Audit log failed" }
    }
}

