"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Plus,
  Trash2,
  CalendarOff,
  AlertTriangle,
  Info,
  Repeat,
  Loader2,
  Save,
  Clock,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  Building2,
} from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput } from "@/src/modules/core/components/rx-input"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { updateAppointmentStatusAction } from "@/src/modules/appointments/actions/appointment.actions"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { CommandCenterCalendar } from "./command-center-calendar"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Appointment {
  id?: string
  start: string
  end: string
  customer: string
  service: string
  status?: "Onaylandı" | "Bekliyor" | "Tamamlandı" | "İptal" | "Gelmedi"
  isBreak?: boolean
  isOffHours?: boolean
}

interface StaffCalendarData {
  id: string
  name: string
  appointmentCount: number
  appointments: Appointment[]
}

interface ShiftDay {
  day: string
  dayIndex: number
  working: boolean
  start: string
  end: string
  breaks: string[]
}

interface ClosedDateItem {
  id: string
  date: string
  formattedDate: string
  reason: string
  is_recurring: boolean
  isPast: boolean
  daysLeft: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const hours = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function getBlockStyle(start: string, end: string) {
  const startMin = timeToMinutes(start) - timeToMinutes("08:00")
  const endMin = timeToMinutes(end) - timeToMinutes("08:00")
  const pxPerMin = 60 / 60
  return {
    top: `${startMin * pxPerMin}px`,
    height: `${(endMin - startMin) * pxPerMin}px`,
  }
}

const dayNames = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
const defaultDayOrder = [1, 2, 3, 4, 5, 6, 0] // Mon..Sun



// ─── Appointment Popover ────────────────────────────────────────────────────────

function AppointmentPopover({
  apt,
  position,
  onClose,
  businessId,
  onRefresh,
}: {
  apt: Appointment
  position: { top: number; left: number }
  onClose: () => void
  businessId: string
  onRefresh: () => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  const handleAction = async (status: any) => {
    if (!apt.id || !businessId) return
    setUpdating(true)
    try {
      const res = await updateAppointmentStatusAction(apt.id, status, businessId)
      if (res.success) {
        toast.success("Randevu durumu güncellendi.")
        onRefresh()
        onClose()
      } else {
        toast.error(res.error || "Hata oluştu.")
      }
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 w-64 rounded-xl border border-border bg-card p-4 shadow-lg animate-in fade-in zoom-in-95 duration-200"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-semibold text-foreground">{apt.customer}</p>
            <p className="text-[12px] text-muted-foreground">{apt.service}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-0.5 text-muted-foreground hover:bg-muted"><X className="size-3.5" /></button>
        </div>

        <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <Clock className="size-3.5" />
          {apt.start} - {apt.end}
        </div>

        {apt.status && (
          <RxBadge variant={apt.status === "Tamamlandı" ? "purple" : apt.status === "Bekliyor" ? "warning" : apt.status === "Gelmedi" ? "danger" : "success"}>
            {apt.status === "Bekliyor" ? "Bekliyor" : apt.status === "Onaylandı" ? "Onaylandı" : apt.status === "Tamamlandı" ? "Tamamlandı" : "No-Show"}
          </RxBadge>
        )}

        <div className="my-1 h-px bg-border" />

        <div className="grid grid-cols-2 gap-2">
          {apt.status === "Bekliyor" && (
            <RxButton size="sm" variant="primary" className="col-span-2" onClick={() => handleAction("Onaylandı")} disabled={updating}>
              {updating ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3.5" />}
              Onayla
            </RxButton>
          )}
          <RxButton size="sm" variant="ghost" className="text-accent hover:bg-badge-red-bg" onClick={() => handleAction("Gelmedi")} disabled={updating}>
            No-Show
          </RxButton>
          <RxButton size="sm" variant="ghost" className="text-accent hover:bg-badge-red-bg" onClick={() => handleAction("İptal")} disabled={updating}>
            Iptal Et
          </RxButton>
        </div>
      </div>
    </div>
  )
}

// ─── Slot Tooltip ───────────────────────────────────────────────────────────────

function SlotTooltip({ position, onClose }: { position: { top: number; left: number }; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-30 rounded-lg border border-border bg-card px-3 py-2 shadow-md"
      style={{ top: position.top, left: position.left }}
    >
      <button type="button" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
        <Plus className="size-3.5" /> Bu saate randevu ekle
      </button>
    </div>
  )
}

// ─── Week View Calendar ─────────────────────────────────────────────────────────

function WeekViewCalendar({ staffFilter, staffData, businessId, onRefresh }: { staffFilter: string; staffData: StaffCalendarData[]; businessId: string; onRefresh: () => void }) {
  const [popoverApt, setPopoverApt] = useState<{ apt: Appointment; pos: { top: number; left: number } } | null>(null)
  const [slotTip, setSlotTip] = useState<{ pos: { top: number; left: number } } | null>(null)

  const filteredStaff = useMemo(() => {
    if (staffFilter === "all") return staffData
    return staffData.filter((s) => s.name === staffFilter)
  }, [staffFilter, staffData])

  const now = new Date()
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  const currentTimeMin = timeToMinutes(currentTimeStr) - timeToMinutes("08:00")
  const currentTimePx = Math.max(0, currentTimeMin * (60 / 60))

  function handleBlockClick(apt: Appointment, e: React.MouseEvent) {
    e.stopPropagation()
    if (apt.isBreak || apt.isOffHours) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const parent = (e.currentTarget as HTMLElement).closest("[data-grid-container]")
    if (!parent) return
    const parentRect = parent.getBoundingClientRect()
    setPopoverApt({
      apt,
      pos: { top: rect.top - parentRect.top + rect.height + 4, left: rect.left - parentRect.left },
    })
    setSlotTip(null)
  }

  function handleEmptyClick(e: React.MouseEvent) {
    const parent = (e.currentTarget as HTMLElement).closest("[data-grid-container]")
    if (!parent) return
    const parentRect = parent.getBoundingClientRect()
    setSlotTip({ pos: { top: e.clientY - parentRect.top + 4, left: e.clientX - parentRect.left } })
    setPopoverApt(null)
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Staff Header */}
      <div className="sticky top-0 z-20 flex border-b border-border bg-card">
        <div className="w-16 shrink-0 border-r border-border" />
        {filteredStaff.map((staff) => (
          <div key={staff.id} className="flex flex-1 items-center gap-2.5 border-r border-border px-4 py-3 last:border-r-0" style={{ minWidth: 200 }}>
            <RxAvatar name={staff.name} size="sm" />
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-foreground">{staff.name}</span>
              <span className="text-[12px] text-muted-foreground">{staff.appointmentCount} randevu</span>
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="relative flex" data-grid-container>
        {/* Time Labels */}
        <div className="w-16 shrink-0 border-r border-border">
          {hours.map((hour) => (
            <div key={hour} className="flex h-[60px] items-start justify-end pr-2 pt-0">
              <span className="text-[13px] leading-none text-muted-foreground">{hour}</span>
            </div>
          ))}
        </div>

        {/* Staff Columns */}
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="relative flex-1 border-r border-border last:border-r-0"
            style={{ minWidth: 200, height: `${hours.length * 60}px` }}
            onClick={handleEmptyClick}
          >
            {/* Hour lines */}
            {hours.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-border" style={{ top: `${(timeToMinutes(hour) - timeToMinutes("08:00")) * (60 / 60)}px` }} />
            ))}

            {/* Appointment Blocks */}
            {staff.appointments.map((apt, i) => {
              const style = getBlockStyle(apt.start, apt.end)

              if (apt.isOffHours) {
                return (
                  <div
                    key={i}
                    className="absolute left-1 right-1 flex items-center justify-center rounded-md"
                    style={{
                      ...style,
                      background: "repeating-linear-gradient(45deg, #F3F4F6, #F3F4F6 8px, #E5E7EB 8px, #E5E7EB 10px)",
                    }}
                  >
                    <span className="rounded bg-card/80 px-2 py-0.5 text-[12px] font-medium text-muted-foreground">Mesai Disi</span>
                  </div>
                )
              }

              if (apt.isBreak) {
                return (
                  <div
                    key={i}
                    className="absolute left-1 right-1 flex items-center justify-center rounded-md border border-dashed border-muted-foreground/40 bg-muted"
                    style={style}
                  >
                    <span className="text-[12px] font-medium text-muted-foreground">Ogle Molasi</span>
                  </div>
                )
              }

              const statusColors = {
                "Bekliyor": "bg-badge-yellow-bg border-badge-yellow-text text-badge-yellow-text",
                "Onaylandı": "bg-success/10 border-success text-success",
                "Tamamlandı": "bg-primary-light border-primary text-primary",
                "Gelmedi": "bg-badge-red-bg border-accent text-accent",
                "İptal": "bg-muted border-muted-foreground/30 text-muted-foreground",
              }
              const colorClass = apt.status ? statusColors[apt.status] : "bg-primary border-primary text-primary-foreground"

              return (
                <button
                  key={i}
                  type="button"
                  className={cn(
                    "absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-l-4 px-2 py-1 text-left transition-opacity hover:opacity-90 shadow-sm",
                    colorClass
                  )}
                  style={style}
                  onClick={(e) => handleBlockClick(apt, e)}
                >
                  <p className="truncate text-[12px] font-bold leading-tight">{apt.customer}</p>
                  <p className="truncate text-[11px] leading-tight opacity-80">{apt.service}</p>
                </button>
              )
            })}
          </div>
        ))}

        {/* Current Time Line */}
        <div
          className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
          style={{ top: `${currentTimePx}px` }}
        >
          <div className="ml-[52px] size-2.5 rounded-full bg-accent" />
          <div className="h-[2px] flex-1 bg-accent" />
        </div>

        {/* Popover */}
        {popoverApt && (
          <AppointmentPopover
            apt={popoverApt.apt}
            position={popoverApt.pos}
            onClose={() => setPopoverApt(null)}
            businessId={businessId}
            onRefresh={onRefresh}
          />
        )}

        {/* Slot Tooltip */}
        {slotTip && (
          <SlotTooltip
            position={slotTip.pos}
            onClose={() => setSlotTip(null)}
          />
        )}
      </div>
    </div>
  )
}

// ─── Day View Calendar ──────────────────────────────────────────────────────────

function DayViewCalendar({ staffFilter, staffData, businessId, onRefresh }: { staffFilter: string; staffData: StaffCalendarData[]; businessId: string; onRefresh: () => void }) {
  const filteredAppointments = useMemo(() => {
    if (staffFilter === "all") return staffData.flatMap((s) => s.appointments).filter((a) => !a.isOffHours)
    const staff = staffData.find((s) => s.name === staffFilter)
    return staff ? staff.appointments : []
  }, [staffFilter, staffData])

  const today = new Date()
  const dateStr = today.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })

  return (
    <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-base font-semibold text-foreground">{dateStr}</h3>
      </div>

      {/* Timeline */}
      <div className="relative flex" style={{ height: `${hours.length * 80}px` }}>
        {/* Time Labels */}
        <div className="w-16 shrink-0 border-r border-border">
          {hours.map((hour) => (
            <div key={hour} className="flex h-[80px] items-start justify-end pr-2 pt-0">
              <span className="text-[13px] leading-none text-muted-foreground">{hour}</span>
            </div>
          ))}
        </div>

        {/* Single Column */}
        <div className="relative flex-1" style={{ height: `${hours.length * 80}px` }}>
          {hours.map((hour) => (
            <div key={hour} className="absolute left-0 right-0 border-t border-border" style={{ top: `${(timeToMinutes(hour) - timeToMinutes("08:00")) * (80 / 60)}px` }} />
          ))}

          {filteredAppointments.map((apt, i) => {
            const startMin = timeToMinutes(apt.start) - timeToMinutes("08:00")
            const endMin = timeToMinutes(apt.end) - timeToMinutes("08:00")
            const pxPerMin = 80 / 60
            const top = startMin * pxPerMin
            const height = (endMin - startMin) * pxPerMin
            const duration = endMin - startMin

            if (apt.isBreak) {
              return (
                <div
                  key={i}
                  className="absolute left-2 right-2 flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 bg-muted"
                  style={{ top: `${top}px`, height: `${height}px` }}
                >
                  <span className="text-[13px] font-medium text-muted-foreground">Ogle Molasi</span>
                </div>
              )
            }

            return (
              <div
                key={i}
                className="absolute left-2 right-2 overflow-hidden rounded-lg border-2 border-card bg-primary px-3 py-2"
                style={{ top: `${top}px`, height: `${height}px` }}
              >
                <p className="text-[13px] font-semibold text-primary-foreground">{apt.customer}</p>
                <p className="text-[12px] text-primary-foreground/80">{apt.service}</p>
                <p className="text-[11px] text-primary-foreground/70">{apt.start} - {apt.end} ({duration} dk)</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── TAB 1: Calendar View ───────────────────────────────────────────────────────

function CalendarViewTab({ staffData, loading, businessId, onRefresh }: { staffData: StaffCalendarData[]; loading: boolean; businessId: string; onRefresh: () => void }) {
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [staffFilter, setStaffFilter] = useState("all")
  const [staffDropdownOpen, setStaffDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setStaffDropdownOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const now = new Date()
  const monthLabel = now.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: month nav */}
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-foreground">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Center: view toggle */}
        <div className="flex items-center rounded-lg border border-border bg-card">
          {(["day", "week", "month"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                viewMode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode === "day" ? "Gun" : mode === "week" ? "Hafta" : "Ay"}
            </button>
          ))}
        </div>

        {/* Right: staff filter + today */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setStaffDropdownOpen(!staffDropdownOpen)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light"
            >
              <Users className="size-4 text-muted-foreground" />
              <span>{staffFilter === "all" ? "Tum Personel" : staffFilter}</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
            {staffDropdownOpen && (
              <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => { setStaffFilter("all"); setStaffDropdownOpen(false) }}
                  className={cn("flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-primary-light", staffFilter === "all" && "text-primary font-medium")}
                >
                  Tum Personel
                </button>
                {staffData.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setStaffFilter(s.name); setStaffDropdownOpen(false) }}
                    className={cn("flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-primary-light", staffFilter === s.name && "text-primary font-medium")}
                  >
                    <RxAvatar name={s.name} size="sm" />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <RxButton variant="ghost" size="sm">Bugun</RxButton>
        </div>
      </div>

      {/* Calendar */}
      {viewMode === "week" && <WeekViewCalendar staffFilter={staffFilter} staffData={staffData} businessId={businessId} onRefresh={onRefresh} />}
      {viewMode === "day" && <DayViewCalendar staffFilter={staffFilter} staffData={staffData} businessId={businessId} onRefresh={onRefresh} />}
      {viewMode === "month" && (
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-card">
          <p className="text-muted-foreground">Aylik gorunum yakinda eklenecek</p>
        </div>
      )}
    </div>
  )
}

// ─── TAB 2: Shift Templates ─────────────────────────────────────────────────────

function ShiftTemplatesTab({ staffData, businessId }: { staffData: StaffCalendarData[]; businessId: string }) {
  const [selectedStaff, setSelectedStaff] = useState(0)
  const [shifts, setShifts] = useState<ShiftDay[]>([])
  const [breakModalOpen, setBreakModalOpen] = useState(false)
  const [breakDayIndex, setBreakDayIndex] = useState<number | null>(null)
  const [newBreakStart, setNewBreakStart] = useState("12:00")
  const [newBreakEnd, setNewBreakEnd] = useState("13:00")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const staffTabs = [
    ...staffData.map((s) => ({ id: s.id, name: s.name, type: "staff" })),
    { id: "all", name: "Genel Isletme", type: "business" }
  ]
  const isAllBusiness = selectedStaff === staffData.length
  const currentStaffId = selectedStaff < staffData.length ? staffData[selectedStaff]?.id : null

  // Fetch schedule data
  useEffect(() => {
    async function fetchSchedule() {
      if (isAllBusiness) {
        const { data } = await supabase
          .from("business_hours")
          .select("*")
          .eq("business_id", businessId)
          .order("day_of_week")

        const mapped: ShiftDay[] = defaultDayOrder.map((dayIdx) => {
          const entry = data?.find((d) => d.day_of_week === dayIdx)
          return {
            day: dayNames[dayIdx],
            dayIndex: dayIdx,
            working: entry?.is_open ?? (dayIdx !== 0),
            start: entry?.open_time || "09:00",
            end: entry?.close_time || "18:00",
            breaks: [],
          }
        })
        setShifts(mapped)
      } else if (currentStaffId) {
        const { data: schedData } = await supabase
          .from("work_schedule_templates")
          .select("*")
          .eq("staff_business_id", currentStaffId)

        const { data: breakData } = await supabase
          .from("break_schedules")
          .select("*")
          .eq("staff_business_id", currentStaffId)

        const mapped: ShiftDay[] = defaultDayOrder.map((dayIdx) => {
          const entry = schedData?.find((s) => s.day_of_week === dayIdx)
          const dayBreaks = (breakData || [])
            .filter((b) => b.day_of_week === dayIdx)
            .map((b) => `${b.start_time}-${b.end_time}`)
          return {
            day: dayNames[dayIdx],
            dayIndex: dayIdx,
            working: entry?.is_working ?? (dayIdx !== 0),
            start: entry?.start_time || "09:00",
            end: entry?.end_time || "18:00",
            breaks: dayBreaks,
          }
        })
        setShifts(mapped)
      }
    }
    fetchSchedule()
  }, [selectedStaff, currentStaffId, isAllBusiness, businessId, supabase])

  function toggleWorking(index: number) {
    setShifts((prev) => prev.map((s, i) => i === index ? { ...s, working: !s.working } : s))
  }

  function updateTime(index: number, field: "start" | "end", value: string) {
    setShifts((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  function removeBreak(dayIndex: number, breakIndex: number) {
    setShifts((prev) => prev.map((s, i) => i === dayIndex ? { ...s, breaks: s.breaks.filter((_, bi) => bi !== breakIndex) } : s))
  }

  function addBreak() {
    if (breakDayIndex === null) return
    const breakStr = `${newBreakStart}-${newBreakEnd}`
    setShifts((prev) => prev.map((s, i) => i === breakDayIndex ? { ...s, breaks: [...s.breaks, breakStr] } : s))
    setBreakModalOpen(false)
    setNewBreakStart("12:00")
    setNewBreakEnd("13:00")
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (isAllBusiness) {
        for (const shift of shifts) {
          await supabase
            .from("business_hours")
            .upsert({
              business_id: businessId,
              day_of_week: shift.dayIndex,
              is_open: shift.working,
              open_time: shift.start,
              close_time: shift.end,
            }, { onConflict: "business_id,day_of_week" })
        }
      } else if (currentStaffId) {
        for (const shift of shifts) {
          await supabase
            .from("work_schedule_templates")
            .upsert({
              staff_business_id: currentStaffId,
              day_of_week: shift.dayIndex,
              is_working: shift.working,
              start_time: shift.start,
              end_time: shift.end,
            }, { onConflict: "staff_business_id,day_of_week" })
        }
        await supabase.from("break_schedules").delete().eq("staff_business_id", currentStaffId)
        for (const shift of shifts) {
          for (const brk of shift.breaks) {
            const [bStart, bEnd] = brk.split("-")
            await supabase.from("break_schedules").insert({
              staff_business_id: currentStaffId,
              day_of_week: shift.dayIndex,
              start_time: bStart,
              end_time: bEnd,
            })
          }
        }
      }
      toast.success("Sablon basariyla kaydedildi.")
    } catch (err) {
      toast.error("Kayit sirasinda bir hata olustu.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header with Save Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Vardiya Sablonlari</h2>
          <p className="text-[11px] font-black text-primary uppercase tracking-widest">Her hafta otomatik uygulanir</p>
        </div>
        <RxButton variant="primary" onClick={handleSave} loading={saving} className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] h-12 shadow-lg shadow-primary/20">
          {!saving && <Save className="size-4 mr-2" />}
          {saving ? "Kaydediliyor..." : "Sablonu Kaydet"}
        </RxButton>
      </div>

      {/* Staff Selector - Modern List */}
      <div className="flex flex-wrap gap-2 p-2 bg-gray-50/50 rounded-3xl border border-gray-100">
        {staffTabs.map((tab, i) => {
          const isActive = selectedStaff === i
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStaff(i)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl transition-all duration-300 border-2",
                isActive
                  ? "bg-white border-primary shadow-lg shadow-primary/5 text-primary"
                  : "bg-transparent border-transparent text-gray-400 hover:bg-white/50"
              )}
            >
              {tab.type === "staff" ? (
                <RxAvatar name={tab.name} size="sm" className="size-5 rounded-md" />
              ) : (
                <Building2 className="size-4" />
              )}
              <span className="text-[11px] font-black uppercase tracking-widest">{tab.name}</span>
            </button>
          )
        })}
      </div>

      {isAllBusiness && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <p className="text-[11px] font-bold text-amber-600 leading-relaxed uppercase tracking-wider">
            DİKKAT: BU AYARLAR TÜM PERSONELİN ÇALIŞMA SAATLERİNİ GEÇERSİZ KILAR.
          </p>
        </div>
      )}

      {/* Weekly Grid - Premium Cards */}
      <div className="grid grid-cols-1 gap-4">
        {shifts.map((shift, index) => {
          const isToday = shift.dayIndex === new Date().getDay()
          return (
            <div
              key={shift.day}
              className={cn(
                "group relative overflow-hidden rounded-[32px] border-2 transition-all duration-500 bg-white p-6",
                !shift.working ? "opacity-60 grayscale border-gray-100" : "border-gray-50 hover:border-primary hover:shadow-2xl hover:shadow-primary/5",
                isToday && shift.working && "border-primary/30 ring-4 ring-primary/5"
              )}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
                {/* Day Info */}
                <div className="flex items-center gap-6 sm:w-1/4">
                  <div className={cn(
                    "flex flex-col items-center justify-center size-14 rounded-2xl transition-colors shrink-0",
                    shift.working ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400"
                  )}>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{shift.day.slice(0, 3)}</span>
                    <Clock className="size-4 mt-1" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{shift.day}</h3>
                    {isToday && <RxBadge variant="purple" className="text-[9px]">BUGÜN</RxBadge>}
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-4 sm:w-1/4">
                  <button
                    type="button"
                    onClick={() => toggleWorking(index)}
                    className={cn(
                      "relative h-7 w-12 rounded-full transition-all duration-300",
                      shift.working ? "bg-primary shadow-lg shadow-primary/20" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 size-5 rounded-full bg-white shadow-md transition-all duration-300",
                      shift.working ? "left-6" : "left-1"
                    )} />
                  </button>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    shift.working ? "text-primary" : "text-gray-400"
                  )}>
                    {shift.working ? "ÇALIŞIYOR" : "KAPALI"}
                  </span>
                </div>

                {/* Time & Breaks */}
                {shift.working ? (
                  <div className="flex flex-1 flex-wrap items-center gap-4 justify-end">
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                      <input
                        type="time"
                        value={shift.start}
                        onChange={(e) => updateTime(index, "start", e.target.value)}
                        className="bg-transparent text-sm font-black text-gray-900 focus:outline-none px-2"
                      />
                      <span className="text-gray-300 font-black">—</span>
                      <input
                        type="time"
                        value={shift.end}
                        onChange={(e) => updateTime(index, "end", e.target.value)}
                        className="bg-transparent text-sm font-black text-gray-900 focus:outline-none px-2"
                      />
                    </div>

                    {!isAllBusiness && (
                      <button
                        type="button"
                        onClick={() => { setBreakDayIndex(index); setBreakModalOpen(true) }}
                        className="size-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                      >
                        <Plus className="size-5" />
                      </button>
                    )}

                    {/* Break Chips */}
                    <div className="flex flex-wrap gap-2">
                      {shift.breaks.map((brk, bi) => (
                        <div key={bi} className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-100">
                          <span className="text-[10px] font-black uppercase tracking-widest">{brk}</span>
                          <button type="button" onClick={() => removeBreak(index, bi)} className="hover:text-rose-500 transition-colors">
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-1 justify-end">
                    <div className="flex items-center gap-2 px-6 py-2 rounded-2xl bg-gray-50 border border-gray-100">
                      <CalendarOff className="size-4 text-gray-300" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet Kapalı</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Info Card */}
      <div className="p-6 rounded-[32px] bg-indigo-50/50 border border-indigo-100 flex items-start gap-4">
        <div className="size-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
          <Info className="size-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-indigo-900">Otomatik Planlama Bilgisi</p>
          <p className="text-[12px] font-medium text-indigo-600 leading-relaxed">
            Bu şablonlar her hafta başı sisteme otomatik olarak yansıtılır. Yıllık izinler, bayramlar veya özel durumlar için lütfen
            <button type="button" className="underline font-black px-1">Kapalı Günler</button>
            sekmesini kullanın.
          </p>
        </div>
      </div>

      <RxModal
        open={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        title="Mola Tanımla"
        className="max-w-md"
      >
        <div className="flex flex-col gap-6 p-2">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-primary">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">SEÇİLEN GÜN</p>
              <p className="text-sm font-black text-gray-900">{breakDayIndex !== null ? shifts[breakDayIndex]?.day : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <RxInput
              label="BAŞLANGIÇ"
              type="time"
              value={newBreakStart}
              onChange={(e) => setNewBreakStart(e.target.value)}
              className="font-black"
            />
            <RxInput
              label="BİTİŞ"
              type="time"
              value={newBreakEnd}
              onChange={(e) => setNewBreakEnd(e.target.value)}
              className="font-black"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <RxButton variant="ghost" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px]" onClick={() => setBreakModalOpen(false)}>Vazgeç</RxButton>
            <RxButton variant="primary" className="flex-[2] rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20" onClick={addBreak}>Molayı Ekle</RxButton>
          </div>
        </div>
      </RxModal>
    </div>
  )
}

// ─── TAB 3: Closed Days ─────────────────────────────────────────────────────────

function ClosedDaysTab({ businessId }: { businessId: string }) {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [recurring, setRecurring] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [description, setDescription] = useState("")
  const [closedDates, setClosedDates] = useState<ClosedDateItem[]>([])
  const [saving, setSaving] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const supabase = createClient()

  const fetchClosedDates = useCallback(async () => {
    const { data } = await supabase
      .from("business_closed_dates")
      .select("*")
      .eq("business_id", businessId)
      .order("date", { ascending: true })

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const mapped: ClosedDateItem[] = (data || []).map((d) => {
      const dateObj = new Date(d.date)
      const diffMs = dateObj.getTime() - now.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
      return {
        id: d.id,
        date: d.date,
        formattedDate: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        reason: d.reason || "",
        is_recurring: d.is_recurring || false,
        isPast: diffDays < 0,
        daysLeft: Math.max(0, diffDays),
      }
    })
    setClosedDates(mapped)
  }, [businessId, supabase])

  useEffect(() => {
    fetchClosedDates()
  }, [fetchClosedDates])

  const upcomingClosed = closedDates.filter((d) => !d.isPast)
  const pastClosed = closedDates.filter((d) => d.isPast)

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate()
  const firstDayOffset = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7 // Mon=0
  const calDayNames = ["Pt", "Sa", "Ca", "Pe", "Cu", "Ct", "Pz"]
  const monthName = new Date(calendarYear, calendarMonth).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })

  async function handleAddClosedDate() {
    if (selectedDay === null) return
    setSaving(true)
    try {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
      await supabase.from("business_closed_dates").insert({
        business_id: businessId,
        date: dateStr,
        reason: description,
        is_recurring: recurring,
      })
      await fetchClosedDates()
      setAddModalOpen(false)
      setDescription("")
      setSelectedDay(null)
      setRecurring(false)
      toast.success("Kapali gun basariyla eklendi.")
    } catch (err) {
      toast.error("Hata olustu.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const { data, error } = await supabase.from("business_closed_dates").delete().eq("id", id)
    if (!error) {
      setClosedDates((prev) => prev.filter((d) => d.id !== id))
      toast.success("Kayit silindi.")
    }
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/40">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Özel Kapalı Günler</h2>
          <p className="text-[11px] font-black text-primary uppercase tracking-widest">İşletme genelinde geçerlidir</p>
        </div>
        <RxButton variant="primary" onClick={() => setAddModalOpen(true)} className="rounded-2xl px-8 font-black uppercase tracking-widest text-[11px] h-12 shadow-lg shadow-primary/20">
          <Plus className="size-4 mr-2" />
          Kapalı Gün Ekle
        </RxButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.15em]">Yaklaşanlar</h3>
            <RxBadge variant="purple" className="text-[10px] px-3">{upcomingClosed.length} GÜN</RxBadge>
          </div>

          <div className="flex flex-col gap-4">
            {upcomingClosed.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
                <div className="size-16 rounded-[24px] bg-white flex items-center justify-center text-gray-200">
                  <Check className="size-8" />
                </div>
                <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">Planlı kapalı gün bulunmuyor</p>
              </div>
            )}
            {upcomingClosed.map((item) => (
              <div key={item.id} className="group relative overflow-hidden flex items-center gap-6 p-6 bg-white rounded-[32px] border-2 border-gray-50 hover:border-primary transition-all duration-300">
                <div className="flex flex-col items-center justify-center size-14 rounded-2xl bg-rose-50 text-rose-500 shrink-0">
                  <CalendarOff className="size-6" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-lg font-black text-gray-900 tracking-tight">{item.formattedDate}</p>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{item.reason || "Belirtilmedi"}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-lg">
                    {item.daysLeft} GÜN KALDI
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="size-8 rounded-lg bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[14px] font-black text-gray-400 uppercase tracking-[0.15em]">Geçmiş Kayıtlar</h3>
          </div>

          <div className="flex flex-col gap-4">
            {pastClosed.length === 0 && (
              <div className="px-6 py-10 text-center text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/30 rounded-[32px] border border-gray-100">
                Geçmiş kayıt bulunmuyor
              </div>
            )}
            {pastClosed.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-5 bg-gray-50/30 rounded-3xl border border-gray-100/50 opacity-60">
                <div className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <CalendarOff className="size-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-gray-600">{item.formattedDate}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.reason}</p>
                </div>
                <RxBadge variant="gray" className="text-[9px]">GEÇTİ</RxBadge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <RxModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Kapalı Gün Tanımla"
        className="max-w-md"
      >
        <div className="flex flex-col gap-6 p-2">
          {/* Custom Date Picker */}
          <div className="bg-gray-50 rounded-[32px] p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1) } else setCalendarMonth((m) => m - 1) }} className="size-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{monthName}</span>
              <button type="button" onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1) } else setCalendarMonth((m) => m + 1) }} className="size-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calDayNames.map((d) => (
                <div key={d} className="flex h-8 items-center justify-center text-[10px] font-black text-gray-400 uppercase">{d}</div>
              ))}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-8" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const isSelected = selectedDay === day
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "h-9 w-full rounded-xl flex items-center justify-center text-xs font-black transition-all",
                      isSelected
                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110 relative z-10"
                        : "hover:bg-white text-gray-600 hover:shadow-sm"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-4">
            <RxInput
              label="KAPANIŞ NEDENİ"
              placeholder="Örn: Yıllık İzin, Tadilat vb."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="font-black"
            />

            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="space-y-0.5">
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">HER YIL TEKRARLA</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Aynı tarihte her yıl kapansın</p>
              </div>
              <button
                type="button"
                onClick={() => setRecurring(!recurring)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-all duration-300",
                  recurring ? "bg-primary" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 size-4 rounded-full bg-white shadow-md transition-all duration-300",
                  recurring ? "left-6" : "left-1"
                )} />
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <RxButton variant="ghost" className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[11px]" onClick={() => setAddModalOpen(false)}>Vazgeç</RxButton>
            <RxButton variant="primary" className="flex-[2] rounded-2xl h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20" onClick={handleAddClosedDate} loading={saving}>
              {!saving && <Check className="size-4 mr-2" />}
              KAYDET
            </RxButton>
          </div>
        </div>
      </RxModal>
    </div>
  )
}

// ─── Main Content ───────────────────────────────────────────────────────────────

export function CalendarShifts() {
  const [activeTab, setActiveTab] = useState<"calendar" | "shifts" | "closed">("calendar")
  const { user } = useCurrentUser()
  const [staffData, setStaffData] = useState<StaffCalendarData[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
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

  const fetchCalendarData = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]

      // Staff
      const { data: staffRows } = await supabase
        .from("staff_business")
        .select("id, user:users(name)")
        .eq("business_id", businessId)
        .eq("is_active", true)

      // Today's appointments
      const { data: aptsData } = await supabase
        .from("appointments")
        .select("id, staff_business_id, start_time, end_time, status, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name))")
        .eq("business_id", businessId)
        .eq("appointment_date", today)

      // Break schedules for all staff
      const { data: breakData } = await supabase
        .from("break_schedules")
        .select("staff_business_id, day_of_week, start_time, end_time")

      const currentDay = new Date().getDay()

      const mapped: StaffCalendarData[] = (staffRows || []).map((s) => {
        const usr = Array.isArray(s.user) ? s.user[0] : s.user
        const staffApts = (aptsData || [])
          .filter((a) => a.staff_business_id === s.id)
          .map((a) => {
            const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
            const aptSvcs = Array.isArray(a.services) ? a.services : []
            const firstSvc = aptSvcs[0]?.service
            const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
            const startParts = String(a.start_time).split(":")
            const endParts = String(a.end_time).split(":")
            return {
              id: a.id,
              start: `${startParts[0]?.padStart(2, "0")}:${startParts[1]?.padStart(2, "0")}`,
              end: `${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
              customer: cust?.name || "?",
              service: svcObj?.name || "?",
              status: a.status as any,
            }
          })

        // Add break blocks
        const staffBreaks = (breakData || [])
          .filter((b) => b.staff_business_id === s.id && b.day_of_week === currentDay)
          .map((b) => ({
            start: b.start_time,
            end: b.end_time,
            customer: "",
            service: "Mola",
            isBreak: true,
          }))

        return {
          id: s.id,
          name: usr?.name || "?",
          appointmentCount: staffApts.length,
          appointments: [...staffApts, ...staffBreaks].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)),
        }
      })

      setStaffData(mapped)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  const tabs = [
    { key: "calendar" as const, label: "Komuta Merkezi", icon: Sparkles },
    { key: "shifts" as const, label: "Vardiya Sablonlari", icon: Clock },
    { key: "closed" as const, label: "Kapali Gunler", icon: CalendarOff },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Header with Title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
          Takvim & <span className="text-primary">Planlama</span>
        </h1>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Operasyonel Kontrol Paneli</p>
      </div>

      {/* Modern Tab Switcher - Apple Style */}
      <div className="flex p-1 w-fit bg-gray-100/80 backdrop-blur-md rounded-2xl border border-gray-200/50">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                isActive ? "text-primary" : "text-gray-400 hover:text-gray-600"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabCalendar"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <tab.icon className={cn("size-3.5 relative z-10", isActive ? "text-primary" : "text-gray-400")} />
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content with Animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="min-h-[600px]"
        >
          {activeTab === "calendar" && businessId && (
            <div className="animate-in fade-in duration-700">
              <CommandCenterCalendar businessId={businessId} />
            </div>
          )}
          {activeTab === "shifts" && businessId && <ShiftTemplatesTab staffData={staffData} businessId={businessId} />}
          {activeTab === "closed" && businessId && <ClosedDaysTab businessId={businessId} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
