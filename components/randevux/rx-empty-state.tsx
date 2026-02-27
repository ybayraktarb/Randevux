import { CalendarX } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "./rx-button"

interface RxEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function RxEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: RxEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-light text-primary">
        {icon || <CalendarX className="size-7" />}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <RxButton onClick={onAction} size="md" className="mt-5">
          {actionLabel}
        </RxButton>
      )}
    </div>
  )
}
