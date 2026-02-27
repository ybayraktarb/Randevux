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
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxModal } from "./rx-modal"
import { RxInput } from "./rx-input"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Appointment {
  start: string
  end: string
  customer: string
  service: string
  status?: "confirmed" | "pending" | "completed"
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
}: {
  apt: Appointment
  position: { top: number; left: number }
  onClose: () => void
}) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [onClose])

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 w-56 rounded-xl border border-border bg-card p-4 shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">{apt.customer}</p>
        <p className="text-[13px] text-muted-foreground">{apt.service}</p>
        <p className="text-[13px] text-muted-foreground">{apt.start} - {apt.end}</p>
        {apt.status && (
          <RxBadge variant={apt.status === "completed" ? "success" : apt.status === "pending" ? "warning" : "success"}>
            {apt.status === "completed" ? "Tamamlandi" : apt.status === "pending" ? "Bekliyor" : "Onaylandi"}
          </RxBadge>
        )}
        <div className="mt-1 flex items-center gap-2">
          <RxButton size="sm" variant="primary">Detay Gor</RxButton>
          <RxButton size="sm" variant="danger">Iptal Et</RxButton>
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

function WeekViewCalendar({ staffFilter, staffData }: { staffFilter: string; staffData: StaffCalendarData[] }) {
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

              return (
                <button
                  key={i}
                  type="button"
                  className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-2 border-card bg-primary px-2 py-1 text-left transition-opacity hover:opacity-90"
                  style={style}
                  onClick={(e) => handleBlockClick(apt, e)}
                >
                  <p className="truncate text-[12px] font-semibold leading-tight text-primary-foreground">{apt.customer}</p>
                  <p className="truncate text-[11px] leading-tight text-primary-foreground/80">{apt.service}</p>
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

function DayViewCalendar({ staffFilter, staffData }: { staffFilter: string; staffData: StaffCalendarData[] }) {
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

function CalendarViewTab({ staffData, loading }: { staffData: StaffCalendarData[]; loading: boolean }) {
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
      {viewMode === "week" && <WeekViewCalendar staffFilter={staffFilter} staffData={staffData} />}
      {viewMode === "day" && <DayViewCalendar staffFilter={staffFilter} staffData={staffData} />}
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

  const staffTabs = [...staffData.map((s) => s.name), "Tum Isletme"]
  const isAllBusiness = selectedStaff === staffData.length
  const currentStaffId = selectedStaff < staffData.length ? staffData[selectedStaff]?.id : null

  // Fetch schedule data
  useEffect(() => {
    async function fetchSchedule() {
      if (isAllBusiness) {
        // Fetch business_hours
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
        // Fetch work_schedule_templates for staff
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
        // Save business_hours
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
        // Save work_schedule_templates
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
        // Delete old breaks and insert new
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
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-[22px] font-semibold text-foreground">Vardiya Sablonlari</h2>
          <span className="rounded-full bg-primary-light px-3 py-1 text-[12px] font-medium text-primary">Her hafta otomatik uygulanir</span>
        </div>
        <RxButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? " Kaydediliyor..." : " Sablon Kaydet"}
        </RxButton>
      </div>

      {/* Staff Selector Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {staffTabs.map((tab, i) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSelectedStaff(i)}
            className={cn(
              "relative px-4 py-2.5 text-sm font-medium transition-colors",
              selectedStaff === i ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {i === staffData.length && <span className="mr-1">+</span>}
            {tab}
            {selectedStaff === i && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Warning for All Business */}
      {isAllBusiness && (
        <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-l-badge-yellow-text bg-badge-yellow-bg px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-badge-yellow-text" />
          <p className="text-[13px] text-badge-yellow-text">Bu ayarlar tum personelin calisma saatlerini gecersiz kilar.</p>
        </div>
      )}

      {/* Weekly Grid */}
      <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {shifts.map((shift, index) => {
          const today = new Date().getDay()
          const isToday = shift.dayIndex === today
          return (
            <div
              key={shift.day}
              className={cn(
                "flex flex-col gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:flex-row sm:items-center",
                !shift.working && "bg-muted/50"
              )}
            >
              {/* Day Name */}
              <div className="w-[120px] shrink-0">
                <span className={cn("text-sm", isToday ? "font-bold text-foreground" : "font-medium text-foreground")}>
                  {shift.day}
                </span>
              </div>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => toggleWorking(index)}
                className="flex items-center gap-2"
              >
                <div className={cn("relative h-6 w-11 rounded-full transition-colors", shift.working ? "bg-primary" : "bg-border")}>
                  <div className={cn("absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform", shift.working ? "translate-x-[22px]" : "translate-x-0.5")} />
                </div>
                <span className={cn("text-sm", shift.working ? "text-foreground" : "text-muted-foreground")}>
                  {shift.working ? "Calisiyor" : "Kapali"}
                </span>
              </button>

              {/* Time Pickers + Breaks */}
              {shift.working ? (
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <input
                    type="time"
                    value={shift.start}
                    onChange={(e) => updateTime(index, "start", e.target.value)}
                    className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-muted-foreground">-</span>
                  <input
                    type="time"
                    value={shift.end}
                    onChange={(e) => updateTime(index, "end", e.target.value)}
                    className="h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  {!isAllBusiness && (
                    <button
                      type="button"
                      onClick={() => { setBreakDayIndex(index); setBreakModalOpen(true) }}
                      className="text-[13px] font-medium text-primary hover:text-primary-hover"
                    >
                      Mola Ekle +
                    </button>
                  )}

                  {/* Break Chips */}
                  {shift.breaks.map((brk, bi) => (
                    <span key={bi} className="inline-flex items-center gap-1.5 rounded-md bg-primary-light px-2.5 py-1 text-[12px] font-medium text-primary">
                      {brk}
                      <button type="button" onClick={() => removeBreak(index, bi)} className="text-primary hover:text-accent">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex-1">
                  <span className="text-sm text-muted-foreground">Kapali</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-l-primary bg-primary-light px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-[13px] text-muted-foreground">
          {"Bu sablon her haftaya otomatik uygulanir. Ozel gunler icin 'Kapali Gunler' sekmesini kullanin."}
        </p>
      </div>

      {/* Break Modal */}
      <RxModal
        open={breakModalOpen}
        onClose={() => setBreakModalOpen(false)}
        title="Mola Ekle"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setBreakModalOpen(false)}>Vazgec</RxButton>
            <RxButton variant="primary" onClick={addBreak}>Ekle</RxButton>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            {breakDayIndex !== null ? shifts[breakDayIndex]?.day : ""} gunu icin mola saati belirleyin.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Baslangic</label>
              <input
                type="time"
                value={newBreakStart}
                onChange={(e) => setNewBreakStart(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="mt-6 text-muted-foreground">-</span>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Bitis</label>
              <input
                type="time"
                value={newBreakEnd}
                onChange={(e) => setNewBreakEnd(e.target.value)}
                className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
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
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await supabase.from("business_closed_dates").delete().eq("id", id)
    setClosedDates((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Ozel Kapali Gunler</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Isletme genelinde gecerlidir</p>
        </div>
        <RxButton variant="primary" onClick={() => setAddModalOpen(true)}>
          <Plus className="size-4" /> Kapali Gun Ekle
        </RxButton>
      </div>

      {/* Upcoming */}
      <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-[15px] font-semibold text-foreground">Yaklasan Kapali Gunler</h3>
        </div>
        <div className="flex flex-col">
          {upcomingClosed.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Yaklasan kapali gun yok</div>
          )}
          {upcomingClosed.map((item) => (
            <div key={item.id} className="flex items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-badge-red-bg">
                <CalendarOff className="size-[18px] text-accent" />
              </div>
              <div className="flex flex-1 flex-col">
                <span className="text-[15px] font-semibold text-foreground">{item.formattedDate}</span>
                <span className="text-[13px] text-muted-foreground">{item.reason}</span>
              </div>
              <span className="hidden rounded-md bg-badge-red-bg px-2.5 py-0.5 text-[12px] font-medium text-accent sm:inline-flex">
                {item.daysLeft} gun kaldi
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-accent transition-colors hover:bg-badge-red-bg">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Past */}
      {pastClosed.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-[15px] font-semibold text-muted-foreground">Gecmis Kapali Gunler</h3>
          </div>
          <div className="flex flex-col">
            {pastClosed.map((item) => (
              <div key={item.id} className="flex items-center gap-4 border-b border-border px-5 py-4 opacity-60 last:border-b-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <CalendarOff className="size-[18px] text-muted-foreground" />
                </div>
                <div className="flex flex-1 flex-col">
                  <span className="text-[15px] font-semibold text-foreground">{item.formattedDate}</span>
                  <span className="text-[13px] text-muted-foreground">{item.reason}</span>
                </div>
                <span className="hidden rounded-md bg-muted px-2.5 py-0.5 text-[12px] font-medium text-muted-foreground sm:inline-flex">
                  Gecti
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Closed Day Modal */}
      <RxModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Kapali Gun Ekle"
        className="max-w-[480px]"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setAddModalOpen(false)}>Vazgec</RxButton>
            <RxButton variant="primary" onClick={handleAddClosedDate} disabled={saving || selectedDay === null}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? " Kaydediliyor..." : "Kaydet"}
            </RxButton>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Mini Calendar */}
          <div>
            <label className="text-sm font-medium text-foreground">Tarih Secin</label>
            <div className="mt-2 rounded-lg border border-border p-3">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear((y) => y - 1) } else setCalendarMonth((m) => m - 1) }} className="rounded-md p-1 text-muted-foreground hover:bg-primary-light">
                  <ChevronLeft className="size-4" />
                </button>
                <span className="text-sm font-semibold text-foreground">{monthName}</span>
                <button type="button" onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear((y) => y + 1) } else setCalendarMonth((m) => m + 1) }} className="rounded-md p-1 text-muted-foreground hover:bg-primary-light">
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {calDayNames.map((d) => (
                  <div key={d} className="flex h-8 items-center justify-center text-[11px] font-medium text-muted-foreground">{d}</div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-8" />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                      selectedDay === day
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-foreground hover:bg-primary-light"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Bu tarihi her yil tekrarla</span>
            </div>
            <button
              type="button"
              onClick={() => setRecurring(!recurring)}
              className="flex items-center"
            >
              <div className={cn("relative h-6 w-11 rounded-full transition-colors", recurring ? "bg-primary" : "bg-border")}>
                <div className={cn("absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform", recurring ? "translate-x-[22px]" : "translate-x-0.5")} />
              </div>
            </button>
          </div>

          {/* Description */}
          <RxInput
            label="Aciklama"
            placeholder="Orn: Ulusal Bayram, Isletme Tatili..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Info */}
          <div className="flex items-start gap-3 rounded-lg border-l-[3px] border-l-primary bg-primary-light px-4 py-3">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-[13px] text-muted-foreground">
              Bu tarihte randevusu olan musteriler bilgilendirilecektir.
            </p>
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
              start: `${startParts[0]?.padStart(2, "0")}:${startParts[1]?.padStart(2, "0")}`,
              end: `${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
              customer: cust?.name || "?",
              service: svcObj?.name || "?",
              status: (a.status === "confirmed" ? "confirmed" : a.status === "completed" ? "completed" : "pending") as "confirmed" | "completed" | "pending",
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
    { key: "calendar" as const, label: "Takvim Gorunumu" },
    { key: "shifts" as const, label: "Vardiya Sablonlari" },
    { key: "closed" as const, label: "Kapali Gunler" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "relative px-5 py-3 text-sm font-medium transition-colors",
              activeTab === tab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "calendar" && <CalendarViewTab staffData={staffData} loading={loading} />}
      {activeTab === "shifts" && businessId && <ShiftTemplatesTab staffData={staffData} businessId={businessId} />}
      {activeTab === "closed" && businessId && <ClosedDaysTab businessId={businessId} />}
    </div>
  )
}
