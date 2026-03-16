import { NotificationSettings } from "@/src/modules/auth/types"
export type { FamilyProfileRecord as FamilyProfile } from "@/src/modules/customers/types"

export type TabView = "kesfet" | "genel" | "randevularim" | "isletmelerim" | "profil"

export interface Appointment {
  id: string
  businessId: string
  businessName: string
  businessInitials: string
  services: string
  date: string
  time: string
  fullDate: Date
  staffName: string
  status: "Onaylandı" | "Bekliyor" | "Tamamlandı" | "İptal" | "Gelmedi"
  price?: string
  isWithinHour?: boolean
}

export interface Business {
  id: string
  name: string
  initials: string
  category: string
  todayHours?: string
  isOpen?: boolean
  isFavorite?: boolean
}

export interface Notification {
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

export interface CustomerStats {
  totalSpent: number
  appointmentCount: number
  topServices: { name: string; count: number }[]
  spendingByMonth: { month: string; amount: number }[]
}
