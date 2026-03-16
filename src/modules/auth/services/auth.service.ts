// Auth service layer

import { createClient } from "@/lib/supabase/server"
import { NotificationSettings, QuickRebookData } from "../types"

export class AuthService {
  /**
   * Profil bilgilerini günceller.
   */
  static async updateProfile(userId: string, data: { name: string, phone: string, notificationSettings: NotificationSettings }) {
    const supabase = await createClient()
    const { error } = await supabase
      .from("users")
      .update({
        name: data.name,
        phone: data.phone,
        notification_settings: data.notificationSettings
      })
      .eq("id", userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * Hızlı tekrar randevu verilerini getirir.
   */
  static async getQuickRebookData(userId: string): Promise<QuickRebookData[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        business_id,
        business:businesses(name, logo_url, category),
        services:appointment_services(service:services(name, id))
      `)
      .eq("customer_user_id", userId)
      .order("appointment_date", { ascending: false })
      .limit(3)

    if (error) throw error

    return (data || []).map((a: any): QuickRebookData => {
      const b = Array.isArray(a.business) ? a.business[0] : a.business
      const s = Array.isArray(a.services) ? a.services : []
      return {
        id: a.id,
        businessId: a.business_id,
        businessName: b?.name || "İşletme",
        businessLogo: b?.logo_url,
        category: b?.category || "Genel",
        serviceNames: s.map((svc: any) => svc.service?.name).filter(Boolean).join(", "),
        serviceIds: s.map((svc: any) => svc.service?.id).filter(Boolean).join(","),
        lastDate: a.appointment_date
      }
    })
  }

  /**
   * Kullanıcı rolünü günceller.
   */
  static async updateUserRole(userId: string, role: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("users").update({ role }).eq("id", userId)
    return { success: !error, error: error?.message }
  }
}
