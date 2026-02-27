"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { cn } from "@/lib/utils"
import { RxButton } from "./rx-button"
import { RxAvatar } from "./rx-avatar"
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Shuffle,
  Scissors,
  Sparkles,
  Clock,
  MapPin,
  CalendarDays,
  Info,
  MessageSquare,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── TYPES ───

interface Service {
  id: string
  name: string
  category: string
  duration: number
  price: number
}

interface Staff {
  id: string
  name: string
  specialty: string
  online: boolean
  serviceIds: string[]
}

interface TimeSlot {
  time: string
  status: "available" | "booked" | "break"
}

interface WorkingSchedule {
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

interface BreakSchedule {
  day_of_week: number
  start_time: string
  end_time: string
}

interface ClosedDate {
  date: string
}

interface AppointmentRaw {
  start_time: string
  end_time: string
}

// ─── CONSTANTS ───
const STEP_LABELS = ["Hizmet", "Personel", "Tarih & Saat", "Ozet"]
const DAYS_TR = ["Pt", "Sl", "Cr", "Pr", "Cu", "Ct", "Pz"]
const MONTHS_TR = [
  "Ocak", "Subat", "Mart", "Nisan", "Mayis", "Haziran",
  "Temmuz", "Agustos", "Eylul", "Ekim", "Kasim", "Aralik",
]
const DAYS_FULL_TR = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]

// ─── UTILS ───
function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function isOverlap(start1: number, end1: number, start2: number, end2: number) {
  return Math.max(start1, start2) < Math.min(end1, end2)
}

function dateToYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ─── COMPONENTS ───

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-6">
      {STEP_LABELS.map((label, i) => {
        const isActive = i === current
        const isComplete = i < current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isActive || isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mt-[-18px] transition-colors duration-300",
                  isComplete ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepServices({
  services,
  selected,
  onToggle,
  onNext,
}: {
  services: Service[]
  selected: string[]
  onToggle: (id: string) => void
  onNext: () => void
}) {
  const [category, setCategory] = useState("Tumu")

  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach(s => cats.add(s.category))
    return ["Tumu", ...Array.from(cats).sort()]
  }, [services])

  const filtered =
    category === "Tumu"
      ? services
      : services.filter((s) => s.category === category)

  const total = services.filter((s) => selected.includes(s.id)).reduce(
    (acc, s) => ({ price: acc.price + s.price, duration: acc.duration + s.duration }),
    { price: 0, duration: 0 }
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hangi hizmetleri almak istersiniz?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Birden fazla hizmet secebilirsiniz.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-muted"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((service) => {
          const isSelected = selected.includes(service.id)
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer text-left",
                "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                isSelected
                  ? "bg-primary-light border-primary"
                  : "bg-card border-border hover:bg-muted/30"
              )}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-semibold text-foreground">
                  {service.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md w-fit">
                  <Clock className="size-3" />
                  {service.duration} dk
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-semibold text-primary">
                  {service.price} TL
                </span>
                <div
                  className={cn(
                    "size-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border bg-card"
                  )}
                >
                  {isSelected && <Check className="size-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-6 px-6 py-4 mt-2">
        {selected.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center">
            Devam etmek icin en az bir hizmet secin
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selected.length} hizmet · ~{total.duration} dk · {total.price} TL
            </span>
            <RxButton size="sm" className="gap-1.5" onClick={onNext}>
              Ileri <ArrowRight className="size-3.5" />
            </RxButton>
          </div>
        )}
      </div>
    </div>
  )
}

