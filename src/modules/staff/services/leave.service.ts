"use server"

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import type { AddLeaveInput, LeaveRecord, LeaveStatus } from "../types"

const getAdmin = () =>
  createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// ─── LeaveService ────────────────────────────────────────────────────────────
// Personel izin yönetimi için saf servis katmanı.

export class LeaveService {
  /**
   * Patron tarafından personele izin ekler (otomatik 'approved').
   */
  static async add(input: AddLeaveInput): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = await createClient()

    const { error } = await supabase.rpc("owner_add_staff_leave", {
      p_staff_business_id: input.staffBusinessId,
      p_request_type: input.requestType,
      p_date: input.date,
      p_start_time: input.startTime ?? null,
      p_end_time: input.endTime ?? null,
      p_reason: input.reason ?? null,
    })

    if (error) return { success: false, error: { message: error.message || "İzin eklenemedi." } }
    revalidatePath("/patron")
    return { success: true }
  }

  /**
   * İzin kaydını siler.
   */
  static async remove(leaveId: string): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", leaveId)

    if (error) return { success: false, error: { message: "İzin silinemedi." } }
    revalidatePath("/patron")
    return { success: true }
  }

  /**
   * Personele ait tüm izinleri listeler.
   */
  static async list(staffBusinessId: string): Promise<{ success: boolean; data: LeaveRecord[]; error?: { message: string } }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("staff_business_id", staffBusinessId)
      .order("date", { ascending: false })

    if (error) return { success: false, error: { message: error.message }, data: [] }
    return { success: true, data: (data || []) as LeaveRecord[] }
  }

  /**
   * İzin talebini onaylar veya reddeder.
   */
  static async review(leaveId: string, status: "approved" | "rejected"): Promise<{ success: boolean; error?: { message: string } }> {
    const supabase = await createClient()

    const { error } = await supabase
      .from("leave_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", leaveId)

    if (error) return { success: false, error: { message: "İzin durumu güncellenemedi." } }
    revalidatePath("/patron")
    return { success: true }
  }
}
