import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { STEP_LABELS } from "./types"

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 px-4 py-6">
      {STEP_LABELS.map((label, i) => {
        const isActive = i === current
        const isComplete = i < current
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                  isActive || isComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {isComplete ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap transition-colors duration-300",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={cn(
                  "w-8 sm:w-12 h-0.5 mx-1 sm:mx-2 mt-[-18px] transition-colors duration-300",
                  isComplete ? "bg-primary" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
