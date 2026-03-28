import type {
  AppointmentSummary as Appointment,
  BusinessSummary as Business,
  CustomerNotification as Notification,
  CustomerProfile,
  FamilyProfile,
  NotificationSettings
} from "@randesk/shared"

export type TabView = "kesfet" | "genel" | "randevularim" | "profil"

export interface CustomerStats {
  totalSpent: number
  appointmentCount: number
  topServices: { name: string; count: number }[]
  spendingByMonth: { month: string; amount: number }[]
}

export type { Appointment, Business, Notification, CustomerProfile, FamilyProfile, NotificationSettings }
