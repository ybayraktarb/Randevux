import { z } from "zod"
import type { AppointmentStatus } from "../types/appointment.types"

export const notificationSettingsSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  push: z.boolean()
})

export const addFamilyProfileSchema = z.object({
  fullName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  relationship: z.enum(["Çocuk", "Eş", "Ebeveyn", "Kardeş", "Diğer"]),
  birthDate: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional()
})

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export interface AppointmentSummary {
  id: string
  businessId: string
  businessName: string
  businessInitials: string
  services: string
  date: string
  time: string
  fullDate: string | Date
  staffName: string
  status: AppointmentStatus
  price?: string
  isWithinHour?: boolean
}

export interface AppointmentDetail {
  id: string
  appointmentDate: string
  startTime: string
  endTime: string
  status: string
  totalPrice?: number | null
  cancellationReason?: string | null
  business: {
    id: string
    name: string
    address?: string | null
    phone?: string | null
    cancellationBufferMinutes?: number | null
    lat?: number | null
    lng?: number | null
  }
  staffName?: string
  services: Array<{
    id: string
    name: string
    price: number
    durationMinutes: number
    bufferMinutes: number
  }>
}

export interface BusinessSummary {
  id: string
  name: string
  initials: string
  category: string
  isFavorite?: boolean
}

export interface CustomerNotification {
  id: string
  title: string
  body: string
  created_at: string
  is_read: boolean
  user_id: string
}

export interface CustomerProfile {
  name: string
  phone: string
  notification_settings: NotificationSettings
}

export interface FamilyProfile {
  id: string
  full_name: string
  relationship: string
  birth_date?: string | null
  gender?: "male" | "female" | "other" | null
  created_at?: string | null
}

export interface CustomerDashboardData {
  profile: CustomerProfile
  businesses: BusinessSummary[]
  appointments: AppointmentSummary[]
  notifications: CustomerNotification[]
}

export type AddFamilyProfileInput = z.infer<typeof addFamilyProfileSchema>
