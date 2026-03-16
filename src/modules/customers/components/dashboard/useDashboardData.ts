import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getUserRole, getDashboardPath } from "@/lib/supabase/roles"
import { getAppointmentDetailsAction, cancelAppointmentAction } from "@/src/modules/appointments/actions/appointment.actions"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import { getFamilyProfilesAction, addFamilyProfileAction, deleteFamilyProfileAction } from "@/src/modules/customers/actions/family.actions"
import { getCustomerStatsAction } from "@/src/modules/core/actions/stats.actions"
import { updateUserProfileAction } from "@/src/modules/auth/actions/auth.actions"
import { leaveBusinessAction } from "@/src/modules/customers/actions/customer.actions"
import { Appointment, Business } from "./types"

export function useDashboardData(user: any) {
  const supabase = createClient()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [profile, setProfile] = useState<{ name: string; phone: string; notification_settings: any }>({
    name: "",
    phone: "",
    notification_settings: { push: true, email: true, sms: false }
  })
  const [familyProfiles, setFamilyProfiles] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const { data: userData } = await supabase
        .from("users")
        .select("name, phone, notification_settings")
        .eq("id", user.id)
        .single()

      if (userData) {
        setProfile({
          name: userData.name || "",
          phone: userData.phone || "",
          notification_settings: userData.notification_settings || { push: true, email: true, sms: false }
        })
      }

      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      setNotifications(notifData || [])

      const { data: aptData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, business_id, business:businesses(name, category), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("customer_user_id", user.id)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })

      const mappedApts: Appointment[] = (aptData || []).map((a) => {
        const bRow = Array.isArray(a.business) ? a.business[0] : a.business
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null

        const svcNames = aptSvcs.map((s) => {
          const svc = Array.isArray(s.service) ? s.service[0] : s.service
          return svc?.name || ""
        }).filter(Boolean).join(", ")

        const dateStr = a.appointment_date + "T00:00:00"
        const fullDateObj = new Date(`${a.appointment_date}T${a.start_time}`)
        const timeParts = String(a.start_time).split(":")
        const endParts = String(a.end_time).split(":")

        const diffMs = fullDateObj.getTime() - new Date().getTime()
        const isWithinHour = diffMs > 0 && diffMs <= 60 * 60 * 1000

        return {
          id: a.id,
          businessId: a.business_id,
          businessName: bRow?.name || "?",
          businessInitials: (bRow?.name || "?").substring(0, 2).toUpperCase(),
          services: svcNames || "Hizmet belirtilmedi",
          date: new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
          fullDate: fullDateObj,
          staffName: staffUser?.name || "?",
          status: a.status as any,
          price: `${a.total_price} TL`,
          isWithinHour
        }
      })
      setAppointments(mappedApts)

      const { data: bData } = await supabase
        .from("business_customers")
        .select("*, business:businesses(id, name, category, logo_url)")
        .eq("user_id", user.id)
        .eq("is_blocked", false)

      const { data: favData } = await supabase
        .from("user_favorites")
        .select("business_id")
        .eq("user_id", user.id)

      const favIds = new Set(favData?.map(f => f.business_id) || [])

      const mappedBiz: Business[] = (bData || []).map((b) => {
        const bRow = Array.isArray(b.business) ? b.business[0] : b.business
        if (!bRow) return null
        return {
          id: bRow.id,
          name: bRow.name || "?",
          initials: (bRow.name || "?").substring(0, 2).toUpperCase(),
          category: bRow.category || "Genel",
          isFavorite: favIds.has(bRow.id)
        }
      }).filter(Boolean) as Business[]

      mappedBiz.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return 0
      })

      setBusinesses(mappedBiz)

      setLoadingFamily(true)
      setLoadingStats(true)
      const [familyRes, statsRes] = await Promise.all([
        getFamilyProfilesAction(),
        getCustomerStatsAction()
      ])
      if (familyRes.success) setFamilyProfiles(familyRes.data || [])
      if (statsRes.success) setStats(statsRes.data)
      setLoadingFamily(false)
      setLoadingStats(false)
    } catch (e) {
      console.error(e)
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
      toast.error(res.error || "İptal işleminde bir sorun oluştu.")
      return false
    }
  }

  const handleJoinBusiness = async (code: string) => {
    if (!user) return
    const cleanedCode = code.replace(/\s+/g, '').toUpperCase()
    if (!cleanedCode) return

    const { data: matchedBiz } = await supabase
      .from("businesses")
      .select("id, name")
      .or(`qr_code.eq.${cleanedCode},invite_code.eq.${cleanedCode}`)
      .maybeSingle()

    if (!matchedBiz) {
      toast.error("İşletme kodu bulunamadı.")
      return
    }

    const { error: joinError } = await supabase.from("business_customers").insert({
      user_id: user.id,
      business_id: matchedBiz.id
    })

    if (!joinError || joinError.code === "23505") {
      toast.success(`${matchedBiz.name} başarıyla eklendi! ✨`)
      fetchData()
    } else {
      toast.error("Hata oluştu.")
    }
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
      toast.error(res.error || "Hata.")
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
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    if (!error) {
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
