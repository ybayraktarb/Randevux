import { Check, UserX, MoreHorizontal, AlertTriangle } from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { motion } from "framer-motion"
import type { NoShowRecord } from "./types"

export function NoShowRecordsWidget({ records }: { records: NoShowRecord[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">No-Show Kayıtları</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">İşletme Kara Listesi</p>
        </div>
        <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Tümünü Gör</button>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-gray-50/50">
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-20 rounded-[32px] bg-emerald-50 flex items-center justify-center">
              <Check className="size-10 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-400">Harika! Son zamanlarda no-show yok.</p>
          </div>
        ) : (
          records.map((record, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              key={index} 
              className="px-8 py-5 flex items-center justify-between hover:bg-white/80 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <RxAvatar name={record.customer} size="sm" className="size-12 rounded-2xl group-hover:scale-105 transition-transform shadow-sm" />
                  <div className="absolute -bottom-1 -right-1 size-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center">
                    <UserX className="size-3 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 leading-none">{record.customer}</h4>
                  <p className="text-[11px] font-bold text-gray-400 mt-1">{record.service} • {record.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PERSONEL</span>
                  <span className="text-[11px] font-black text-gray-900">{record.staff}</span>
                </div>
                <button type="button" className="size-10 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all">
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-8 bg-gray-50/30 border-t border-gray-50 mt-auto">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
          <AlertTriangle className="size-5 text-rose-500 shrink-0" />
          <p className="text-[11px] font-bold text-rose-600 leading-relaxed">
            {"Bu müşteriler randevusuna gelmedi. Bir sonraki randevularında ön ödeme talep edebilirsiniz."}
          </p>
        </div>
      </div>
    </div>
  )
}
