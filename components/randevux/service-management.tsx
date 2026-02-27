"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((name) => (
          <div key={name} className="rounded-full ring-2 ring-card">
            <RxAvatar name={name} size="sm" />
          </div>
        ))}
      </div>
      {extra > 0 && (
        <span className="ml-1.5 text-[12px] text-muted-foreground">+{extra}</span>
      )}
      <span className="ml-2 text-[13px] text-muted-foreground">{names.length} personel</span>
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
  onSave: (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean }) => Promise<void>
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
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-foreground/30 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-card shadow-xl transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label={service.name}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Kapat"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-5">
            {/* Genel Bilgiler */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-[15px] font-semibold text-foreground">Genel Bilgiler</h3>
              <div className="mt-4 flex flex-col gap-4">
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">Hizmet Adi</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">Aciklama</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Durum</span>
                  <ToggleSwitch checked={statusActive} onChange={setStatusActive} label={statusActive ? "Aktif" : "Pasif"} />
                </div>
              </div>
            </div>

            {/* Sure & Fiyat */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-[15px] font-semibold text-foreground">Sure ve Fiyat</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">Hizmet Suresi</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editDuration}
                      onChange={(e) => setEditDuration(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="shrink-0 text-sm text-muted-foreground">dakika</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">Baz Fiyat</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                      className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="shrink-0 text-sm text-muted-foreground">{"₺"}</span>
                  </div>
                </div>
              </div>
              {/* Buffer Time */}
              <div className="mt-4 border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Buffer Time Aktif</span>
                  <ToggleSwitch checked={bufferActive} onChange={setBufferActive} />
                </div>
                {bufferActive && (
                  <div className="mt-3">
                    <label className="mb-1 block text-[13px] text-muted-foreground">{"Hazirlik/Temizlik Suresi"}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editBuffer}
                        onChange={(e) => setEditBuffer(Number(e.target.value))}
                        className="h-10 w-24 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <span className="text-sm text-muted-foreground">dakika</span>
                    </div>
                    <div className="mt-2 flex items-start gap-1.5 text-[13px] text-muted-foreground">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>Buffer sure takvimi korur, musteriye gosterilmez.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personel Bazli Fiyatlar */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-[15px] font-semibold text-foreground">Personel Bazli Fiyatlar</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">Personel kendi fiyatini belirleyebilir modunda ise burada farkli fiyatlar gorebilirsiniz.</p>
              <div className="mt-4 flex flex-col gap-3">
                {staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <RxAvatar name={staff.user?.name || "?"} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{staff.user?.name || "?"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{"₺"}{service.base_price}</span>
                      <span className="rounded-md bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">
                        {staff.can_set_own_price ? "Kendi fiyati" : "Patron fiyati gecerli"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="flex shrink-0 items-center justify-between border-t border-border bg-card px-5 py-4">
          <RxButton variant="ghost" onClick={onClose}>Vazgec</RxButton>
          <RxButton variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? " Kaydediliyor..." : " Degisiklikleri Kaydet"}
          </RxButton>
        </div>
      </div>
    </>
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
  onUpdateService: (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean }) => Promise<void>
  onRefresh: () => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [drawerService, setDrawerService] = useState<ServiceItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = windowWidth < 768

  const filtered = services.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || (statusFilter === "aktif" ? s.is_active : !s.is_active)
    return matchSearch && matchStatus
  })

  const activeCount = services.filter((s) => s.is_active).length

  const openDrawer = (service: ServiceItem) => {
    setDrawerService(service)
    setDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Hizmetler</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{activeCount} aktif hizmet</p>
        </div>
        <RxButton variant="primary" onClick={onAddNew}>
          <Plus className="size-4" /> Yeni Hizmet Ekle
        </RxButton>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Hizmet ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tum Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card py-12 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Scissors className="size-6 text-muted-foreground" />
          </div>
          <p className="text-base font-semibold text-foreground">Hizmet bulunamadi</p>
          <p className="max-w-xs text-center text-sm text-muted-foreground">Arama kriterlerinizi degistirin veya yeni hizmet ekleyin.</p>
          <RxButton variant="primary" onClick={onAddNew} className="mt-2">
            <Plus className="size-4" /> Yeni Hizmet Ekle
          </RxButton>
        </div>
      )}

      {/* Desktop Table */}
      {filtered.length > 0 && !isMobile && (
        <div className="overflow-hidden rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Hizmet</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Sure</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Buffer</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Fiyat</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Personel</th>
                  <th className="px-4 py-3 text-left text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Durum</th>
                  <th className="px-4 py-3 text-right text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((service) => (
                  <tr key={service.id} className="border-b border-border last:border-b-0 transition-colors hover:bg-primary-light">
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-foreground">{service.base_duration_minutes} dk</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-foreground">{service.buffer_time_minutes} dk</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-medium text-foreground">{"₺"}{Number(service.base_price).toLocaleString("tr-TR")}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <AvatarStack names={service.staffNames} />
                    </td>
                    <td className="px-4 py-3.5">
                      <RxBadge variant={service.is_active ? "success" : "gray"}>
                        {service.is_active ? "Aktif" : "Pasif"}
                      </RxBadge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openDrawer(service)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label="Duzenle"
                        >
                          <Edit3 className="size-4" />
                        </button>
                        <ToggleSwitch
                          checked={service.is_active}
                          onChange={() => onToggleStatus(service.id, service.is_active)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card List */}
      {filtered.length > 0 && isMobile && (
        <div className="flex flex-col gap-3">
          {filtered.map((service) => (
            <div key={service.id} className={cn(
              "rounded-xl bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-opacity",
              !service.is_active && "opacity-60"
            )}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                </div>
                <RxBadge variant={service.is_active ? "success" : "gray"}>
                  {service.is_active ? "Aktif" : "Pasif"}
                </RxBadge>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
                <span>{service.base_duration_minutes} dk</span>
                <span>Buffer: {service.buffer_time_minutes} dk</span>
                <span className="font-medium text-foreground">{"₺"}{Number(service.base_price).toLocaleString("tr-TR")}</span>
              </div>
              <div className="mt-3">
                <AvatarStack names={service.staffNames} />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => openDrawer(service)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Edit3 className="size-3.5" /> Duzenle
                </button>
                <ToggleSwitch
                  checked={service.is_active}
                  onChange={() => onToggleStatus(service.id, service.is_active)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Drawer */}
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
  onSubmit: (data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number }) => Promise<void>
}) {
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formDuration, setFormDuration] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [bufferEnabled, setBufferEnabled] = useState(false)
  const [formBuffer, setFormBuffer] = useState("")
  const [priceControl, setPriceControl] = useState<"patron" | "personel">("patron")
  const [selectedStaff, setSelectedStaff] = useState(staffMembers.map(() => true))
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
      })
      onCancel() // Switch back to list tab
    } finally {
      setSaving(false)
    }
  }

  const selectAll = () => setSelectedStaff(staffMembers.map(() => true))
  const clearAll = () => setSelectedStaff(staffMembers.map(() => false))

  const totalBlock = (Number(formDuration) || 0) + (bufferEnabled ? (Number(formBuffer) || 0) : 0)

  const inputClass = (field: string) => cn(
    "h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
    errors[field] ? "border-accent focus:border-accent" : "border-border focus:border-primary"
  )

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[560px] rounded-xl bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Yeni Hizmet Ekle</h2>
        <p className="mt-1 text-sm text-muted-foreground">Isletmenize yeni bir hizmet tanimlayin.</p>

        {/* Temel Bilgiler */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground">Temel Bilgiler</h4>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-[13px] text-muted-foreground">Hizmet Adi <span className="text-accent">*</span></label>
              <input type="text" placeholder="Orn: Sac Kesimi" value={formName} onChange={(e) => setFormName(e.target.value)} className={inputClass("name")} />
              {errors.name && <p className="mt-1 text-[12px] text-accent">Bu alan zorunludur</p>}
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-muted-foreground">Aciklama</label>
              <textarea
                placeholder="Hizmet hakkinda kisa aciklama..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Sure & Fiyat */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground">Sure & Fiyat</h4>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-[13px] text-muted-foreground">Hizmet Suresi (dk)</label>
              <input type="number" placeholder="45" value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className={inputClass("")} />
            </div>
            <div>
              <label className="mb-1 block text-[13px] text-muted-foreground">{"Baz Fiyat (₺)"}</label>
              <input type="number" placeholder="350" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className={inputClass("")} />
            </div>
          </div>

          {/* Buffer Time */}
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">Buffer Time</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground">
                      <Info className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p>Randevular arasi hazirlik suresi. Musteriye gosterilmez.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ToggleSwitch checked={bufferEnabled} onChange={setBufferEnabled} />
            </div>
            {bufferEnabled && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="mb-1 block text-[13px] text-muted-foreground">Buffer Suresi (dk)</label>
                  <input type="number" placeholder="5" value={formBuffer} onChange={(e) => setFormBuffer(e.target.value)} className={inputClass("")} />
                </div>
                {(Number(formDuration) > 0) && (
                  <div className="flex items-center rounded-lg bg-primary-light px-3 py-2">
                    <span className="text-[13px] text-primary">
                      {"Toplam blok suresi: "}{formDuration} + {formBuffer || "0"} = {totalBlock} dakika
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fiyat Kontrolu */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground">Fiyat Kontrolu</h4>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPriceControl("patron")}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                priceControl === "patron"
                  ? "border-primary bg-primary-light"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <Building2 className={cn("size-5", priceControl === "patron" ? "text-primary" : "text-muted-foreground")} />
              <div>
                <span className={cn("text-sm font-medium", priceControl === "patron" ? "text-primary" : "text-foreground")}>Patron Belirler</span>
                <p className="text-[11px] text-muted-foreground">Fiyat patron tarafindan belirlenir</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setPriceControl("personel")}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-4 text-left transition-colors",
                priceControl === "personel"
                  ? "border-primary bg-primary-light"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <User className={cn("size-5", priceControl === "personel" ? "text-primary" : "text-muted-foreground")} />
              <div>
                <span className={cn("text-sm font-medium", priceControl === "personel" ? "text-primary" : "text-foreground")}>Personel Belirlesin</span>
                <p className="text-[11px] text-muted-foreground">Personel kendi fiyatini belirler</p>
              </div>
            </button>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary-light px-3 py-2.5">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-[13px] text-muted-foreground">
              {priceControl === "patron"
                ? "Tum personel icin belirlediginiz baz fiyat gecerli olacaktir."
                : "Her personel bu hizmet icin kendi fiyatini girebilecektir."}
            </p>
          </div>
        </div>

        {/* Personel Atamasi */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">Bu hizmeti yapabilecek personel</h4>
            <div className="flex items-center gap-3">
              <button type="button" onClick={selectAll} className="text-[12px] font-medium text-primary hover:underline">Tumunu Sec</button>
              <button type="button" onClick={clearAll} className="text-[12px] font-medium text-muted-foreground hover:underline">Temizle</button>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {staffMembers.map((staff, index) => (
              <label key={staff.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-primary-light">
                <input
                  type="checkbox"
                  checked={selectedStaff[index] ?? false}
                  onChange={(e) => {
                    const next = [...selectedStaff]
                    next[index] = e.target.checked
                    setSelectedStaff(next)
                  }}
                  className="size-4 rounded border-border text-primary accent-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{staff.user?.name || "?"}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Form Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <RxButton variant="ghost" onClick={onCancel}>Vazgec</RxButton>
          <RxButton variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? " Kaydediliyor..." : " Hizmeti Kaydet"}
          </RxButton>
        </div>
      </div>
    </div>
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
    // Optimistic update
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !currentActive } : s))
    await supabase.from("services").update({ is_active: !currentActive }).eq("id", id)
  }

  const handleUpdateService = async (id: string, data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number; is_active: boolean }) => {
    await supabase.from("services").update(data).eq("id", id)
    await fetchServices()
  }

  const handleAddService = async (data: { name: string; description: string; base_duration_minutes: number; base_price: number; buffer_time_minutes: number }) => {
    if (!businessId) return
    await supabase.from("services").insert({ ...data, business_id: businessId })
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
