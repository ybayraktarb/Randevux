import { Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { RxButton } from "@/src/modules/core/components/rx-button"
import type { PendingItem } from "./types"

export function PendingApprovalsWidget({ items, onApprove, onReject }: {
  items: PendingItem[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Bekleyen Onaylar</h2>
          <span className="flex size-6 items-center justify-center rounded-xl bg-accent/20 text-[11px] font-black text-accent-foreground border border-accent/20">{items.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 p-8">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <div className="size-16 rounded-[24px] bg-emerald-50 flex items-center justify-center border border-emerald-100/50">
                <Check className="size-8 text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-gray-400">{"Sıranız tertemiz!"}</p>
            </motion.div>
          ) : (
            items.map((item, index) => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                key={item.id} 
                className="rounded-3xl border border-white/80 bg-white/60 backdrop-blur-xl p-5 hover:border-white shadow-xl shadow-gray-200/20 transition-all hover:shadow-2xl"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-gray-900">{item.customer}</span>
                    <div className="px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                      {item.time}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-gray-400">{item.service}</span>
                    <span className="text-[11px] font-black text-primary uppercase tracking-widest">{item.staff}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                    <RxButton size="sm" variant="primary" onClick={() => onApprove(item.id)} className="rounded-xl flex-1 font-black text-[10px] uppercase tracking-widest">
                      ONAYLA
                    </RxButton>
                    <RxButton size="sm" variant="danger" onClick={() => onReject(item.id)} className="rounded-xl flex-1 font-black text-[10px] uppercase tracking-widest">
                      REDDET
                    </RxButton>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Info Banner */}
        <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4 mt-2">
          <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
            {"Manuel onay modu aktif. Otomatik onaya geçmek için "}
            <button type="button" className="font-black underline decoration-2 underline-offset-4">Ayarlar</button>
            {"'a gidin."}
          </p>
        </div>
      </div>
    </div>
  )
}
