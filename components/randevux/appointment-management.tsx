"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Search,
  X,
  CalendarPlus,
  MoreHorizontal,
  Check,
  XIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  CalendarIcon,
  Plus,
  CheckCircle,
  CheckCheck,
  UserX,
  XCircle,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxInput, RxTextarea } from "./rx-input"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"

type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "no_show"

interface AppointmentSvc {
  name: string
  duration: number
  price: number
}

interface Appointment {
  id: string
  code: string
  customer: string
  phone: string
  email: string
  services: AppointmentSvc[]
  date: string
  dateRaw: string
  time: string
  staff: string
  staffRole: string
  amount: number
  status: AppointmentStatus
  customerNote?: string
  totalDuration: number
  customerId?: string
}

// ─── Status Helpers ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  switch (status) {
    case "confirmed": return <RxBadge variant="success">Onaylandi</RxBadge>
    case "pending": return <RxBadge variant="warning">Bekliyor</RxBadge>
    case "completed": return <RxBadge variant="purple">Tamamlandi</RxBadge>
    case "cancelled": return <RxBadge variant="gray">Iptal Edildi</RxBadge>
    case "no_show": return <RxBadge variant="danger">No-Show</RxBadge>
    default: return null
  }
}

// ─── Action Dropdown ────────────────────────────────────────────────────────────

