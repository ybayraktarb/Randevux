import { SupabaseClient } from "@supabase/supabase-js"

type NotificationType =
    | "appointment_created"
    | "appointment_confirmed"
    | "appointment_cancelled"
    | "reminder"
    | "leave_result"
    | "staff_invitation"
    | "system"

interface CreateNotificationParams {
    userId: string
    type: NotificationType
    title: string
    body?: string
    relatedId?: string
    relatedType?: string
}

/**
 * Bildirim oluşturma yardımcı fonksiyonu.
 * Her CRUD noktasından çağrılarak kullanıcıya bildirim gönderir.
 */
export async function createNotification(
    supabase: SupabaseClient,
    params: CreateNotificationParams
) {
    const { error } = await supabase.from("notifications").insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        body: params.body || null,
        related_id: params.relatedId || null,
        related_type: params.relatedType || null,
        is_read: false,
    })
    if (error) {
        console.error("[createNotification] Error:", error.message)
    }
}

/**
 * Birden fazla kullanıcıya aynı bildirimi gönder.
 */
export async function createNotificationBulk(
    supabase: SupabaseClient,
    userIds: string[],
    params: Omit<CreateNotificationParams, "userId">
) {
    const rows = userIds.map((uid) => ({
        user_id: uid,
        type: params.type,
        title: params.title,
        body: params.body || null,
        related_id: params.relatedId || null,
        related_type: params.relatedType || null,
        is_read: false,
    }))
    const { error } = await supabase.from("notifications").insert(rows)
    if (error) {
        console.error("[createNotificationBulk] Error:", error.message)
    }
}
