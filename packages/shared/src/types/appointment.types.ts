import { z } from "zod"

export type AppointmentStatus = "Bekliyor" | "Onaylandı" | "Tamamlandı" | "İptal" | "Gelmedi" | "pending" | "confirmed" | "cancelled" | "no_show" | "completed"

// ─── ZOD SCHEMAS ─────────────────────────────────────────────────────────────

// Hizmet secimi semasi
export const serviceSelectionSchema = z.object({
  id: z.string().uuid("Hizmet ID'si geçersiz"),
  base_price: z.number().min(0),
  base_duration_minutes: z.number().min(1),
  buffer_time_minutes: z.number().optional().default(0),
})

// Manuel Randevu Olusturma Semasi
export const createManualAppointmentSchema = z.object({
  businessId: z.string().uuid("İşletme ID'si geçersiz"),
  customerId: z.string().uuid().optional(),
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  staffId: z.string().uuid("Personel ID'si geçersiz"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Geçersiz tarih formatı (YYYY-A-G)"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Geçersiz saat formatı (SS:DD)"),
  services: z.array(serviceSelectionSchema).min(1, "En az bir hizmet seçmelisiniz"),
}).refine(data => {
  // Eger misafir ise id yoksa isim ve telefon sart
  if (!data.customerId && (!data.guestName || !data.guestPhone)) {
    return false
  }
  return true
}, {
  message: "Müşteri seçmediyseniz misafir adı ve telefonu girmek zorundasınız.",
  path: ["guestName"] // error bound to guestName
})

export type CreateManualAppointmentInput = z.infer<typeof createManualAppointmentSchema>

// Randevu Iptal Semasi
export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().uuid("Geçersiz randevu ID'si"),
  businessId: z.string().uuid(),
  reason: z.string().optional(),
})

export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>

// Randevu Durum Guncelleme Semasi
export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  businessId: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled", "no_show", "completed", "Bekliyor", "Onaylandı", "İptal", "Gelmedi", "Tamamlandı"]),
})

export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>
