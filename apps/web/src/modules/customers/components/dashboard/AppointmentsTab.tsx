import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, ChevronLeft, ChevronRight, Sparkles, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppointmentCard } from "./AppointmentCard"
import { Appointment } from "./types"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { useRouter } from "next/navigation"

export function AppointmentsTab({
  allAppointments,
  onCancel,
  onRebook,
  onViewDetails,
  onReview
}: {
  allAppointments: Appointment[]
  onCancel: (id: string, businessId: string, fullDate: Date) => void
  onRebook: (businessId: string, services: string) => void
  onViewDetails: (id: string) => void,
  onReview?: (apt: Appointment) => void
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const filters: {
    id: "all" | "upcoming" | "completed" | "cancelled"
    label: string
  }[] = [
      { id: "all", label: "Tümü" },
      { id: "upcoming", label: "Yaklaşan" },
      { id: "completed", label: "Tamamlanan" },
      { id: "cancelled", label: "İptal" },
    ]

  const filtered = allAppointments.filter((a) => {
    if (filter === "all") return true
    if (filter === "upcoming")
      return a.status === "Onaylandı" || a.status === "Bekliyor"
    if (filter === "completed") return a.status === "Tamamlandı"
    if (filter === "cancelled") return a.status === "İptal" || a.status === "Gelmedi"
    return true
  })

  return (
    <div className="flex flex-col gap-10 pb-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Randevularım</h2>
            <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest animate-pulse">
                Sistem Aktif
            </div>
        </div>
        <div className="flex items-center gap-2">
             <div className="size-1.5 rounded-full bg-emerald-500" />
             <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                Toplam {allAppointments.length} elite rezervasyon bulundu.
            </p>
        </div>
      </div>

      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl w-fit self-start border border-gray-200/50">
        <div className="flex gap-1 relative">
          {filters.map((f) => {
            const isActive = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id)
                  setCurrentPage(1)
                }}
                className={cn(
                  "relative z-10 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 cursor-pointer",
                  isActive
                    ? "text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="filter-active"
                    className="absolute inset-0 bg-white rounded-xl shadow-md -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group relative flex flex-col items-center justify-center rounded-[32px] sm:rounded-[40px] border-2 border-dashed border-gray-100 bg-white/40 backdrop-blur-xl px-6 py-16 sm:py-24 text-center overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="mb-6 sm:mb-8 relative">
                <div className="size-24 sm:size-28 flex items-center justify-center rounded-[28px] sm:rounded-[32px] bg-white shadow-2xl shadow-gray-200/50 relative z-10 border border-gray-50">
                    <Inbox className="size-10 sm:size-12 text-primary/20 group-hover:text-primary group-hover:scale-110 transition-all duration-700" />
                </div>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                    className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10"
                />
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                Henüz Biletin Yok
              </h3>
              <p className="mt-3 text-[10px] sm:text-xs font-bold text-gray-400 max-w-[280px] sm:max-w-[320px] uppercase tracking-widest leading-relaxed">
                Bu kategoride kayıtlı bir randevun bulunmuyor. Keşfet bölümünden hemen bir randevu alabilirsin!
              </p>

              <RxButton
                variant="primary"
                className="mt-8 sm:mt-10 rounded-2xl bg-primary shadow-xl shadow-primary/20 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] h-12 sm:h-14 px-8 sm:px-10 hover:scale-105 active:scale-95 transition-all text-white"
                onClick={() => {
                   const discoverTab = document.querySelector('[data-tab-id="dashboard"]') as HTMLButtonElement;
                   if (discoverTab) discoverTab.click();
                   else router.push('/musteri-panel');
                }}
              >
                HEMEN KEŞFET
              </RxButton>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onCancel={onCancel}
                  onRebook={onRebook}
                  onViewDetails={onViewDetails}
                  onReview={onReview}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {filtered.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-6 pt-6">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors disabled:opacity-20 cursor-pointer"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            GERİ
          </button>

          <div className="flex gap-3">
            {[...Array(Math.ceil(filtered.length / itemsPerPage))].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-500",
                  currentPage === i + 1 ? "bg-primary w-8 shadow-lg shadow-primary/30" : "bg-gray-200"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= filtered.length}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors disabled:opacity-20 cursor-pointer"
          >
            İLERİ
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  )
}
