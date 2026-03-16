import { TimeSlot } from "@/src/modules/appointments/types"
import { FamilyProfileRecord as FamilyProfile } from "@/src/modules/customers/types"

export interface Service {
  id: string
  name: string
  category: string
  duration: number
  price: number
}

export interface Staff {
  id: string
  name: string
  specialty: string
  online: boolean
  serviceIds: string[]
}

export const STEP_LABELS = ["Hizmet", "Personel", "Tarih & Saat", "Ozet"]
export const DAYS_TR = ["Pt", "Sl", "Cr", "Pr", "Cu", "Ct", "Pz"]
export const MONTHS_TR = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
]
export const DAYS_FULL_TR = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
