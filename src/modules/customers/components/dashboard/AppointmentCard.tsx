import { motion } from "framer-motion"
import { Calendar, Clock, Star, ArrowRight, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Appointment } from "./types"

export function AppointmentCard({
  appointment,
  compact = false,
  onCancel,
  onRebook,
  onViewDetails,
  onReview,
}: {
  appointment: Appointment
  compact?: boolean
  onCancel?: (id: string, businessId: string, fullDate: Date) => void
  onRebook?: (businessId: string, services: string) => void
  onViewDetails?: (id: string) => void
  onReview?: (apt: Appointment) => void
}) {
  const statusMap: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" | "gray"; color: string }
  > = {
    "Onaylandı": { label: "Onaylandı", variant: "success", color: "bg-emerald-500" },
    "Bekliyor": { label: "Bekliyor", variant: "warning", color: "bg-amber-500" },
    "Tamamlandı": { label: "Tamamlandı", variant: "success", color: "bg-blue-500" },
    "İptal": { label: "İptal Edildi", variant: "gray", color: "bg-gray-400" },
    "Gelmedi": { label: "Gelinmedi", variant: "danger", color: "bg-red-500" },
  }
  const s = statusMap[appointment.status] || { label: appointment.status, variant: "gray", color: "bg-gray-400" }

  const CardWrapper = motion.div

  if (compact) {
    return (
      <CardWrapper
        whileHover={{ x: 4 }}
        className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-4 shadow-sm cursor-pointer hover:border-primary/30 transition-all"
        onClick={() => onViewDetails?.(appointment.id)}
      >
        <div className="relative">
          <RxAvatar name={appointment.businessName} size="sm" />
          <div className={cn("absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background", s.color)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-black text-foreground">
            {appointment.businessName}
          </span>
          <span className="truncate text-xs font-bold text-muted-foreground">
            {appointment.date} • {appointment.time}
          </span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </CardWrapper>
    )
  }

  return (
    <CardWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/10"
      onClick={() => onViewDetails?.(appointment.id)}
    >
      <div className="flex p-6 gap-6 relative">
        {/* Main Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <RxAvatar name={appointment.businessName} size="lg" className="rounded-2xl border-2 border-gray-50" />
                <div className={cn("absolute -bottom-1 -right-1 size-4 rounded-full border-4 border-white", s.color)} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{appointment.businessName}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                  {appointment.services}
                </p>
              </div>
            </div>
            <div className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
              appointment.status === "Onaylandı" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                appointment.status === "Bekliyor" ? "bg-amber-50 text-amber-600 border-amber-100" :
                  appointment.status === "Tamamlandı" ? "bg-blue-50 text-blue-600 border-blue-100" :
                    "bg-gray-50 text-gray-500 border-gray-100"
            )}>
              {s.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/50 rounded-[20px] p-4 border border-gray-100/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tarih</p>
              <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                <Calendar className="size-4 text-primary" />
                {appointment.date}
              </div>
            </div>
            <div className="bg-gray-50/50 rounded-[20px] p-4 border border-gray-100/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saat</p>
              <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                <Clock className="size-4 text-primary" />
                {appointment.time}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <RxAvatar name={appointment.staffName} size="sm" />
              <span className="text-xs font-bold text-gray-500">{appointment.staffName}</span>
            </div>
            {appointment.price && (
              <span className="text-lg font-black text-primary">{appointment.price}</span>
            )}
          </div>
        </div>

        {/* Ticket Perforation Aesthetic */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-4 mr-[-6px] pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="size-3 rounded-full bg-white border border-gray-100 shadow-inner" />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gray-50/30 border-t border-dashed border-gray-100 p-4 px-6 flex items-center justify-between">
        <div className="flex gap-2">
          {appointment.status === "Tamamlandı" && onReview && (
            <RxButton
              variant="secondary"
              size="sm"
              className="rounded-full bg-white hover:bg-primary/5 border-gray-100 text-primary font-black text-[11px] gap-2 px-4 h-9"
              onClick={(e) => { e.stopPropagation(); onReview(appointment); }}
            >
              <Star className="size-3.5 fill-current" />
              DEĞERLENDİR
            </RxButton>
          )}
          {(appointment.status === "Tamamlandı" || appointment.status === "İptal") && onRebook && (
            <RxButton
              variant="secondary"
              size="sm"
              className="rounded-full bg-white hover:bg-primary/5 border-gray-100 text-gray-700 font-black text-[11px] h-9 px-4"
              onClick={(e) => { e.stopPropagation(); onRebook(appointment.businessId, appointment.services); }}
            >
              TEKRAR AL
            </RxButton>
          )}
        </div>

        <div className="flex gap-3">
          {(appointment.status === "Onaylandı" || appointment.status === "Bekliyor") && onCancel && (
            <button
              className="text-[11px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest px-2"
              onClick={(e) => { e.stopPropagation(); onCancel(appointment.id, appointment.businessId, appointment.fullDate); }}
            >
              İptal Et
            </button>
          )}
          <RxButton
            variant="ghost"
            size="sm"
            className="rounded-full text-primary font-black text-[11px] uppercase tracking-widest h-9 px-4 gap-2"
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(appointment.id); }}
          >
            Detaylar
            <ArrowRight className="size-3.5" />
          </RxButton>
        </div>
      </div>
    </CardWrapper>
  )
}
