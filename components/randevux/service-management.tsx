"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import {
  Scissors,
  Search,
  X,
  Plus,
  Edit3,
  Info,
  Building2,
  User,
  Save,
  Loader2,
  Sparkles,
  Zap,
  LayoutGrid,
  Filter,
  CheckCircle2,
  MoreVertical,
  Trash2,
  Percent,
  Clock,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"



// ─── Service Data ──────────────────────────────────────────────────────────────

interface ServiceItem {
  id: string
  name: string
  description: string
  base_duration_minutes: number
  base_price: number
  buffer_time_minutes: number
  is_active: boolean
  created_at: string
  // UI-only derived fields
  staffCount: number
  staffNames: string[]
  staffIds: string[]
}

interface StaffMemberData {
  id: string
  user: { name: string; email: string; phone: string | null; avatar_url: string | null } | null
  can_set_own_price: boolean
}



// ─── Toggle Switch ──────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
          checked ? "bg-success" : "bg-muted-foreground/30"
        )}
      >
        <span className={cn(
          "inline-block size-3.5 rounded-full bg-card shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )} />
      </button>
      {label && <span className="text-[13px] text-muted-foreground">{label}</span>}
    </label>
  )
}

// ─── Avatar Stack ───────────────────────────────────────────────────────────────

