import { z } from "zod"

// ─── Business Schemas ───────────────────────────────────────────────────────

export const businessProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "İşletme adı en az 2 karakter olmalıdır"),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  logoUrl: z.string().url("Geçerli bir URL giriniz").nullable().optional().or(z.literal("")),
  qrCode: z.string().nullable().optional(),
})

export type BusinessProfileInput = z.infer<typeof businessProfileSchema>

export const appointmentPolicySchema = z.object({
  businessId: z.string().uuid(),
  autoApprove: z.boolean(),
  cancellationBufferMinutes: z.number().min(0),
})

export type AppointmentPolicyInput = z.infer<typeof appointmentPolicySchema>

// ─── Service Schemas ────────────────────────────────────────────────────────

export const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  name: z.string().min(2, "Hizmet adı en az 2 karakter olmalıdır"),
  description: z.string().nullable().optional(),
  baseDurationMinutes: z.number().min(1, "Süre en az 1 dakika olmalıdır"),
  basePrice: z.number().min(0, "Fiyat negatif olamaz"),
  bufferTimeMinutes: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
  staffIds: z.array(z.string().uuid()).optional(),
})

export type ServiceInput = z.infer<typeof serviceSchema>

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Business {
  id: string
  name: string
  address?: string
  phone?: string
  description?: string
  logo_url?: string
  qr_code?: string
  invite_code?: string
  auto_approve: boolean
  cancellation_buffer_minutes: number
  is_active: boolean
  created_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  base_duration_minutes: number
  base_price: number
  buffer_time_minutes: number
  is_active: boolean
  created_at: string
  // Derived fields for UI
  staffCount?: number
  staffNames?: string[]
  staffIds?: string[]
}
export interface AtomicOnboardPayload {
  isNewOwner: boolean
  ownerId?: string
  newOwnerData?: {
    name: string
    email: string
    password?: string
  }
  businessData: {
    name: string
    city: string
    phone: string
    description?: string
    onboardingStatus: string
    packageId: string
  }
}

export interface ReviewInput {
  businessId: string
  rating: number
  comment?: string
  appointmentId: string
}
