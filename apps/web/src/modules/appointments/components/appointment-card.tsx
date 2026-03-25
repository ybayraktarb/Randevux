"use client"

import { motion } from "framer-motion"
import { Clock, Info, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { StatusBadge } from "./status-badge"
import type { AppointmentStatus } from "@randevux/shared"

// We can define the Appointment interface here, or move it to types later.
export interface AppointmentCardProps {
  id: string
  customer: string
  phone: string
  services: { name: string }[]
  date: string
  time: string
  staff: string
  amount: number
  totalDuration: number
  status: AppointmentStatus
}

export function AppointmentCard({
  appointment,
  onUpdateStatus,
  onDetailView,
  onCheckout
}: {
  appointment: AppointmentCardProps
  onUpdateStatus: (status: AppointmentStatus) => void
  onDetailView: () => void
  onCheckout: () => void
}) {
  const isPending = appointment.status === "Bekliyor"
  const isCancelled = appointment.status === "İptal" || appointment.status === "Gelmedi"
  const isCompleted = appointment.status === "Tamamlandı"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5 }}
      className="group relative flex flex-col rounded-[32px] bg-white p-6 shadow-sm border border-gray-100/50 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:border-primary/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <RxAvatar name={appointment.customer} size="sm" className="rounded-2xl" />
            <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-white p-0.5 shadow-sm">
              <div className={cn("size-full rounded-full",
                appointment.status === "Onaylandı" ? "bg-emerald-500" :
                  appointment.status === "Bekliyor" ? "bg-amber-500" :
                    appointment.status === "Tamamlandı" ? "bg-indigo-500" : "bg-gray-400"
              )} />
            </div>
          </div>
          <div>
            <h4 className="text-[15px] font-black text-gray-900 tracking-tight leading-none truncate max-w-[120px]">{appointment.customer}</h4>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">{appointment.phone}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="mt-6 flex-1 space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {appointment.services.map((s, idx) => (
            <span key={idx} className="px-3 py-1 rounded-xl bg-gray-50 text-[10px] font-black text-gray-600 uppercase tracking-wider">
              {s.name}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 text-gray-600">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-gray-400" />
            <div>
              <p className="text-[12px] font-black tracking-tight">{appointment.time}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{appointment.date}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-black text-gray-900">₺{appointment.amount.toLocaleString("tr-TR")}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{appointment.totalDuration} dk</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-2xl border border-gray-100/50 bg-white shadow-sm">
          <RxAvatar name={appointment.staff} size="sm" className="rounded-lg" />
          <div className="flex-1">
            <p className="text-[11px] font-black text-gray-900 truncate">{appointment.staff}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">UZMAN</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 flex items-center gap-2">
        {isPending ? (
          <>
            <RxButton
              variant="primary"
              onClick={(e) => { e.stopPropagation(); onUpdateStatus("Onaylandı") }}
              className="flex-1 h-10 rounded-xl text-[10px] font-black tracking-[0.1em] uppercase"
            >
              ONAYLA
            </RxButton>
            <RxButton
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onUpdateStatus("İptal") }}
              className="h-10 px-3 rounded-xl border border-rose-100 text-rose-500 hover:bg-rose-50"
            >
              <XIcon className="size-4" />
            </RxButton>
          </>
        ) : !isCancelled && !isCompleted ? (
          <RxButton
            variant="primary"
            onClick={(e) => { e.stopPropagation(); onCheckout() }}
            className="flex-1 h-10 rounded-xl text-[10px] font-black tracking-[0.1em] uppercase bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/10"
          >
            ÖDEME AL
          </RxButton>
        ) : (
          <RxButton
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onDetailView() }}
            className="flex-1 h-10 rounded-xl text-[10px] font-black tracking-[0.1em] uppercase bg-gray-50 text-gray-500"
          >
            DETAY GÖR
          </RxButton>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDetailView() }}
          className="size-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
        >
          <Info className="size-4" />
        </button>
      </div>
    </motion.div>
  )
}
