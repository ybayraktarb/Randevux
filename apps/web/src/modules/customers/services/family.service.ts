"use server"

import { createClient } from "@/lib/supabase/server"
import type { AddFamilyProfileInput } from "../types"

// ─── FamilyService ──────────────────────────────────────────────────────────
// Müşteriyle ilgili ama ayrı bir sorumluluk alanı: Aile profilleri.

export class FamilyService {
  /**
   * Kullanıcıya ait aile profillerini getirir.
   */
  static async list(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("family_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })

    if (error) return { success: false, error: error.message, data: [] }
    return { success: true, data }
  }

  /**
   * Yeni aile profili ekler.
   */
  static async add(userId: string, input: AddFamilyProfileInput) {
    const supabase = await createClient()

    const { error } = await supabase.from("family_profiles").insert({
      user_id: userId,
      full_name: input.fullName,
      relationship: input.relationship,
      birth_date: input.birthDate,
      gender: input.gender,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  }

  /**
   * Aile profilini siler.
   */
  static async delete(profileId: string, userId: string) {
    const supabase = await createClient()

    // Güvenlik: Sadece kendi profilini silebilir
    const { error } = await supabase
      .from("family_profiles")
      .delete()
      .eq("id", profileId)
      .eq("user_id", userId) // RLS desteklese de double-check

    if (error) return { success: false, error: error.message }
    return { success: true }
  }
}
