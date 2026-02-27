import { cn } from "@/lib/utils"

interface RxCardProps {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function RxCard({ children, header, footer, className }: RxCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
        className
      )}
    >
      {header && (
        <div className="border-b border-border px-5 py-4">{header}</div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="border-t border-border px-5 py-4">{footer}</div>
      )}
    </div>
  )
}
