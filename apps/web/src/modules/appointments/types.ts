export interface SlotParams {
    businessId: string
    date: string // YYYY-MM-DD
    staffBusinessId: string | "ANY"
    serviceIds: string[]
}

export interface TimeSlot {
    time: string
    status: "available" | "booked" | "break"
    staffId?: string // NEW: Candidate staff member for this slot
}

export interface BookingData {
  businessName: string
  businessHours: any[]
  services: any[]
  staffList: StaffBookingInfo[]
}

export interface StaffBookingInfo {
  id: string
  name: string
  avatar_url?: string
  serviceIds: string[]
  expertiseLevel?: string
  calendarColor?: string
  averageRating: number
}

export interface CreateBookingInput {
  businessId: string
  staffBusinessId: string
  serviceIds: string[]
  appointmentDate: string // YYYY-MM-DD
  startTime: string // HH:mm
  totalPrice: number
  totalDuration: number
  customerNote?: string
  familyProfileId?: string | null
}
