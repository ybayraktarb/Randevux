"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  UserX,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  X,
  Search,
  StickyNote,
  Clock,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxModal } from "./rx-modal"
import { RxTextarea } from "./rx-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string
  time: string
  endTime: string
  customer: string
  customerPhone?: string
  service: string
  duration: string
  price: string
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show"
  note?: string
  isBreak?: boolean
  appointmentDate: string
}

interface WeekAppointment {
  id: string
  day: number // 0-6 (Mon-Sun)
  startHour: number
  startMin: number
  durationMin: number
  customer: string
  service: string
  status: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function parseTimeToHM(t: string) {
  const parts = t.split(":")
  return { h: parseInt(parts[0] || "0"), m: parseInt(parts[1] || "0") }
}

function dateToYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function getWeekRange(refDate: Date) {
  const d = new Date(refDate)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: monday, end: sunday }
}

const MONTHS_TR = ["Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran", "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik"]
const DAYS_FULL_TR = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]

// ─── Status Badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <RxBadge variant="success">Tamamlandi</RxBadge>
    case "confirmed":
      return <RxBadge variant="purple">Onaylandi</RxBadge>
    case "pending":
      return <RxBadge variant="warning">Bekliyor</RxBadge>
    case "cancelled":
      return <RxBadge variant="danger">Iptal Edildi</RxBadge>
    case "no_show":
      return <RxBadge variant="warning">No-Show</RxBadge>
    default:
      return <RxBadge variant="gray">{status}</RxBadge>
  }
}

// ─── useStaffData Hook ──────────────────────────────────────────────────────────

function useStaffData() {
  const { user } = useCurrentUser()
  const supabase = createClient()
  const [staffBusinessId, setStaffBusinessId] = useState<string | null>(null)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [staffName, setStaffName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from("staff_business")
        .select("id, business_id")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle()
      if (data) {
        setStaffBusinessId(data.id)
        setBusinessId(data.business_id)
      }
      // Also check if they are a business owner (patron acting as staff)
      if (!data) {
        const { data: ownerData } = await supabase
          .from("business_owners")
          .select("business_id")
          .eq("user_id", user!.id)
          .maybeSingle()
        if (ownerData) {
          setBusinessId(ownerData.business_id)
          // Find their staff_business entry
          const { data: sb } = await supabase
            .from("staff_business")
            .select("id")
            .eq("user_id", user!.id)
            .eq("business_id", ownerData.business_id)
            .maybeSingle()
          if (sb) setStaffBusinessId(sb.id)
        }
      }
      const { data: uData } = await supabase.from("users").select("name").eq("id", user!.id).maybeSingle()
      setStaffName(uData?.name || user?.user_metadata?.name || "")
      setLoading(false)
    }
    load()
  }, [user])

  return { staffBusinessId, businessId, staffName, loading, user, supabase }
}

// ─── Tab 1: Genel Bakis ─────────────────────────────────────────────────────────

