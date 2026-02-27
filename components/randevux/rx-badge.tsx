import { cn } from "@/lib/utils"

type BadgeVariant = "success" | "warning" | "danger" | "purple" | "gray"

interface RxBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-badge-green-bg text-badge-green-text",
  warning: "bg-badge-yellow-bg text-badge-yellow-text",
  danger: "bg-badge-red-bg text-badge-red-text",
  purple: "bg-badge-purple-bg text-badge-purple-text",
  gray: "bg-badge-gray-bg text-badge-gray-text",
}

export function RxBadge({ variant, children, className }: RxBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
