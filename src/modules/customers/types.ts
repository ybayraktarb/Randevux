import { z } from "zod"

// ─── CRM Zod Schemas ────────────────────────────────────────────────────────

export const addCustomerSchema = z.object({
  businessId: z.string().uuid("Geçersiz işletme ID"),
  email: z.string().email("Geçersiz e-posta"),
  name: z.string().min(2, "Ad en az 2 karakter olmalı"),
  phone: z.string().optional(),
})

export const updateCustomerNotesSchema = z.object({
  businessId: z.string().uuid(),
  customerUserId: z.string().uuid(),
  notes: z.string(),
})

export const toggleVipSchema = z.object({
  businessId: z.string().uuid(),
  customerUserId: z.string().uuid(),
  isVip: z.boolean(),
})

export const addFamilyProfileSchema = z.object({
  fullName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  relationship: z.enum(["Çocuk", "Eş", "Ebeveyn", "Kardeş", "Diğer"]),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
})

// ─── TypeScript Types ────────────────────────────────────────────────────────

export type AddCustomerInput = z.infer<typeof addCustomerSchema>
export type UpdateCustomerNotesInput = z.infer<typeof updateCustomerNotesSchema>
export type ToggleVipInput = z.infer<typeof toggleVipSchema>
export type AddFamilyProfileInput = z.infer<typeof addFamilyProfileSchema>

export interface CustomerRecord {
  id: string
  name: string
  email: string
  phone?: string
  isVip: boolean
  internalNotes?: string
  totalAppointments?: number
  totalSpent?: number
  joinedAt: string
}

export interface FamilyProfile {
  id: string
  userId: string
  fullName: string
  relationship: string
  birthDate?: string
  gender?: "male" | "female" | "other"
  createdAt: string
}

export interface FamilyProfileRecord {
  id: string
  full_name: string
  relationship: string
}
