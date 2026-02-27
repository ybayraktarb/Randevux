"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Calendar,
  CalendarOff,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Send,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
} from "lucide-react"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxModal } from "./rx-modal"
import { RxTextarea } from "./rx-input"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────────

type LeaveStatus = "pending" | "approved" | "rejected"
type LeaveType = "full_day" | "partial"

interface LeaveRequest {
  id: string
  type: LeaveType
  date: string
  timeRange?: string
  reason?: string
  status: LeaveStatus
  patronNote?: string
  reviewerName?: string
  createdAt: string
}

// ─── Calendar Helpers ───────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
]
const DAY_HEADERS = ["Pt", "Sa", "Ca", "Pe", "Cu", "Ct", "Pa"]
const DAY_NAMES = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}

function dateToYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ─── Status Helpers ─────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: LeaveStatus }) {
  switch (status) {
    case "pending":
      return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED]">
          <Clock className="size-5 text-[#F59E0B]" />
        </div>
      )
    case "approved":
      return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5]">
          <CheckCircle className="size-5 text-[#10B981]" />
        </div>
      )
    case "rejected":
      return (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0F3]">
          <XCircle className="size-5 text-accent" />
        </div>
      )
  }
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  switch (status) {
    case "pending":
      return <RxBadge variant="warning">Bekliyor</RxBadge>
    case "approved":
      return <RxBadge variant="success">Onaylandi</RxBadge>
    case "rejected":
      return <RxBadge variant="danger">Reddedildi</RxBadge>
  }
}

// ─── useStaffInfo Hook ──────────────────────────────────────────────────────────

function useStaffInfo() {
  const { user } = useCurrentUser()
  const supabase = createClient()
  const [staffBusinessId, setStaffBusinessId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from("staff_business")
        .select("id")
        .eq("user_id", user!.id)
        .eq("is_active", true)
        .maybeSingle()
      if (data) setStaffBusinessId(data.id)
      setLoading(false)
    }
    load()
  }, [user])

  return { staffBusinessId, loading, user, supabase }
}

// ─── Tab 1: Taleplerim ──────────────────────────────────────────────────────────

