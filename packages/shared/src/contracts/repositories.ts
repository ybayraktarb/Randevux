import type { AppResult } from "../core/result"
import type {
  AddFamilyProfileInput,
  AppointmentDetail,
  AppointmentSummary,
  BusinessSummary,
  CustomerDashboardData,
  CustomerNotification,
  CustomerProfile,
  FamilyProfile
} from "../customer/types"

export interface AppointmentsRepository {
  list(userId: string): Promise<AppResult<AppointmentSummary[]>>
  getDetail(appointmentId: string): Promise<AppResult<AppointmentDetail>>
}

export interface CustomerProfileRepository {
  getProfile(userId: string): Promise<AppResult<CustomerProfile>>
  updateProfile(userId: string, profile: CustomerProfile): Promise<AppResult<CustomerProfile>>
  getBusinesses(userId: string): Promise<AppResult<BusinessSummary[]>>
  joinBusiness(userId: string, code: string): Promise<AppResult<BusinessSummary>>
  leaveBusiness(userId: string, businessId: string): Promise<AppResult<void>>
  getDashboardData(userId: string): Promise<AppResult<CustomerDashboardData>>
}

export interface NotificationsRepository {
  list(userId: string): Promise<AppResult<CustomerNotification[]>>
  markAsRead(notificationId: string): Promise<AppResult<void>>
}

export interface FamilyProfilesRepository {
  list(userId: string): Promise<AppResult<FamilyProfile[]>>
  add(userId: string, input: AddFamilyProfileInput): Promise<AppResult<FamilyProfile>>
  remove(id: string): Promise<AppResult<void>>
}