function ActionDropdown({ onAction }: { onAction: (action: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const actions = [
    { key: "detail", label: "Detay Gor" },
    { key: "approve", label: "Onayla" },
    { key: "cancel", label: "Iptal Et" },
    { key: "noshow", label: "No-Show Isaretle" },
  ]

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted" aria-label="Islemler">
        <MoreHorizontal className="size-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
          {actions.map((a) => (
            <button key={a.key} type="button" onClick={() => { onAction(a.key); setOpen(false) }} className="flex w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-light">
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Manuel Randevu Ekle Modal ──────────────────────────────────────────────────

function AddAppointmentModal({ open, onClose, businessId, onAdded }: { open: boolean; onClose: () => void; businessId: string; onAdded: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [searchValue, setSearchValue] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [customers, setCustomers] = useState<{ id: string; name: string; phone: string }[]>([])
  const [services, setServices] = useState<{ id: string; name: string; base_duration_minutes: number; base_price: number }[]>([])
  const [staffList, setStaffList] = useState<{ id: string; name: string }[]>([])
  const [selectedStaff, setSelectedStaff] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!open || !businessId) return
    async function fetchOptions() {
      const { data: svcData } = await supabase
        .from("services")
        .select("id, name, base_duration_minutes, base_price")
        .eq("business_id", businessId)
        .eq("is_active", true)
      setServices(svcData || [])

      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user:users(name)")
        .eq("business_id", businessId)
        .eq("is_active", true)
      setStaffList((staffData || []).map((s) => {
        const u = Array.isArray(s.user) ? s.user[0] : s.user
        return { id: s.id, name: u?.name || "?" }
      }))
    }
    fetchOptions()
  }, [open, businessId, supabase])

  useEffect(() => {
    if (!searchValue || !businessId) { setCustomers([]); return }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, phone")
        .ilike("name", `%${searchValue}%`)
        .limit(5)
      setCustomers(data || [])
    }, 300)
    return () => clearTimeout(timer)
  }, [searchValue, businessId, supabase])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    if (open) { document.addEventListener("keydown", handleEsc); document.body.style.overflow = "hidden" }
    return () => { document.removeEventListener("keydown", handleEsc); document.body.style.overflow = "" }
  }, [open, onClose])

  if (!open) return null

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function handleSubmit() {
    if (!selectedCustomer || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime) return
    setSaving(true)
    try {
      const selectedSvcs = services.filter(s => selectedServices.includes(s.id))
      const totalDuration = selectedSvcs.reduce((sum, s) => sum + s.base_duration_minutes, 0)
      const totalPrice = selectedSvcs.reduce((sum, s) => sum + Number(s.base_price), 0)

      // Parse start/end times
      const [hh, mm] = selectedTime.split(":").map(Number)
      const endMinutes = hh * 60 + mm + totalDuration
      const endHH = String(Math.floor(endMinutes / 60)).padStart(2, "0")
      const endMM = String(endMinutes % 60).padStart(2, "0")

      const { data: aptData } = await supabase.from("appointments").insert({
        business_id: businessId,
        customer_user_id: selectedCustomer.id,
        staff_business_id: selectedStaff,
        appointment_date: selectedDate,
        start_time: `${selectedTime}:00`,
        end_time: `${endHH}:${endMM}:00`,
        status: "confirmed",
        total_price: totalPrice,
        total_duration_minutes: totalDuration,
        customer_note: "",
      }).select("id").single()

      // Insert appointment_services
      if (aptData) {
        const aptServices = selectedSvcs.map(s => ({
          appointment_id: aptData.id,
          service_id: s.id,
          price_snapshot: Number(s.base_price),
          duration_snapshot: s.base_duration_minutes,
          buffer_snapshot: 0,
        }))
        await supabase.from("appointment_services").insert(aptServices)
      }

      onAdded()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" onClick={(e) => { if (e.target === overlayRef.current) onClose() }} role="dialog" aria-modal="true" aria-label="Manuel Randevu Ekle">
      <div className="w-full max-w-[560px] rounded-xl border border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">Manuel Randevu Ekle</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat"><X className="size-5" /></button>
        </div>

        {/* Body */}
        <div className="max-h-[400px] overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-4">
            {/* Customer */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Musteri Secimi</label>
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary-light px-3 py-1.5 text-sm font-medium text-primary">
                    {selectedCustomer.name}
                    <button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-full p-0.5 text-primary transition-colors hover:bg-primary/10"><X className="size-3.5" /></button>
                  </span>
                </div>
              ) : (
                <div className="relative">
                  <RxInput icon={<Search className="size-4" />} placeholder="Musteri ara..." value={searchValue} onChange={(e) => { setSearchValue(e.target.value); setShowDropdown(true) }} onFocus={() => setShowDropdown(true)} />
                  {showDropdown && customers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-card shadow-lg">
                      {customers.map((c) => (
                        <button key={c.id} type="button" onClick={() => { setSelectedCustomer({ id: c.id, name: c.name }); setShowDropdown(false); setSearchValue("") }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-light">
                          <RxAvatar name={c.name} size="sm" />
                          <div className="flex flex-1 flex-col">
                            <span className="text-sm font-medium text-foreground">{c.name}</span>
                            <span className="text-xs text-muted-foreground">{c.phone}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Services */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Hizmet Secimi</label>
              <div className="flex flex-col gap-2">
                {services.map((svc) => (
                  <label key={svc.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors", selectedServices.includes(svc.id) ? "border-primary bg-primary-light" : "border-border hover:border-primary/30")}>
                    <input type="checkbox" className="size-4 rounded border-border text-primary accent-primary" checked={selectedServices.includes(svc.id)} onChange={() => toggleService(svc.id)} />
                    <div className="flex flex-1 items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{svc.name}</span>
                        <span className="text-xs text-muted-foreground">{svc.base_duration_minutes} dk</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">₺{svc.base_price}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Staff */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Personel Secimi</label>
              <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                <option value="">Personel secin</option>
                {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Date & Time */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tarih</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">Saat</label>
                <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-5 py-4">
          <RxButton variant="ghost" onClick={onClose}>Vazgec</RxButton>
          <RxButton variant="primary" onClick={handleSubmit} disabled={saving || !selectedCustomer || selectedServices.length === 0 || !selectedStaff || !selectedDate || !selectedTime}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
            {saving ? " Kaydediliyor..." : " Randevu Olustur"}
          </RxButton>
        </div>
      </div>
    </div>
  )
}

// ─── Liste Gorunumu ─────────────────────────────────────────────────────────────

function ListeGorunumu({ appointments, statusCounts, loading, onRefresh, onStatusChange, onDetailView, businessId }: {
  appointments: Appointment[]
  statusCounts: Record<string, number>
  loading: boolean
  onRefresh: () => void
  onStatusChange: (id: string, status: AppointmentStatus) => void
  onDetailView: (apt: Appointment) => void
  businessId: string
}) {
  const [activeStatus, setActiveStatus] = useState<AppointmentStatus | "all">("all")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const statusTabs: { key: AppointmentStatus | "all"; label: string }[] = [
    { key: "all", label: "Tumu" },
    { key: "pending", label: "Bekliyor" },
    { key: "confirmed", label: "Onaylandi" },
    { key: "completed", label: "Tamamlandi" },
    { key: "cancelled", label: "Iptal Edildi" },
    { key: "no_show", label: "No-Show" },
  ]

  const filtered = appointments.filter(a => {
    const statusMatch = activeStatus === "all" || a.status === activeStatus
    const searchMatch = !searchQuery || a.customer.toLowerCase().includes(searchQuery.toLowerCase()) || a.services.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    return statusMatch && searchMatch
  })

  const allSelected = filtered.length > 0 && filtered.every(a => selectedIds.includes(a.id))
  const toggleAll = () => { if (allSelected) setSelectedIds([]); else setSelectedIds(filtered.map(a => a.id)) }
  const toggleOne = (id: string) => { setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]) }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Randevular</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{statusCounts.all || 0} randevu bu ay</p>
        </div>
        <RxButton variant="primary" onClick={() => setModalOpen(true)}>
          <CalendarPlus className="size-4" /> Manuel Randevu Ekle
        </RxButton>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-end">
          <div className="w-full lg:w-[300px]">
            <RxInput icon={<Search className="size-4" />} placeholder="Musteri veya hizmet ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {/* Status tabs */}
        <div className="overflow-x-auto border-b border-border px-5">
          <div className="flex items-center gap-0">
            {statusTabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveStatus(tab.key)} className={cn("flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors", activeStatus === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {tab.label}
                <span className={cn("inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold", activeStatus === tab.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{statusCounts[tab.key] || 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 rounded-xl bg-foreground px-5 py-3 text-primary-foreground shadow-lg">
          <span className="text-sm font-medium">{selectedIds.length} randevu secildi</span>
          <RxButton variant="primary" size="sm" className="bg-primary-foreground text-foreground hover:bg-primary-foreground/90" onClick={() => { selectedIds.forEach(id => onStatusChange(id, "confirmed")); setSelectedIds([]) }}><Check className="size-3.5" /> Onayla</RxButton>
          <RxButton variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => { selectedIds.forEach(id => onStatusChange(id, "cancelled")); setSelectedIds([]) }}><XIcon className="size-3.5" /> Iptal Et</RxButton>
          <button type="button" onClick={() => setSelectedIds([])} className="ml-auto rounded-lg p-1 text-primary-foreground/70 transition-colors hover:text-primary-foreground"><X className="size-4" /></button>
        </div>
      )}

      {/* Appointments Table */}
      <div className="overflow-hidden rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="size-4 rounded border-border accent-primary" checked={allSelected} onChange={toggleAll} aria-label="Tumunu sec" />
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Musteri</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Hizmet</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">{"Tarih & Saat"}</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Personel</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Tutar</th>
                <th className="px-4 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Durum</th>
                <th className="px-4 py-3 text-right text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-sm text-muted-foreground">Randevu bulunamadi</td></tr>
              )}
              {filtered.map((apt) => {
                const isNoShow = apt.status === "no_show"
                const isCancelled = apt.status === "cancelled"
                const isPending = apt.status === "pending"

                return (
                  <tr key={apt.id} className={cn("border-b border-border transition-colors hover:bg-primary-light/50", isNoShow && "bg-badge-red-bg/40", isCancelled && "bg-muted/40")}>
                    <td className="w-10 px-4 py-3">
                      <input type="checkbox" className="size-4 rounded border-border accent-primary" checked={selectedIds.includes(apt.id)} onChange={() => toggleOne(apt.id)} aria-label={`${apt.customer} sec`} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <RxAvatar name={apt.customer} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">{apt.customer}</span>
                          <span className="text-xs text-muted-foreground">{apt.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap gap-1">
                          {apt.services.map((s) => (
                            <span key={s.name} className="inline-flex rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{s.name}</span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{apt.totalDuration} dk</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{apt.date}</span>
                        <span className="text-[13px] text-muted-foreground">{apt.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <RxAvatar name={apt.staff} size="sm" />
                        <span className="text-[13px] text-foreground">{apt.staff}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-sm font-semibold", isCancelled ? "text-muted-foreground line-through" : "text-foreground")}>₺{apt.amount.toLocaleString("tr-TR")}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={apt.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button type="button" onClick={() => onStatusChange(apt.id, "confirmed")} className="inline-flex items-center gap-1 rounded-lg bg-success px-2.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-success/90">
                            <Check className="size-3" /> Onayla
                          </button>
                          <button type="button" onClick={() => onStatusChange(apt.id, "cancelled")} className="inline-flex items-center gap-1 rounded-lg border border-destructive px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-badge-red-bg">
                            <XIcon className="size-3" /> Reddet
                          </button>
                        </div>
                      ) : (
                        <ActionDropdown onAction={(action) => {
                          if (action === "detail") onDetailView(apt)
                          else if (action === "approve") onStatusChange(apt.id, "confirmed")
                          else if (action === "cancel") onStatusChange(apt.id, "cancelled")
                          else if (action === "noshow") onStatusChange(apt.id, "no_show")
                        }} />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-5 py-3 sm:flex-row">
          <span className="text-[13px] text-muted-foreground">{filtered.length} randevu gosteriliyor</span>
        </div>
      </div>

      <AddAppointmentModal open={modalOpen} onClose={() => setModalOpen(false)} businessId={businessId} onAdded={onRefresh} />
    </div>
  )
}

// ─── Randevu Detayi ─────────────────────────────────────────────────────────────

function RandevuDetayi({ appointment, onBack, onStatusChange }: { appointment: Appointment; onBack: () => void; onStatusChange: (id: string, status: AppointmentStatus) => void }) {
  const [showCancelInput, setShowCancelInput] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [staffNotes, setStaffNotes] = useState<{ staff: string; date: string; note: string }[]>([])
  const [customerStats, setCustomerStats] = useState({ totalAppointments: 0, totalNoShow: 0, totalSpent: 0 })
  const supabase = createClient()
  const apt = appointment

  useEffect(() => {
    if (!apt.customerId) return
    async function fetchCustomerData() {
      // Customer appointment stats
      const { data: custApts } = await supabase
        .from("appointments")
        .select("id, status, total_price")
        .eq("customer_user_id", apt.customerId!)

      const all = custApts || []
      setCustomerStats({
        totalAppointments: all.length,
        totalNoShow: all.filter(a => a.status === "no_show").length,
        totalSpent: all.filter(a => a.status === "completed").reduce((sum, a) => sum + (Number(a.total_price) || 0), 0),
      })

      // Customer notes
      const { data: notes } = await supabase
        .from("customer_notes")
        .select("note, created_at, staff:staff_business(user:users(name))")
        .eq("customer_user_id", apt.customerId!)
        .order("created_at", { ascending: false })
        .limit(5)

      setStaffNotes((notes || []).map(n => {
        const staffRow = Array.isArray(n.staff) ? n.staff[0] : n.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        return {
          staff: staffUser?.name || "?",
          date: new Date(n.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          note: n.note,
        }
      }))
    }
    fetchCustomerData()
  }, [apt.customerId, supabase])

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-primary">
        <ChevronLeft className="size-3.5" />
        <span>{"Randevular"}</span>
        <span>{"→"}</span>
        <span className="font-medium text-foreground">{"#" + apt.code}</span>
      </button>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-3">
          {/* Randevu Bilgileri */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-foreground">{"#" + apt.code}</span>
                <StatusBadge status={apt.status} />
              </div>
            </div>

            <div className="px-5 py-4">
              {/* Services */}
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">Hizmetler</h3>
                {apt.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.duration} dk</span>
                    </div>
                    <span className="text-sm text-foreground">₺{s.price}</span>
                  </div>
                ))}
                <div className="mt-1 border-t border-border pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Toplam</span>
                    <span className="text-sm font-bold text-foreground">₺{apt.amount.toLocaleString("tr-TR")}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{"Tahmini Sure: ~" + apt.totalDuration + " dk"}</span>
                </div>
              </div>

              <div className="my-4 h-px bg-border" />

              {/* Date & Staff */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="size-4 text-primary" />
                  <span className="text-sm text-foreground">{apt.dateRaw + " · " + apt.time}</span>
                </div>
                <div className="flex items-center gap-3">
                  <RxAvatar name={apt.staff} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{apt.staff}</span>
                    <span className="text-xs text-muted-foreground">{apt.staffRole}</span>
                  </div>
                </div>
              </div>

              {apt.customerNote && (
                <>
                  <div className="my-4 h-px bg-border" />
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Musteri Notu</h3>
                    <div className="rounded-lg bg-muted px-4 py-3">
                      <p className="text-[13px] italic text-muted-foreground">{apt.customerNote}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Musteri Bilgileri */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Musteri Bilgileri</h2>
            </div>
            <div className="flex flex-col items-center px-5 py-5">
              <RxAvatar name={apt.customer} size="lg" />
              <span className="mt-2 text-base font-semibold text-foreground">{apt.customer}</span>

              <div className="my-4 h-px w-full bg-border" />

              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /><span className="text-sm text-foreground">{apt.phone}</span></div>
                <div className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" /><span className="text-sm text-foreground">{apt.email}</span></div>
              </div>

              <div className="my-4 h-px w-full bg-border" />

              <div className="grid w-full grid-cols-3 gap-2">
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">{customerStats.totalAppointments}</span>
                  <span className="text-[11px] text-muted-foreground">Randevu</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">{customerStats.totalNoShow}</span>
                  <span className="text-[11px] text-muted-foreground">No-Show</span>
                </div>
                <div className="flex flex-col items-center rounded-lg bg-primary-light px-2 py-3">
                  <span className="text-lg font-semibold text-foreground">₺{customerStats.totalSpent.toLocaleString("tr-TR")}</span>
                  <span className="text-[11px] text-muted-foreground">Toplam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dahili Notlar */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Personel Notlari</h2>
            </div>
            <div className="px-5 py-4">
              <p className="mb-4 text-xs italic text-muted-foreground">Bu notlar sadece isletme icinde gorulur.</p>

              {staffNotes.map((note, i) => (
                <div key={i}>
                  <div className="flex items-start gap-3">
                    <RxAvatar name={note.staff} size="sm" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-foreground">{note.staff}</span>
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground">{note.note}</p>
                    </div>
                  </div>
                  {i < staffNotes.length - 1 && <div className="my-3 h-px bg-border" />}
                </div>
              ))}

              <div className="mt-4 border-t border-border pt-4">
                <RxTextarea placeholder="Bu randevu icin not ekleyin..." className="min-h-[80px]" value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <div className="mt-2 flex justify-end">
                  <RxButton variant="primary" size="sm">Not Kaydet</RxButton>
                </div>
              </div>
            </div>
          </div>

          {/* Islemler */}
          <div className="rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-[15px] font-semibold text-foreground">Islemler</h2>
            </div>
            <div className="flex flex-col gap-2.5 px-5 py-4">
              {apt.status === "pending" && (
                <RxButton variant="primary" className="w-full justify-center" onClick={() => onStatusChange(apt.id, "confirmed")}>
                  <CheckCircle className="size-4" /> Randevuyu Onayla
                </RxButton>
              )}
              <RxButton variant="primary" className="w-full justify-center" onClick={() => onStatusChange(apt.id, "completed")}>
                <CheckCheck className="size-4" /> Tamamlandi Isaretle
              </RxButton>
              <RxButton variant="ghost" className="w-full justify-center text-accent hover:bg-badge-red-bg hover:text-accent" onClick={() => onStatusChange(apt.id, "no_show")}>
                <UserX className="size-4" /> No-Show Isaretle
              </RxButton>
              <RxButton variant="ghost" className="w-full justify-center text-accent hover:bg-badge-red-bg hover:text-accent" onClick={() => setShowCancelInput(!showCancelInput)}>
                <XCircle className="size-4" /> Randevuyu Iptal Et
              </RxButton>

              {showCancelInput && (
                <div className="mt-2 flex flex-col gap-2 rounded-lg border border-border p-3">
                  <RxTextarea placeholder="Iptal Nedeni" className="min-h-[70px]" />
                  <div className="flex items-center gap-2">
                    <RxButton variant="danger" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => { onStatusChange(apt.id, "cancelled"); setShowCancelInput(false) }}>Iptal Et</RxButton>
                    <RxButton variant="ghost" size="sm" onClick={() => setShowCancelInput(false)}>Vazgec</RxButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Export ────────────────────────────────────────────────────────────────

export function AppointmentManagement() {
  const { user } = useCurrentUser()
  const [tab, setTab] = useState<"list" | "detail">("list")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({ all: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 })

  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    async function fetchBid() {
      const { data } = await supabase.from("business_owners").select("business_id").eq("user_id", user!.id).maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBid()
  }, [user, supabase])

  const fetchAppointments = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, total_duration_minutes, customer_note, customer_user_id, customer:users!appointments_customer_user_id_fkey(id, name, phone, email), services:appointment_services(service:services(name), price_snapshot, duration_snapshot), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .order("appointment_date", { ascending: false })
        .limit(50)

      const mapped: Appointment[] = (data || []).map((a, idx) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptServices = Array.isArray(a.services) ? a.services : []
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const startParts = String(a.start_time).split(":")
        const endParts = String(a.end_time).split(":")
        const dateObj = new Date(a.appointment_date + "T00:00:00")

        return {
          id: a.id,
          code: `RDV-${String(idx + 1).padStart(4, "0")}`,
          customer: cust?.name || "?",
          phone: cust?.phone || "",
          email: cust?.email || "",
          customerId: cust?.id || a.customer_user_id,
          services: aptServices.map(as => {
            const svc = Array.isArray(as.service) ? as.service[0] : as.service
            return { name: svc?.name || "?", duration: as.duration_snapshot || 0, price: Number(as.price_snapshot) || 0 }
          }),
          date: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }),
          dateRaw: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
          time: `${startParts[0]?.padStart(2, "0")}:${startParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
          staff: staffUser?.name || "?",
          staffRole: "",
          amount: Number(a.total_price) || 0,
          status: a.status as AppointmentStatus,
          customerNote: a.customer_note || undefined,
          totalDuration: a.total_duration_minutes || 0,
        }
      })

      setAppointments(mapped)

      // Count statuses
      const counts: Record<string, number> = { all: mapped.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0, no_show: 0 }
      mapped.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1 })
      setStatusCounts(counts)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))

    const now = new Date().toISOString()
    const updatePayload: Record<string, unknown> = { status }

    if (status === "confirmed") {
      updatePayload.confirmed_at = now
    } else if (status === "completed") {
      updatePayload.completed_at = now
    } else if (status === "cancelled") {
      updatePayload.cancelled_by = "staff"
      updatePayload.cancelled_at = now
    }

    await supabase.from("appointments").update(updatePayload).eq("id", id)

    // Insert no_show_record if marking as no-show
    if (status === "no_show" && user) {
      const { data: staffRow } = await supabase
        .from("staff_business")
        .select("id")
        .eq("business_id", businessId!)
        .eq("user_id", user.id)
        .maybeSingle()

      if (staffRow) {
        await supabase.from("no_show_records").insert({
          appointment_id: id,
          marked_by_staff_business_id: staffRow.id,
        })
      }
    }

    fetchAppointments()
  }

  const handleDetailView = (apt: Appointment) => {
    setSelectedAppointment(apt)
    setTab("detail")
  }

  const tabs = [
    { key: "list" as const, label: "Liste Gorunumu" },
    { key: "detail" as const, label: "Randevu Detayi" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-0 border-b border-border">
        {tabs.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("border-b-2 px-5 py-3 text-sm font-medium transition-colors", tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "list" ? (
        <ListeGorunumu
          appointments={appointments}
          statusCounts={statusCounts}
          loading={loading}
          onRefresh={fetchAppointments}
          onStatusChange={handleStatusChange}
          onDetailView={handleDetailView}
          businessId={businessId || ""}
        />
      ) : (
        selectedAppointment && <RandevuDetayi appointment={selectedAppointment} onBack={() => setTab("list")} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}
