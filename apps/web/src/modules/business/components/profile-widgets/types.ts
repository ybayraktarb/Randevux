export type ServiceCategory = "Tumu" | string

export interface Business {
  id: string
  name: string
  category: string
  address: string
  phone: string
  logo_url?: string
  description?: string
  isFavorite?: boolean
  averageRating?: number
  reviewCount?: number
}

export interface Review {
  id: string
  userName: string
  avatarUrl?: string
  rating: number
  comment: string
  createdAt: string
}

export interface Service {
  id: string
  name: string
  duration: string // formatted string "45 dk"
  price: number
  priceLabel: string
  category: ServiceCategory
  rawDuration: number
}

export interface StaffMember {
  id: string
  name: string
  specialty: string
  rating: string
  online: boolean
}

export interface WorkingDay {
  day: string
  hours: string
  isClosed: boolean
  isToday: boolean
}
