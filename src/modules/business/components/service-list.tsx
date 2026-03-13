"use client"

import { useState, useMemo } from "react"
import { Search, Plus, LayoutGrid, Filter, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { ServiceCard } from "./service-card"
import type { Service } from "../types"

interface ServiceListProps {
  services: Service[]
  loading: boolean
  onAddNew: () => void
  onEdit: (service: Service) => void
  onToggleStatus: (id: string, currentStatus: boolean) => void
}

export function ServiceList({ services, loading, onAddNew, onEdit, onToggleStatus }: ServiceListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("TÜMÜ")

  const categories = useMemo(() => {
    return ["TÜMÜ", ...Array.from(new Set(services.map(s => s.description?.split(" ")[0] || "DİĞER") || []))].slice(0, 6)
  }, [services])

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchCategory = activeCategory === "TÜMÜ" || (s.description || "").startsWith(activeCategory)
    return matchSearch && matchCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-12 animate-spin text-primary/30" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">HİZMET KATALOĞU</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">İşletme Hizmetleri</h2>
          <p className="text-[13px] text-gray-500 font-medium">Toplam {services.length} hizmet tanımlı</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Hizmet, açıklama ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] pl-12 pr-4 text-[13px] font-bold focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <RxButton
            variant="primary"
            onClick={onAddNew}
            className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 gap-2 shrink-0 group"
          >
            <Plus className="size-4 group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[13px] font-black uppercase tracking-widest">YENİ EKLE</span>
          </RxButton>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        {categories.map((cat: string) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all whitespace-nowrap",
              activeCategory === cat
                ? "bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-900/10 scale-105"
                : "bg-white text-gray-400 border-gray-100 hover:border-gray-200 hover:text-gray-600 shadow-sm"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-6 rounded-[40px] bg-white border-2 border-dashed border-gray-100"
          >
            <LayoutGrid className="size-10 text-gray-200 mb-6" />
            <h3 className="text-xl font-black text-gray-900 mb-2">Hizmet Bulunamadı</h3>
            <p className="text-sm text-gray-500 font-medium text-center max-w-xs mb-8">
              Arama kriterlerinize uygun sonuç bulamadık.
            </p>
            <RxButton variant="ghost" onClick={() => { setSearchQuery(""); setActiveCategory("TÜMÜ") }} className="text-primary font-black uppercase tracking-widest">Tümünü Göster</RxButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