function RequestsTab({
  staffBusinessId,
  supabase,
  onNewRequest,
  refreshKey,
}: {
  staffBusinessId: string
  supabase: ReturnType<typeof createClient>
  onNewRequest: () => void
  refreshKey: number
}) {
  const [filter, setFilter] = useState<"all" | LeaveStatus>("all")
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawTarget, setWithdrawTarget] = useState<string | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("leave_requests")
      .select("*, reviewer:users!leave_requests_reviewed_by_fkey(name)")
      .eq("staff_business_id", staffBusinessId)
      .order("created_at", { ascending: false })

    const mapped: LeaveRequest[] = (data || []).map((r: any) => {
      const rev = Array.isArray(r.reviewer) ? r.reviewer[0] : r.reviewer
      const d = new Date(r.date + "T00:00:00")
      const dateLabel = `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
      const dayOfWeek = DAY_NAMES[d.getDay()]
      const st = r.start_time ? String(r.start_time).slice(0, 5) : ""
      const et = r.end_time ? String(r.end_time).slice(0, 5) : ""
      return {
        id: r.id,
        type: r.request_type as LeaveType,
        date: `${dateLabel}, ${dayOfWeek}`,
        timeRange: st && et ? `${st} - ${et}` : undefined,
        reason: r.reason || undefined,
        status: r.status as LeaveStatus,
        reviewerName: rev?.name || undefined,
        createdAt: new Date(r.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      }
    })
    setRequests(mapped)
    setLoading(false)
  }, [staffBusinessId, supabase])

  useEffect(() => { fetchData() }, [fetchData, refreshKey])

  const handleWithdraw = async () => {
    if (!withdrawTarget) return
    const { error } = await supabase
      .from("leave_requests")
      .delete()
      .eq("id", withdrawTarget)
      .eq("status", "pending")
    if (error) { toast?.error ? toast.error("Islem basarisiz oldu.") : null; return }
    toast?.success ? toast.success("Talep geri cekildi.") : null
    setWithdrawModalOpen(false)
    setWithdrawTarget(null)
    fetchData()
  }

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter)

  const summaryCards = [
    { icon: Clock, value: String(counts.pending), label: "Bekliyor", color: "#F59E0B", borderColor: "border-t-[#F59E0B]" },
    { icon: CheckCircle, value: String(counts.approved), label: "Onaylandi", color: "#10B981", borderColor: "border-t-[#10B981]" },
    { icon: XCircle, value: String(counts.rejected), label: "Reddedildi", color: "#FF6584", borderColor: "border-t-[#FF6584]" },
  ]

  const filterTabs = [
    { key: "all" as const, label: `Tumu (${counts.all})` },
    { key: "pending" as const, label: `Bekliyor (${counts.pending})` },
    { key: "approved" as const, label: `Onaylandi (${counts.approved})` },
    { key: "rejected" as const, label: `Reddedildi (${counts.rejected})` },
  ]

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-foreground">Izin Taleplerim</h2>
          <span className="text-sm text-muted-foreground">{counts.all} talep</span>
        </div>
        <RxButton onClick={onNewRequest}>
          <Plus className="size-4" />
          Yeni Talep Olustur
        </RxButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={cn("flex items-center gap-4 rounded-xl border border-border border-t-[3px] bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]", card.borderColor)}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card">
                <Icon className="size-5" style={{ color: card.color }} />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                <span className="text-[13px] text-muted-foreground">{card.label}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex border-b border-border">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors",
              filter === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">Izin talebi bulunamadi.</div>
        ) : (
          filtered.map((req, idx) => (
            <div key={req.id} className={cn("flex gap-4 px-5 py-4", idx !== filtered.length - 1 && "border-b border-border")}>
              <StatusIcon status={req.status} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-foreground">
                    {req.type === "full_day" ? "Tam Gun Izin" : "Kismi Izin"}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="size-3.5" />
                  {req.type === "full_day" ? (
                    <span>{req.date}</span>
                  ) : (
                    <span>{req.date} &middot; {req.timeRange}</span>
                  )}
                </div>
                {req.reason ? (
                  <p className="text-[13px] italic text-muted-foreground">{req.reason}</p>
                ) : (
                  <p className="text-[13px] italic text-muted-foreground/60">Neden belirtilmedi</p>
                )}
                {req.reviewerName && req.status !== "pending" && (
                  <p className="text-xs text-muted-foreground">
                    {req.status === "approved" ? "Onaylayan" : "Reddeden"}: {req.reviewerName}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">Talep tarihi: {req.createdAt}</p>
              </div>
              {req.status === "pending" && (
                <div className="flex shrink-0 items-start pt-1">
                  <button
                    type="button"
                    onClick={() => { setWithdrawTarget(req.id); setWithdrawModalOpen(true) }}
                    className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-[#FFF0F3]"
                  >
                    Talebi Geri Cek
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <RxModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Talebi Geri Cek"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setWithdrawModalOpen(false)}>Vazgec</RxButton>
            <RxButton variant="danger" onClick={handleWithdraw}>Geri Cek</RxButton>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FFF0F3]">
            <XCircle className="size-6 text-accent" />
          </div>
          <p className="text-base font-semibold text-foreground">Bu izin talebini geri cekmek istediginize emin misiniz?</p>
          <p className="text-center text-[13px] text-muted-foreground">Bu islem geri alinamaz.</p>
        </div>
      </RxModal>
    </div>
  )
}

// ─── Tab 2: Yeni Talep ──────────────────────────────────────────────────────────

function NewRequestTab({
  staffBusinessId,
  supabase,
  onBackToList,
  onCreated,
}: {
  staffBusinessId: string
  supabase: ReturnType<typeof createClient>
  onBackToList: () => void
  onCreated: () => void
}) {
  const [leaveType, setLeaveType] = useState<"full_day" | "partial">("full_day")
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [startTime, setStartTime] = useState("14:00")
  const [endTime, setEndTime] = useState("17:00")
  const [reason, setReason] = useState("")
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const today = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() }

  const daysInMonth = getDaysInMonth(calYear, calMonth)
  const firstDay = getFirstDayOfMonth(calYear, calMonth)

  const calcDuration = useCallback(() => {
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const totalMins = (eh * 60 + em) - (sh * 60 + sm)
    if (totalMins <= 0) return null
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (mins === 0) return `${hours} saat`
    return `${hours} saat ${mins} dakika`
  }, [startTime, endTime])

  const duration = calcDuration()

  const isPast = (day: number) => {
    if (calYear < today.year) return true
    if (calYear === today.year && calMonth < today.month) return true
    if (calYear === today.year && calMonth === today.month && day <= today.day) return true
    return false
  }

  const selectedDateLabel = selectedDay
    ? `${selectedDay} ${MONTH_NAMES[calMonth]} ${calYear}`
    : null

  const getDayOfWeek = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    return DAY_NAMES[d.getDay()]
  }

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else { setCalMonth(calMonth - 1) }
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else { setCalMonth(calMonth + 1) }
    setSelectedDay(null)
  }

  const handleSubmit = async () => {
    if (!selectedDay) return
    setSubmitting(true)
    const dateStr = dateToYMD(new Date(calYear, calMonth, selectedDay))
    const insert: Record<string, any> = {
      staff_business_id: staffBusinessId,
      request_type: leaveType,
      date: dateStr,
      reason: reason || null,
      status: "pending",
    }
    if (leaveType === "partial") {
      insert.start_time = startTime + ":00"
      insert.end_time = endTime + ":00"
    }

    const { error } = await supabase.from("leave_requests").insert(insert)
    setSubmitting(false)
    if (error) { toast?.error ? toast.error("Talep olusturulamadi: " + error.message) : null; return }
    toast?.success ? toast.success("Izin talebi basariyla gonderildi!") : null
    setConfirmModalOpen(false)
    onCreated()
    onBackToList()
  }

  return (
    <div className="flex justify-center">
      <div className="flex w-full max-w-[540px] flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Yeni Izin Talebi</h2>
          <p className="mt-1 text-sm text-muted-foreground">Talebiniz patronunuza iletilecektir.</p>
        </div>

        {/* Leave Type Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Izin Turu</label>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setLeaveType("full_day")}
              className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors", leaveType === "full_day" ? "border-primary bg-primary-light" : "border-border bg-card hover:border-muted-foreground/30")}>
              <CalendarOff className="size-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Tam Gun Izin</span>
              <span className="text-center text-xs text-muted-foreground leading-relaxed">Secilen gun boyunca calismayacaksiniz.</span>
            </button>
            <button type="button" onClick={() => setLeaveType("partial")}
              className={cn("flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors", leaveType === "partial" ? "border-primary bg-primary-light" : "border-border bg-card hover:border-muted-foreground/30")}>
              <Clock className="size-8 text-primary" />
              <span className="text-sm font-semibold text-foreground">Kismi Izin</span>
              <span className="text-center text-xs text-muted-foreground leading-relaxed">Belirli saat araligi icin izin talep edin.</span>
            </button>
          </div>
        </div>

        {/* Date Selection - Mini Calendar */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Izin Gunu</label>
          <div className="rounded-xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={prevMonth} className="rounded-lg p-1 text-muted-foreground hover:bg-primary-light hover:text-foreground"><ChevronLeft className="size-4" /></button>
              <span className="text-sm font-semibold text-foreground">{MONTH_NAMES[calMonth]} {calYear}</span>
              <button type="button" onClick={nextMonth} className="rounded-lg p-1 text-muted-foreground hover:bg-primary-light hover:text-foreground"><ChevronRight className="size-4" /></button>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="flex items-center justify-center py-1 text-xs font-medium text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`empty-${i}`} className="flex size-9 items-center justify-center" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1
                const past = isPast(day)
                const isSelected = selectedDay === day
                const isToday = calYear === today.year && calMonth === today.month && day === today.day
                return (
                  <button key={day} type="button" disabled={past} onClick={() => setSelectedDay(day)}
                    className={cn(
                      "relative flex size-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      past && "cursor-not-allowed text-muted-foreground/40",
                      !past && !isSelected && "text-foreground hover:bg-primary-light",
                      isSelected && "bg-primary text-primary-foreground"
                    )}>
                    {day}
                    {isToday && !isSelected && (<span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />)}
                  </button>
                )
              })}
            </div>
          </div>
          {selectedDay && (
            <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary-light px-3 py-2">
              <CheckCircle className="size-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedDay} {MONTH_NAMES[calMonth]} {calYear}, {getDayOfWeek(selectedDay)} secildi
              </span>
            </div>
          )}
        </div>

        {/* Time Range (only for partial) */}
        {leaveType === "partial" && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-300">
            <label className="text-sm font-medium text-foreground">Izin Saatleri</label>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-muted-foreground">Baslangic</span>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" />
              </div>
              <span className="mt-5 text-lg text-muted-foreground">&ndash;</span>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-xs text-muted-foreground">Bitis</span>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" />
              </div>
            </div>
            {duration && (
              <div className="rounded-lg bg-primary-light px-3 py-2">
                <span className="text-sm font-medium text-primary">{duration} izin talep edilecek</span>
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-foreground">Izin Nedeni (Istege Bagli)</label>
          <div className="relative">
            <RxTextarea
              placeholder="Patronunuza iletmek istediginiz bir bilgi var mi?"
              value={reason}
              onChange={(e) => { if (e.target.value.length <= 300) setReason(e.target.value) }}
            />
            <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">{reason.length}/300</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <RxButton variant="ghost" onClick={onBackToList}>Vazgec</RxButton>
          <RxButton disabled={!selectedDay} onClick={() => setConfirmModalOpen(true)}>
            <Send className="size-4" />
            Talebi Gonder
          </RxButton>
        </div>
      </div>

      {/* Confirmation Modal */}
      <RxModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Talebi Onayla"
        className="max-w-[480px]"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setConfirmModalOpen(false)}>Geri Don</RxButton>
            <RxButton onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Gonder"}
              {!submitting && <CheckCircle className="size-4" />}
            </RxButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2.5 rounded-xl bg-primary-light p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Izin Turu:</span>
              <span className="font-medium text-foreground">{leaveType === "full_day" ? "Tam Gun Izin" : "Kismi Izin"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tarih:</span>
              <span className="font-medium text-foreground">
                {selectedDateLabel && `${selectedDateLabel}, ${getDayOfWeek(selectedDay!)}`}
              </span>
            </div>
            {leaveType === "partial" && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saat:</span>
                <span className="font-medium text-foreground">{startTime} - {endTime}</span>
              </div>
            )}
            {reason && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Neden:</span>
                <span className="font-medium text-foreground">{reason}</span>
              </div>
            )}
          </div>
          <p className="text-center text-[13px] text-muted-foreground">
            Talebiniz patronunuza iletilecek ve sonuc size bildirilecektir.
          </p>
        </div>
      </RxModal>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function LeaveRequests() {
  const { staffBusinessId, loading, supabase } = useStaffInfo()
  const [activeTab, setActiveTab] = useState<"requests" | "new">("requests")
  const [refreshKey, setRefreshKey] = useState(0)

  const tabs = [
    { key: "requests" as const, label: "Taleplerim" },
    { key: "new" as const, label: "Yeni Talep" },
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

      {activeTab === "requests" && <RequestsTab staffBusinessId={staffBusinessId} supabase={supabase} onNewRequest={() => setActiveTab("new")} refreshKey={refreshKey} />}
      {activeTab === "new" && <NewRequestTab staffBusinessId={staffBusinessId} supabase={supabase} onBackToList={() => setActiveTab("requests")} onCreated={() => setRefreshKey(k => k + 1)} />}
    </>
  )
}
