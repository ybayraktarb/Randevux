"use server"

import * as Sentry from "@sentry/nextjs"
import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"

type NotificationType =
    | "appointment_created"
    | "appointment_confirmed"
    | "appointment_cancelled"
    | "reminder"
    | "leave_result"
    | "staff_invitation"
    | "system"

/**
 * Server-side notification action.
 * Caller'ın auth durumu server'da kontrol ediliyor.
 * userId alıcının ID'si — gönderenin değil, bu sebeple auth check caller içindir.
 */
export async function createNotificationAction(params: {
    userId: string
    type: NotificationType
    title: string
    body?: string
    relatedId?: string
    relatedType?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            Sentry.captureMessage("createNotificationAction: Unauthorized attempt", "warning")
            return { success: false, error: "Unauthorized" }
        }

        await createNotification(supabase, params)
        return { success: true }
    } catch (error) {
        Sentry.captureException(error, {
            tags: { action: "createNotificationAction" },
        })
        return { success: false, error: "Notification creation failed" }
    }
}

