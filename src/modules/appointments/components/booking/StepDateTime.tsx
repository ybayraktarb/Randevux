import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react"
import { TimeSlot } from "@/src/modules/appointments/types"
import { Service, Staff, MONTHS_TR, DAYS_TR, DAYS_FULL_TR } from "./types"

export function StepDateTime({
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
              const isTodayDay = isSameDay(day, today)
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
                  {isTodayDay && !isChosen && (
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
