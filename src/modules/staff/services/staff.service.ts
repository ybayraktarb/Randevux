// Staff service layer

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"
import type { CreateStaffInput, UpdateStaffInput } from "../types"

// ─── StaffService ────────────────────────────────────────────────────────────
// Personel CRUD işlemleri için saf servis katmanı.

const getAdmin = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

export class StaffService {
  /**
   * Yeni personel oluşturur:
   * 1. Supabase Auth'ta kullanıcı açar
   * 2. staff_business tablosuna ekler
   * 3. Karşılama bildirimi gönderir
   */
  static async create(input: CreateStaffInput) {
    const supabaseAdmin = getAdmin()

    // 1. Auth user oluştur
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: "Randevuxx" + Math.random().toString(36).slice(2) + "!",
      phone: input.phone || undefined,
      email_confirm: true,
      user_metadata: { name: input.name },
    })

    if (createError || !newUser?.user) {
      return { success: false, error: { message: "Kullanıcı oluşturulamadı: " + createError?.message } }
    }

    // 2. DB trigger için kısa bekleme
    await delay(400)

    // 3. staff_business'a ekle
    const { error: staffError } = await supabaseAdmin
      .from("staff_business")
      .insert({
        user_id: newUser.user.id,
        business_id: input.businessId,
        is_active: true,
        calendar_color: input.calendarColor,
        expertise_level: input.expertiseLevel,
      })

    if (staffError) {
      // Rollback: auth user'ı sil
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      return { success: false, error: { message: "Personel eklenemedi: " + staffError.message } }
    }

    // 4. Bildirim gönder (best-effort)
    try {
      await createNotificationAction({
        userId: newUser.user.id,
        title: "İşletmeye Davet Edildiniz",
        body: "Bir işletmeye personel olarak eklendiniz. Hoş geldiniz!",
        type: "staff_invitation",
      })
    } catch { /* bildirimsiz devam et */ }

    revalidatePath("/patron")
    return { success: true, data: { user: newUser.user } }
  }

  /**
   * Personelin aktiflik durumunu değiştirir.
   */
  static async toggleActive(staffBusinessId: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase
      .from("staff_business")
      .update({ is_active: isActive })
      .eq("id", staffBusinessId)

    if (error) return { success: false, error: { message: error.message } }
    revalidatePath("/patron")
    return { success: true }
  }

  /**
   * Personeli işletmeden kaldırır (hard delete).
   */
  static async remove(staffBusinessId: string) {
    const supabase = await createClient()
    const { error } = await supabase
      .from("staff_business")
      .delete()
      .eq("id", staffBusinessId)

    if (error) return { success: false, error: { message: error.message } }
    revalidatePath("/patron")
    return { success: true }
  }

  /**
   * Bir personelin gelecekteki aktif randevu sayısını getirir.
   */
  static async getFutureAppointmentsCount(staffBusinessId: string) {
    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("staff_business_id", staffBusinessId)
      .gte("appointment_date", today)
      .not("status", "in", '("İptal", "Gelmedi")')

    if (error) return { success: false, count: 0, error: error.message }
    return { success: true, count: count || 0 }
  }

  /**
   * Personel performans metriklerini hesaplar.
   */
  static async getPerformanceMetrics(staffBusinessId: string) {
    const supabase = await createClient()
    
    // 1. Toplam tamamlanan randevular
    const { count: totalApts, error: countErr } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("staff_business_id", staffBusinessId)
      .eq("status", "Tamamlandı")

    if (countErr) return { success: false, data: { totalAppointments: 0, averageRating: 0 } }

    // 2. Ortalama puan (Reviewlardan)
    const { data: reviews, error: reviewsErr } = await supabase
      .from("business_reviews")
      .select("rating")
      .eq("staff_business_id", staffBusinessId) // Assuming schema supports this or via appointment join

    if (reviewsErr) return { success: true, data: { totalAppointments: totalApts || 0, averageRating: 0 } }

    let avgRating = 0
    if (reviews && reviews.length > 0) {
      avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    }

    return {
      success: true,
      data: {
        totalAppointments: totalApts || 0,
        averageRating: Number(avgRating.toFixed(1))
      }
    }
  }

  /**
   * Mevcut bir personele tekrar davet e-postası gönderir.
   */
  static async resendInvitation(email: string) {
    const supabaseAdmin = getAdmin()
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * Randevuları bir personelden diğerine aktarır.
   */
  static async transferAppointments(fromStaffId: string, toStaffId: string, businessId: string) {
    const supabase = await createClient()
    const today = new Date().toISOString().split("T")[0]

    const { data: appts, error: fetchErr } = await supabase
      .from("appointments")
      .select("id, customer_user_id, appointment_date")
      .eq("staff_business_id", fromStaffId)
      .eq("business_id", businessId)
      .gte("appointment_date", today)
      .in("status", ["Bekliyor", "Onaylandı"])

    if (fetchErr) return { success: false, error: fetchErr.message }
    if (!appts || appts.length === 0) return { success: true, count: 0 }

    const { error: updateErr } = await supabase
      .from("appointments")
      .update({ staff_business_id: toStaffId })
      .in("id", appts.map(a => a.id))

    if (updateErr) return { success: false, error: updateErr.message }

    // Bildirim gönderimi (Async)
    appts.forEach(async (apt) => {
      if (apt.customer_user_id) {
        await createNotificationAction({
          userId: apt.customer_user_id,
          title: "Personel Değişikliği",
          body: `${apt.appointment_date} tarihindeki randevunuz için yeni bir uzman atanmıştır.`,
          type: "system",
        })
      }
    })

    revalidatePath("/patron")
    return { success: true, count: appts.length }
  }

  /**
   * Aktarım için uygun personel listesini getirir.
   */
  static async getActiveStaffForTransfer(businessId: string, excludeStaffId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("staff_business")
      .select("id, users(name)")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .neq("id", excludeStaffId)

    if (error) return { success: false, error: error.message }
    return { success: true, data }
  }
}
