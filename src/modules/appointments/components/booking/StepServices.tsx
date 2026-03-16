import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Clock, Check, ArrowRight } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Service } from "./types"

export function StepServices({
  services,
  selected,
  onToggle,
  onNext,
}: {
  services: Service[]
  selected: string[]
  onToggle: (id: string) => void
  onNext: () => void
}) {
  const [category, setCategory] = useState("Tumu")

  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach(s => cats.add(s.category))
    return ["Tumu", ...Array.from(cats).sort()]
  }, [services])

  const filtered =
    category === "Tumu"
      ? services
      : services.filter((s) => s.category === category)

  const total = services.filter((s) => selected.includes(s.id)).reduce(
    (acc, s) => ({ price: acc.price + s.price, duration: acc.duration + s.duration }),
    { price: 0, duration: 0 }
  )

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Hangi hizmetleri almak istersiniz?
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Birden fazla hizmet secebilirsiniz.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0",
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-muted"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((service) => {
          const isSelected = selected.includes(service.id)
          return (
            <button
              key={service.id}
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer text-left",
                "shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                isSelected
                  ? "bg-primary-light border-primary"
                  : "bg-card border-border hover:bg-muted/30"
              )}
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-semibold text-foreground">
                  {service.name}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md w-fit">
                  <Clock className="size-3" />
                  {service.duration} dk
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-semibold text-primary">
                  {service.price} TL
                </span>
                <div
                  className={cn(
                    "size-5 rounded-md border flex items-center justify-center transition-all shrink-0",
                    isSelected
                      ? "bg-primary border-primary"
                      : "border-border bg-card"
                  )}
                >
                  {isSelected && <Check className="size-3 text-primary-foreground" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-6 px-6 py-4 mt-2">
        {selected.length === 0 ? (
          <p className="text-[13px] text-muted-foreground text-center">
            Devam etmek icin en az bir hizmet secin
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {selected.length} hizmet · ~{total.duration} dk · {total.price} TL
            </span>
            <RxButton size="sm" className="gap-1.5" onClick={onNext}>
              Ileri <ArrowRight className="size-3.5" />
            </RxButton>
          </div>
        )}
      </div>
    </div>
  )
}
