import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ticket, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppointmentCard } from "./AppointmentCard"
import { Appointment } from "./types"

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
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Randevularım</h2>
        <p className="text-sm font-bold text-muted-foreground">
          Toplam {allAppointments.length} randevunuz bulunuyor.
        </p>
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
              className="flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-gray-100 bg-gray-50/30 px-6 py-24 text-center"
            >
              <div className="mb-6 flex size-24 items-center justify-center rounded-[32px] bg-white shadow-xl shadow-gray-200/50">
                <Ticket className="size-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900">
                Görüntülenecek randevu yok
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground max-w-[280px]">
                Bu kategoride henüz bir randevunuz bulunmuyor. Keşfet bölümünden yeni yerler bulabilirsiniz!
              </p>
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

          <div className="flex gap-2">
            {[...Array(Math.ceil(filtered.length / itemsPerPage))].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-300",
                  currentPage === i + 1 ? "bg-primary w-6" : "bg-gray-200"
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
