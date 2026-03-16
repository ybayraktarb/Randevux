"use server"

import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { WorkSchedule, BreakSchedule } from "../types"

const getAdmin = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// ─── ScheduleService ─────────────────────────────────────────────────────────
// Personelin çalışma takvimi ve mola yönetimi.

export class ScheduleService {
  /**
   * Personelin haftalık çalışma saatlerini günceller (replace-all stratejisi).
   */
  static async updateWorkSchedules(staffBusinessId: string, schedules: WorkSchedule[]): Promise<{ success: boolean; error?: { message: string } }> {
    const admin = getAdmin()

    // 1. Mevcut kayıtları temizle
    const { error: deleteError } = await admin
      .from("work_schedule_templates")
      .delete()
      .eq("staff_business_id", staffBusinessId)

    if (deleteError) {
      return { success: false, error: { message: "Çalışma saatleri silinirken hata oluştu." } }
    }

    // 2. Yeni kayıtları ekle
    if (schedules.length > 0) {
      const rows = schedules.map((s) => ({
        staff_business_id: staffBusinessId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_working: s.is_working,
      }))

      const { error: insertError } = await admin
        .from("work_schedule_templates")
        .insert(rows)

      if (insertError) {
        return { success: false, error: { message: "Çalışma saatleri kaydedilirken hata oluştu." } }
      }
    }

    revalidatePath("/patron")
    return { success: true }
  }

  /**
   * Personelin mola bloklarını günceller (replace-all stratejisi).
   */
  static async updateBreaks(staffBusinessId: string, breaks: BreakSchedule[]): Promise<{ success: boolean; error?: { message: string } }> {
    const admin = getAdmin()

    // 1. Mola kayıtlarını temizle
    const { error: deleteError } = await admin
      .from("break_schedules")
      .delete()
      .eq("staff_business_id", staffBusinessId)

    if (deleteError) {
      return { success: false, error: { message: "Mola saatleri silinirken hata oluştu." } }
    }

    // 2. Yeni mola bloklarını ekle
    if (breaks.length > 0) {
      const rows = breaks.map((b) => ({
        staff_business_id: staffBusinessId,
        day_of_week: b.day_of_week,
        start_time: b.start_time,
        end_time: b.end_time,
        label: b.label || "Mola",
      }))

      const { error: insertError } = await admin
        .from("break_schedules")
        .insert(rows)

      if (insertError) {
        return { success: false, error: { message: "Mola saatleri kaydedilirken hata oluştu." } }
      }
    }

    revalidatePath("/patron")
    return { success: true }
  }
}
