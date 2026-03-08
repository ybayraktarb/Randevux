"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { format, addDays, isSameDay, startOfToday } from "date-fns"
import { tr } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DateCarouselProps {
  selectedDate: Date
  onDateSelect: (date: Date) => void
  daysCount?: number
  availableDays?: number[] // Array of 0-6 (getDay values)
}

export function DateCarousel({
  selectedDate,
  onDateSelect,
  daysCount = 30,
  availableDays = [1, 2, 3, 4, 5, 6], // Default all but Sunday if not provided
}: DateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dates, setDates] = useState<Date[]>([])
  const today = startOfToday()

  useEffect(() => {
    const nextDates = Array.from({ length: daysCount }, (_, i) => addDays(today, i))
    setDates(nextDates)
  }, [daysCount])

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="relative group">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-1"
      >
        {dates.map((date) => {
          const isSelected = isSameDay(date, selectedDate)
          const isTodayDate = isSameDay(date, today)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              className={cn(
                "flex flex-col items-center justify-center min-w-[70px] h-[90px] rounded-2xl border transition-all duration-200 shrink-0",
                isSelected
                  ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-105"
                  : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium uppercase tracking-wider mb-1",
                  isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                )}
              >
                {format(date, "EEE", { locale: tr })}
              </span>
              <span
                className={cn(
                  "text-xl font-bold",
                  isSelected ? "text-primary-foreground" : "text-foreground"
                )}
              >
                {format(date, "d")}
              </span>
              {isTodayDate && !isSelected && (
                <div className="size-1 rounded-full bg-primary mt-1" />
              )}
              {!isTodayDate && !isSelected && availableDays.includes(date.getDay()) && (
                <div className="size-1 rounded-full bg-emerald-500 mt-1 opacity-40" />
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 size-8 rounded-full bg-background border border-border flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 size-8 rounded-full bg-background border border-border flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}
