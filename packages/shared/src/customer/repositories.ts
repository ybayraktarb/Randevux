import type {
  AppointmentsRepository,
  CustomerProfileRepository,
  FamilyProfilesRepository,
  NotificationsRepository
} from "../contracts/repositories"
import { fail, ok, type AppResult } from "../core/result"
import type {
  AddFamilyProfileInput,
  AppointmentDetail,
  AppointmentSummary,
  BusinessSummary,
  CustomerDashboardData,
  CustomerNotification,
  CustomerProfile,
  FamilyProfile
} from "./types"
import { addFamilyProfileSchema } from "./types"

type QueryResult<T> = Promise<{ data: T | null; error: { message: string; code?: string } | null }>

export interface SupabaseLike {
  from(table: string): {
    select(query: string): any
    update(values: Record<string, unknown>): any
    insert(values: Record<string, unknown> | Array<Record<string, unknown>>): any
    delete(): any
  }
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

function getInitials(name: string | null | undefined) {
  return (name || "?").substring(0, 2).toUpperCase()
}

function mapAppointment(row: any): AppointmentSummary {
  const businessRow = unwrapOne(row.business)
  const staffRow = unwrapOne(row.staff)
  const staffUser = unwrapOne(staffRow?.user)
  const services = Array.isArray(row.services) ? row.services : []

  const serviceNames = services
    .map((serviceRow: any) => unwrapOne(serviceRow.service)?.name || "")
    .filter(Boolean)
    .join(", ")

  const fullDate = new Date(`${row.appointment_date}T${row.start_time}`)
  const now = new Date()
  const diffMs = fullDate.getTime() - now.getTime()
  const timeParts = String(row.start_time).split(":")
  const endParts = String(row.end_time).split(":")

  return {
    id: row.id,
    businessId: row.business_id,
    businessName: businessRow?.name || "?",
    businessInitials: getInitials(businessRow?.name),
    services: serviceNames || "Hizmet belirtilmedi",
    date: new Date(`${row.appointment_date}T00:00:00`).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "long"
    }),
    time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
    fullDate: fullDate.toISOString(),
    staffName: staffUser?.name || "?",
    status: row.status,
    price: row.total_price ? `${row.total_price} TL` : undefined,
    isWithinHour: diffMs > 0 && diffMs <= 60 * 60 * 1000
  }
}

function mapBusiness(row: any, favoriteIds: Set<string>): BusinessSummary | null {
  const businessRow = unwrapOne(row.business)
  if (!businessRow) return null

  return {
    id: businessRow.id,
    name: businessRow.name || "?",
    initials: getInitials(businessRow.name),
    category: businessRow.category || "Genel",
    isFavorite: favoriteIds.has(businessRow.id)
  }
}

function mapAppointmentDetail(row: any): AppointmentDetail {
  const business = unwrapOne(row.businesses)
  const staff = unwrapOne(row.staff_business)
  const staffUser = unwrapOne(staff?.users)
  const services = Array.isArray(row.appointment_services) ? row.appointment_services : []

  return {
    id: row.id,
    appointmentDate: row.appointment_date,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    totalPrice: row.total_price,
    cancellationReason: row.cancellation_reason,
    business: {
      id: business?.id || "",
      name: business?.name || "",
      address: business?.address,
      phone: business?.phone,
      cancellationBufferMinutes: business?.cancellation_buffer_minutes,
      lat: business?.lat,
      lng: business?.lng
    },
    staffName: staffUser?.name,
    services: services.map((service: any) => ({
      id: service.id,
      name: unwrapOne(service.services)?.name || "",
      price: Number(service.price_snapshot || 0),
      durationMinutes: Number(service.duration_snapshot || 0),
      bufferMinutes: Number(service.buffer_snapshot || 0)
    }))
  }
}

