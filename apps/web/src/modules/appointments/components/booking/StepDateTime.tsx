import { useState } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, ChevronLeft, ChevronRight, CalendarDays, Loader2, Clock, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { RxSkeleton } from "@/src/modules/core/components/rx-skeleton"
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

  const staff = selectedStaff === "ANY" 
    ? { name: "Uygun Uzman" } 
    : staffList.find((s) => s.id === selectedStaff)

  const selectedSvcs = services.filter((s) => selectedServices.includes(s.id))
  const serviceNames = selectedSvcs.map((s) => s.name).join(", ")
  const totalDuration = selectedSvcs.reduce((acc, s) => acc + s.duration, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(viewYear, viewMonth, 1)
  const lastDay = new Date(viewYear, viewMonth + 1, 0)
  const startDay = (firstDay.getDay() + 6) % 7

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
    ? `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    : "—"

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Tarih & Saat</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Sizin için en uygun zamanı belirleyin
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-full w-fit max-w-full"
      >
        <Sparkles className="size-3.5 shrink-0" />
        <span className="line-clamp-1">{staff?.name} · {serviceNames} · ~{totalDuration} dk</span>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Calendar Card */}
        <div className="w-full lg:w-[360px] bg-card rounded-[2rem] border-2 border-border p-6 shadow-xl shadow-black/5 shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">
              {MONTHS_TR[viewMonth]} {viewYear}
            </h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all cursor-pointer">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all cursor-pointer">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {DAYS_TR.map((d) => (
              <div key={d} className="text-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            <AnimatePresence mode="popLayout">
              {calendarDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />
                const past = isPast(day)
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, today)
                const disabled = past

                return (
                  <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={day.toISOString()}
                    disabled={disabled}
                    onClick={() => !disabled && onSelectDate(day)}
                    className={cn(
                      "relative flex items-center justify-center h-10 rounded-xl text-sm transition-all cursor-pointer font-bold",
                      disabled ? "opacity-20 cursor-not-allowed" :
                      isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-primary/5 scale-105" :
                      "text-foreground hover:bg-muted hover:text-primary active:scale-95"
                    )}
                  >
                    {day.getDate()}
                    {isToday && !isSelected && (
                      <div className="absolute top-1 right-1 size-1 bg-primary rounded-full" />
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Seçilen Gün</p>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <CalendarDays className="size-4 text-primary" />
                {selectedDateLabel}
              </h3>
            </div>
            {fetchStatus === "loading" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <Loader2 className="size-3 animate-spin text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Güncelleniyor</span>
              </div>
            )}
          </div>

          <div className="relative">
            {fetchStatus === "loading" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(12)].map((_, i) => (
                  <RxSkeleton key={i} className="h-12 rounded-2xl" />
                ))}
              </div>
            ) : timeSlots.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 px-8 bg-muted/20 border-2 border-dashed border-border rounded-[2rem] text-center"
              >
                <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Clock className="size-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm font-bold text-muted-foreground">Bu tarih için uygun randevu saati bulunamadı.</p>
                <p className="text-[11px] font-medium text-muted-foreground/60 mt-1 uppercase tracking-wider">Lütfen başka bir gün seçin</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                <AnimatePresence mode="popLayout">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot.time
                    const isBooked = slot.status === "booked"
                    const isBreak = slot.status === "break"
                    const disabled = isBooked || isBreak

                    return (
                      <motion.button
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={slot.time}
                        disabled={disabled}
                        onClick={() => !disabled && onSelectTime(slot.time)}
                        className={cn(
                          "relative group flex items-center justify-center h-12 rounded-2xl text-sm font-black transition-all cursor-pointer border-2",
                          disabled ? "bg-muted/30 border-transparent opacity-40 cursor-not-allowed line-through text-muted-foreground" :
                          isSelected ? "bg-card border-primary text-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5" :
                          "bg-card border-border text-foreground hover:border-primary/20 hover:text-primary"
                        )}
                      >
                        {isSelected && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 shadow-lg">
                            <Check className="size-2 text-primary-foreground stroke-[4]" />
                          </motion.div>
                        )}
                        {isBreak ? "MOLA" : slot.time}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacing for mobile fixed bottom bar */}
      <div className="h-16 lg:hidden" />
    </div>
  )
}
