import type { CustomerDashboardData, CustomerProfile, FamilyProfile } from "@randevux/shared"
import { supabase } from "./supabase"

interface ApiResult<T> {
  success: boolean
  data?: T
  error?: { message: string }
}

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const headers = new Headers(init?.headers)
  const authHeaders = await getAuthHeaders()
  headers.set("Content-Type", "application/json")
  if (authHeaders.Authorization) {
    headers.set("Authorization", authHeaders.Authorization)
  }

  const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${path}`, {
    ...init,
    headers
  })

  return response.json()
}

export const mobileApi = {
  dashboard: () => request<CustomerDashboardData>("/api/v1/mobile/dashboard"),
  profile: () => request<CustomerProfile>("/api/v1/mobile/profile"),
  updateProfile: (profile: CustomerProfile) =>
    request<CustomerProfile>("/api/v1/mobile/profile", { method: "PUT", body: JSON.stringify(profile) }),
  familyProfiles: () => request<FamilyProfile[]>("/api/v1/mobile/family"),
  cancelAppointment: (appointmentId: string, reason?: string) =>
    request<void>(`/api/v1/mobile/appointments/${appointmentId}/cancel`, {
      method: "POST",
      body: JSON.stringify({ reason })
    })
}