function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const visible = names.slice(0, max)
  const extra = names.length - max

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((name, i) => (
        <div key={`${name}-${i}`} className="group relative">
          <div className="rounded-full ring-2 ring-white shadow-sm transition-transform hover:scale-110 hover:z-10">
            <RxAvatar name={name} size="sm" />
          </div>
        </div>
      ))}
      {extra > 0 && (
        <div className="relative flex size-8 items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-gray-400 ring-2 ring-white">
          +{extra}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// DETAIL DRAWER — Hizmet Detay
// ═══════════════════════════════════════════════════════════════════════════════

function ServiceDetailDrawer({ service, open, onClose, staffMembers, onSave }: {
  service: ServiceItem | null
  open: boolean
  onClose: () => void
  staffMembers: StaffMemberData[]
  onSave: (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean; staffIds: string[] }) => Promise<void>
}) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEsc)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEsc)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  const [statusActive, setStatusActive] = useState(true)
  const [bufferActive, setBufferActive] = useState(true)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDuration, setEditDuration] = useState(0)
  const [editPrice, setEditPrice] = useState(0)
  const [editBuffer, setEditBuffer] = useState(0)
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (service) {
      setStatusActive(service.is_active)
      setBufferActive(service.buffer_time_minutes > 0)
      setEditName(service.name)
      setEditDescription(service.description || "")
      setEditDuration(service.base_duration_minutes)
      setEditPrice(service.base_price)
      setEditBuffer(service.buffer_time_minutes)
      setSelectedStaffIds(service.staffIds || [])
    }
  }, [service])

  if (!open || !service) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(service.id, {
        name: editName,
        description: editDescription,
        base_duration_minutes: editDuration,
        base_price: editPrice,
        buffer_time_minutes: bufferActive ? editBuffer : 0,
        is_active: statusActive,
        staffIds: selectedStaffIds,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm transition-all"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[520px] bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/5 flex items-center justify-center">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">{service.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">HİZMET DÜZENLEME</span>
                  </div>
                </div>
              </div>
              <RxButton variant="ghost" onClick={onClose} className="size-10 p-0 rounded-xl hover:bg-gray-50">
                <X className="size-5" />
              </RxButton>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <LayoutGrid className="size-4 text-gray-400" />
                  </div>
                  <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Genel Detaylar</h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 ml-1">HİZMET ADI</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-14 w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 text-[15px] font-bold transition-all focus:bg-white focus:border-primary/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 ml-1">AÇIKLAMA / KATEGORİ</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 py-4 text-[15px] font-bold transition-all focus:bg-white focus:border-primary/10 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("size-2.5 rounded-full", statusActive ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-gray-300")} />
                    <span className="text-[13px] font-black text-gray-700">Satışa Açık / Aktif</span>
                  </div>
                  <ToggleSwitch checked={statusActive} onChange={setStatusActive} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Clock className="size-4 text-gray-400" />
                  </div>
                  <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Süre & Fiyatlandırma</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 ml-1">DURASYON (DK)</label>
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="h-14 w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 text-[15px] font-black transition-all focus:bg-white focus:border-primary/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 ml-1">BAZ FİYAT (₺)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="h-14 w-full rounded-2xl bg-primary/5 border-2 border-transparent px-9 text-[15px] font-black text-primary transition-all focus:bg-white focus:border-primary/10 focus:outline-none"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₺</span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all",
                  bufferActive ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-transparent opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className={cn("size-4", bufferActive ? "text-amber-500" : "text-gray-400")} />
                      <span className="text-[13px] font-black text-gray-900">Mola Süresi (Buffer)</span>
                    </div>
                    <ToggleSwitch checked={bufferActive} onChange={setBufferActive} />
                  </div>
                  {bufferActive && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="space-y-4">
                      <input
                        type="number"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(Number(e.target.value))}
                        className="h-12 w-full rounded-xl bg-white shadow-sm border-none px-4 text-[14px] font-bold focus:ring-2 focus:ring-amber-200 focus:outline-none"
                      />
                      <p className="text-[11px] text-amber-600/60 font-black uppercase tracking-widest pl-1">Takvimde {editDuration + editBuffer} dk yer kaplar</p>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-gray-100 flex items-center justify-center">
                      <User className="size-4 text-gray-400" />
                    </div>
                    <h4 className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Yetkili Ekip</h4>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedStaffIds(staffMembers.map(s => s.id))} className="text-[10px] font-black text-primary uppercase px-2 py-1">HEPSİ</button>
                    <button onClick={() => setSelectedStaffIds([])} className="text-[10px] font-black text-gray-400 uppercase px-2 py-1">TEMİZLE</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-20">
                  {staffMembers.map((staff) => {
                    const isChecked = selectedStaffIds.includes(staff.id)
                    return (
                      <button
                        key={staff.id}
                        onClick={() => {
                          if (isChecked) {
                            setSelectedStaffIds(prev => prev.filter(id => id !== staff.id))
                          } else {
                            setSelectedStaffIds(prev => [...prev, staff.id])
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                          isChecked
                            ? "bg-white border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                            : "bg-gray-50 border-transparent hover:border-gray-100"
                        )}
                      >
                        <div className="shrink-0 scale-75">
                          <RxAvatar name={staff.user?.name || "?"} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-black text-gray-900 truncate tracking-tight">{staff.user?.name}</div>
                        </div>
                        {isChecked && <CheckCircle2 className="size-4 text-primary shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center gap-4">
              <RxButton variant="ghost" onClick={onClose} className="flex-1 h-14 rounded-2xl text-[13px] font-black uppercase tracking-widest text-gray-400">VAZGEÇ</RxButton>
              <RxButton
                variant="primary"
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-14 rounded-2xl text-[13px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
              >
                {saving ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
                <span>{saving ? "KAYDEDİLİYOR" : "DEĞİŞİKLİKLERİ KAYDET"}</span>
              </RxButton>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Service Card ───────────────────────────────────────────────────────────────

function ServiceCard({
  service,
  onEdit,
  onToggleStatus
}: {
  service: ServiceItem
  onEdit: () => void
  onToggleStatus: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group relative flex flex-col rounded-3xl border transition-all duration-300",
        service.is_active
          ? "bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]"
          : "bg-gray-50/50 border-gray-100 opacity-60"
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[15px] font-black text-gray-900 truncate tracking-tight">{service.name}</h3>
              {service.is_active && (
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <p className="text-[12px] text-gray-500 font-medium line-clamp-2 min-h-[32px] mb-4">
              {service.description || "Bu hizmet için henüz bir açıklama girilmemiş."}
            </p>
          </div>
          <RxButton
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="size-8 p-0 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors shrink-0"
          >
            <Edit3 className="size-4" />
          </RxButton>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50/80 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SÜRE</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="size-3 text-primary" />
              <span className="text-[13px] font-black text-gray-700">{service.base_duration_minutes}dk</span>
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-3 flex flex-col justify-between">
            <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">FİYAT</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[14px] font-black text-primary">₺{Number(service.base_price).toLocaleString("tr-TR")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">PERSONEL</span>
            <AvatarStack names={service.staffNames} />
          </div>
          <button
            onClick={onToggleStatus}
            className={cn(
              "h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              service.is_active
                ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            )}
          >
            {service.is_active ? "AKTİF" : "PASİF"}
          </button>
        </div>
      </div>

      {service.buffer_time_minutes > 0 && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl shadow-lg shadow-amber-500/20 border-2 border-white">
          <Zap className="size-3 fill-white" />
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Hizmet Listesi
// ═══════════════════════════════════════════════════════════════════════════════

function ServiceListTab({ onAddNew, services, staffMembers, loading, onToggleStatus, onUpdateService, onRefresh }: {
  onAddNew: () => void
  services: ServiceItem[]
  staffMembers: StaffMemberData[]
  loading: boolean
  onToggleStatus: (id: string, currentActive: boolean) => void
  onUpdateService: (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean; staffIds: string[] }) => Promise<void>
  onRefresh: () => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState<string>("TÜMÜ")
  const [drawerService, setDrawerService] = useState<ServiceItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
        <div className="relative">
          <Loader2 className="size-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl scale-150 animate-pulse bg-primary/20 rounded-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Premium Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">HİZMET KATALOĞU</span>
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">İşletme Hizmetleri</h2>
          <p className="text-[13px] text-gray-500 font-medium">Toplam {services.length} hizmet tanımlı • {services.filter(s => s.is_active).length} aktif</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <input
              type="text"
              placeholder="Hizmet, açıklama veya personel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 w-full rounded-2xl border-none bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)] pl-12 pr-4 text-[13px] font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 transition-all"
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
        <div className="h-6 w-px bg-gray-200 mx-2 shrink-0" />
        <button className="p-2.5 rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-primary transition-colors shrink-0 shadow-sm">
          <Filter className="size-4" />
        </button>
      </div>

      {/* Modern Grid Layout */}
      <AnimatePresence mode="popLayout">
        {filtered.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filtered.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onEdit={() => {
                  setDrawerService(service)
                  setDrawerOpen(true)
                }}
                onToggleStatus={() => onToggleStatus(service.id, service.is_active)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 px-6 rounded-[40px] bg-white border-2 border-dashed border-gray-100"
          >
            <div className="size-20 rounded-[32px] bg-gray-50 flex items-center justify-center mb-6">
              <LayoutGrid className="size-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Hizmet Bulunamadı</h3>
            <p className="text-sm text-gray-500 font-medium text-center max-w-xs mb-8">
              Arama kriterlerinize uygun sonuç bulamadık. Lütfen farklı bir kategori deneyin.
            </p>
            <RxButton variant="ghost" onClick={() => { setSearchQuery(""); setActiveCategory("TÜMÜ") }} className="text-primary font-black uppercase tracking-widest">Tümünü Göster</RxButton>
          </motion.div>
        )}
      </AnimatePresence>

      <ServiceDetailDrawer
        service={drawerService}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); onRefresh() }}
        staffMembers={staffMembers}
        onSave={onUpdateService}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Yeni Hizmet Ekle
// ═══════════════════════════════════════════════════════════════════════════════

function AddServiceTab({ onCancel, staffMembers, onSubmit }: {
  onCancel: () => void
  staffMembers: StaffMemberData[]
  onSubmit: (data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; staffIds: string[] }) => Promise<void>
}) {
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDuration, setFormDuration] = useState("30")
  const [formPrice, setFormPrice] = useState("0")
  const [bufferEnabled, setBufferEnabled] = useState(false)
  const [formBuffer, setFormBuffer] = useState("5")
  const [selectedStaff, setSelectedStaff] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!formName.trim()) newErrors.name = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      await onSubmit({
        name: formName,
        description: formDescription,
        base_duration_minutes: Number(formDuration) || 30,
        base_price: Number(formPrice) || 0,
        buffer_time_minutes: bufferEnabled ? (Number(formBuffer) || 0) : 0,
        staffIds: selectedStaff,
      })
      toast.success("Hizmet başarıyla eklendi.")
    } catch (err) {
      toast.error("Hizmet eklenirken bir hata oluştu.")
    } finally {
      setSaving(false)
    }
  }

  const toggleStaff = (id: string) => {
    setSelectedStaff(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id])
  }

  const totalBlock = (Number(formDuration) || 0) + (bufferEnabled ? (Number(formBuffer) || 0) : 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full pb-20"
    >
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="p-8 lg:p-12">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Yeni Hizmet Oluştur</h2>
              <p className="text-[13px] text-gray-500 font-medium">Hizmet detaylarını ve görevli personelleri belirleyin.</p>
            </div>
            <RxButton variant="ghost" onClick={onCancel} className="rounded-2xl hover:bg-gray-50">
              <X className="size-5" />
            </RxButton>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Sol Kolon: Temel Bilgiler */}
            <div className="space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center">
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Temel Bilgiler</h4>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-gray-600 ml-1">HİZMET ADI</label>
                    <input
                      type="text"
                      placeholder="Örn: Saç Kesimi & Yıkama"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={cn(
                        "h-14 w-full rounded-2xl bg-gray-50 border-2 px-5 text-[15px] font-bold transition-all focus:outline-none",
                        errors.name ? "border-red-100 bg-red-50/30" : "border-transparent focus:bg-white focus:border-primary/10"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-gray-600 ml-1">AÇIKLAMA / KATEGORİ</label>
                    <textarea
                      placeholder="Hizmet kategorisini ilk kelime yapın (Örn: SAÇ Kesimi...)"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 py-4 text-[15px] font-bold transition-all focus:outline-none focus:bg-white focus:border-primary/10 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-8 rounded-xl bg-amber-500/5 flex items-center justify-center">
                    <Clock className="size-4 text-amber-500" />
                  </div>
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Süre & Fiyat</h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-gray-600 ml-1">SÜRE (DK)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formDuration}
                        onChange={(e) => setFormDuration(e.target.value)}
                        className="h-14 w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 pr-12 text-[15px] font-black transition-all focus:outline-none focus:bg-white focus:border-primary/10"
                      />
                      <Clock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[12px] font-black text-gray-600 ml-1">FİYAT (₺)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="h-14 w-full rounded-2xl bg-primary/5 border-2 border-transparent px-9 text-[15px] font-black text-primary transition-all focus:outline-none focus:bg-white focus:border-primary/10"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₺</span>
                    </div>
                  </div>
                </div>

                <div className={cn(
                  "p-5 rounded-3xl border-2 transition-all",
                  bufferEnabled ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-transparent opacity-60"
                )}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className={cn("size-4", bufferEnabled ? "text-amber-500" : "text-gray-400")} />
                      <span className="text-[13px] font-black text-gray-900">Buffer Time (Hazırlık)</span>
                    </div>
                    <ToggleSwitch checked={bufferEnabled} onChange={setBufferEnabled} />
                  </div>
                  {bufferEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <input
                        type="number"
                        placeholder="Uygulama sonrası mola süresi..."
                        value={formBuffer}
                        onChange={(e) => setFormBuffer(e.target.value)}
                        className="h-12 w-full rounded-xl bg-white border-none shadow-sm px-4 text-[14px] font-bold focus:ring-2 focus:ring-amber-200"
                      />
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-black text-amber-600/60 uppercase tracking-widest">TOPLAM BLOK:</span>
                        <span className="text-[13px] font-black text-amber-600">{totalBlock} DAKİKA</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ Kolon: Personel */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-indigo-500/5 flex items-center justify-center">
                    <User className="size-4 text-indigo-500" />
                  </div>
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">GÖREVLİ PERSONEL</h4>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedStaff(staffMembers.map(s => s.id))} className="text-[10px] font-black text-primary uppercase hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">HEPSİ</button>
                  <button onClick={() => setSelectedStaff([])} className="text-[10px] font-black text-gray-400 uppercase hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">TEMİZLE</button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {staffMembers.map((staff) => {
                  const isSelected = selectedStaff.includes(staff.id)
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      onClick={() => toggleStaff(staff.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                        isSelected
                          ? "bg-white border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                          : "bg-gray-50 border-transparent hover:border-gray-100"
                      )}
                    >
                      <div className="shrink-0 scale-90">
                        <RxAvatar name={staff.user?.name || "?"} size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-gray-900 truncate tracking-tight">{staff.user?.name}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">{isSelected ? "SEÇİLDİ" : "PASİF"}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 mr-1" />}
                    </button>
                  )
                })}
              </div>

              {selectedStaff.length === 0 && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                  <Info className="size-4 shrink-0" />
                  <p className="text-[11px] font-black uppercase tracking-tight">EN AZ BİR PERSONEL SEÇMELİSİNİZ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 p-8 lg:p-12 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Sparkles className="size-5 text-gray-300" />
            </div>
            <div>
              <div className="text-[13px] font-black text-gray-900">Randevux Premium</div>
              <div className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">HİZMET YÖNETİM MODÜLÜ</div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <RxButton variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-gray-400 hover:bg-gray-100">VAZGEÇ</RxButton>
            <RxButton
              variant="primary"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 sm:flex-none h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3 group"
            >
              {saving ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5 group-hover:rotate-90 transition-transform duration-300" />}
              <span>{saving ? "KAYDEDİLİYOR" : "HİZMETİ OLUŞTUR"}</span>
            </RxButton>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Service Management
// ═══════════════════════════════════════════════════════════════════════════════

type TabKey = "list" | "add"

export function ServiceManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("list")
  const { user, businessName } = useCurrentUser()
  const [services, setServices] = useState<ServiceItem[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMemberData[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const supabase = createClient()

  // Get business_id from the current user
  useEffect(() => {
    if (!user) return
    async function fetchBusinessId() {
      const { data } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", user!.id)
        .maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBusinessId()
  }, [user, supabase])

  const fetchServices = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      // Fetch services
      const { data: svcData } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true })

      // Fetch staff for this business
      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user_id, can_set_own_price, can_set_own_duration, is_active, user:users(name, email, phone, avatar_url)")
        .eq("business_id", businessId)
        .eq("is_active", true)

      // Fetch staff_services to know which staff does which service
      const { data: staffSvcData } = await supabase
        .from("staff_services")
        .select("staff_business_id, service_id, is_active")
        .eq("is_active", true)

      const staffList: StaffMemberData[] = (staffData || []).map((s) => ({
        id: s.id,
        user: Array.isArray(s.user) ? s.user[0] : s.user,
        can_set_own_price: s.can_set_own_price,
      }))
      setStaffMembers(staffList)

      // Map services with staff info
      const mappedServices: ServiceItem[] = (svcData || []).map((svc) => {
        const assignedStaffIds = (staffSvcData || [])
          .filter((ss) => ss.service_id === svc.id)
          .map((ss) => ss.staff_business_id)
        const assignedStaff = staffList.filter((s) => assignedStaffIds.includes(s.id))
        return {
          ...svc,
          staffCount: assignedStaff.length,
          staffNames: assignedStaff.map((s) => s.user?.name || "?"),
          staffIds: assignedStaffIds,
        }
      })
      setServices(mappedServices)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    // Rollback için mevcut state'i yedekle
    const previousServices = services

    // Optimistic update — UI hemen güncellenir
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !currentActive } : s))

    const { error } = await supabase.from("services").update({ is_active: !currentActive }).eq("id", id)

    if (error) {
      // Rollback — eski state'e dön
      setServices(previousServices)
      toast.error("Hizmet durumu güncellenemedi, lütfen tekrar deneyin.")
    }
  }

  const handleUpdateService = async (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean; staffIds: string[] }) => {
    const { staffIds, ...serviceData } = data

    // 1. Update core service info
    await supabase.from("services").update(serviceData).eq("id", id)

    // 2. Sync staff mappings
    // Get existing mappings
    const { data: existing } = await supabase.from("staff_services").select("staff_business_id").eq("service_id", id)
    const existingStaffIds = (existing || []).map(e => e.staff_business_id)

    // Identify to add and to remove
    const toAdd = staffIds.filter(sid => !existingStaffIds.includes(sid))
    const toRemove = existingStaffIds.filter(sid => !staffIds.includes(sid))

    if (toAdd.length > 0) {
      await supabase.from("staff_services").insert(toAdd.map(sid => ({
        staff_business_id: sid,
        service_id: id,
        is_active: true
      })))
    }

    if (toRemove.length > 0) {
      await supabase.from("staff_services").delete().eq("service_id", id).in("staff_business_id", toRemove)
    }

    await fetchServices()
  }

  const handleAddService = async (data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; staffIds: string[] }) => {
    if (!businessId) return
    const { staffIds, ...serviceData } = data

    // 1. Insert Service
    const { data: newSvc, error } = await supabase
      .from("services")
      .insert({ ...serviceData, business_id: businessId })
      .select("id")
      .single()

    if (!error && newSvc && staffIds.length > 0) {
      // 2. Insert Staff Mappings
      await supabase.from("staff_services").insert(staffIds.map(sid => ({
        staff_business_id: sid,
        service_id: newSvc.id,
        is_active: true
      })))
    }

    await fetchServices()
    setActiveTab("list")
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "list", label: "Hizmet Listesi" },
    { key: "add", label: "Hizmet Ekle / Duzenle" },
  ]

  return (
    <>
      {/* Tab Switcher */}
      <div className="-mt-5 lg:-mt-8 -mx-5 lg:-mx-8 mb-5 shrink-0 border-b border-border bg-card px-4 lg:px-8">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <TooltipProvider delayDuration={100}>
        {activeTab === "list" && (
          <ServiceListTab
            onAddNew={() => setActiveTab("add")}
            services={services}
            staffMembers={staffMembers}
            loading={loading}
            onToggleStatus={handleToggleStatus}
            onUpdateService={handleUpdateService}
            onRefresh={fetchServices}
          />
        )}
        {activeTab === "add" && (
          <AddServiceTab
            onCancel={() => setActiveTab("list")}
            staffMembers={staffMembers}
            onSubmit={handleAddService}
          />
        )}
      </TooltipProvider>
    </>
  )
}