function StepStaff({
  services,
  staffList,
  selectedServices,
  selectedStaff,
  onSelectStaff,
}: {
  services: Service[]
  staffList: Staff[]
  selectedServices: string[]
  selectedStaff: string | null
  onSelectStaff: (id: string | null) => void
}) {
  const serviceNames = services.filter((s) => selectedServices.includes(s.id))
    .map((s) => s.name)
    .join(", ")

  const totalPrice = services.filter((s) => selectedServices.includes(s.id)).reduce(
    (acc, s) => acc + s.price,
    0
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hangi uzmanla calismak istersiniz?
        </h2>
      </div>

      <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm px-3 py-2 rounded-lg w-fit">
        <Scissors className="size-3.5 shrink-0" />
        <span className="font-medium">Secilen hizmetler:</span> <span className="line-clamp-1">{serviceNames}</span>
      </div>

      <div className="flex flex-col gap-3">
        {staffList.map((staff) => {
          const canDoAll = selectedServices.every((id) => staff.serviceIds.includes(id))
          const isSelected = selectedStaff === staff.id

          return (
            <button
              key={staff.id}
              disabled={!canDoAll}
              onClick={() => canDoAll && onSelectStaff(staff.id)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                !canDoAll
                  ? "bg-muted border-border opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "bg-primary-light border-primary cursor-pointer"
                    : "bg-card border-border hover:bg-muted/30 cursor-pointer"
              )}
            >
              <RxAvatar name={staff.name} size="lg" online={canDoAll && staff.online} />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-foreground">
                  {staff.name}
                </p>
                <p className="text-[13px] text-muted-foreground line-clamp-1">{staff.specialty}</p>
                {canDoAll ? (
                  <p className="text-[13px] text-primary mt-0.5">
                    Bu hizmetler icin: {totalPrice} TL
                  </p>
                ) : (
                  <span className="inline-flex items-center gap-1 mt-1 bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-md">
                    Uygun Degil
                  </span>
                )}
              </div>
              {canDoAll && (
                <div
                  className={cn(
                    "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  )}
                >
                  {isSelected && (
                    <div className="size-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              )}
            </button>
          )
        })}

        <button
          onClick={() => onSelectStaff("ANY")}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border-dashed border-2 transition-all cursor-pointer text-left mt-2",
            selectedStaff === "ANY"
              ? "bg-primary-light border-primary"
              : "bg-card border-border hover:bg-muted/30"
          )}
        >
          <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Shuffle className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-foreground">
              Fark etmez
            </p>
            <p className="text-[13px] text-muted-foreground">
              Uygun olan biriyle devam et
            </p>
          </div>
          <div
            className={cn(
              "size-5 rounded-full border flex items-center justify-center shrink-0 transition-all",
              selectedStaff === "ANY"
                ? "border-primary bg-primary"
                : "border-border bg-card"
            )}
          >
            {selectedStaff === "ANY" && (
              <div className="size-2 rounded-full bg-primary-foreground" />
            )}
          </div>
        </button>
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-6 px-6 py-4 mt-2">
        {selectedStaff === null ? (
          <p className="text-[13px] text-muted-foreground text-center">
            Secim yapiniz
          </p>
        ) : (
          <div className="flex items-center justify-end">
            <RxButton size="sm" className="gap-1.5" onClick={() => onSelectStaff(selectedStaff)}>
              Ileri <ArrowRight className="size-3.5" />
            </RxButton>
          </div>
        )}
      </div>
    </div>
  )
}

function StepDateTime({
  fetchStatus,
  services,
  staffList,
  selectedServices,
  selectedStaff,
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
  timeSlots
}: {
  fetchStatus: string
  services: Service[]
  staffList: Staff[]
  selectedServices: string[]
  selectedStaff: string | null
  selectedDate: Date
  selectedTime: string | null
  onSelectDate: (d: Date) => void
  onSelectTime: (t: string) => void
  timeSlots: TimeSlot[]
}) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth())
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear())

  const staffName =
    selectedStaff === "ANY"
      ? "Uygun personel"
      : staffList.find((s) => s.id === selectedStaff)?.name || "Personel"

  const serviceNames = services.filter((s) => selectedServices.includes(s.id))
    .map((s) => s.name)
    .join(", ")

  const totalDuration = services.filter((s) => selectedServices.includes(s.id)).reduce(
    (acc, s) => acc + s.duration,
    0
  )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calendar generation
  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startDay = (firstDay.getDay() + 6) % 7 // Monday = 0

  const calendarDays: (Date | null)[] = []
  for (let i = 0; i < startDay; i++) calendarDays.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    calendarDays.push(new Date(viewYear, viewMonth, d))
  }

  const isSameDay = (a: Date | null, b: Date | null) =>
    a && b && a.toDateString() === b.toDateString()

  const isPast = (d: Date) => d < today

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const selectedDateLabel = selectedDate
    ? `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${DAYS_FULL_TR[selectedDate.getDay()]}`
    : "—"

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Tarih ve saat secin
        </h2>
      </div>

      <div className="inline-flex items-center gap-2 bg-primary-light text-primary text-sm px-3 py-2 rounded-lg flex-wrap">
        <Sparkles className="size-3.5 shrink-0" />
        <span>{staffName} · {serviceNames} · ~{totalDuration} dk</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Calendar */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:w-[320px] shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <ChevronLeft className="size-4 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS_TR[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer">
              <ChevronRight className="size-4 text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS_TR.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const past = isPast(day)
              const isToday = isSameDay(day, today)
              const isChosen = isSameDay(day, selectedDate)
              const disabled = past

              return (
                <button
                  key={day.toISOString()}
                  disabled={disabled}
                  onClick={() => !disabled && onSelectDate(day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-9 rounded-lg text-sm transition-all cursor-pointer",
                    disabled && "cursor-not-allowed opacity-50",
                    !disabled && !isChosen && "text-foreground hover:bg-primary-light",
                    isChosen && "bg-primary text-primary-foreground font-semibold"
                  )}
                >
                  {day.getDate()}
                  {isToday && !isChosen && (
                    <span className="absolute bottom-0.5 size-1 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time slots */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            Musait Saatler — {selectedDateLabel}
            {fetchStatus === "loading" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </p>

          {fetchStatus !== "loading" && timeSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 bg-muted/20 border border-dashed rounded-xl">
              <CalendarDays className="size-8 mb-2 opacity-50" />
              <p className="text-sm text-center">Bu tarihte uygun saat bulunamadı veya isletme kapali.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((slot) => {
                const isChosen = selectedTime === slot.time
                const isBooked = slot.status === "booked"
                const isBreak = slot.status === "break"
                const disabled = isBooked || isBreak || fetchStatus === "loading"

                return (
                  <button
                    key={slot.time}
                    disabled={disabled}
                    onClick={() => !disabled && onSelectTime(slot.time)}
                    className={cn(
                      "py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                      disabled && "cursor-not-allowed",
                      isBreak && "bg-muted text-muted-foreground",
                      isBooked && "bg-primary-light text-border line-through",
                      !disabled && !isChosen && "bg-card border border-border text-foreground hover:bg-primary-light",
                      isChosen && "bg-primary text-primary-foreground font-semibold"
                    )}
                  >
                    {isBreak ? "Mola / Dolu" : slot.time}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StepSummary({
  businessName,
  services,
  staffList,
  selectedServices,
  selectedStaff,
  selectedDate,
  selectedTime,
  note,
  onNoteChange,
}: {
  businessName: string
  services: Service[]
  staffList: Staff[]
  selectedServices: string[]
  selectedStaff: string | null
  selectedDate: Date
  selectedTime: string | null
  note: string
  onNoteChange: (v: string) => void
}) {
  const selectedSvcs = services.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedSvcs.reduce((acc, s) => acc + s.price, 0)
  const totalDuration = selectedSvcs.reduce((acc, s) => acc + s.duration, 0)
  const staff =
    selectedStaff === "ANY"
      ? { name: "Uygun personel atanacaktir", specialty: "" }
      : staffList.find((s) => s.id === selectedStaff) || {
        name: "—",
        specialty: "",
      }

  const endTime = useMemo(() => {
    if (!selectedTime) return ""
    const startMins = parseTime(selectedTime)
    return formatTime(startMins + totalDuration)
  }, [selectedTime, totalDuration])

  const dateLabel = `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}, ${DAYS_FULL_TR[selectedDate.getDay()]}`

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-foreground">Randevu Ozeti</h2>

      <div className="bg-card rounded-xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] divide-y divide-border">
        {/* Business */}
        <div className="flex items-center gap-3 p-4">
          <RxAvatar name={businessName} size="md" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {businessName}
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Hizmetler
          </p>
          {selectedSvcs.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {s.name} · {s.duration} dk
              </span>
              <span className="text-sm text-foreground">{s.price} TL</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
            <span className="text-sm font-bold text-foreground">Toplam</span>
            <span className="text-sm font-bold text-primary">
              {totalPrice} TL
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tahmini Sure: ~{totalDuration} dk
          </p>
        </div>

        {/* Staff */}
        <div className="flex items-center gap-3 p-4">
          <RxAvatar name={staff.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {staff.name}
            </p>
            {staff.specialty && <p className="text-xs text-muted-foreground">{staff.specialty}</p>}
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 p-4">
          <div className="size-8 rounded-lg bg-primary-light flex items-center justify-center">
            <CalendarDays className="size-4 text-primary" />
          </div>
          <p className="text-sm text-foreground">
            {dateLabel} · {selectedTime} - {endTime}
          </p>
        </div>

        {/* Note */}
        <div className="p-4">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value.slice(0, 300))}
            placeholder="Uzmana notunuz (istege bagli)"
            className="w-full min-h-[80px] rounded-lg border px-3 py-2 text-sm resize-y"
          />
        </div>
      </div>
    </div>
  )
}

function SuccessState({ router }: { router: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="size-20 rounded-full bg-primary flex items-center justify-center mb-6 animate-[scaleIn_0.4s_ease-out]">
        <CheckCircle2 className="size-10 text-primary-foreground" />
      </div>
      <h2 className="text-[22px] font-semibold text-foreground mb-2">
        Randevunuz Olusturuldu!
      </h2>
      <p className="text-[13px] text-muted-foreground mb-8">
        Randevu durumunuzu randevularınızdan takip edebilirsiniz.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <RxButton className="w-full" onClick={() => router.push("/randevularim")}>Randevularimi Goruntule</RxButton>
        <RxButton variant="ghost" className="w-full" onClick={() => router.push("/musteri-panel")}>
          Ana Sayfaya Don
        </RxButton>
      </div>
    </div>
  )
}


function BookingFlowInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const businessId = searchParams.get("business_id")
  const initialServicesStr = searchParams.get("services")

  const { user } = useCurrentUser()
  const supabase = createClient()

  // State
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [businessName, setBusinessName] = useState("")
  const [services, setServices] = useState<Service[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])

  // Booking details
  const [previewStep, setPreviewStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [note, setNote] = useState("")

  // Time slot data
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "done">("idle")
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  // 1. Fetch initial business schema
  useEffect(() => {
    if (!businessId) {
      toast?.error ? toast.error("İşletme ID bulunamadı.") : alert("Hata: İşletme ID bulunamadı")
      router.push("/musteri-panel")
      return
    }

    async function loadData() {
      if (!businessId) return
      try {
        const [bRes, sRes, stRes, staffSvcRes] = await Promise.all([
          supabase.from("businesses").select("name").eq("id", businessId).single(),
          supabase.from("services").select("*").eq("business_id", businessId).eq("is_active", true),
          supabase.from("staff_business").select("*, user:users(name, title)").eq("business_id", businessId).eq("is_active", true),
          supabase.from("staff_services").select("*").eq("is_active", true)
        ])

        if (bRes.data) setBusinessName(bRes.data.name)

        const fetchedServices: Service[] = (sRes.data || []).map(s => ({
          id: s.id,
          name: s.name,
          category: s.category || "Genel",
          duration: s.base_duration_minutes,
          price: Number(s.base_price)
        }))
        setServices(fetchedServices)

        const staffSvcs = staffSvcRes.data || []

        const fetchedStaff: Staff[] = (stRes.data || []).map(st => {
          const u = Array.isArray(st.user) ? st.user[0] : st.user
          // find service ids for this staff
          const validIds = staffSvcs.filter(ss => ss.staff_business_id === st.id).map(ss => ss.service_id)
          return {
            id: st.id,
            name: u?.name || "Personel",
            specialty: u?.title || "",
            online: true,
            serviceIds: validIds
          }
        })
        setStaffList(fetchedStaff)

        if (initialServicesStr) {
          const arr = initialServicesStr.split(",").filter((id) => fetchedServices.some((s) => s.id === id))
          if (arr.length > 0) setSelectedServices(arr)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoadingInitial(false)
      }
    }
    loadData()
  }, [businessId])

  // 2. Fetch Slots whenever date or staff changes
  useEffect(() => {
    if (previewStep === 2 && businessId && selectedStaff) {
      fetchAvailableSlots()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewStep, selectedDate, selectedStaff, selectedServices])

  const fetchAvailableSlots = async () => {
    setFetchStatus("loading")
    setSelectedTime(null)

    // We will analyze the chosen date
    const ymd = dateToYMD(selectedDate)
    const dayOfWeek = selectedDate.getDay() // 0-6 JS (Sunday=0)

    // Total needed duration
    const totalDuration = selectedServices.reduce((sum, sId) => {
      const s = services.find(x => x.id === sId)
      return sum + (s?.duration || 0)
    }, 0)

    try {
      // Are we closed globally?
      const { data: closed } = await supabase.from("business_closed_dates").select("id").eq("business_id", businessId).eq("date", ymd).maybeSingle()
      if (closed) {
        setTimeSlots([])
        setFetchStatus("done")
        return
      }

      // We need to resolve which staff to check. If ANY, we fetch all capable staff and aggregate slots.
      let checkStaffIds: string[] = []
      if (selectedStaff === "ANY") {
        checkStaffIds = staffList.filter(st => selectedServices.every(sId => st.serviceIds.includes(sId))).map(s => s.id)
      } else {
        checkStaffIds = [selectedStaff!]
      }

      if (checkStaffIds.length === 0) {
        setTimeSlots([])
        setFetchStatus("done")
        return
      }

      // Fetch work templates, breaks, and appointments for these staff members
      const [worksRes, breaksRes, aptsRes] = await Promise.all([
        supabase.from("work_schedule_templates").select("*").in("staff_business_id", checkStaffIds).eq("day_of_week", dayOfWeek),
        supabase.from("break_schedules").select("*").in("staff_business_id", checkStaffIds).eq("day_of_week", dayOfWeek),
        supabase.from("appointments").select("staff_business_id, start_time, end_time").in("staff_business_id", checkStaffIds).eq("appointment_date", ymd).not("status", "eq", "cancelled").not("status", "eq", "no_show")
      ])

      const works = worksRes.data || []
      const breaks = breaksRes.data || []
      const apts = aptsRes.data || []
      const nowMs = new Date().getTime()

      // Calculate availability:
      // We will generate 30-min block slots starting from earliest work time.
      let earliestWork = 24 * 60
      let latestWork = 0
      works.forEach(w => {
        if (!w.is_working) return
        earliestWork = Math.min(earliestWork, parseTime(w.start_time))
        latestWork = Math.max(latestWork, parseTime(w.end_time))
      })

      if (earliestWork >= latestWork) {
        setTimeSlots([])
        setFetchStatus("done")
        return
      }

      // To simplify ANY, a time slot is available if AT LEAST ONE staff member is completely free for duration.
      // We evaluate slot by slot.
      const slots: TimeSlot[] = []
      for (let time = earliestWork; time + totalDuration <= latestWork; time += 30) {

        let isSlotAvailableForAtLeastOne = false

        // Skip past times if today
        const slotDateStr = `${ymd}T${formatTime(time)}:00`
        if (new Date(slotDateStr).getTime() < nowMs) {
          continue // slot in past
        }

        for (const sId of checkStaffIds) {
          const staffWork = works.find(w => w.staff_business_id === sId)
          if (!staffWork || !staffWork.is_working) continue

          const wStart = parseTime(staffWork.start_time)
          const wEnd = parseTime(staffWork.end_time)

          if (time < wStart || time + totalDuration > wEnd) continue

          const sBreaks = breaks.filter(b => b.staff_business_id === sId)
          const sApts = apts.filter(a => a.staff_business_id === sId)

          // Check collision with breaks
          const hitBreak = sBreaks.some(b => isOverlap(time, time + totalDuration, parseTime(b.start_time), parseTime(b.end_time)))
          if (hitBreak) continue

          // Check collision with appointments
          const hitApt = sApts.some(a => isOverlap(time, time + totalDuration, parseTime(a.start_time), parseTime(a.end_time)))
          if (hitApt) continue

          // Staff is available!
          isSlotAvailableForAtLeastOne = true
          break
        }

        slots.push({
          time: formatTime(time),
          status: isSlotAvailableForAtLeastOne ? "available" : "booked"
        })
      }

      setTimeSlots(slots)
    } catch (e) {
      console.error(e)
    } finally {
      setFetchStatus("done")
    }
  }

  const goNext = () => {
    if (previewStep === 0 && selectedServices.length === 0) return toast.error("Hizmet seciniz")
    if (previewStep === 1 && selectedStaff === null) return toast.error("Personel seciniz")
    if (previewStep === 2 && selectedTime === null) return toast.error("Saat seciniz")
    if (previewStep < 3) setPreviewStep(previewStep + 1)
  }

  const goBack = () => {
    if (previewStep > 0) setPreviewStep(previewStep - 1)
  }

  const submitAppointment = async () => {
    if (!user || !businessId || !selectedTime) return
    setSubmitting(true)

    try {
      const ymd = dateToYMD(selectedDate)

      const totalDuration = selectedServices.reduce((sum, sId) => {
        const s = services.find(x => x.id === sId)
        return sum + (s?.duration || 0)
      }, 0)

      const totalPrice = selectedServices.reduce((sum, sId) => {
        const s = services.find(x => x.id === sId)
        return sum + (s?.price || 0)
      }, 0)

      let assignedStaffId = selectedStaff

      // If ANY staff was selected, quickly find someone who is free
      if (selectedStaff === "ANY") {
        const possibleStaff = staffList.filter(st => selectedServices.every(sId => st.serviceIds.includes(sId))).map(s => s.id)

        const [worksRes, breaksRes, aptsRes] = await Promise.all([
          supabase.from("work_schedule_templates").select("*").in("staff_business_id", possibleStaff).eq("day_of_week", selectedDate.getDay()),
          supabase.from("break_schedules").select("*").in("staff_business_id", possibleStaff).eq("day_of_week", selectedDate.getDay()),
          supabase.from("appointments").select("staff_business_id, start_time, end_time").in("staff_business_id", possibleStaff).eq("appointment_date", ymd).not("status", "eq", "cancelled").not("status", "eq", "no_show")
        ])

        const tStart = parseTime(selectedTime)
        const tEnd = tStart + totalDuration

        let found = null
        for (const sId of possibleStaff) {
          const w = worksRes.data?.find(x => x.staff_business_id === sId)
          if (!w || !w.is_working) continue
          if (tStart < parseTime(w.start_time) || tEnd > parseTime(w.end_time)) continue

          const hitB = breaksRes.data?.some(b => b.staff_business_id === sId && isOverlap(tStart, tEnd, parseTime(b.start_time), parseTime(b.end_time)))
          if (hitB) continue

          const hitA = aptsRes.data?.some(a => a.staff_business_id === sId && isOverlap(tStart, tEnd, parseTime(a.start_time), parseTime(a.end_time)))
          if (hitA) continue

          found = sId
          break
        }

        if (!found) {
          toast?.error ? toast.error("Maalesef bu saat secimi iptal oldu. Baska bir saat secin.") : alert("Hata")
          setSubmitting(false)
          setPreviewStep(2) // go back to time picker
          return
        }
        assignedStaffId = found
      }

      // final conflict check (in case another user booked the same time right now)
      const { data: conflicts } = await supabase
        .from("appointments")
        .select("id")
        .eq("staff_business_id", assignedStaffId)
        .eq("appointment_date", ymd)
        .not("status", "eq", "cancelled")
        .not("status", "eq", "no_show")

      // Check overlap
      const tStart = parseTime(selectedTime)
      const tEnd = tStart + totalDuration

      // I couldn't write the interval logic natively in supabase select immediately, doing client side filter:
      if (conflicts && conflicts.length > 0) {
        // fetch their times
        const { data: cTimes } = await supabase.from("appointments").select("start_time, end_time").in("id", conflicts.map(c => c.id))
        const hasOverlap = cTimes?.some(c => isOverlap(tStart, tEnd, parseTime(c.start_time), parseTime(c.end_time)))
        if (hasOverlap) {
          toast?.error ? toast.error("Bu saat baska biri tarafindan alindi. Lutfen saat degistirin.") : null
          setSubmitting(false)
          setPreviewStep(2) // go back
          fetchAvailableSlots() // refresh
          return
        }
      }

      // Calculate string end time
      const hEnd = Math.floor(tEnd / 60)
      const mEnd = tEnd % 60
      const endTimeStr = `${String(hEnd).padStart(2, "0")}:${String(mEnd).padStart(2, "0")}:00`
      const startTimeStr = `${selectedTime}:00`

      // 1. Insert Appointment
      const { data: aptData, error: aptError } = await supabase.from("appointments").insert({
        business_id: businessId,
        customer_user_id: user.id,
        staff_business_id: assignedStaffId,
        appointment_date: ymd,
        start_time: startTimeStr,
        end_time: endTimeStr,
        status: "pending",
        total_price: totalPrice,
        total_duration_minutes: totalDuration,
        customer_note: note
      }).select("id").single()

      if (aptError || !aptData) {
        throw aptError || new Error("Appointment creation failed")
      }

      // 2. Insert Appointment Services
      const aptServices = selectedServices.map(sId => {
        const svc = services.find(x => x.id === sId)
        return {
          appointment_id: aptData.id,
          service_id: sId,
          price_snapshot: svc?.price || 0,
          duration_snapshot: svc?.duration || 0,
          buffer_snapshot: 0
        }
      })
      await supabase.from("appointment_services").insert(aptServices)

      // Notify staff and business owner
      try {
        const { createNotification } = await import("@/lib/notifications")
        const dateLabel = `${ymd}`
        const timeLabel = selectedTime
        // Get staff user_id
        const { data: sbData } = await supabase.from("staff_business").select("user_id, business_id").eq("id", assignedStaffId).maybeSingle()
        if (sbData?.user_id) {
          await createNotification(supabase, { userId: sbData.user_id, type: "appointment_created", title: "Yeni randevu talebi", body: `${dateLabel} tarihinde saat ${timeLabel} icin yeni bir randevu`, relatedId: aptData.id, relatedType: "appointment" })
        }
        // Get business owner user_id
        if (sbData?.business_id) {
          const { data: ownerData } = await supabase.from("business_owners").select("user_id").eq("business_id", sbData.business_id).maybeSingle()
          if (ownerData?.user_id && ownerData.user_id !== sbData.user_id) {
            await createNotification(supabase, { userId: ownerData.user_id, type: "appointment_created", title: "Yeni randevu talebi", body: `${dateLabel} tarihinde saat ${timeLabel} icin yeni bir randevu`, relatedId: aptData.id, relatedType: "appointment" })
          }
        }
      } catch (e) { console.error("[Notification]", e) }

      // Audit
      try { const { logAudit } = await import("@/lib/audit"); await logAudit(supabase, { userId: user.id, action: "created", targetTable: "appointments", targetId: aptData.id }) } catch { }

      setSuccess(true)
      setPreviewStep(4)
    } catch (e: any) {
      console.error(e)
      toast.error("Randevu olusturulamadi: " + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInitial) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* Step Indicator (hidden on success) */}
        {!success && <StepIndicator current={previewStep} />}

        {/* Steps content */}
        <div className="bg-card rounded-xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6">
            {previewStep === 0 && (
              <StepServices
                services={services}
                selected={selectedServices}
                onToggle={toggleService}
                onNext={goNext}
              />
            )}
            {previewStep === 1 && (
              <StepStaff
                services={services}
                staffList={staffList}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                onSelectStaff={(id) => { setSelectedStaff(id); goNext() }}
              />
            )}
            {previewStep === 2 && (
              <StepDateTime
                fetchStatus={fetchStatus}
                services={services}
                staffList={staffList}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
                timeSlots={timeSlots}
              />
            )}
            {previewStep === 3 && (
              <StepSummary
                businessName={businessName}
                services={services}
                staffList={staffList}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                note={note}
                onNoteChange={setNote}
              />
            )}
            {previewStep === 4 && <SuccessState router={router} />}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      {!success && previewStep > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-[640px] items-center justify-between">
            <RxButton variant="secondary" onClick={goBack}>
              Geri
            </RxButton>

            {previewStep === 2 && (
              <RxButton onClick={goNext} disabled={!selectedTime}>Ileri</RxButton>
            )}

            {previewStep === 3 && (
              <RxButton onClick={submitAppointment} disabled={submitting}>
                {submitting ? <Loader2 className="size-4 animate-spin" /> : "Randevuyu Onayla"}
              </RxButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BookingFlow() {
  return (
    <Suspense fallback={null}>
      <BookingFlowInner />
    </Suspense>
  )
}
