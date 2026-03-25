// Business service layer

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import type { 
  BusinessProfileInput, 
  AppointmentPolicyInput,
  Business
} from "@/src/modules/business/types"

export class BusinessService {
  /**
   * İşletme profil bilgilerini günceller.
   */
  static async updateProfile(input: BusinessProfileInput) {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("businesses")
      .update({
        name: input.name,
        address: input.address || null,
        phone: input.phone || null,
        description: input.description || null,
        logo_url: input.logoUrl || null,
        qr_code: input.qrCode || null
      })
      .eq("id", input.id)

    if (error) return { success: false, error: error.message }
    
    await logAuditAction({ action: "updated", targetTable: "businesses", targetId: input.id })
    revalidatePath("/ayarlar")
    return { success: true }
  }

  /**
   * Randevu politikalarını günceller.
   */
  static async updateAppointmentPolicies(input: AppointmentPolicyInput) {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from("businesses")
      .update({
        auto_approve: input.autoApprove,
        cancellation_buffer_minutes: input.cancellationBufferMinutes
      })
      .eq("id", input.businessId)

    if (error) return { success: false, error: error.message }
    
    await logAuditAction({ action: "updated", targetTable: "businesses", targetId: input.businessId })
    revalidatePath("/ayarlar")
    return { success: true }
  }

  /**
   * Davet kodunu yeniler.
   */
  static async refreshInviteCode(businessId: string) {
    const supabase = await createClient()
    const newCode = crypto.randomUUID().slice(0, 8).toUpperCase()
    
    const { error } = await supabase
      .from("businesses")
      .update({ invite_code: newCode })
      .eq("id", businessId)

    if (error) return { success: false, error: error.message }
    return { success: true, newCode }
  }

  /**
   * İşletme bilgilerini getirir.
   */
  static async getBusiness(businessId: string): Promise<{ success: boolean; data?: Business; error?: string }> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .maybeSingle()

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }
}
