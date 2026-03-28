"use server"

import * as Sentry from "@sentry/nextjs"
import { createCustomerRepositories } from "@randesk/shared"
import { CustomerService } from "@/src/modules/customers/services/customer.service"
import { createClient } from "@/lib/supabase/server"

export async function toggleVipStatusAction(businessId: string, customerUserId: string, isVip: boolean) {
  try {
    return await CustomerService.toggleVip({ businessId, customerUserId, isVip })
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: err.message } }
  }
}

export async function updateCustomerInternalNotesAction(businessId: string, customerUserId: string, notes: string) {
  try {
    return await CustomerService.updateNotes({ businessId, customerUserId, notes })
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: err.message } }
  }
}

export async function addCustomerToBusinessAction(businessId: string, email: string, name: string, phone: string) {
  try {
    const result = await CustomerService.addCustomer({ businessId, email, name, phone })
    return { success: result.success, data: result.data, error: result.error ? { message: result.error } : undefined }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: err.message } }
  }
}

export async function leaveBusinessAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açılmamış." } }
    const repositories = createCustomerRepositories(supabase)
    return await repositories.customerProfile.leaveBusiness(user.id, businessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: err.message } }
  }
}
