export type { UserRole } from "@randevux/shared"

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
}

export interface QuickRebookData {
  id: string
  businessId: string
  businessName: string
  businessLogo?: string
  category: string
  serviceNames: string
  serviceIds: string
  lastDate: string
}
