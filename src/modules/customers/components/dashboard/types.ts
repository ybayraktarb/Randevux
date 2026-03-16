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
