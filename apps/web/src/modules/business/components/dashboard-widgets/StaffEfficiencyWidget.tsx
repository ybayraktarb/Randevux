import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { motion } from "framer-motion"
import type { EfficiencyMetric } from "./types"

export function StaffEfficiencyWidget({ efficiency }: { efficiency: EfficiencyMetric[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Personel Verimliliği</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Performans Karnesi</p>
        </div>
      </div>
      <div className="p-8 space-y-8">
        {efficiency.length === 0 && (
          <p className="text-sm font-bold text-gray-400 text-center py-10">Veri yok</p>
        )}
        {efficiency.map((staff, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            key={staff.name} 
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RxAvatar name={staff.name} size="sm" className="size-10 rounded-xl" />
                <span className="text-sm font-black text-gray-900 tracking-tight">{staff.name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-primary">%{staff.completionRate}</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TAMAMLAMA</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/80 border border-white/50 shadow-sm">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOPLAM MESAİ</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900">{staff.totalHours}</span>
                  <span className="text-[11px] font-bold text-gray-400">Saat</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-sm">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">DURUM</p>
                <span className="text-[11px] font-black text-emerald-600 uppercase">Yüksek Verim</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