function OverviewTab({
  staffBusinessId,
  staffName,
  supabase,
  onStatusChange,
  refreshKey,
}: {
  staffBusinessId: string
  staffName: string
  supabase: ReturnType<typeof createClient>
  onStatusChange: () => void
  refreshKey?: number
}) {
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([])
  const [weekCount, setWeekCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [monthCompleted, setMonthCompleted] = useState(0)
  const [loading, setLoading] = useState(true)
  const [noShowModalOpen, setNoShowModalOpen] = useState(false)
  const [noShowTarget, setNoShowTarget] = useState<string | null>(null)
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)

  const todayStr = dateToYMD(new Date())
  const now = new Date()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const today = new Date()
    const { start: weekStart, end: weekEnd } = getWeekRange(today)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    // Today's appointments
    const { data: todayData } = await supabase
      .from("appointments")
      .select("*, customer:users!appointments_customer_user_id_fkey(name, phone), services:appointment_services(service:services(name), price_snapshot, duration_snapshot)")
      .eq("staff_business_id", staffBusinessId)
      .eq("appointment_date", todayStr)
      .in("status", ["pending", "confirmed", "completed"])
      .order("start_time")

    const mapped: Appointment[] = (todayData || []).map((a: any) => {
      const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
      const svcs = Array.isArray(a.services) ? a.services : []
      const svcNames = svcs.map((s: any) => { const sv = Array.isArray(s.service) ? s.service[0] : s.service; return sv?.name || "" }).filter(Boolean).join(", ")
      const totalDur = svcs.reduce((sum: number, s: any) => sum + (s.duration_snapshot || 0), 0)
      const totalPrice = svcs.reduce((sum: number, s: any) => sum + Number(s.price_snapshot || 0), 0)
      const st = String(a.start_time).slice(0, 5)
      const et = String(a.end_time).slice(0, 5)
      return {
        id: a.id,
        time: st,
        endTime: et,
        customer: cust?.name || "?",
        customerPhone: cust?.phone || "",
        service: svcNames || "Hizmet",
        duration: `${totalDur} dk`,
        price: String(totalPrice),
        status: a.status,
        note: a.customer_note || undefined,
        appointmentDate: a.appointment_date,
      }
    })
    setTodayAppts(mapped)

    // Week count
    const { count: wc } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("staff_business_id", staffBusinessId)
      .gte("appointment_date", dateToYMD(weekStart))
      .lte("appointment_date", dateToYMD(weekEnd))
      .in("status", ["pending", "confirmed", "completed"])
    setWeekCount(wc || 0)

    // Pending count
    const { count: pc } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("staff_business_id", staffBusinessId)
      .eq("status", "pending")
    setPendingCount(pc || 0)

    // Month completed count
    const { count: mc } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("staff_business_id", staffBusinessId)
      .eq("status", "completed")
      .gte("appointment_date", dateToYMD(monthStart))
      .lte("appointment_date", dateToYMD(monthEnd))
    setMonthCompleted(mc || 0)

    setLoading(false)
  }, [staffBusinessId, supabase, todayStr])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const handleStatusUpdate = async (aptId: string, newStatus: string) => {
    const nowISO = new Date().toISOString()
    const update: Record<string, any> = { status: newStatus }
    if (newStatus === "confirmed") update.confirmed_at = nowISO
    if (newStatus === "completed") update.completed_at = nowISO
    if (newStatus === "cancelled") { update.cancelled_at = nowISO; update.cancelled_by = "staff" }

    const { error } = await supabase.from("appointments").update(update).eq("id", aptId)
    if (newStatus === "no_show") {
      await supabase.from("no_show_records").insert({ appointment_id: aptId, marked_by_staff_business_id: staffBusinessId })
    }
    if (error) { toast?.error ? toast.error("Islem basarisiz oldu.") : null; return }

    // Notify customer
    try {
      const { createNotification } = await import("@/lib/notifications")
      const { data: aptRow } = await supabase.from("appointments").select("customer_user_id, appointment_date, start_time").eq("id", aptId).maybeSingle()
      if (aptRow?.customer_user_id) {
        const titleMap: Record<string, string> = { confirmed: "Randevunuz onaylandi", cancelled: "Randevunuz iptal edildi", completed: "Randevunuz tamamlandi", no_show: "Randevunuz no-show olarak isaretlendi" }
        const typeMap: Record<string, string> = { confirmed: "appointment_confirmed", cancelled: "appointment_cancelled", completed: "appointment_confirmed", no_show: "appointment_cancelled" }
        await createNotification(supabase, { userId: aptRow.customer_user_id, type: (typeMap[newStatus] || "system") as any, title: titleMap[newStatus] || "Randevu guncellendi", body: `${aptRow.appointment_date} tarihinde saat ${String(aptRow.start_time).slice(0, 5)}`, relatedId: aptId, relatedType: "appointment" })
      }
    } catch (e) { console.error("[Notification]", e) }

    // Audit
    try { const { logAudit } = await import("@/lib/audit"); const { data: { user: authUser } } = await supabase.auth.getUser(); if (authUser) await logAudit(supabase, { userId: authUser.id, action: "updated", targetTable: "appointments", targetId: aptId }) } catch { }


    toast?.success ? toast.success("Randevu guncellendi.") : null
    fetchData()
    onStatusChange()
  }

  const dateLabel = `${now.getDate()} ${MONTHS_TR[now.getMonth()]} ${now.getFullYear()}, ${DAYS_FULL_TR[now.getDay()]}`

  const summaryCards = [
    { label: "Bugunku Randevu", icon: Calendar, value: String(todayAppts.length), sub: todayAppts.length > 0 ? `Sonraki: ${todayAppts.find(a => a.status === "pending" || a.status === "confirmed")?.time || "—"}` : "Randevu yok", color: "text-primary" },
    { label: "Bu Hafta", icon: CalendarDays, value: String(weekCount), sub: "Toplam randevu", color: "text-primary" },
    { label: "Bekleyen Onay", icon: Clock, value: String(pendingCount), sub: "Onay bekliyor", color: "text-primary" },
    { label: "Tamamlanan (Ay)", icon: CheckCircle, value: String(monthCompleted), sub: "Bu ay", color: "text-primary" },
  ]

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">Merhaba, {staffName} <span role="img" aria-label="wave">&#128075;</span></h2>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel} &middot; Bugun {todayAppts.length} randevunuz var</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Icon className={cn("size-5", card.color)} />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-muted-foreground">{card.label}</span>
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                <span className="mt-0.5 text-[13px] text-muted-foreground">{card.sub}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Today's Timeline */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Bugunun Programi</h3>
          <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">{dateLabel}</span>
        </div>

        {todayAppts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
            Bugun icin randevu bulunmuyor.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {todayAppts.map((apt, idx) => (
              <div
                key={apt.id}
                className={cn("flex gap-4 px-5 py-4", idx !== todayAppts.length - 1 && "border-b border-border")}
              >
                {/* Time column */}
                <div className="flex w-[60px] shrink-0 flex-col items-center">
                  <span className="text-sm font-semibold text-primary">{apt.time}</span>
                  <div className="mt-1 flex flex-1 flex-col items-center">
                    <div className="size-2.5 rounded-full bg-primary" />
                    {idx !== todayAppts.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <RxAvatar name={apt.customer} size="sm" />
                      <span className="text-[15px] font-semibold text-foreground">{apt.customer}</span>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{apt.service}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{apt.duration}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-medium text-primary">{"\u20BA"}{apt.price}</span>
                    {apt.note && (
                      <div className="relative">
                        <button
                          type="button"
                          className="text-muted-foreground transition-colors hover:text-primary"
                          onMouseEnter={() => setHoveredNote(apt.id)}
                          onMouseLeave={() => setHoveredNote(null)}
                          aria-label="Notu gor"
                        >
                          <StickyNote className="size-4" />
                        </button>
                        {hoveredNote === apt.id && (
                          <div className="absolute bottom-full left-0 z-10 mb-2 w-56 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground shadow-lg">
                            {apt.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2">
                    {apt.status === "pending" && (
                      <button type="button" onClick={() => handleStatusUpdate(apt.id, "confirmed")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">Onayla</button>
                    )}
                    {apt.status === "confirmed" && (
                      <>
                        <button type="button" onClick={() => handleStatusUpdate(apt.id, "completed")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">Tamamlandi</button>
                        <button type="button" onClick={() => { setNoShowTarget(apt.id); setNoShowModalOpen(true) }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-badge-red-bg">No-Show</button>
                        <button type="button" onClick={() => handleStatusUpdate(apt.id, "cancelled")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-badge-red-bg">Iptal</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* No-Show Modal */}
      <RxModal
        open={noShowModalOpen}
        onClose={() => setNoShowModalOpen(false)}
        title="No-Show Isaretle"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setNoShowModalOpen(false)}>Vazgec</RxButton>
            <RxButton variant="danger" onClick={() => { if (noShowTarget) handleStatusUpdate(noShowTarget, "no_show"); setNoShowModalOpen(false) }}>No-Show Isaretle</RxButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-badge-red-bg">
            <AlertTriangle className="size-6 text-accent" />
          </div>
          <p className="text-base font-semibold text-foreground">Musteri randevuya gelmedi mi?</p>
          <p className="text-center text-[13px] text-muted-foreground">Bu islem musterinin profilinde kayit olarak tutulacaktir.</p>
        </div>
      </RxModal>
    </div>
  )
}

// ─── Tab 2: Takvim ──────────────────────────────────────────────────────────────

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8) // 08-21
const DAY_LABELS = ["Pt", "Sa", "Ca", "Pe", "Cu", "Ct", "Pa"]

function CalendarTab({ staffBusinessId, supabase, refreshKey }: { staffBusinessId: string; supabase: ReturnType<typeof createClient>; refreshKey?: number }) {
  const [view, setView] = useState<"week" | "day">("week")
  const [weekOffset, setWeekOffset] = useState(0)
  const [weekAppts, setWeekAppts] = useState<WeekAppointment[]>([])
  const [popover, setPopover] = useState<{ apt: WeekAppointment; x: number; y: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const refDate = new Date(today)
  refDate.setDate(refDate.getDate() + weekOffset * 7)
  const { start: weekStart, end: weekEnd } = getWeekRange(refDate)

  const dayDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name))")
        .eq("staff_business_id", staffBusinessId)
        .gte("appointment_date", dateToYMD(weekStart))
        .lte("appointment_date", dateToYMD(weekEnd))
        .in("status", ["pending", "confirmed", "completed"])

      const mapped: WeekAppointment[] = (data || []).map((a: any) => {
        const aptDate = new Date(a.appointment_date + "T00:00:00")
        const jsDay = aptDate.getDay()
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1 // Mon=0
        const st = parseTimeToHM(a.start_time)
        const et = parseTimeToHM(a.end_time)
        const dur = (et.h * 60 + et.m) - (st.h * 60 + st.m)
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const svcs = Array.isArray(a.services) ? a.services : []
        const svcName = svcs.map((s: any) => { const sv = Array.isArray(s.service) ? s.service[0] : s.service; return sv?.name || "" }).filter(Boolean).join(", ")
        return {
          id: a.id,
          day: dayIdx,
          startHour: st.h,
          startMin: st.m,
          durationMin: dur > 0 ? dur : 30,
          customer: cust?.name || "?",
          service: svcName || "Hizmet",
          status: a.status,
        }
      })
      setWeekAppts(mapped)
      setLoading(false)
    }
    fetch()
  }, [weekOffset, staffBusinessId, supabase, refreshKey])

  const handleAptClick = useCallback((apt: WeekAppointment, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const gridRect = gridRef.current?.getBoundingClientRect()
    if (gridRect) {
      setPopover({ apt, x: rect.left - gridRect.left + rect.width / 2, y: rect.top - gridRect.top })
    }
  }, [])

  useEffect(() => {
    function handleClickOutside() { setPopover(null) }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  const hourHeight = 60
  const monthLabel = `${MONTHS_TR[weekStart.getMonth()]} ${weekStart.getFullYear()}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setWeekOffset(w => w - 1)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary-light hover:text-foreground"><ChevronLeft className="size-5" /></button>
          <span className="text-base font-semibold text-foreground">{monthLabel}</span>
          <button type="button" onClick={() => setWeekOffset(w => w + 1)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary-light hover:text-foreground"><ChevronRight className="size-5" /></button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            <button type="button" onClick={() => setView("day")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Gun</button>
            <button type="button" onClick={() => setView("week")} className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Hafta</button>
          </div>
          <RxButton size="sm" variant="ghost" onClick={() => setWeekOffset(0)}>Bugun</RxButton>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div ref={gridRef} className="relative min-w-[700px]">
            {/* Day headers */}
            <div className="sticky top-0 z-10 grid border-b border-border bg-card" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="border-r border-border p-2" />
              {DAY_LABELS.map((day, i) => {
                const d = dayDates[i]
                const isToday = dateToYMD(d) === dateToYMD(today)
                return (
                  <div key={i} className={cn("flex flex-col items-center border-r border-border py-2 last:border-r-0", isToday && "bg-primary-light")}>
                    <span className={cn("text-xs", isToday ? "font-bold text-primary" : "text-muted-foreground")}>{day}</span>
                    <span className={cn("text-lg font-semibold", isToday ? "text-primary" : "text-foreground")}>{d.getDate()}</span>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="relative grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
              <div className="border-r border-border">
                {HOURS.map((hour) => (
                  <div key={hour} className="flex items-start justify-end border-b border-border pr-2" style={{ height: hourHeight }}>
                    <span className="relative -top-2 text-[13px] text-muted-foreground">{String(hour).padStart(2, "0")}:00</span>
                  </div>
                ))}
              </div>

              {Array.from({ length: 7 }, (_, dayIdx) => {
                const d = dayDates[dayIdx]
                const isToday = dateToYMD(d) === dateToYMD(today)
                const dayAppts = weekAppts.filter(a => a.day === dayIdx)

                return (
                  <div key={dayIdx} className={cn("relative border-r border-border last:border-r-0", isToday && "bg-primary-light/50")}>
                    {HOURS.map((hour) => (
                      <div key={hour} className="border-b border-border" style={{ height: hourHeight }} />
                    ))}
                    {dayAppts.map((apt) => {
                      const topPx = ((apt.startHour - 8) * hourHeight) + ((apt.startMin / 60) * hourHeight)
                      const heightPx = (apt.durationMin / 60) * hourHeight
                      return (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleAptClick(apt, e) }}
                          className="absolute left-1 right-1 z-[2] overflow-hidden rounded-md bg-primary px-1.5 py-1 text-left text-[11px] leading-tight text-primary-foreground shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                          style={{ top: topPx, height: Math.max(heightPx - 2, 20) }}
                        >
                          <span className="block truncate font-medium">{apt.customer}</span>
                          {heightPx > 30 && <span className="block truncate opacity-80">{apt.service}</span>}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            {/* Popover */}
            {popover && (
              <div
                className="absolute z-20 w-52 rounded-xl border border-border bg-card p-4 shadow-xl"
                style={{ left: Math.max(0, popover.x - 104), top: popover.y - 8 }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-sm font-semibold text-foreground">{popover.apt.customer}</p>
                <p className="mt-1 text-xs text-muted-foreground">{popover.apt.service}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {String(popover.apt.startHour).padStart(2, "0")}:{String(popover.apt.startMin).padStart(2, "0")} &middot; {popover.apt.durationMin} dk
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Randevularim ────────────────────────────────────────────────────────

function AppointmentsTab({
  staffBusinessId,
  supabase,
  refreshKey,
}: {
  staffBusinessId: string
  supabase: ReturnType<typeof createClient>
  refreshKey: number
}) {
  const [filter, setFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from("appointments")
        .select("*, customer:users!appointments_customer_user_id_fkey(name, phone), services:appointment_services(service:services(name), price_snapshot, duration_snapshot)")
        .eq("staff_business_id", staffBusinessId)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })

      const mapped: Appointment[] = (data || []).map((a: any) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const svcs = Array.isArray(a.services) ? a.services : []
        const svcNames = svcs.map((s: any) => { const sv = Array.isArray(s.service) ? s.service[0] : s.service; return sv?.name || "" }).filter(Boolean).join(", ")
        const totalDur = svcs.reduce((sum: number, s: any) => sum + (s.duration_snapshot || 0), 0)
        const totalPrice = svcs.reduce((sum: number, s: any) => sum + Number(s.price_snapshot || 0), 0)
        const st = String(a.start_time).slice(0, 5)
        const et = String(a.end_time).slice(0, 5)
        return {
          id: a.id,
          time: `${st} - ${et}`,
          endTime: et,
          customer: cust?.name || "?",
          service: svcNames || "Hizmet",
          duration: `${totalDur} dk`,
          price: String(totalPrice),
          status: a.status,
          appointmentDate: a.appointment_date,
        }
      })
      setAppointments(mapped)
      setLoading(false)
    }
    fetch()
  }, [staffBusinessId, supabase, refreshKey])

  const filters = [
    { key: "all", label: "Tumu" },
    { key: "pending", label: "Bekleyen" },
    { key: "confirmed", label: "Onaylanan" },
    { key: "completed", label: "Tamamlanan" },
    { key: "cancelled", label: "Iptal Edilen" },
    { key: "no_show", label: "No-Show" },
  ]

  const filtered = appointments.filter((apt) => {
    const matchesFilter = filter === "all" || apt.status === filter
    const matchesSearch = !searchQuery || apt.customer.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold text-foreground">Randevularim</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Musteri ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-56 rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Randevu bulunamadi.</div>
        ) : (
          filtered.map((apt, idx) => {
            const d = new Date(apt.appointmentDate + "T00:00:00")
            const dayNum = String(d.getDate())
            const month = MONTHS_TR[d.getMonth()]?.slice(0, 3) || ""
            return (
              <div key={apt.id} className={cn("flex items-center gap-4 px-5 py-4", idx !== filtered.length - 1 && "border-b border-border")}>
                <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-base font-bold leading-none">{dayNum}</span>
                  <span className="text-[10px] leading-none">{month}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold text-foreground">{apt.customer}</span>
                    <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{apt.service}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-muted-foreground">{apt.time}</span>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{apt.duration}</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[15px] font-semibold text-foreground">{"\u20BA"}{apt.price}</span>
                  <StatusBadge status={apt.status} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function StaffDashboard() {
  const { staffBusinessId, staffName, loading, supabase } = useStaffData()
  const [activeTab, setActiveTab] = useState<"overview" | "calendar" | "appointments">("overview")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (!staffBusinessId) return

    const channel = supabase.channel('staff-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `staff_business_id=eq.${staffBusinessId}`,
        },
        () => {
          setRefreshKey((k) => k + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [staffBusinessId, supabase])

  const tabs = [
    { key: "overview" as const, label: "Genel Bakis" },
    { key: "calendar" as const, label: "Takvim" },
    { key: "appointments" as const, label: "Randevularim" },
  ]

  if (loading || !staffBusinessId) {
    return <div className="flex items-center justify-center p-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  return (
    <>
      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab staffBusinessId={staffBusinessId} staffName={staffName} supabase={supabase} onStatusChange={() => setRefreshKey(k => k + 1)} refreshKey={refreshKey} />}
      {activeTab === "calendar" && <CalendarTab staffBusinessId={staffBusinessId} supabase={supabase} refreshKey={refreshKey} />}
      {activeTab === "appointments" && <AppointmentsTab staffBusinessId={staffBusinessId} supabase={supabase} refreshKey={refreshKey} />}
    </>
  )
}
