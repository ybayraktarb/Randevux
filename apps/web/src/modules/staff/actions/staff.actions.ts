"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { StaffService } from "@/src/modules/staff/services/staff.service"
import { LeaveService } from "@/src/modules/staff/services/leave.service"
import { ScheduleService } from "@/src/modules/staff/services/schedule.service"
import {
  createStaffSchema,
  addLeaveSchema,
  updateScheduleSchema,
  updateBreaksSchema,
} from "@/src/modules/staff/types"
import type { ActionResult } from "@/lib/validations/action-types"
import type { WorkSchedule, BreakSchedule, StaffLeave } from "@/src/modules/staff/types"
import type { User } from "@supabase/supabase-js"

// ─── Staff Thin Actions ──────────────────────────────────────────────────────
// Auth kontrolü + Zod validasyonu → Service çağrısı

/**
 * Yeni personel oluşturur (FormData veya plain object).
 */
export async function createStaffAction(input: {
  businessId: string
  name: string
  email: string
  phone?: string
  role?: string
  expertiseLevel?: string
  calendarColor?: string
}): Promise<ActionResult<{ user: User }>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const validated = createStaffSchema.safeParse(input)
    if (!validated.success) {
      const firstError = validated.error.errors[0]
      return { success: false, error: { message: firstError.message, field: firstError.path.join(".") } }
    }

    const res = await StaffService.create(validated.data)
    if (!res.success) return { success: false, error: res.error || { message: "Personel eklenemedi." } }
    return { success: true, data: res.data as { user: User } }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Personel eklenirken beklenmedik bir hata oluştu."
    return { success: false, error: { message } }
  }
}

/**
 * Personelin aktifliğini toggle eder.
 */
export async function toggleStaffActiveAction(staffBusinessId: string, isActive: boolean): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const res = await StaffService.toggleActive(staffBusinessId, isActive)
    if (!res.success) return { success: false, error: res.error || { message: "Hata oluştu." } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İşlem başarısız oldu."
    return { success: false, error: { message } }
  }
}

/**
 * Personeli kaldırır.
 */
export async function removeStaffAction(staffBusinessId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const res = await StaffService.remove(staffBusinessId)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Personel kaldırılırken hata oluştu."
    return { success: false, error: { message } }
  }
}

// ─── Leave Actions ────────────────────────────────────────────────────────────

export async function addStaffLeaveAction(input: {
  staffBusinessId: string
  requestType: "full_day" | "partial"
  date: string
  startTime?: string | null
  endTime?: string | null
  reason?: string
}): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const validated = addLeaveSchema.safeParse(input)
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    const res = await LeaveService.add(validated.data)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İzin eklenirken hata oluştu."
    return { success: false, error: { message } }
  }
}

export async function removeStaffLeaveAction(leaveId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const res = await LeaveService.remove(leaveId)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İzin silinemedi."
    return { success: false, error: { message } }
  }
}

export async function getStaffLeavesAction(staffBusinessId: string): Promise<ActionResult<StaffLeave[]>> {
  try {
    const res = await LeaveService.list(staffBusinessId)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: res.data }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İzinler yüklenemedi."
    return { success: false, error: { message } }
  }
}

export async function reviewStaffLeaveAction(leaveId: string, status: "approved" | "rejected"): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const res = await LeaveService.review(leaveId, status)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "İzin durumu güncellenemedi."
    return { success: false, error: { message } }
  }
}

// ─── Schedule Actions ─────────────────────────────────────────────────────────

export async function updateStaffWorkSchedulesAction(staffBusinessId: string, schedules: WorkSchedule[]): Promise<ActionResult<void>> {
  try {
    const validated = updateScheduleSchema.safeParse({ staffBusinessId, schedules })
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    const res = await ScheduleService.updateWorkSchedules(staffBusinessId, schedules)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Çalışma saatleri kaydedilemedi."
    return { success: false, error: { message } }
  }
}

export async function updateStaffBreaksAction(staffBusinessId: string, breaks: BreakSchedule[]): Promise<ActionResult<void>> {
  try {
    const validated = updateBreaksSchema.safeParse({ staffBusinessId, breaks })
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    const res = await ScheduleService.updateBreaks(staffBusinessId, breaks)
    if (!res.success) return { success: false, error: res.error || { message: "Hata" } }
    return { success: true, data: undefined }
  } catch (err: unknown) {
    Sentry.captureException(err)
    const message = err instanceof Error ? err.message : "Mola saatleri kaydedilemedi."
    return { success: false, error: { message } }
  }
}