export function createCustomerRepositories(supabase: SupabaseLike): {
  appointments: AppointmentsRepository
  customerProfile: CustomerProfileRepository
  notifications: NotificationsRepository
  familyProfiles: FamilyProfilesRepository
} {
  const appointments: AppointmentsRepository = {
    async list(userId) {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, business_id, business:businesses(name, category), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("customer_user_id", userId)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })

      if (error) return fail(error.message)

      return ok(((data || []) as any[]).map(mapAppointment))
    },

    async getDetail(appointmentId) {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          businesses (id, name, address, phone, cancellation_buffer_minutes, lat, lng),
          staff_business (id, users (name)),
          appointment_services (id, price_snapshot, duration_snapshot, buffer_snapshot, services (name))
        `)
        .eq("id", appointmentId)
        .single()

      if (error || !data) return fail(error?.message || "Randevu bulunamadı.")

      return ok(mapAppointmentDetail(data))
    }
  }

  const customerProfile: CustomerProfileRepository = {
    async getProfile(userId) {
      const { data, error } = await supabase
        .from("users")
        .select("name, phone, notification_settings")
        .eq("id", userId)
        .single()

      if (error) return fail(error.message)

      return ok({
        name: data?.name || "",
        phone: data?.phone || "",
        notification_settings: data?.notification_settings || { push: true, email: true, sms: false }
      })
    },

    async updateProfile(userId, profile) {
      const { error } = await supabase
        .from("users")
        .update({
          name: profile.name,
          phone: profile.phone,
          notification_settings: profile.notification_settings
        })
        .eq("id", userId)

      if (error) return fail(error.message)
      return ok(profile)
    },

    async getBusinesses(userId) {
      const [{ data: businessRows, error: businessError }, { data: favoriteRows, error: favoriteError }] = await Promise.all([
        supabase
          .from("business_customers")
          .select("*, business:businesses(id, name, category, logo_url)")
          .eq("user_id", userId)
          .eq("is_blocked", false),
        supabase
          .from("user_favorites")
          .select("business_id")
          .eq("user_id", userId)
      ])

      if (businessError) return fail(businessError.message)
      if (favoriteError) return fail(favoriteError.message)

      const favoriteIds = new Set(((favoriteRows || []) as any[]).map((row) => row.business_id))
      const businesses = ((businessRows || []) as any[])
        .map((row) => mapBusiness(row, favoriteIds))
        .filter(Boolean) as BusinessSummary[]
      businesses.sort((a, b) => Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)))

      return ok(businesses)
    },

    async joinBusiness(userId, code) {
      const cleanedCode = code.replace(/\s+/g, "").toUpperCase()
      if (!cleanedCode) return fail("İşletme kodu gerekli.")

      const { data: matchedBusiness, error: businessError } = await supabase
        .from("businesses")
        .select("id, name, category")
        .or(`qr_code.eq.${cleanedCode},invite_code.eq.${cleanedCode}`)
        .maybeSingle()

      if (businessError) return fail(businessError.message)
      if (!matchedBusiness) return fail("İşletme kodu bulunamadı.")

      const { error: insertError } = await supabase
        .from("business_customers")
        .insert({ user_id: userId, business_id: matchedBusiness.id })

      if (insertError && insertError.code !== "23505") return fail(insertError.message)

      return ok({
        id: matchedBusiness.id,
        name: matchedBusiness.name || "?",
        initials: getInitials(matchedBusiness.name),
        category: matchedBusiness.category || "Genel",
        isFavorite: false
      })
    },

    async leaveBusiness(userId, businessId) {
      const { error } = await supabase
        .from("business_customers")
        .delete()
        .eq("business_id", businessId)
        .eq("user_id", userId)

      if (error) return fail(error.message)
      return ok(undefined)
    },

    async getDashboardData(userId) {
      const [profileResult, businessesResult, appointmentsResult, notificationsResult] = await Promise.all([
        this.getProfile(userId),
        this.getBusinesses(userId),
        appointments.list(userId),
        notifications.list(userId)
      ])

      if (!profileResult.success) return profileResult
      if (!businessesResult.success) return businessesResult
      if (!appointmentsResult.success) return appointmentsResult
      if (!notificationsResult.success) return notificationsResult

      return ok<CustomerDashboardData>({
        profile: profileResult.data,
        businesses: businessesResult.data,
        appointments: appointmentsResult.data,
        notifications: notificationsResult.data
      })
    }
  }

  const notifications: NotificationsRepository = {
    async list(userId) {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) return fail(error.message)
      return ok((data || []) as CustomerNotification[])
    },

    async markAsRead(notificationId) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId)

      if (error) return fail(error.message)
      return ok(undefined)
    }
  }

  const familyProfiles: FamilyProfilesRepository = {
    async list(userId) {
      const { data, error } = await supabase
        .from("family_profiles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })

      if (error) return fail(error.message)
      return ok((data || []) as FamilyProfile[])
    },

    async add(userId, input) {
      const parsed = addFamilyProfileSchema.safeParse(input)
      if (!parsed.success) return fail(parsed.error.errors[0]?.message || "Geçersiz profil bilgisi.")

      const payload = {
        user_id: userId,
        full_name: parsed.data.fullName,
        relationship: parsed.data.relationship,
        birth_date: parsed.data.birthDate,
        gender: parsed.data.gender
      }

      const { data, error } = await supabase
        .from("family_profiles")
        .insert(payload)
        .select("*")
        .single()

      if (error || !data) return fail(error?.message || "Profil eklenemedi.")

      return ok(data as FamilyProfile)
    },

    async remove(id) {
      const { error } = await supabase
        .from("family_profiles")
        .delete()
        .eq("id", id)

      if (error) return fail(error.message)
      return ok(undefined)
    }
  }

  return {
    appointments,
    customerProfile,
    notifications,
    familyProfiles
  }
}
