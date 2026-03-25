import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { STEP_LABELS } from "./types"
import { motion } from "framer-motion"

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-10">
      <div className="relative flex items-center justify-between">
        {/* Progress Track */}
        <div className="absolute top-5 left-0 right-0 h-[2px] bg-muted z-0 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${(current / (STEP_LABELS.length - 1)) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
          />
        </div>

        {STEP_LABELS.map((label, i) => {
          const isActive = i === current
          const isComplete = i < current
          
          return (
            <div key={label} className="relative z-10 flex flex-col items-center gap-3">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive || isComplete ? "var(--color-primary)" : "var(--color-card)",
                  borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                  color: isActive || isComplete ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)",
                }}
                className={cn(
                  "size-10 rounded-xl border-2 flex items-center justify-center text-sm font-black transition-colors duration-300 shadow-sm",
                  isActive && "shadow-lg shadow-primary/20",
                  !isActive && !isComplete && "bg-card"
                )}
              >
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Check className="size-5 stroke-[3]" />
                  </motion.div>
                ) : (
                  <span>{i + 1}</span>
                )}
              </motion.div>
              
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-colors duration-300",
                  isActive ? "text-primary translate-y-0 opacity-100" : "text-muted-foreground/40"
                )}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
