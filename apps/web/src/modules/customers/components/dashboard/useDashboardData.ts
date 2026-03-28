import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import * as Sentry from "@sentry/nextjs"
import { toast } from "sonner"
import { createCustomerRepositories } from "@randesk/shared"
import { cancelAppointmentAction } from "@/src/modules/appointments/actions/appointment.actions"
import { getFamilyProfilesAction, addFamilyProfileAction, deleteFamilyProfileAction } from "@/src/modules/customers/actions/family.actions"
import { getCustomerStatsAction } from "@/src/modules/core/actions/stats.actions"
import { updateUserProfileAction } from "@/src/modules/auth/actions/auth.actions"
import { leaveBusinessAction } from "@/src/modules/customers/actions/customer.actions"
import { Appointment, Business, Notification, CustomerProfile, FamilyProfile, CustomerStats } from "./types"
import type { User } from "@supabase/supabase-js"

export function useDashboardData(user: User | null) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [profile, setProfile] = useState<CustomerProfile>({
    name: "",
    phone: "",
    notification_settings: { push: true, email: true, sms: false }
  })
  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const repositories = createCustomerRepositories(supabase)
      const dashboardResult = await repositories.customerProfile.getDashboardData(user.id)
      if (!dashboardResult.success) throw new Error(dashboardResult.error.message)

      setProfile(dashboardResult.data.profile)
      setAppointments(dashboardResult.data.appointments.map((appointment) => ({
        ...appointment,
        fullDate: new Date(appointment.fullDate)
      })))
      setBusinesses(dashboardResult.data.businesses as Business[])
      setNotifications(dashboardResult.data.notifications as Notification[])

      setLoadingFamily(true)
      setLoadingStats(true)
      const [familyRes, statsRes] = await Promise.all([
        getFamilyProfilesAction(),
        getCustomerStatsAction()
      ])
      if (familyRes.success) setFamilyProfiles(familyRes.data as FamilyProfile[])
      if (statsRes.success) setStats(statsRes.data as CustomerStats)
      setLoadingFamily(false)
      setLoadingStats(false)
    } catch (e) {
      Sentry.captureException(e, { tags: { module: 'customers', action: 'fetchDashboardData' } })
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCancelAppointment = async (aptId: string, bizId: string, fullDate: Date) => {
    const { data: bData } = await supabase.from("businesses").select("cancellation_buffer_minutes").eq("id", bizId).single()
    const buffer = bData?.cancellation_buffer_minutes || 60
    const diffMs = fullDate.getTime() - new Date().getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < buffer) {
      toast.error(`Randevuya ${buffer} dakikadan az kaldığı için iptal edilemez.`)
      return false
    }

    const reasons = ["Plan değişikliği", "Acil durum", "Hatalı kayıt", "Diğer"]
    const reason = prompt("İptal nedeninizi seçin:\n" + reasons.join(", "), reasons[0])
    if (reason === null) return false
    if (!confirm("Randevuyu iptal etmek istediğinize emin misiniz?")) return false

    const res = await cancelAppointmentAction(aptId, bizId, reason)
    if (res.success) {
      toast.success("Randevu başarıyla iptal edildi.")
      fetchData()
      return true
    } else {
      toast.error(res.error.message || "İptal işleminde bir sorun oluştu.")
      return false
    }
  }

  const handleJoinBusiness = async (code: string) => {
    if (!user) return
    const repositories = createCustomerRepositories(supabase)
    const result = await repositories.customerProfile.joinBusiness(user.id, code)

    if (result.success) {
      toast.success(`${result.data.name} başarıyla eklendi! ✨`)
      fetchData()
      return
    }

    toast.error(result.error.message || "Hata oluştu.")
  }

  const handleLeaveBusiness = async (businessId: string) => {
    if (!confirm("Bu işletmeden ayrılmak istediğinize emin misiniz?")) return
    const res = await leaveBusinessAction(businessId)
    if (res.success) {
      toast.success("İşletmeden başarıyla ayrıldınız.")
      fetchData()
    } else {
      toast.error("Hata oluştu.")
    }
  }

  const handleUpdateProfile = async (name: string, phone: string, settings: any) => {
    const res = await updateUserProfileAction(name, phone, settings)
    if (res.success) {
      toast.success("Profiliniz güncellendi.")
      fetchData()
    } else {
      toast.error("Hata oluştu.")
    }
  }

  const handleAddFamilyProfile = async (fullName: string, relationship: string) => {
    const res = await addFamilyProfileAction({ fullName, relationship })
    if (res.success) {
      toast.success("Aile profili eklendi.")
      fetchData()
    } else {
      toast.error(res.error.message || "Hata.")
    }
  }

  const handleDeleteFamilyProfile = async (id: string) => {
    const res = await deleteFamilyProfileAction(id)
    if (res.success) {
      toast.success("Profil silindi.")
      fetchData()
    }
  }

  const handleMarkAsRead = async (id: string) => {
    const repositories = createCustomerRepositories(supabase)
    const result = await repositories.notifications.markAsRead(id)
    if (result.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  return {
    appointments,
    businesses,
    loading,
    notifications,
    profile,
    familyProfiles,
    stats,
    loadingFamily,
    loadingStats,
    handleCancelAppointment,
    handleJoinBusiness,
    handleLeaveBusiness,
    handleUpdateProfile,
    handleAddFamilyProfile,
    handleDeleteFamilyProfile,
    handleMarkAsRead,
    refresh: fetchData
  }
}
