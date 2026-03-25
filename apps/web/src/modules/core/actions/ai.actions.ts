"use server"

import { checkFeatureAccess } from "@/lib/permissions"

/**
 * İşletmenin AI özelliğine erişimi olup olmadığını döner (Client component kullanımı için).
 */
export async function getAiAccessAction(businessId: string) {
    const hasAccess = await checkFeatureAccess(businessId, 'ai_assistant')
    return { success: true, hasAccess }
}
