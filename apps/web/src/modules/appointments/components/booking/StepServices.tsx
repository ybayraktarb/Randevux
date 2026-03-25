import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Clock, Check, ArrowRight, Star } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
  const [category, setCategory] = useState("Tümü")

  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach(s => cats.add(s.category))
    return ["Tümü", ...Array.from(cats).sort()]
  }, [services])

  const filtered =
    category === "Tümü"
      ? services
      : services.filter((s) => s.category === category)

  const total = services.filter((s) => selected.includes(s.id)).reduce(
    (acc, s) => ({ price: acc.price + s.price, duration: acc.duration + s.duration }),
    { price: 0, duration: 0 }
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Hizmet Seçimi</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Almak istediğiniz hizmetleri ekleyin
        </p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-2 px-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap shrink-0 border",
              category === cat
                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                : "bg-background text-muted-foreground border-border hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((service) => {
            const isSelected = selected.includes(service.id)
            return (
              <motion.button
                layout
                key={service.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggle(service.id)}
                className={cn(
                  "group relative flex flex-col items-start p-5 rounded-card border-2 transition-all cursor-pointer text-left overflow-hidden",
                  isSelected
                    ? "bg-card border-primary shadow-xl shadow-primary/5"
                    : "bg-card border-border hover:border-primary/20 hover:shadow-lg"
                )}
              >
                {/* Background Glow */}
                {isSelected && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
                )}

                <div className="w-full flex justify-between items-start mb-4">
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center transition-colors shadow-inner",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <Star className={cn("size-5", isSelected && "fill-current")} />
                  </div>
                  <div
                    className={cn(
                      "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                      isSelected ? "bg-primary border-primary" : "border-border bg-card"
                    )}
                  >
                    {isSelected && <Check className="size-3.5 text-primary-foreground stroke-[3]" />}
                  </div>
                </div>

                <h3 className="text-base font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/60 rounded-full text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <Clock className="size-3" />
                    {service.duration} dk
                  </div>
                  <div className="text-base font-black text-primary">
                    {service.price} TL
                  </div>
                </div>
              </motion.button>
            )
          })}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card/8 backdrop-blur-xl border-t border-border p-6 z-40 transform-gpu translate-z-0">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Seçilen Toplam</span>
            <span className="text-lg font-black text-foreground">
              {selected.length} Hizmet · {total.price} TL
            </span>
          </div>
          <RxButton 
            size="lg" 
            className="gap-2 px-8 font-black uppercase tracking-[0.2em] text-xs h-12 rounded-full shadow-xl shadow-primary/20" 
            onClick={onNext}
            disabled={selected.length === 0}
          >
            Devam Et <ArrowRight className="size-4" />
          </RxButton>
        </div>
      </div>
    </div>
  )
}
