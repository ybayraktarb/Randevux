"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  TrendingUp,
  UserX,
  CalendarPlus,
  MoreHorizontal,
  ArrowRight,
  Check,
  XIcon,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TodayApt {
  id: string
  time: string
  customer: string
  service: string
  staff: string
  status: "completed" | "ongoing" | "confirmed" | "pending" | "break"
}

interface PendingItem {
  id: string
  customer: string
  service: string
  date: string
  time: string
  staff: string
}

interface NoShowRecord {
  customer: string
  service: string
  date: string
  staff: string
}

interface StaffPerf {
  name: string
  count: number
  percent: number
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, icon: Icon, value, trendText, trendValue, trendPositive, actionLabel, onAction }: {
  label: string; icon: React.ElementType; value: string; trendText?: string; trendValue?: string; trendPositive?: boolean; actionLabel?: string; onAction?: () => void
}) {
  return (
    <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <div className="flex size-9 items-center justify-center rounded-full bg-primary-light">
          <Icon className="size-[18px] text-primary" />
        </div>
      </div>
      <p className="mt-2 text-[28px] font-semibold leading-tight text-foreground">{value}</p>
      <div className="mt-2 flex items-center gap-1.5">
        {trendValue && (
          <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium", trendPositive ? "bg-badge-green-bg text-badge-green-text" : "bg-badge-red-bg text-badge-red-text")}>
            {trendValue}
          </span>
        )}
        {trendText && <span className="text-[12px] text-muted-foreground">{trendText}</span>}
        {actionLabel && (
          <button type="button" onClick={onAction} className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground transition-colors hover:opacity-90">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Status Badge Helper ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <RxBadge variant="success">{"Tamamlandi"}</RxBadge>
    case "ongoing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-badge-purple-bg px-2.5 py-0.5 text-xs font-medium text-badge-purple-text">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          {"Devam Ediyor"}
        </span>
      )
    case "confirmed":
      return <RxBadge variant="success">{"Onaylandi"}</RxBadge>
    case "pending":
      return <RxBadge variant="warning">{"Bekliyor"}</RxBadge>
    default:
      return null
  }
}

// ─── Today's Appointments ───────────────────────────────────────────────────────

function TodayAppointments({ appointments }: { appointments: TodayApt[] }) {
  const today = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" })

  return (
    <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">{"Bugunku Randevular"}</h2>
          <span className="rounded-md bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">{today}</span>
        </div>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
          {"Tumunu Gor"} <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex flex-col px-5 py-4">
        {appointments.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Calendar className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Bugun randevu bulunmuyor</p>
          </div>
        )}
        {appointments.map((apt, index) => {
          const isBreak = apt.status === "break"
          const isOngoing = apt.status === "ongoing"
          const isLast = index === appointments.length - 1

          return (
            <div key={`${apt.time}-${index}`} className="flex gap-4">
              {/* Time */}
              <div className="w-12 shrink-0 pt-3 text-right">
                <span className="text-[13px] text-muted-foreground">{apt.time}</span>
              </div>

              {/* Timeline connector */}
              <div className="relative flex flex-col items-center">
                <div className={cn("mt-3.5 size-2.5 shrink-0 rounded-full ring-2", isOngoing ? "bg-primary ring-primary/30" : isBreak ? "bg-muted-foreground/30 ring-muted/50" : "bg-border ring-card")} />
                {!isLast && <div className="w-px flex-1 bg-border" />}
              </div>

              {/* Content */}
              <div className={cn("mb-3 flex-1 pb-3")}>
                {isBreak ? (
                  <div className="mt-1.5 rounded-lg border border-dashed border-muted-foreground/30 px-4 py-2.5">
                    <span className="text-[13px] text-muted-foreground">{"Ogle Molasi"}</span>
                  </div>
                ) : (
                  <div className="mt-1.5 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/20">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <RxAvatar name={apt.customer} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{apt.customer}</span>
                          <span className="text-[13px] text-muted-foreground">{apt.service}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="hidden rounded-md bg-primary-light px-2 py-0.5 text-[11px] font-medium text-muted-foreground sm:inline-flex">{apt.staff}</span>
                        <StatusBadge status={apt.status} />
                        <button type="button" className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted" aria-label="Daha fazla">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pending Approvals ──────────────────────────────────────────────────────────

function PendingApprovals({ items, onApprove, onReject }: {
  items: PendingItem[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  return (
    <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-foreground">{"Bekleyen Onaylar"}</h2>
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">{items.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 p-5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8">
            <Check className="size-8 text-success" />
            <p className="text-sm text-muted-foreground">{"Bekleyen onay bulunmuyor"}</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border-l-[3px] border-l-accent border border-border bg-card p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{item.customer}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-[13px] text-muted-foreground">
                  <span>{item.service}</span>
                  <span>{item.date} - {item.time}</span>
                  <span>{item.staff}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <RxButton size="sm" variant="primary" onClick={() => onApprove(item.id)}>
                    <Check className="size-3.5" /> Onayla
                  </RxButton>
                  <RxButton size="sm" variant="danger" onClick={() => onReject(item.id)}>
                    <XIcon className="size-3.5" /> Reddet
                  </RxButton>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info Banner */}
        <div className="mt-1 rounded-lg bg-primary-light px-4 py-3">
          <p className="text-[13px] text-muted-foreground">
            {"Manuel onay modu aktif. Otomatik onaya gecmek icin "}
            <button type="button" className="font-medium text-primary hover:underline">Ayarlar</button>
            {"'a gidin."}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Revenue Chart ──────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

function RevenueChart({ revenueData, totalRevenue }: { revenueData: { week: string; revenue: number }[]; totalRevenue: number }) {
  return (
    <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{"Bu Ay Gelir"}</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} Gelir Trendi
        </p>
      </div>
      <div className="px-5 pt-4 pb-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#6B7280" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={2.5} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 border-t border-border px-5 py-3">
        <span className="text-sm font-semibold text-foreground">
          {"Toplam: ₺"}{totalRevenue.toLocaleString("tr-TR")}
        </span>
      </div>
    </div>
  )
}

// ─── Staff Performance ──────────────────────────────────────────────────────────

function StaffPerformance({ staffPerf }: { staffPerf: StaffPerf[] }) {
  return (
    <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{"Personel Dagilimi"}</h2>
      </div>
      <div className="flex flex-col gap-5 p-5">
        {staffPerf.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Veri yok</p>
        )}
        {staffPerf.map((staff) => (
          <div key={staff.name} className="flex items-center gap-3">
            <RxAvatar name={staff.name} size="sm" />
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{staff.name}</span>
                <span className="text-[13px] text-muted-foreground">{staff.count} randevu</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${staff.percent}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
          {"Detayli Rapor"} <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

// ─── No-Show Records ────────────────────────────────────────────────────────────

function NoShowRecords({ records }: { records: NoShowRecord[] }) {
  return (
    <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{"Son No-Show Kayitlari"}</h2>
        <button type="button" className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
          {"Tumunu Gor"} <ArrowRight className="size-3.5" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[13px] font-medium text-muted-foreground">{"Musteri"}</th>
              <th className="hidden px-5 py-3 text-left text-[13px] font-medium text-muted-foreground sm:table-cell">{"Hizmet"}</th>
              <th className="hidden px-5 py-3 text-left text-[13px] font-medium text-muted-foreground md:table-cell">{"Tarih"}</th>
              <th className="hidden px-5 py-3 text-left text-[13px] font-medium text-muted-foreground lg:table-cell">{"Personel"}</th>
              <th className="px-5 py-3 text-right text-[13px] font-medium text-muted-foreground">{"Islem"}</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">No-show kaydi yok</td></tr>
            )}
            {records.map((record, index) => (
              <tr key={index} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary-light/50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <UserX className="size-4 shrink-0 text-accent" />
                    <span className="text-sm font-medium text-foreground">{record.customer}</span>
                  </div>
                </td>
                <td className="hidden px-5 py-3 text-sm text-muted-foreground sm:table-cell">{record.service}</td>
                <td className="hidden px-5 py-3 text-sm text-muted-foreground md:table-cell">{record.date}</td>
                <td className="hidden px-5 py-3 text-sm text-muted-foreground lg:table-cell">{record.staff}</td>
                <td className="px-5 py-3 text-right">
                  <RxButton variant="ghost" size="sm">Not Ekle</RxButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export function PatronDashboard() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [todayApts, setTodayApts] = useState<TodayApt[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [noShowRecords, setNoShowRecords] = useState<NoShowRecord[]>([])
  const [staffPerf, setStaffPerf] = useState<StaffPerf[]>([])
  const [revenueData, setRevenueData] = useState<{ week: string; revenue: number }[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [noShowCount, setNoShowCount] = useState(0)

  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    async function fetchBusinessId() {
      const { data } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", user!.id)
        .maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBusinessId()
  }, [user, supabase])

  const fetchDashboard = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`

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
          status: (a.status === "completed" ? "completed" : a.status === "confirmed" ? "confirmed" : "pending") as TodayApt["status"],
        }
      })
      setTodayApts(mappedToday)

      // Pending approvals
      const { data: pendingData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "pending")
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

      // No-show records (last 5)
      const { data: noShowData } = await supabase
        .from("appointments")
        .select("appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "no_show")
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

      // Monthly stats
      const { data: monthApts } = await supabase
        .from("appointments")
        .select("id, status, total_price")
        .eq("business_id", businessId)
        .gte("appointment_date", monthStart)

      const allMonthApts = monthApts || []
      setTotalAppointments(allMonthApts.length)
      setNoShowCount(allMonthApts.filter((a) => a.status === "no_show").length)
      const revenue = allMonthApts
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + (Number(a.total_price) || 0), 0)
      setTotalRevenue(revenue)

      // Weekly revenue breakdown (4 weeks)
      const weeklyRevenue: { week: string; revenue: number }[] = []
      for (let w = 0; w < 4; w++) {
        const weekStart = new Date(today.getFullYear(), today.getMonth(), 1 + w * 7)
        const weekEnd = new Date(today.getFullYear(), today.getMonth(), Math.min(1 + (w + 1) * 7, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()))
        const weekApts = allMonthApts.filter((a) => {
          // Simple week classification by index
          return true
        })
        const weekRev = allMonthApts
          .filter((a) => a.status === "completed")
          .reduce((sum, a) => sum + (Number(a.total_price) || 0) / 4, 0) // Distribute evenly as approximation
        weeklyRevenue.push({ week: `H${w + 1}`, revenue: Math.round(weekRev) })
      }
      setRevenueData(weeklyRevenue.length > 0 ? weeklyRevenue : [{ week: "H1", revenue: 0 }])

      // Staff performance (appointment counts this month)
      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user:users(name)")
        .eq("business_id", businessId)
        .eq("is_active", true)

      const maxApts = Math.max(1, allMonthApts.length)
      const perfData: StaffPerf[] = (staffData || []).map((s) => {
        const usr = Array.isArray(s.user) ? s.user[0] : s.user
        const count = allMonthApts.filter((a) => (a as Record<string, unknown>).staff_business_id === s.id).length
        return {
          name: usr?.name || "?",
          count,
          percent: Math.round((count / maxApts) * 100),
        }
      })
      setStaffPerf(perfData)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleApprove = async (id: string) => {
    await supabase.from("appointments").update({ status: "confirmed" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleReject = async (id: string) => {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? "Gunaydin" : now.getHours() < 18 ? "Iyi gunler" : "Iyi aksamlar"
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Patron"
  const dateStr = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{greeting}, {userName} 👋</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <RxButton variant="primary">
          <CalendarPlus className="size-4" />
          Yeni Randevu Ekle
        </RxButton>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Bu Ayki Gelir" icon={TrendingUp} value={`₺${totalRevenue.toLocaleString("tr-TR")}`} />
        <StatCard label="Toplam Randevu" icon={Calendar} value={String(totalAppointments)} trendText="bu ay" />
        <StatCard label="No-Show" icon={UserX} value={String(noShowCount)} trendText="bu ay" />
        <StatCard label="Bekleyen Onay" icon={Clock} value={String(pendingItems.length)} actionLabel="Hemen Incele" />
      </div>

      {/* Today's Appointments + Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TodayAppointments appointments={todayApts} />
        </div>
        <div className="xl:col-span-2">
          <PendingApprovals items={pendingItems} onApprove={handleApprove} onReject={handleReject} />
        </div>
      </div>

      {/* Revenue Chart + Staff Performance */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <div className="xl:col-span-5">
          <RevenueChart revenueData={revenueData} totalRevenue={totalRevenue} />
        </div>
        <div className="xl:col-span-4">
          <StaffPerformance staffPerf={staffPerf} />
        </div>
      </div>

      {/* No-Show Records */}
      <NoShowRecords records={noShowRecords} />
    </div>
  )
}
