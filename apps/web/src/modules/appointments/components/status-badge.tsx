"use client"

import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@randesk/shared"

// We redefine AppointmentStatus locally to not break the type references in existing code or we export it properly.
// Best to just use it directly.

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case "Onaylandı":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100/50">
          <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">ONAYLANDI</span>
        </div>
      )
    case "Bekliyor":
    case "pending":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100/50">
          <div className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider">BEKLİYOR</span>
        </div>
      )
    case "Tamamlandı":
    case "completed":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100/50">
          <div className="size-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">TAMAMLANDI</span>
        </div>
      )
    case "İptal":
    case "cancelled":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
          <div className="size-1.5 rounded-full bg-gray-400" />
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider">İPTAL EDİLDİ</span>
        </div>
      )
    case "Gelmedi":
    case "no_show":
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 border border-rose-100/50">
          <div className="size-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider">GELMEDİ</span>
        </div>
      )
    default: return null
  }
}
