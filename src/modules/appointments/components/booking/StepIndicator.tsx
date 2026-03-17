import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { STEP_LABELS } from "./types"

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between px-8 py-8 max-w-md mx-auto relative">
      {/* Background Progress Line */}
      <div className="absolute top-[52px] left-12 right-12 h-[2px] bg-border z-0" />
      
      {/* Active Progress Line */}
      <div 
        className="absolute top-[52px] left-12 h-[2px] bg-primary z-0 transition-all duration-500 ease-out" 
        style={{ width: `${(current / (STEP_LABELS.length - 1)) * (100 - (24 * 100 / 320))}%` }}
      />

      {STEP_LABELS.map((label, i) => {
        const isActive = i === current
        const isComplete = i < current
        return (
          <div key={label} className="flex flex-col items-center gap-3 z-10 relative">
            <div
              className={cn(
                "size-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500",
                "shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                isActive 
                  ? "bg-primary text-primary-foreground scale-110 ring-4 ring-primary/20" 
                  : isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground border border-border"
              )}
            >
              {isComplete ? <Check className="size-5 stroke-[3]" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors duration-500",
                isActive ? "text-primary" : "text-muted-foreground/60"
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
