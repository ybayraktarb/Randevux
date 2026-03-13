import { z } from "zod"

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const phoneRegex = /^(\+?[\d\s\-]{7,15})$/

export const createStaffSchema = z.object({
  businessId: z.string().uuid("Geçerli bir işletme seçiniz."),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").max(50, "İsim en fazla 50 karakter olabilir."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  phone: z.string().regex(phoneRegex, "Geçerli bir telefon numarası giriniz.").optional().or(z.literal("")),
  role: z.enum(["staff", "manager", "personel"]).default("personel"),
  expertiseLevel: z.string().optional().default("Mid-Level"),
  calendarColor: z.string().optional().default("#3b82f6"),
})

export const updateStaffSchema = z.object({
  staffBusinessId: z.string().uuid(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  calendarColor: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const addLeaveSchema = z.object({
  staffBusinessId: z.string().uuid("Geçersiz personel ID"),
  requestType: z.enum(["full_day", "partial"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih YYYY-MM-DD formatında olmalı"),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  reason: z.string().max(500).optional(),
})

export const updateScheduleSchema = z.object({
  staffBusinessId: z.string().uuid(),
  schedules: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
    is_working: z.boolean(),
  })),
})

export const updateBreaksSchema = z.object({
  staffBusinessId: z.string().uuid(),
  breaks: z.array(z.object({
    day_of_week: z.number().min(0).max(6),
    start_time: z.string(),
    end_time: z.string(),
    label: z.string().default("Mola"),
  })),
})

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type CreateStaffInput = z.infer<typeof createStaffSchema>
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>
export type AddLeaveInput = z.infer<typeof addLeaveSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type UpdateBreaksInput = z.infer<typeof updateBreaksSchema>

export type LeaveType = "full_day" | "partial"
export type LeaveStatus = "pending" | "approved" | "rejected"

export interface LeaveRecord {
  id: string
  staff_business_id: string
  request_type: LeaveType
  date: string
  start_time: string | null
  end_time: string | null
  reason: string | null
  status: LeaveStatus
  reviewed_at: string | null
  created_at: string
}

export interface WorkSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

export interface BreakSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  label: string
}

export interface StaffMember {
  id: string
  userId: string
  name: string
  email: string
  phone?: string
  isActive: boolean
  calendarColor?: string
  expertiseLevel?: string
  role?: string
}
