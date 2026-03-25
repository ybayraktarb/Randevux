import { PackageOpen, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import type { ServiceMetric } from "./types"

export function ServiceUtilizationWidget({ services }: { services: ServiceMetric[] }) {
  const maxCount = Math.max(...services.map(s => s.count), 1)

  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Hizmet Analitiği</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Popüler Hizmetler ve Gelir</p>
        </div>
      </div>
      <div className="p-8 space-y-6">
        {services.length === 0 && (
          <p className="text-sm font-bold text-gray-400 text-center py-10">Veri yok</p>
        )}
        {services.map((svc, index) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            key={svc.name} 
            className="space-y-2"
          >
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <PackageOpen className="size-4 text-primary" />
                </div>
                <span className="text-sm font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">{svc.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900">₺{svc.revenue.toLocaleString("tr-TR")}</span>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">GELİR</p>
                </div>
                <div className="size-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-gray-900">{svc.count}</span>
                  <p className="text-[8px] font-black text-gray-400 uppercase">ADET</p>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(svc.count / maxCount) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </div>
      {services.length > 0 && (
        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <TrendingUp className="size-5 text-indigo-500 shrink-0" />
            <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
              <strong>{services[0].name}</strong> bu ay en çok tercih edilen hizmetiniz oldu. Bu alana özel kampanyalar değerlendirilebilir.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
