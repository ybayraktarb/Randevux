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
import type { WorkSchedule, BreakSchedule } from "@/src/modules/staff/types"

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
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const validated = createStaffSchema.safeParse(input)
    if (!validated.success) {
      const firstError = validated.error.errors[0]
      return { success: false, error: { message: firstError.message, field: firstError.path.join(".") } }
    }

    return await StaffService.create(validated.data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "Personel eklenirken beklenmedik bir hata oluştu." } }
  }
}

/**
 * Personelin aktifliğini toggle eder.
 */
export async function toggleStaffActiveAction(staffBusinessId: string, isActive: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    return await StaffService.toggleActive(staffBusinessId, isActive)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "İşlem başarısız oldu." } }
  }
}

/**
 * Personeli kaldırır.
 */
export async function removeStaffAction(staffBusinessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    return await StaffService.remove(staffBusinessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "Personel kaldırılırken hata oluştu." } }
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
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    const validated = addLeaveSchema.safeParse(input)
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    return await LeaveService.add(validated.data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "İzin eklenirken hata oluştu." } }
  }
}

export async function removeStaffLeaveAction(leaveId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    return await LeaveService.remove(leaveId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "İzin silinemedi." } }
  }
}

export async function getStaffLeavesAction(staffBusinessId: string) {
  try {
    return await LeaveService.list(staffBusinessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "İzinler yüklenemedi.", data: [] }
  }
}

export async function reviewStaffLeaveAction(leaveId: string, status: "approved" | "rejected") {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: { message: "Oturum açmanız gerekiyor." } }

    return await LeaveService.review(leaveId, status)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "İzin durumu güncellenemedi." } }
  }
}

// ─── Schedule Actions ─────────────────────────────────────────────────────────

export async function updateStaffWorkSchedulesAction(staffBusinessId: string, schedules: WorkSchedule[]) {
  try {
    const validated = updateScheduleSchema.safeParse({ staffBusinessId, schedules })
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    return await ScheduleService.updateWorkSchedules(staffBusinessId, schedules)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "Çalışma saatleri kaydedilemedi." } }
  }
}

export async function updateStaffBreaksAction(staffBusinessId: string, breaks: BreakSchedule[]) {
  try {
    const validated = updateBreaksSchema.safeParse({ staffBusinessId, breaks })
    if (!validated.success) return { success: false, error: { message: validated.error.errors[0].message } }

    return await ScheduleService.updateBreaks(staffBusinessId, breaks)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: { message: "Mola saatleri kaydedilemedi." } }
  }
}
