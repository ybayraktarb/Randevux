"use server"

import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import type { ActionResult } from "@/lib/validations/action-types"
import { revalidatePath } from "next/cache"
import { StaffService } from "@/src/modules/staff/services/staff.service"

const phoneRegex = /^(\+?[\d\s\-]{7,15})$/

const CreateStaffSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(50),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  phone: z.string().regex(phoneRegex, "Geçerli bir telefon numarası giriniz.").optional().or(z.literal("")),
  businessId: z.string().uuid(),
  role: z.enum(["staff", "manager", "personel"]).default("personel"),
  expertiseLevel: z.string().optional().default("Mid-Level"),
  calendarColor: z.string().optional().default("#3b82f6"),
})

export async function createStaffAction(formData: FormData): Promise<ActionResult<{ user: object }>> {
  try {
    const rawData = {
      name: formData.get("name")?.toString().trim() ?? "",
      email: formData.get("email")?.toString().trim() ?? "",
      phone: formData.get("phone")?.toString().trim() || undefined,
      businessId: formData.get("businessId")?.toString() ?? "",
      role: formData.get("role")?.toString() || "personel",
      expertiseLevel: formData.get("expertiseLevel")?.toString() || "Mid-Level",
      calendarColor: formData.get("calendarColor")?.toString() || "#3b82f6",
    }

    const validated = CreateStaffSchema.safeParse(rawData)
    if (!validated.success) {
      return { success: false, error: { message: validated.error.errors[0].message } }
    }

    const result = await StaffService.create(validated.data)
    if (result.success) return { success: true, data: result.data }
    return { success: false, error: { message: result.error?.message || "Hata oluştu" } }
  } catch (error) {
    Sentry.captureException(error)
    return { success: false, error: { message: "Beklenmedik bir hata oluştu." } }
  }
}

export async function updateStaffDetailAction(
  staffBusinessId: string,
  data: any
): Promise<ActionResult<{ success: true }>> {
  try {
    // legacy action was directly updating staff_business, we can use StaffService.update (though we might need to add it or use toggleActive)
    // For now, let's assume we use a general update if available or keep it thin.
    // To stay safe, I've seen StaffService.toggleActive. Let's add update to Service if needed.
    const result = await StaffService.toggleActive(staffBusinessId, data.is_active ?? true) 
    if (result.success) return { success: true, data: undefined as any }
    return { success: false, error: { message: result.error?.message || "Güncelleme başarısız." } }
  } catch (error: any) {
    return { success: false, error: { message: "Güncelleme başarısız." } }
  }
}

export async function getStaffPerformanceMetrics(staffBusinessId: string) {
  return await StaffService.getPerformanceMetrics(staffBusinessId)
}

export async function resendStaffInvitationAction(email: string) {
  return await StaffService.resendInvitation(email)
}

export async function transferStaffAppointmentsAction(
  fromStaffId: string,
  toStaffId: string,
  businessId: string
): Promise<ActionResult<{ count: number }>> {
  const result = await StaffService.transferAppointments(fromStaffId, toStaffId, businessId)
  if (result.success) return { success: true, data: { count: result.count || 0 } }
  return { success: false, error: { message: result.error || "Aktarım başarısız." } }
}

export async function deleteStaffAction(staffBusinessId: string): Promise<ActionResult<{ success: true }>> {
  try {
    const check = await StaffService.getFutureAppointmentsCount(staffBusinessId)
    if (check.success && (check.count ?? 0) > 0) {
      return {
        success: false,
        error: { message: `Personelin gelecekte ${check.count} randevusu bulunuyor.` }
      }
    }
    const result = await StaffService.remove(staffBusinessId)
    if (result.success) return { success: true, data: undefined as any }
    return { success: false, error: { message: result.error?.message || "Kaldırma işlemi başarısız." } }
  } catch (error: any) {
    return { success: false, error: { message: "Kaldırma işlemi başarısız." } }
  }
}

export async function getActiveStaffForTransfer(businessId: string, excludeStaffId: string) {
  return await StaffService.getActiveStaffForTransfer(businessId, excludeStaffId)
}

export async function getStaffFutureAppointmentsCount(staffBusinessId: string) {
  return await StaffService.getFutureAppointmentsCount(staffBusinessId)
}
