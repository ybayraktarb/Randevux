import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { User } from "@supabase/supabase-js"
import * as Sentry from "@sentry/nextjs"
import { getDashboardStatsAction, type DashboardStats } from "@/src/modules/core/actions/dash-stats.actions"
import type { TodayApt, PendingItem, NoShowRecord } from "./types"

export function usePatronDashboardData(user: User | null) {
  const supabase = useMemo(() => createClient(), [])
  
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  
  const [todayApts, setTodayApts] = useState<TodayApt[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [noShowRecords, setNoShowRecords] = useState<NoShowRecord[]>([])
  
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [noShowCount, setNoShowCount] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [vipCount, setVipCount] = useState(0)
  const [revenueData, setRevenueData] = useState<{ week: string; revenue: number }[]>([])
  const [staffPerf, setStaffPerf] = useState<any[]>([])
  const [serviceUtilization, setServiceUtilization] = useState<DashboardStats["serviceUtilization"]>([])
  const [staffEfficiency, setStaffEfficiency] = useState<DashboardStats["staffEfficiency"]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  // 1. Initialize business ID
  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function init() {
      const { data } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", user!.id)
        .maybeSingle()

      if (cancelled) return

      if (!data?.business_id) {
        toast.error("İşletme bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.")
        setLoading(false)
        return
      }

      setBusinessId(data.business_id)
    }

    init()
    return () => { cancelled = true }
  }, [user, supabase])

  // 2. Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]

      // Today's appointments
      const { data: todayData } = await supabase
        .from("appointments")
        .select("id, start_time, status, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("appointment_date", todayStr)
        .order("start_time")

      const mappedToday: TodayApt[] = (todayData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const timeParts = String(a.start_time).split(":")
        return {
          id: a.id,
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")}`,
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          staff: staffUser?.name || "?",
          status: (a.status === "Tamamlandı" ? "Tamamlandı" : a.status === "Onaylandı" ? "Onaylandı" : "Bekliyor") as TodayApt["status"],
        }
      })
      setTodayApts(mappedToday)

      // Pending approvals
      const { data: pendingData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "Bekliyor")
        .order("appointment_date")
        .limit(10)

      const mappedPending: PendingItem[] = (pendingData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const dateObj = new Date(a.appointment_date + "T00:00:00")
        const timeParts = String(a.start_time).split(":")
        return {
          id: a.id,
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          date: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")}`,
          staff: staffUser?.name || "?",
        }
      })
      setPendingItems(mappedPending)

      // No-show records
      const { data: noShowData } = await supabase
        .from("appointments")
        .select("appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "Gelmedi")
        .order("appointment_date", { ascending: false })
        .limit(5)

      const mappedNoShow: NoShowRecord[] = (noShowData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        return {
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          date: new Date(a.appointment_date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
          staff: staffUser?.name || "?",
        }
      })
      setNoShowRecords(mappedNoShow)

      // Stock
      const { data: stockData } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_alert")
        .eq("business_id", businessId)
        .eq("is_active", true)

      if (stockData) {
        setLowStockItems(stockData.filter(p => p.stock_quantity <= p.min_stock_alert))
      }

      // Stats Action
      const statsRes = await getDashboardStatsAction(businessId)
      if (statsRes.success && statsRes.data) {
        const s = statsRes.data as DashboardStats
        setTotalRevenue(s.totalRevenue)
        setTotalAppointments(s.totalAppointments)
        setNoShowCount(s.noShowCount)
        setTotalCustomers(s.totalCustomers)
        setVipCount(s.vipCount)
        setRevenueData(s.weeklyRevenue)
        setStaffPerf(s.staffPerformance)
        setServiceUtilization(s.serviceUtilization)
        setStaffEfficiency(s.staffEfficiency)
      }
      } catch (err) {
        Sentry.captureException(err, { tags: { module: 'business', action: 'fetchPatronDashboard' } })
        toast.error("Veriler yüklenirken bir hata oluştu.")
      } finally {
        setLoading(false)
      }
  }, [businessId, supabase])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Handlers
  const handleApprove = async (id: string) => {
    await supabase.from("appointments").update({ status: "Onaylandı" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleReject = async (id: string) => {
    await supabase.from("appointments").update({ status: "İptal" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  return {
    loading,
    businessId,
    todayApts,
    pendingItems,
    noShowRecords,
    totalRevenue,
    totalAppointments,
    noShowCount,
    totalCustomers,
    vipCount,
    revenueData,
    staffPerf,
    serviceUtilization,
    staffEfficiency,
    lowStockItems,
    fetchDashboard,
    handleApprove,
    handleReject
  }
}
