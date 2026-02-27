"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  ChevronRight,
  Search,
  UserPlus,
  Eye,
  Edit3,
  Trash2,
  Mail,
  Phone,
  CalendarIcon,
  Building2,
  User,
  Upload,
  Send,
  Info,
  Star,
  Check,
  XIcon,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"



// ─── Types ──────────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string // staff_business.id
  user_id: string
  name: string
  role: string
  is_active: boolean
  email: string
  phone: string
  created_at: string
  services: string[]
  appointmentCount: number
  noShowCount: number
}

interface InvitationItem {
  id: string
  phone: string
  status: string
  created_at: string
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
          checked ? "bg-primary" : "bg-muted-foreground/30"
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

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Personel Listesi
// ═══════════════════════════════════════════════════════════════════════════════

function StaffCard({ staff, onDetail, onToggle }: { staff: StaffMember; onDetail: () => void; onToggle: () => void }) {
  const maxVisibleServices = 3
  const visibleServices = staff.services.slice(0, maxVisibleServices)
  const extraCount = staff.services.length - maxVisibleServices

  return (
    <div className={cn(
      "flex flex-col overflow-hidden rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-opacity",
      !staff.is_active && "opacity-60"
    )}>
      {/* Top header bg */}
      <div className="relative flex h-20 items-end justify-center bg-primary-light">
        <div className="absolute -bottom-8">
          <div className="rounded-full border-[3px] border-card">
            <RxAvatar name={staff.name} size="lg" />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col items-center px-4 pt-10 pb-4">
        <h3 className="text-base font-semibold text-foreground">{staff.name}</h3>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{staff.role || "Personel"}</p>
        <div className="mt-2">
          <RxBadge variant={staff.is_active ? "success" : "gray"}>
            {staff.is_active ? "Aktif" : "Pasif"}
          </RxBadge>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center border-t border-border px-4 py-3">
        <div className="flex flex-1 flex-col items-center">
          <span className="text-sm font-semibold text-foreground">{staff.appointmentCount}</span>
          <span className="text-[11px] text-muted-foreground">Randevu</span>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="flex flex-1 flex-col items-center">
          <span className="text-sm font-semibold text-foreground">{staff.noShowCount}</span>
          <span className="text-[11px] text-muted-foreground">No-Show</span>
        </div>
      </div>

      {/* Services chips */}
      <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-3">
        {visibleServices.map((s) => (
          <span key={s} className="rounded-md bg-primary-light px-2 py-0.5 text-[11px] font-medium text-primary">{s}</span>
        ))}
        {extraCount > 0 && (
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">+{extraCount} daha</span>
        )}
        {staff.services.length === 0 && (
          <span className="text-[11px] text-muted-foreground">Hizmet atanmamis</span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDetail} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Eye className="size-3.5" /> Detay
          </button>
        </div>
        <ToggleSwitch checked={staff.is_active} onChange={onToggle} />
      </div>
    </div>
  )
}

function StaffListTab({ onViewDetail, onAddNew, staffList, loading, onToggle, invitations, onCancelInvite }: {
  onViewDetail: (staff: StaffMember) => void
  onAddNew: () => void
  staffList: StaffMember[]
  loading: boolean
  onToggle: (id: string, current: boolean) => void
  invitations: InvitationItem[]
  onCancelInvite: (id: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "aktif" | "pasif">("all")

  const filteredStaff = staffList.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.role.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === "all" || (statusFilter === "aktif" ? s.is_active : !s.is_active)
    return matchSearch && matchStatus
  })

  const activeCount = staffList.filter((s) => s.is_active).length

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
          <h2 className="text-[22px] font-semibold text-foreground">{"Personel Yonetimi"}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{activeCount} aktif personel</p>
        </div>
        <RxButton variant="primary" onClick={onAddNew}>
          <UserPlus className="size-4" /> Yeni Personel Ekle
        </RxButton>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Personel ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | "aktif" | "pasif")}
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">Tum Durumlar</option>
          <option value="aktif">Aktif</option>
          <option value="pasif">Pasif</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {filteredStaff.map((staff) => (
          <StaffCard
            key={staff.id}
            staff={staff}
            onDetail={() => onViewDetail(staff)}
            onToggle={() => onToggle(staff.id, staff.is_active)}
          />
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-card py-12 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <Users className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Sonuc bulunamadi</p>
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <h3 className="text-[15px] font-semibold text-foreground">Bekleyen Davetler</h3>
          <div className="mt-4 flex flex-col gap-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{inv.phone}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(inv.created_at).toLocaleDateString("tr-TR")} tarihinde gonderildi
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RxBadge variant="warning">{inv.status === "pending" ? "Bekliyor" : inv.status}</RxBadge>
                  {inv.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => onCancelInvite(inv.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-badge-red-bg hover:text-accent"
                    >
                      <XIcon className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Personel Detayi
// ═══════════════════════════════════════════════════════════════════════════════

function StaffDetailTab({ onBack, staff, businessId, onDeactivate }: {
  onBack: () => void
  staff: StaffMember
  businessId: string
  onDeactivate: () => void
}) {
  const [statusActive, setStatusActive] = useState(staff.is_active)
  const [priceControl, setPriceControl] = useState<"patron" | "personel">("patron")
  const [staffServices, setStaffServices] = useState<{ name: string; duration: string; price: number; active: boolean }[]>([])
  const [serviceToggles, setServiceToggles] = useState<boolean[]>([])
  const [scheduleData, setScheduleData] = useState<{ day: string; working: boolean; start: string | null; end: string | null; breakStart: string | null; breakEnd: string | null }[]>([])
  const [scheduleToggles, setScheduleToggles] = useState<boolean[]>([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchStaffDetails() {
      // Fetch staff services
      const { data: ssData } = await supabase
        .from("staff_services")
        .select("*, service:services(name, base_duration_minutes, base_price)")
        .eq("staff_business_id", staff.id)

      if (ssData) {
        const svcs = ssData.map((ss) => {
          const svc = Array.isArray(ss.service) ? ss.service[0] : ss.service
          return {
            name: svc?.name || "?",
            duration: `${svc?.base_duration_minutes || 0} dk`,
            price: Number(svc?.base_price || 0),
            active: ss.is_active,
          }
        })
        setStaffServices(svcs)
        setServiceToggles(svcs.map((s) => s.active))
      }

      // Fetch work schedule templates
      const dayNames = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
      const { data: schedData } = await supabase
        .from("work_schedule_templates")
        .select("*")
        .eq("staff_business_id", staff.id)
        .order("day_of_week")

      // Fetch breaks
      const { data: breakData } = await supabase
        .from("break_schedules")
        .select("*")
        .eq("staff_business_id", staff.id)

      const schedule = Array.from({ length: 7 }, (_, i) => {
        const dayIndex = (i + 1) % 7 // Mon=1 ... Sun=0
        const entry = schedData?.find((s) => s.day_of_week === dayIndex)
        const brk = breakData?.find((b) => b.day_of_week === dayIndex)
        return {
          day: dayNames[dayIndex],
          working: entry?.is_working ?? (dayIndex !== 0),
          start: entry?.start_time || "09:00",
          end: entry?.end_time || "18:00",
          breakStart: brk?.start_time || null,
          breakEnd: brk?.end_time || null,
        }
      })
      setScheduleData(schedule)
      setScheduleToggles(schedule.map((s) => s.working))

      // Fetch price control
      const { data: sbData } = await supabase
        .from("staff_business")
        .select("can_set_own_price")
        .eq("id", staff.id)
        .maybeSingle()
      if (sbData) {
        setPriceControl(sbData.can_set_own_price ? "personel" : "patron")
      }
    }
    fetchStaffDetails()
  }, [staff.id, supabase])

  const handleToggleStatus = async (active: boolean) => {
    setStatusActive(active)
    await supabase.from("staff_business").update({ is_active: active }).eq("id", staff.id)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <button type="button" onClick={onBack} className="transition-colors hover:text-primary">Personel</button>
        <ChevronRight className="size-3.5" />
        <span className="font-medium text-foreground">{staff.name}</span>
      </nav>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column - Profile */}
        <div className="xl:col-span-4">
          <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center px-5 py-6">
              <div className="rounded-full border-[3px] border-primary-light">
                <RxAvatar name={staff.name} size="lg" />
              </div>
              <h3 className="mt-3 text-lg font-semibold text-foreground">{staff.name}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{staff.role || "Personel"}</p>
              <div className="mt-3">
                <ToggleSwitch checked={statusActive} onChange={handleToggleStatus} label={statusActive ? "Aktif" : "Pasif"} />
              </div>
            </div>

            {/* Info Rows */}
            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">E-posta</span>
                    <span className="text-sm text-foreground">{staff.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Telefon</span>
                    <span className="text-sm text-foreground">{staff.phone || "-"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-[11px] text-muted-foreground">Baslangic Tarihi</span>
                    <span className="text-sm text-foreground">{new Date(staff.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="border-t border-border px-5 py-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Toplam Randevu</span>
                  <span className="font-medium text-foreground">{staff.appointmentCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">No-Show</span>
                  <span className="font-medium text-foreground">{staff.noShowCount}</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-border px-5 py-4">
              <button
                type="button"
                onClick={onDeactivate}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-badge-red-bg"
              >
                <Trash2 className="size-4" /> Personeli Cikar
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex flex-col gap-5 xl:col-span-8">
          {/* Price & Duration Control */}
          <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[15px] font-semibold text-foreground">Fiyat ve Sure Kontrolu</h3>
            <p className="mt-1 text-[13px] text-muted-foreground">Bu personelin hizmet fiyatlarini ve surelerini kim belirlesin?</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  <span className={cn("text-sm font-medium", priceControl === "patron" ? "text-primary" : "text-foreground")}>Ben Belirlerim</span>
                  <p className="text-[11px] text-muted-foreground">Fiyatlari patron belirler</p>
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
                  <p className="text-[11px] text-muted-foreground">Personel kendi fiyatini girer</p>
                </div>
              </button>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary-light px-3 py-2.5">
              <Info className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-[13px] text-muted-foreground">
                {priceControl === "patron" ? "Su an patron fiyatlari gecerli." : "Personel kendi fiyatini belirleyebilir."}
              </p>
            </div>
          </div>

          {/* Assigned Services */}
          <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Atanan Hizmetler</h3>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {staffServices.length === 0 && (
                <p className="text-sm text-muted-foreground">Henuz hizmet atanmamis.</p>
              )}
              {staffServices.map((service, index) => (
                <div key={service.name} className={cn(
                  "flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-opacity",
                  !serviceToggles[index] && "opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{service.name}</span>
                      <span className="rounded-md text-[11px] text-muted-foreground">{service.duration}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">{"₺"}{service.price}</span>
                    <ToggleSwitch
                      checked={serviceToggles[index]}
                      onChange={(v) => {
                        const next = [...serviceToggles]
                        next[index] = v
                        setServiceToggles(next)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Calisma Saatleri</h3>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {scheduleData.map((day, index) => (
                <div key={day.day} className={cn(
                  "flex items-center gap-4 rounded-lg border border-border px-4 py-3",
                  !scheduleToggles[index] && "opacity-50"
                )}>
                  <span className="w-24 shrink-0 text-sm font-medium text-foreground">{day.day}</span>
                  <ToggleSwitch
                    checked={scheduleToggles[index]}
                    onChange={(v) => {
                      const next = [...scheduleToggles]
                      next[index] = v
                      setScheduleToggles(next)
                    }}
                  />
                  {scheduleToggles[index] && day.start ? (
                    <div className="flex flex-1 flex-wrap items-center gap-2">
                      <span className="text-sm text-foreground">{day.start} - {day.end}</span>
                      {day.breakStart && (
                        <span className="rounded-md bg-badge-yellow-bg px-2 py-0.5 text-[11px] font-medium text-badge-yellow-text">
                          Ogle Molasi {day.breakStart}-{day.breakEnd}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Kapali</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Yeni Personel Davet
// ═══════════════════════════════════════════════════════════════════════════════

function AddStaffTab({ onCancel, businessId, userId, onInviteSent }: {
  onCancel: () => void
  businessId: string
  userId: string
  onInviteSent: () => void
}) {
  const [formPhone, setFormPhone] = useState("")
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {}
    if (!formPhone.trim()) newErrors.phone = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("staff_invitations")
        .insert({
          business_id: businessId,
          invited_by: userId,
          phone: formPhone,
          status: "pending",
        })

      if (error) {
        console.error("Davet hatasi:", error)
        return
      }

      console.log(`SMS gönderilecek: ${formPhone}`)
      setSuccess(true)
      onInviteSent()
      setTimeout(() => {
        onCancel()
      }, 2000)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = (field: string) => cn(
    "h-10 w-full rounded-lg border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
    errors[field] ? "border-accent focus:border-accent" : "border-border focus:border-primary"
  )

  if (success) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-[560px] rounded-xl bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex items-center justify-center size-16 rounded-full bg-badge-green-bg">
              <Check className="size-8 text-badge-green-text" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Davet Gonderildi!</h2>
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">{formPhone}</strong> numarasina davet gonderildi.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-[560px] rounded-xl bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] sm:p-8">
        <h2 className="text-xl font-semibold text-foreground">Personel Davet Et</h2>
        <p className="mt-1 text-sm text-muted-foreground">Personel telefon numarasi ile davet edilecektir.</p>

        {/* Telefon */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-foreground">Iletisim Bilgisi</h4>
          <div className="mt-3 flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-[13px] text-muted-foreground">Telefon Numarasi <span className="text-accent">*</span></label>
              <input type="tel" placeholder="+90 532 000 00 00" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className={inputClass("phone")} />
              {errors.phone && <p className="mt-1 text-[12px] text-accent">Bu alan zorunludur</p>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-primary-light px-3 py-2.5">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[13px] text-muted-foreground">
            Davet gonderildiginde personele SMS ile bildirim yapilacaktir. Simdilik sadece DB kaydı olusturulur.
          </p>
        </div>

        {/* Form Footer */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <RxButton variant="ghost" onClick={onCancel}>Vazgec</RxButton>
          <RxButton variant="primary" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {saving ? " Gonderiliyor..." : " Personeli Davet Et"}
          </RxButton>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB: Izin Talepleri (Patron Side)
// ═══════════════════════════════════════════════════════════════════════════════

function LeaveRequestsPatronTab({ businessId, userId }: { businessId: string; userId: string }) {
  const supabase = createClient()
  const [requests, setRequests] = useState<{ id: string; staffName: string; type: string; date: string; timeRange?: string; reason?: string; createdAt: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from("leave_requests")
      .select("*, staff_business!inner(business_id, user:users(name))")
      .eq("staff_business.business_id", businessId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    const mapped = (data || []).map((r: any) => {
      const sb = Array.isArray(r.staff_business) ? r.staff_business[0] : r.staff_business
      const usr = sb ? (Array.isArray(sb.user) ? sb.user[0] : sb.user) : null
      const d = new Date(r.date + "T00:00:00")
      const days = ["Pazar", "Pazartesi", "Sali", "Carsamba", "Persembe", "Cuma", "Cumartesi"]
      const months = ["Oca", "Sub", "Mar", "Nis", "May", "Haz", "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara"]
      const st = r.start_time ? String(r.start_time).slice(0, 5) : ""
      const et = r.end_time ? String(r.end_time).slice(0, 5) : ""
      return {
        id: r.id,
        staffName: usr?.name || "Personel",
        type: r.request_type === "full_day" ? "Tam Gun" : "Kismi",
        date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${days[d.getDay()]}`,
        timeRange: st && et ? `${st} - ${et}` : undefined,
        reason: r.reason || undefined,
        createdAt: new Date(r.created_at).toLocaleDateString("tr-TR"),
      }
    })
    setRequests(mapped)
    setLoading(false)
  }, [businessId, supabase])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setProcessing(id)
    await supabase.from("leave_requests").update({
      status: action,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id)

    // Notify staff
    try {
      const { createNotification } = await import("@/lib/notifications")
      const { data: lr } = await supabase.from("leave_requests").select("staff_business_id, date").eq("id", id).maybeSingle()
      if (lr?.staff_business_id) {
        const { data: sb } = await supabase.from("staff_business").select("user_id").eq("id", lr.staff_business_id).maybeSingle()
        if (sb?.user_id) {
          const title = action === "approved" ? "Izin talebiniz onaylandi" : "Izin talebiniz reddedildi"
          await createNotification(supabase, { userId: sb.user_id, type: "leave_result", title, body: `${lr.date} tarihli izin talebi`, relatedId: id, relatedType: "leave_request" })
        }
      }
    } catch (e) { console.error("[Notification]", e) }

    setProcessing(null)
    fetchRequests()
  }

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[22px] font-semibold text-foreground">Bekleyen Izin Talepleri</h2>
      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">Bekleyen izin talebi yok.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          {requests.map((req, idx) => (
            <div key={req.id} className={cn("flex items-center gap-4 px-5 py-4", idx !== requests.length - 1 && "border-b border-border")}>
              <RxAvatar name={req.staffName} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[15px] font-semibold text-foreground">{req.staffName}</span>
                  <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{req.type}</span>
                </div>
                <span className="text-[13px] text-muted-foreground">{req.date}{req.timeRange ? ` · ${req.timeRange}` : ""}</span>
                {req.reason && <span className="text-[13px] italic text-muted-foreground">{req.reason}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" disabled={processing === req.id} onClick={() => handleAction(req.id, "approved")} className="rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-xs font-medium text-[#10B981] transition-colors hover:bg-[#D1FAE5] disabled:opacity-50">Onayla</button>
                <button type="button" disabled={processing === req.id} onClick={() => handleAction(req.id, "rejected")} className="rounded-lg bg-[#FFF0F3] px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-badge-red-bg disabled:opacity-50">Reddet</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — Staff Management
// ═══════════════════════════════════════════════════════════════════════════════

type TabKey = "list" | "detail" | "add" | "leaves"

export function StaffManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("list")
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)
  const { user } = useCurrentUser()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [invitations, setInvitations] = useState<InvitationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const supabase = createClient()

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

  const fetchStaff = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      // Fetch staff with user info
      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user_id, role, is_active, can_set_own_price, created_at, user:users(name, email, phone, avatar_url)")
        .eq("business_id", businessId)

      // Fetch staff services
      const { data: ssData } = await supabase
        .from("staff_services")
        .select("staff_business_id, service:services(name)")
        .eq("is_active", true)

      // Fetch appointments count per staff
      const { data: aptsData } = await supabase
        .from("appointments")
        .select("staff_business_id")
        .eq("business_id", businessId)

      const mapped: StaffMember[] = (staffData || []).map((s) => {
        const usr = Array.isArray(s.user) ? s.user[0] : s.user
        const staffSvcs = (ssData || [])
          .filter((ss) => ss.staff_business_id === s.id)
          .map((ss) => {
            const svc = Array.isArray(ss.service) ? ss.service[0] : ss.service
            return svc?.name || "?"
          })
        const aptCount = (aptsData || []).filter((a) => a.staff_business_id === s.id).length

        return {
          id: s.id,
          user_id: s.user_id,
          name: usr?.name || "?",
          role: s.role || "",
          is_active: s.is_active,
          email: usr?.email || "",
          phone: usr?.phone || "",
          created_at: s.created_at,
          services: staffSvcs,
          appointmentCount: aptCount,
          noShowCount: 0,
        }
      })
      setStaffList(mapped)

      // Fetch pending invitations
      const { data: invData } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      setInvitations((invData || []).map((i) => ({
        id: i.id,
        phone: i.phone,
        status: i.status,
        created_at: i.created_at,
      })))
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchStaff()
  }, [fetchStaff])

  const handleToggle = async (id: string, current: boolean) => {
    setStaffList((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !current } : s))
    await supabase.from("staff_business").update({ is_active: !current }).eq("id", id)
  }

  const handleDeactivate = async () => {
    if (!selectedStaff) return
    await supabase.from("staff_business").update({ is_active: false }).eq("id", selectedStaff.id)
    await fetchStaff()
    setActiveTab("list")
  }

  const handleCancelInvite = async (id: string) => {
    await supabase.from("staff_invitations").update({ status: "cancelled" }).eq("id", id)
    setInvitations((prev) => prev.filter((i) => i.id !== id))
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "list", label: "Personel Listesi" },
    { key: "detail", label: "Personel Detayi" },
    { key: "add", label: "Yeni Personel Ekle" },
    { key: "leaves", label: "Izin Talepleri" },
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
                "relative whitespace-nowrap py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === "list" && (
        <StaffListTab
          onViewDetail={(staff) => { setSelectedStaff(staff); setActiveTab("detail") }}
          onAddNew={() => setActiveTab("add")}
          staffList={staffList}
          loading={loading}
          onToggle={handleToggle}
          invitations={invitations}
          onCancelInvite={handleCancelInvite}
        />
      )}
      {activeTab === "detail" && selectedStaff && businessId && (
        <StaffDetailTab
          onBack={() => setActiveTab("list")}
          staff={selectedStaff}
          businessId={businessId}
          onDeactivate={handleDeactivate}
        />
      )}
      {activeTab === "add" && businessId && user && (
        <AddStaffTab
          onCancel={() => setActiveTab("list")}
          businessId={businessId}
          userId={user.id}
          onInviteSent={fetchStaff}
        />
      )}
      {activeTab === "leaves" && businessId && user && (
        <LeaveRequestsPatronTab businessId={businessId} userId={user.id} />
      )}
    </>
  )
}
