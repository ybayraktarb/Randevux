import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { type ElementType } from "react"

export function StatCard({ 
  label, icon: Icon, value, trendText, trendValue, trendPositive, actionLabel, onAction, color = "primary" 
}: {
  label: string; 
  icon: ElementType; 
  value: string; 
  trendText?: string; 
  trendValue?: string; 
  trendPositive?: boolean; 
  actionLabel?: string; 
  onAction?: () => void; 
  color?: string
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative overflow-hidden group rounded-[32px] bg-white/70 backdrop-blur-2xl border border-white/60 shadow-2xl shadow-gray-200/50 hover:shadow-primary/10 transition-all duration-500"
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-8 -top-8 size-32 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
        color === "primary" ? "bg-primary" : "bg-emerald-500"
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex size-12 items-center justify-center rounded-2xl shadow-inner-white",
            color === "primary" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-600"
          )}>
            <Icon className="size-6" />
          </div>
          {trendValue && (
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
              trendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600 border border-rose-100"
            )}>
              {trendPositive ? "↑" : "↓"} {trendValue}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-bold text-gray-400">{trendText || "Genel Durum"}</span>
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
