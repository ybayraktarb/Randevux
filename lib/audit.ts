import { SupabaseClient } from "@supabase/supabase-js"

type AuditAction = "viewed" | "created" | "updated" | "deleted"

interface LogAuditParams {
    userId: string
    action: AuditAction
    targetTable: string
    targetId?: string
}

/**
 * Audit logging helper.
 * Inserts a row into audit_logs for critical CRUD operations.
 */
export async function logAudit(
    supabase: SupabaseClient,
    params: LogAuditParams
) {
    const { error } = await supabase.from("audit_logs").insert({
        user_id: params.userId,
        action: params.action,
        target_table: params.targetTable,
        target_id: params.targetId || null,
    })
    if (error) {
        console.error("[logAudit] Error:", error.message)
    }
}
