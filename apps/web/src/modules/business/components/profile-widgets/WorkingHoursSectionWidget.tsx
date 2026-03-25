import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"
import type { WorkingDay } from "./types"

export function WorkingHoursSectionWidget({ hours }: { hours: WorkingDay[] }) {
  if (hours.length === 0) return null

  return (
    <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-xl font-black text-gray-900 tracking-tight">Çalışma Saatleri</h2>

      <div className="mt-6 rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 p-6">
        <div className="flex flex-col">
          {hours.map((day, i) => (
            <div
              key={day.day}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl transition-colors",
                day.isToday && "bg-primary/5",
                i < hours.length - 1 && !day.isToday && "border-b border-gray-50",
                day.isToday && "border border-primary/10 shadow-sm shadow-primary/5 my-1"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "size-8 rounded-lg flex items-center justify-center",
                  day.isToday ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-gray-50 text-gray-400"
                )}>
                  <Clock className="size-4" />
                </div>
                <span
                  className={cn(
                    "text-sm",
                    day.isToday
                      ? "font-black text-primary tracking-tight"
                      : "font-bold text-gray-600 tracking-tight"
                  )}
                >
                  {day.day}
                  {day.isToday && (
                    <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary/70">
                      (Bugün)
                    </span>
                  )}
                </span>
              </div>
              <span
                className={cn(
                  "text-[12px] uppercase tracking-widest font-black",
                  day.isClosed
                    ? "text-rose-500 bg-rose-50 px-3 py-1 rounded-full"
                    : day.isToday
                      ? "text-primary"
                      : "text-gray-900"
                )}
              >
                {day.hours}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
