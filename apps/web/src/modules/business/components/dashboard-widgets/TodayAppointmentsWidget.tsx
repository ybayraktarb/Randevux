import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Calendar, Clock, PackageOpen, MoreHorizontal } from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import type { TodayApt } from "./types"

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Tamamlandı":
      return <RxBadge variant="success">{"Tamamlandı"}</RxBadge>
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
    case "Onaylandı":
      return <RxBadge variant="success">{"Onaylandı"}</RxBadge>
    case "Bekliyor":
      return <RxBadge variant="warning">{"Bekliyor"}</RxBadge>
    default:
      return null
  }
}

export function TodayAppointmentsWidget({ appointments }: { appointments: TodayApt[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Bugünkü Akış</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operasyonel Takvim</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100">
          <Clock className="size-3.5 text-gray-400" />
          <span className="text-xs font-black text-gray-900">{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col p-8 gap-0 relative">
        {/* Central Line */}
        <div className="absolute left-[59px] top-8 bottom-8 w-px bg-gray-100" />

        {appointments.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-20 rounded-[32px] bg-gray-50 flex items-center justify-center">
              <PackageOpen className="size-10 text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-400">Henüz bir randevu bulunmuyor</p>
          </div>
        )}

        {appointments.map((apt, index) => {
          const isBreak = apt.status === "break"
          const isOngoing = apt.status === "ongoing"
          const isDone = apt.status === "Tamamlandı"

          return (
            <motion.div 
              key={`${apt.id}-${index}`} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.5, ease: "easeOut" }}
              className="flex gap-8 group relative pb-8 last:pb-0"
            >
              {/* Time Label */}
              <div className="w-12 pt-1 text-right">
                <span className={cn(
                  "text-[13px] font-black tracking-tighter",
                  isOngoing ? "text-primary" : "text-gray-400"
                )}>
                  {apt.time}
                </span>
              </div>

              {/* Node */}
              <div className="relative z-10">
                <div className={cn(
                  "size-3 rounded-full border-2 transition-all duration-500 mt-[6px]",
                  isOngoing
                    ? "bg-primary border-primary ring-4 ring-primary/20 scale-125"
                    : isDone
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-200 group-hover:border-primary"
                )} />
              </div>

              {/* Card Container */}
              <div className="flex-1">
                {isBreak ? (
                  <div className="p-4 rounded-2xl bg-gray-50/50 border border-dashed border-gray-200">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Öğle Molası</span>
                  </div>
                ) : (
                  <div className={cn(
                    "p-5 rounded-3xl border-2 transition-all duration-500",
                    isOngoing
                      ? "bg-white border-primary shadow-xl shadow-primary/5 -translate-y-1"
                      : "bg-white border-gray-50 hover:border-gray-200 hover:shadow-lg"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <RxAvatar name={apt.customer} size="sm" className="size-10 rounded-xl" />
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-gray-900">{apt.customer}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400">{apt.service}</span>
                            <span className="size-1 rounded-full bg-gray-200" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-widest">{apt.staff}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <StatusBadge status={apt.status} />
                        <button type="button" className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
