import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Plus, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { Service, ServiceCategory } from "./types"

function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: Service
  selected: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      layout
      className={cn(
        "group flex items-center gap-4 rounded-[24px] bg-white p-5 shadow-sm transition-all duration-300 cursor-pointer overflow-hidden relative",
        selected
          ? "border-2 border-primary ring-4 ring-primary/10 shadow-lg"
          : "border-2 border-transparent hover:border-gray-100 hover:shadow-md"
      )}
      onClick={onToggle}
    >
      {selected && (
        <motion.div 
          layoutId="selected-bg"
          className="absolute inset-0 bg-primary/5" 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
        />
      )}
      <div className="min-w-0 flex-1 relative z-10">
        <p className="text-base font-black text-gray-900 group-hover:text-primary transition-colors">
          {service.name}
        </p>
        <p className="mt-1 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          {service.duration}
        </p>
      </div>
      <div className="shrink-0 text-right relative z-10">
        <p className="text-lg font-black text-primary tracking-tighter">
          {service.priceLabel}
        </p>
      </div>
      <button
        type="button"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl border-2 transition-all duration-300 relative z-10",
          selected
            ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/30"
            : "border-gray-100 text-gray-400 group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5"
        )}
        aria-label={selected ? `${service.name} kaldir` : `${service.name} ekle`}
      >
        <motion.div initial={false} animate={{ rotate: selected ? 180 : 0 }}>
          {selected ? <Check className="size-5" /> : <Plus className="size-5" />}
        </motion.div>
      </button>
    </motion.div>
  )
}

export function ServicesSectionWidget({
  services,
  selectedIds,
  onToggle,
}: {
  services: Service[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<ServiceCategory>("Tumu")

  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach(s => cats.add(s.category))
    return ["Tumu", ...Array.from(cats).sort()]
  }, [services])

  const filtered = useMemo(() => {
    if (activeTab === "Tumu") return services
    return services.filter((s) => s.category === activeTab)
  }, [activeTab, services])

  if (services.length === 0) {
    return (
      <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-[32px] border border-dashed border-gray-200 p-12 flex items-center justify-center bg-gray-50/50">
          <p className="text-sm font-bold text-gray-400">Bu işletmenin henüz kayıtlı bir hizmeti bulunmuyor.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="px-4 sm:px-8 max-w-5xl mx-auto w-full">
      <h2 className="text-xl font-black text-gray-900 tracking-tight">Katalog</h2>

      {/* Category Tabs */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
        {categories.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 rounded-[16px] px-6 py-3 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer relative",
              activeTab === tab
                ? "text-primary-foreground shadow-md shadow-primary/20"
                : "bg-white text-gray-400 border border-gray-100 hover:border-gray-200 hover:text-gray-900 hover:shadow-sm"
            )}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="active-tab"
                className="absolute inset-0 bg-primary rounded-[16px] -z-10"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            {tab}
          </button>
        ))}
      </div>

      {/* Service Cards */}
      <motion.div layout className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((service, idx) => (
            <motion.div
              key={service.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
            >
              <ServiceCard
                service={service}
                selected={selectedIds.has(service.id)}
                onToggle={() => onToggle(service.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}
