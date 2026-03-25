import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, Star, ArrowRight, ChevronRight, MapPin, CalendarPlus, AlertTriangle, User, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
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
    const [showCancelModal, setShowCancelModal] = useState(false)

  const statusMap: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" | "gray"; color: string; bg: string; text: string }
  > = {
    "Onaylandı": { label: "Onaylandı", variant: "success", color: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600" },
    "Bekliyor": { label: "Bekliyor", variant: "warning", color: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600" },
    "Tamamlandı": { label: "Tamamlandı", variant: "success", color: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600" },
    "İptal": { label: "İptal Edildi", variant: "gray", color: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-500" },
    "Gelmedi": { label: "Gelinmedi", variant: "danger", color: "bg-red-500", bg: "bg-red-50", text: "text-red-600" },
  }
  const s = statusMap[appointment.status] || { label: appointment.status, variant: "gray", color: "bg-gray-400", bg: "bg-gray-50", text: "text-gray-500" }

  const CardWrapper = motion.div

  if (compact) {
    return (
      <CardWrapper
        whileHover={{ x: 4 }}
        className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white/60 backdrop-blur-xl p-4 shadow-sm cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
        onClick={() => onViewDetails?.(appointment.id)}
      >
        <div className="relative shrink-0">
          <RxAvatar name={appointment.businessName} size="sm" />
          <div className={cn("absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-white shadow-sm", s.color)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
            {appointment.businessName}
          </span>
          <span className="truncate text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {appointment.date} • {appointment.time}
          </span>
        </div>
        <ChevronRight className="size-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </CardWrapper>
    )
  }

  return (
    <>
      <CardWrapper
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/20 cursor-pointer transition-all hover:shadow-primary/10 hover:border-primary/20"
        onClick={() => onViewDetails?.(appointment.id)}
      >
        <div className="p-5 sm:p-6 flex flex-col gap-5">
            {/* Top Row: Logo & Business Info & Status */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gray-50 p-1 ring-1 ring-black/5 group-hover:ring-primary/20 transition-all shadow-sm shrink-0">
                        <RxAvatar name={appointment.businessName} size="md" className="rounded-xl" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-black text-gray-900 tracking-tight truncate max-w-[150px] sm:max-w-none">
                                {appointment.businessName}
                            </h3>
                            <div className={cn(
                                "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                s.bg, s.text, `border-${s.variant}-500/10`
                            )}>
                                {s.label}
                            </div>
                        </div>
                        <p className="text-[10px] font-black text-primary/60 uppercase tracking-[0.15em] mt-1 truncate">
                            {appointment.services}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pt-1">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-1">Tutar</span>
                    <span className="text-xl font-black text-gray-900 tracking-tighter">{appointment.price || "--- TL"}</span>
                </div>
            </div>

            {/* Middle Row: Unified Info (Date, Time, Expert) */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-[18px] bg-gray-50/50 border border-gray-100 group-hover:bg-primary/5 transition-colors">
                    <Calendar className="size-4 text-primary" />
                    <span className="text-xs font-black text-gray-700 truncate">{appointment.date}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-[18px] bg-gray-50/50 border border-gray-100 group-hover:bg-primary/5 transition-colors">
                    <Clock className="size-4 text-primary" />
                    <span className="text-xs font-black text-gray-700 truncate">{appointment.time}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-[18px] bg-gray-50/50 border border-gray-100 group-hover:bg-primary/5 transition-colors">
                    <User className="size-4 text-primary" />
                    <span className="text-xs font-black text-gray-700 truncate">{appointment.staffName || "Belirtilmedi"}</span>
                </div>
            </div>

            {/* Action Row: Minified buttons */}
            <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    {(appointment.status === "Onaylandı" || appointment.status === "Bekliyor") && (
                        <>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="size-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all"
                                onClick={(e) => { e.stopPropagation(); /* Map logic */ }}
                                title="Yol Tarifi"
                            >
                                <MapPin className="size-4" />
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="size-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all"
                                onClick={(e) => { e.stopPropagation(); /* Calendar logic */ }}
                                title="Takvime Ekle"
                            >
                                <CalendarPlus className="size-4" />
                            </motion.button>
                            <div className="w-[1px] h-4 bg-gray-100 mx-1" />
                        </>
                    )}

                    {appointment.status === "Tamamlandı" && onReview && (
                        <RxButton
                            variant="secondary"
                            size="sm"
                            className="bg-primary/5 text-primary hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest gap-2 rounded-xl h-9 px-4"
                            onClick={(e) => { e.stopPropagation(); onReview(appointment); }}
                        >
                            <Star className="size-3.5" />
                            Puanla
                        </RxButton>
                    )}

                    {(appointment.status === "Tamamlandı" || appointment.status === "İptal") && onRebook && (
                        <RxButton
                            variant="secondary"
                            size="sm"
                            className="bg-gray-100 text-gray-600 hover:bg-primary hover:text-white font-black text-[10px] uppercase tracking-widest rounded-xl h-9 px-4"
                            onClick={(e) => { e.stopPropagation(); onRebook(appointment.businessId, appointment.services); }}
                        >
                            Tekrar Al
                        </RxButton>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {(appointment.status === "Onaylandı" || appointment.status === "Bekliyor") && onCancel && (
                        <button
                            className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors mr-2 px-2 py-1"
                            onClick={(e) => { e.stopPropagation(); setShowCancelModal(true); }}
                        >
                            İPTAL
                        </button>
                    )}
                    <RxButton
                        variant="ghost"
                        size="sm"
                        className="h-9 px-4 rounded-full bg-primary text-white hover:bg-primary/90 font-black text-[10px] uppercase tracking-[0.1em] shadow-sm hover:shadow-lg shadow-primary/20 transition-all flex gap-2 items-center"
                        onClick={(e) => { e.stopPropagation(); onViewDetails?.(appointment.id); }}
                    >
                        <span>Detaylar</span>
                        <ChevronRight className="size-3.5" />
                    </RxButton>
                </div>
            </div>
        </div>

        {/* Subtle Ticket Aesthetic Decoration */}
        <div className="absolute top-1/2 -left-2 size-4 rounded-full bg-gray-50 border border-gray-100 z-10" />
        <div className="absolute top-1/2 -right-2 size-4 rounded-full bg-gray-50 border border-gray-100 z-10" />
      </CardWrapper>

      <RxModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="size-6 animate-pulse" />
            <span className="font-black uppercase tracking-widest text-sm">Rezervasyon İptali</span>
          </div>
        }
        footer={
          <div className="flex gap-3 w-full p-4 bg-gray-50/50 border-t border-dashed border-gray-100 rounded-b-[32px]">
            <RxButton variant="ghost" className="flex-1 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-400 hover:text-gray-900 h-12" onClick={() => setShowCancelModal(false)}>
              VAZGEÇ
            </RxButton>
            <RxButton
              className="flex-1 rounded-2xl bg-red-500 shadow-lg shadow-red-500/10 font-black text-[11px] uppercase tracking-widest h-12 hover:bg-red-600 transition-all text-white"
              onClick={() => {
                if (onCancel) {
                  onCancel(
                    appointment.id,
                    appointment.businessId,
                    appointment.fullDate instanceof Date ? appointment.fullDate : new Date(appointment.fullDate)
                  )
                }
                setShowCancelModal(false)
              }}
            >
              İPTAL ET
            </RxButton>
          </div>
        }
      >
        <div className="flex flex-col gap-5 py-4">
            <div className="p-5 rounded-3xl bg-red-50/50 border border-dashed border-red-100 space-y-3">
                <p className="text-sm font-bold text-gray-700 leading-relaxed">
                    <strong className="text-gray-900">{appointment.businessName}</strong> randevunuzu iptal etmek istediğinize emin misiniz?
                </p>
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-red-50">
                    <Calendar className="size-4 text-red-500" />
                    <span className="text-xs font-black text-gray-900">{appointment.date} — {appointment.time}</span>
                </div>
            </div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">
                BU İŞLEM GERİ ALINAMAZ
            </p>
        </div>
      </RxModal>
    </>
  )
}
