// Customer service layer

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { randomBytes } from "crypto"
import type {
  AddCustomerInput,
  UpdateCustomerNotesInput,
  ToggleVipInput,
} from "../types"

// ─── CustomerService ────────────────────────────────────────────────────────
// Tüm müşteri iş mantığı bu servis üzerinden geçer.
// Server Action ya da API Route bunu çağırabilir.

export class CustomerService {
  /**
   * İşletmeye müşteri ekler.
   * Sistemde kayıtlıysa bağlar, kayıtlı değilse shadow user oluşturur.
   */
  static async addCustomer(input: AddCustomerInput) {
    const supabase = await createClient()
    let targetUserId = ""
    let targetUserName = input.name

    // 1. Kullanıcıyı e-posta ile ara
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, name")
      .eq("email", input.email)
      .maybeSingle()

    if (existingUser) {
      targetUserId = existingUser.id
      targetUserName = existingUser.name || input.name
    } else {
      // 2. Shadow user oluştur (Admin API)
      const supabaseAdmin = await createAdminClient()

      const generatedPassword = "Randevuxx!" + randomBytes(8).toString("hex")
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: generatedPassword,
        phone: input.phone || undefined,
        email_confirm: true,
        user_metadata: { name: targetUserName },
      })

      if (createError || !newUser?.user) {
        return {
          success: false,
          error: "Yeni müşteri profili oluşturulamadı: " + createError?.message,
        }
      }

      targetUserId = newUser.user.id

      // DB trigger'ın public.users'a yazması için kısa bekleme
      await new Promise((res) => setTimeout(res, 400))
    }

    // 3. İşletmeye bağla
    const { error: linkError } = await supabase
      .from("business_customers")
      .insert({ business_id: input.businessId, user_id: targetUserId })

    if (linkError) {
      if (linkError.code === "23505") {
        return { success: false, error: "Bu müşteri zaten işletmenize kayıtlı." }
      }
      return { success: false, error: linkError.message }
    }

    return { success: true, data: { id: targetUserId, name: targetUserName } }
  }

  /**
   * VIP durumunu toggle eder.
   */
  static async toggleVip(input: ToggleVipInput) {
    const supabase = await createClient()

    const { error } = await supabase
      .from("business_customers")
      .update({ is_vip: input.isVip })
      .eq("business_id", input.businessId)
      .eq("user_id", input.customerUserId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * Müşteri notlarını günceller.
   */
  static async updateNotes(input: UpdateCustomerNotesInput) {
    const supabase = await createClient()

    const { error } = await supabase
      .from("business_customers")
      .update({ internal_notes: input.notes })
      .eq("business_id", input.businessId)
      .eq("user_id", input.customerUserId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * Müşterinin bir işletmeden ayrılmasını sağlar.
   */
  static async leaveBusiness(businessId: string, userId: string) {
    const supabase = await createClient()

    const { error } = await supabase
      .from("business_customers")
      .delete()
      .eq("business_id", businessId)
      .eq("user_id", userId)

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * İşletmeye ait müşteri listesini getirir.
   */
  static async listCustomers(businessId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("business_customers")
      .select(`
        user_id,
        is_vip,
        internal_notes,
        joined_at,
        users!inner (id, name, email, phone)
      `)
      .eq("business_id", businessId)
      .order("joined_at", { ascending: false })

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data }
  }
}
