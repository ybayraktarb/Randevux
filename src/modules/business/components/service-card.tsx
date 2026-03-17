"use client"

import { Clock, Edit3, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import type { Service } from "../types"

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
}

function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const visible = names.slice(0, max)
  const extra = names.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, i) => (
        <div key={`${name}-${i}`} className="group relative">
          <div className="rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-110 hover:z-10">
            <RxAvatar name={name} size="sm" />
          </div>
        </div>
      ))}
      {extra > 0 && (
        <div className="relative flex size-8 items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-gray-400 ring-2 ring-white">
          +{extra}
        </div>
      )}
    </div>
  )
}

export function ServiceCard({ service, onEdit, onToggleStatus }: Readonly<ServiceCardProps>) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative flex flex-col rounded-3xl border transition-all duration-300",
        service.is_active
          ? "bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
          : "bg-gray-50/50 border-gray-100 opacity-60"
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-black text-gray-900 truncate tracking-tight">{service.name}</h3>
              {service.is_active && (
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <p className="text-[12px] text-gray-500 font-medium line-clamp-2 min-h-[32px] mb-4">
              {service.description || "Bu hizmet için henüz bir açıklama girilmemiş."}
            </p>
          </div>
          <RxButton
            variant="ghost"
            size="sm"
            onClick={() => onEdit(service)}
            className="size-8 p-0 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
          >
            <Edit3 className="size-4" />
          </RxButton>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SÜRE</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="size-3 text-primary" />
              <span className="text-[13px] font-black text-gray-700">{service.base_duration_minutes}dk</span>
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">FİYAT</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[14px] font-black text-primary">₺{Number(service.base_price).toLocaleString("tr-TR")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PERSONEL</span>
            <AvatarStack names={service.staffNames || []} />
          </div>
          <button
            onClick={() => onToggleStatus(service.id, !service.is_active)}
            className={cn(
              "h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              service.is_active
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            )}
          >
            {service.is_active ? "AKTİF" : "PASİF"}
          </button>
        </div>
      </div>

      {service.buffer_time_minutes > 0 && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg shadow-amber-500/20 border-2 border-white">
          <Zap className="size-3 fill-white" />
        </div>
      )}
    </motion.div>
  )
}
