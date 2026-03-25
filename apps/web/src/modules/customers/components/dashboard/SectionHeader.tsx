import { ArrowRight } from "lucide-react"

export function SectionHeader({
  title,
  linkText,
  onLink,
}: {
  title: string
  linkText?: string
  onLink?: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {linkText && onLink && (
        <button
          type="button"
          onClick={onLink}
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          {linkText}
          <ArrowRight className="size-3.5" />
        </button>
      )}
    </div>
  )
}
