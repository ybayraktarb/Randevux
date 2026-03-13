"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
  Building2,
  Calendar,
  User,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  QrCode,
  CalendarPlus,
  Clock,
  Phone,
  Plus,
  ArrowRight,
  Loader2,
  X,
  Bell,
  Settings,
  Shield,
  Trash2,
  Mail,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Heart,
  Star,
  Sun,
  Moon,
  Users,
  TrendingUp,
  Ticket,
  MapPin,
  ExternalLink
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { DiscoveryTab } from "@/src/modules/business/components/DiscoveryTab"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import { updateUserProfileAction } from "@/src/modules/auth/actions/auth.actions"
import { leaveBusinessAction } from "@/src/modules/customers/actions/customer.actions"
import { getAppointmentDetailsAction, cancelAppointmentAction } from "@/src/modules/appointments/actions/appointment.actions"
import { addReviewAction } from "@/src/modules/business/actions/business.actions"
import { getFamilyProfilesAction, addFamilyProfileAction, deleteFamilyProfileAction } from "@/src/modules/customers/actions/family.actions"
import { getCustomerStatsAction } from "@/src/modules/core/actions/stats.actions"
import { useTheme } from "next-themes"
import { Html5QrcodeScanner } from "html5-qrcode"

// ─── Helpers ────────────────────────────────────────────────────────
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 6) return "İyi Geceler"
  if (hour < 12) return "Günaydın"
  if (hour < 18) return "İyi Günler"
  return "İyi Akşamlar"
}

// ─── Types ──────────────────────────────────────────────────────────────────────

export type TabView = "kesfet" | "genel" | "randevularim" | "isletmelerim" | "profil"
const defaultTab: TabView = "kesfet"

interface Appointment {
  id: string
  businessId: string
  businessName: string
  businessInitials: string
  services: string
  date: string
  time: string
  fullDate: Date
  staffName: string
  status: "Onaylandı" | "Bekliyor" | "Tamamlandı" | "İptal" | "Gelmedi"
  price?: string
  isWithinHour?: boolean
}

interface Business {
  id: string
  name: string
  initials: string
  category: string
  todayHours?: string
  isOpen?: boolean
  isFavorite?: boolean
}

// ─── QR Scanner Component ────────────────────────────────────────────────────────
function QrScanner({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    )

    scanner.render(
      (decodedText) => {
        onScan(decodedText)
        scanner.clear()
        onClose()
      },
      (error) => {
        // console.warn(error)
      }
    )

    return () => {
      scanner.clear().catch((e) => console.error("Scanner clear error", e))
    }
  }, [onScan, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            QR Kod Tarat
          </h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted transition-colors">
            <X className="size-5" />
          </button>
        </div>
        <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-primary/20" />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          İşletmenin QR kodunu kameranıza okutun.
        </p>
      </div>
    </div>
  )
}

function SectionHeader({
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

// ─── Appointment Card ───────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  compact = false,
  onCancel,
  onRebook,
  onViewDetails,
  onReview,
}: {
  appointment: Appointment
  compact?: boolean
  onCancel?: (id: string, businessId: string, fullDate: Date) => void
  onRebook?: (businessId: string, services: string) => void
  onViewDetails?: (id: string) => void
  onReview?: (apt: Appointment) => void
}) {
  const statusMap: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" | "gray"; color: string }
  > = {
    "Onaylandı": { label: "Onaylandı", variant: "success", color: "bg-emerald-500" },
    "Bekliyor": { label: "Bekliyor", variant: "warning", color: "bg-amber-500" },
    "Tamamlandı": { label: "Tamamlandı", variant: "success", color: "bg-blue-500" },
    "İptal": { label: "İptal Edildi", variant: "gray", color: "bg-gray-400" },
    "Gelmedi": { label: "Gelinmedi", variant: "danger", color: "bg-red-500" },
  }
  const s = statusMap[appointment.status] || { label: appointment.status, variant: "gray", color: "bg-gray-400" }

  const CardWrapper = motion.div

  if (compact) {
    return (
      <CardWrapper
        whileHover={{ x: 4 }}
        className="flex items-center gap-4 rounded-[24px] border border-border bg-card p-4 shadow-sm cursor-pointer hover:border-primary/30 transition-all"
        onClick={() => onViewDetails?.(appointment.id)}
      >
        <div className="relative">
          <RxAvatar name={appointment.businessName} size="sm" />
          <div className={cn("absolute -bottom-1 -right-1 size-3 rounded-full border-2 border-background", s.color)} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-black text-foreground">
            {appointment.businessName}
          </span>
          <span className="truncate text-xs font-bold text-muted-foreground">
            {appointment.date} • {appointment.time}
          </span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </CardWrapper>
    )
  }

  return (
    <CardWrapper
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 cursor-pointer transition-all hover:shadow-2xl hover:shadow-primary/10"
      onClick={() => onViewDetails?.(appointment.id)}
    >
      <div className="flex p-6 gap-6 relative">
        {/* Main Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <RxAvatar name={appointment.businessName} size="lg" className="rounded-2xl border-2 border-gray-50" />
                <div className={cn("absolute -bottom-1 -right-1 size-4 rounded-full border-4 border-white", s.color)} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">{appointment.businessName}</h3>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none mt-1">
                  {appointment.services}
                </p>
              </div>
            </div>
            <div className={cn(
              "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm",
              appointment.status === "Onaylandı" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                appointment.status === "Bekliyor" ? "bg-amber-50 text-amber-600 border-amber-100" :
                  appointment.status === "Tamamlandı" ? "bg-blue-50 text-blue-600 border-blue-100" :
                    "bg-gray-50 text-gray-500 border-gray-100"
            )}>
              {s.label}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50/50 rounded-[20px] p-4 border border-gray-100/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tarih</p>
              <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                <Calendar className="size-4 text-primary" />
                {appointment.date}
              </div>
            </div>
            <div className="bg-gray-50/50 rounded-[20px] p-4 border border-gray-100/50">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Saat</p>
              <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                <Clock className="size-4 text-primary" />
                {appointment.time}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <RxAvatar name={appointment.staffName} size="sm" />
              <span className="text-xs font-bold text-gray-500">{appointment.staffName}</span>
            </div>
            {appointment.price && (
              <span className="text-lg font-black text-primary">{appointment.price}</span>
            )}
          </div>
        </div>

        {/* Ticket Perforation Aesthetic */}
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-4 mr-[-6px] pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="size-3 rounded-full bg-white border border-gray-100 shadow-inner" />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-gray-50/30 border-t border-dashed border-gray-100 p-4 px-6 flex items-center justify-between">
        <div className="flex gap-2">
          {appointment.status === "Tamamlandı" && onReview && (
            <RxButton
              variant="secondary"
              size="sm"
              className="rounded-full bg-white hover:bg-primary/5 border-gray-100 text-primary font-black text-[11px] gap-2 px-4 h-9"
              onClick={(e) => { e.stopPropagation(); onReview(appointment); }}
            >
              <Star className="size-3.5 fill-current" />
              DEĞERLENDİR
            </RxButton>
          )}
          {(appointment.status === "Tamamlandı" || appointment.status === "İptal") && onRebook && (
            <RxButton
              variant="secondary"
              size="sm"
              className="rounded-full bg-white hover:bg-primary/5 border-gray-100 text-gray-700 font-black text-[11px] h-9 px-4"
              onClick={(e) => { e.stopPropagation(); onRebook(appointment.businessId, appointment.services); }}
            >
              TEKRAR AL
            </RxButton>
          )}
        </div>

        <div className="flex gap-3">
          {(appointment.status === "Onaylandı" || appointment.status === "Bekliyor") && onCancel && (
            <button
              className="text-[11px] font-black text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest px-2"
              onClick={(e) => { e.stopPropagation(); onCancel(appointment.id, appointment.businessId, appointment.fullDate); }}
            >
              İptal Et
            </button>
          )}
          <RxButton
            variant="ghost"
            size="sm"
            className="rounded-full text-primary font-black text-[11px] uppercase tracking-widest h-9 px-4 gap-2"
            onClick={(e) => { e.stopPropagation(); onViewDetails?.(appointment.id); }}
          >
            Detaylar
            <ArrowRight className="size-3.5" />
          </RxButton>
        </div>
      </div>
    </CardWrapper>
  )
}

// ─── Genel Bakis (Overview) ─────────────────────────────────────────────────────

function ProfilTab({
  profile,
  onUpdate,
  familyProfiles,
  onAddFamily,
  onDeleteFamily,
  loadingFamily,
  stats,
  loadingStats
}: {
  profile: { name: string; phone: string; notification_settings: any },
  onUpdate: (name: string, phone: string, settings: any) => Promise<void>,
  familyProfiles: any[],
  onAddFamily: (name: string, rel: string) => Promise<void>,
  onDeleteFamily: (id: string) => Promise<void>,
  loadingFamily: boolean,
  stats: any,
  loadingStats: boolean
}) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)
  const [settings, setSettings] = useState(profile.notification_settings)
  const [isSaving, setIsSaving] = useState(false)

  const [showAddFamily, setShowAddFamily] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState("")
  const [newFamilyRel, setNewFamilyRel] = useState("Çocuk")

  const handleSave = async () => {
    setIsSaving(true)
    await onUpdate(name, phone, settings)
    setIsSaving(false)
  }

  const handleAddSubmit = async () => {
    if (!newFamilyName) return
    await onAddFamily(newFamilyName, newFamilyRel)
    setNewFamilyName("")
    setShowAddFamily(false)
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Profil Ayarlarım</h2>
        <p className="text-muted-foreground">Hesap bilgilerinizi, ailenizi ve istatistiklerinizi buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid gap-6">
        {/* Spending Insights */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="font-semibold">İstatistiklerim</h3>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Toplam Harcama</span>
                <span className="text-2xl font-bold text-primary">{stats.totalSpent.toLocaleString('tr-TR')} TL</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Randevu Sayısı</span>
                <span className="text-2xl font-bold">{stats.appointmentCount}</span>
              </div>
              {stats.topServices?.length > 0 && (
                <div className="col-span-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">En Çok Alınan Hizmetler</span>
                  <div className="flex flex-wrap gap-2">
                    {stats.topServices.map((s: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-background border border-border rounded-full text-xs font-medium">
                        {s.name} ({s.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Henüz istatistik bulunmuyor.</p>
          )}
        </div>

        {/* Family Profiles */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="font-semibold">Aile Profilleri</h3>
            </div>
            <RxButton size="sm" variant="secondary" onClick={() => setShowAddFamily(!showAddFamily)}>
              {showAddFamily ? <X className="size-4" /> : <Plus className="size-4" />}
            </RxButton>
          </div>

          {showAddFamily && (
            <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold">Ad Soyad</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Örn: Mehmet Yılmaz"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold">Yakınlık Derecesi</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={newFamilyRel}
                    onChange={(e) => setNewFamilyRel(e.target.value)}
                  >
                    <option>Çocuk</option>
                    <option>Eş</option>
                    <option>Ebeveyn</option>
                    <option>Diğer</option>
                  </select>
                </div>
                <RxButton size="sm" className="w-full mt-1" onClick={handleAddSubmit}>Ekle</RxButton>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {loadingFamily ? (
              <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : familyProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Henüz ekli aile profili yok.</p>
            ) : (
              familyProfiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {p.full_name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{p.full_name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.relationship}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteFamily(p.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <User className="size-5 text-primary" />
            <h3 className="font-semibold">Kişisel Bilgiler</h3>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Ad Soyad</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Telefon</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="size-5 text-primary" />
            <h3 className="font-semibold">Bildirim Tercihleri</h3>
          </div>
          <div className="grid gap-4">
            {[
              { id: 'push', label: 'Push Bildirimleri', desc: 'Randevu güncellemelerini anlık al.', icon: <Smartphone className="size-4" /> },
              { id: 'email', label: 'E-posta', desc: 'Detaylı özetler e-postanıza gelsin.', icon: <Mail className="size-4" /> },
              { id: 'sms', label: 'SMS', desc: 'Önemli hatırlatmalar için kısa mesaj.', icon: <Phone className="size-4" /> },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-muted-foreground">{item.icon}</div>
                  <div className="grid gap-0.5">
                    <span className="text-sm font-medium leading-none">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.desc}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, [item.id]: !settings[item.id] })}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    settings[item.id] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    settings[item.id] ? "translate-x-4" : "translate-x-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <RxButton onClick={handleSave} disabled={isSaving} className="w-full sm:w-fit sm:ml-auto gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Degisiklikleri Kaydet
        </RxButton>
      </div>
    </div>
  )
}

function NotificationBell({ notifications, onMarkAsRead }: { notifications: any[], onMarkAsRead: (id: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-50 w-72 origin-top-right rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-2 px-2 py-1 flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground">Bildirimler</span>
              {unreadCount > 0 && <span className="text-[10px] text-muted-foreground">{unreadCount} okunmamış</span>}
            </div>
            <div className="flex max-h-[300px] flex-col overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Henüz bildiriminiz yok.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex flex-col gap-1 rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer",
                      !n.is_read && "bg-primary/5"
                    )}
                    onClick={() => onMarkAsRead(n.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{n.title}</span>
                      {!n.is_read && <div className="size-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-tight">{n.body}</p>
                    <span className="text-[10px] text-muted-foreground/60">{new Date(n.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function OverviewTab({
  upcoming,
  past,
  businesses,
  onNavigate,
  onCancel,
  userName,
  onJoinBusiness,
  onRebook,
  onLeave,
  notifications,
  onMarkAsRead,
  onViewDetails,
  onReview,
  router,
}: {
  upcoming: Appointment[]
  past: Appointment[]
  businesses: Business[]
  onNavigate: (tab: TabView) => void
  onCancel: (id: string, businessId: string, fullDate: Date) => void
  userName: string
  onJoinBusiness: (code: string) => Promise<void>
  onRebook: (businessId: string, services: string) => void
  onLeave: (id: string) => Promise<void>
  notifications: any[]
  onMarkAsRead: (id: string) => Promise<void>
  onViewDetails: (id: string) => void
  onReview?: (apt: Appointment) => void
  router: any
}) {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
      return (
        <button className="flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted">
          <Sun className="size-5 text-muted-foreground" />
        </button>
      )
    }

    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted"
      >
        {theme === "dark" ? <Sun className="size-5 text-yellow-500" /> : <Moon className="size-5 text-slate-700" />}
      </button>
    )
  }

  const submitJoin = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    await onJoinBusiness(joinCode.trim())
    setIsJoining(false)
    setShowJoinForm(false)
    setJoinCode("")
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Genel Bakış</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Randevularını ve işletmelerini yönet</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
          />
          <RxButton variant="secondary" size="sm" onClick={handleLogout} className="text-red-500 border-red-200 hover:bg-red-50">
            Çıkış Yap
          </RxButton>
        </div>
      </div>

      {/* Hero: Next Appointment removed as it's now on Discovery/Home tab */}

      {/* Upcoming Appointments (excluding the first one if shown in Hero) */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title={upcoming.length > 0 ? "Diğer Yaklaşan Randevular" : "Yaklaşan Randevular"}
          linkText="Tumunu Gor"
          onLink={() => onNavigate("randevularim")}
        />

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-gray-100 bg-gray-50/30 px-6 py-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-[24px] bg-white shadow-lg shadow-gray-200/50">
              <Calendar className="size-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Şu an planlı bir randevunuz yok
            </h3>
            <p className="mt-1 text-xs font-bold text-muted-foreground max-w-[280px]">
              Hayatınıza biraz bakım katmaya ne dersiniz? Hemen yeni bir randevu alabilirsiniz.
            </p>
            <RxButton className="mt-6 rounded-full px-8 h-12 font-black uppercase tracking-widest text-[11px]" onClick={() => onNavigate("isletmelerim")}>
              İşletmelerimi Gör
            </RxButton>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onCancel={onCancel} onViewDetails={onViewDetails} onReview={onReview} />
            ))}
          </div>
        )}
      </section>

      {/* Connected Businesses */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Isletmelerim"
          linkText="Tumunu Gor"
          onLink={() => onNavigate("isletmelerim")}
        />
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="flex w-[200px] shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative"
            >
              <RxAvatar name={b.name} size="lg" />
              {b.isFavorite && (
                <Heart className="absolute right-4 top-4 size-4 fill-red-500 text-red-500" />
              )}
              <span className="text-center text-sm font-semibold text-foreground">
                {b.name}
              </span>
              <span className="text-center text-xs text-muted-foreground">
                {b.category}
              </span>
              <RxButton size="sm" className="w-full" onClick={() => router.push(`/isletme/${b.id}`)}>
                Profili Gor
              </RxButton>
              <RxButton
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => onLeave(b.id)}
              >
                <Trash2 className="size-4" />
              </RxButton>
            </div>
          ))}

          {/* Add Business Card */}
          {showJoinForm ? (
            <div className="flex w-[200px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Isletme Ekle</span>
                <button onClick={() => setShowJoinForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="QR/DAVET KODU"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
              />
              <div className="flex gap-2">
                <RxButton size="sm" variant="secondary" className="flex-1" onClick={() => setShowScanner(true)}>
                  <QrCode className="size-3.5 mr-1" /> Tara
                </RxButton>
                <RxButton size="sm" className="flex-1" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
                  {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Katil"}
                </RxButton>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowJoinForm(true)}
              className="flex w-[200px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-5 hover:border-primary/50 transition-colors"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Plus className="size-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Isletme Ekle
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Past Appointments */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Gecmis Randevular"
          linkText="Tumunu Gor"
          onLink={() => onNavigate("randevularim")}
        />
        <div className="flex flex-col gap-3">
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geçmiş randevunuz bulunmuyor.</p>
          ) : (
            past.slice(0, 3).map((a) => (
              <AppointmentCard key={a.id} appointment={a} compact onRebook={onRebook} onViewDetails={onViewDetails} />
            ))
          )}
        </div>
      </section>

      {/* QR Scanner Overlay */}
      {showScanner && (
        <QrScanner
          onScan={(code) => {
            setJoinCode(code)
            onJoinBusiness(code)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}

// ─── Randevularim Tab ───────────────────────────────────────────────────────────

function AppointmentsTab({
  allAppointments,
  onCancel,
  onRebook,
  onViewDetails,
  onReview
}: {
  allAppointments: Appointment[]
  onCancel: (id: string, businessId: string, fullDate: Date) => void
  onRebook: (businessId: string, services: string) => void
  onViewDetails: (id: string) => void,
  onReview?: (apt: Appointment) => void
}) {
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const filters: {
    id: "all" | "upcoming" | "completed" | "cancelled"
    label: string
  }[] = [
      { id: "all", label: "Tümü" },
      { id: "upcoming", label: "Yaklaşan" },
      { id: "completed", label: "Tamamlanan" },
      { id: "cancelled", label: "İptal" },
    ]

  const filtered = allAppointments.filter((a) => {
    if (filter === "all") return true
    if (filter === "upcoming")
      return a.status === "Onaylandı" || a.status === "Bekliyor"
    if (filter === "completed") return a.status === "Tamamlandı"
    if (filter === "cancelled") return a.status === "İptal" || a.status === "Gelmedi"
    return true
  })

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Info */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Randevularım</h2>
        <p className="text-sm font-bold text-muted-foreground">
          Toplam {allAppointments.length} randevunuz bulunuyor.
        </p>
      </div>

      {/* Filter Tabs - Apple Style Segmented Control */}
      <div className="flex p-1.5 bg-gray-100/80 rounded-2xl w-fit self-start border border-gray-200/50">
        <div className="flex gap-1 relative">
          {filters.map((f) => {
            const isActive = filter === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFilter(f.id)
                  setCurrentPage(1)
                }}
                className={cn(
                  "relative z-10 rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300",
                  isActive
                    ? "text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="filter-active"
                    className="absolute inset-0 bg-white rounded-xl shadow-md -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Appointment List */}
      <div className="flex flex-col gap-6">
        <AnimatePresence mode="popLayout" initial={false}>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-gray-100 bg-gray-50/30 px-6 py-24 text-center"
            >
              <div className="mb-6 flex size-24 items-center justify-center rounded-[32px] bg-white shadow-xl shadow-gray-200/50">
                <Ticket className="size-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900">
                Görüntülenecek randevu yok
              </h3>
              <p className="mt-2 text-sm font-bold text-muted-foreground max-w-[280px]">
                Bu kategoride henüz bir randevunuz bulunmuyor. Keşfet bölümünden yeni yerler bulabilirsiniz!
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  onCancel={onCancel}
                  onRebook={onRebook}
                  onViewDetails={onViewDetails}
                  onReview={onReview}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Pagination - Minimalist */}
      {filtered.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-6 pt-6">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors disabled:opacity-20"
          >
            <ChevronLeft className="size-4 group-hover:-translate-x-1 transition-transform" />
            GERİ
          </button>

          <div className="flex gap-2">
            {[...Array(Math.ceil(filtered.length / itemsPerPage))].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "size-1.5 rounded-full transition-all duration-300",
                  currentPage === i + 1 ? "bg-primary w-6" : "bg-gray-200"
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= filtered.length}
            className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors disabled:opacity-20"
          >
            İLERİ
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Isletmelerim Tab ───────────────────────────────────────────────────────────


function BusinessesTab({ businesses, onJoinBusiness, onLeave }: { businesses: Business[], onJoinBusiness: (c: string) => Promise<void>, onLeave: (id: string) => Promise<void> }) {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const submitJoin = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    await onJoinBusiness(joinCode.trim())
    setIsJoining(false)
    setShowJoinForm(false)
    setJoinCode("")
  }

  return (
    <div className="flex flex-col gap-6">

      {businesses.length === 0 && !showJoinForm && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-12 text-center transition-colors hover:bg-card mb-4 min-h-[300px]">
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="size-10" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            Henüz Hiçbir İşletmeye Katılmadınız
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
            Favori kuaförünüz, güzellik salonunuz veya berberiniz RandevuX kullanıyorsa, kodlarını alarak hemen ekleyin.
          </p>
          <RxButton className="mt-6 gap-2" size="lg" onClick={() => setShowJoinForm(true)}>
            <QrCode className="size-5" /> İşletme Ekle
          </RxButton>
        </div>
      )}

      {businesses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              {/* Cover gradient */}
              <div className="relative h-20 bg-gradient-to-br from-primary/20 to-primary/5">
                <div className="absolute -bottom-5 left-4">
                  <RxAvatar name={b.name} size="lg" />
                </div>
                {b.isFavorite && (
                  <div className="absolute right-3 top-3 rounded-full bg-white/80 p-1 text-red-500 backdrop-blur-sm">
                    <Heart className="size-4 fill-current" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 px-4 pb-4 pt-8">
                <div>
                  <h3 className="text-[15px] font-semibold text-foreground">
                    {b.name}
                  </h3>
                  <RxBadge variant="purple" className="mt-1">
                    {b.category}
                  </RxBadge>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <RxButton
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.location.href = `/isletme/${b.id}`}
                  >
                    Profili Gor
                  </RxButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Business Card - Only show in grid if there are businesses OR if form is explicitly open */}
      {(businesses.length > 0 || showJoinForm) && (
        <>
          {showJoinForm ? (
            <div className="flex min-h-[220px] flex-col justify-center gap-3 rounded-xl border border-border bg-card p-6 shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <span className="text-sm font-semibold">İşletme Kodunu Girin</span>
              <input
                type="text"
                placeholder="QR/DAVET KODU"
                className="w-full rounded-md border border-input px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                autoFocus
              />
              <div className="flex flex-col gap-2 mt-2">
                <RxButton size="sm" variant="secondary" className="w-full" onClick={() => setShowScanner(true)}>
                  <QrCode className="size-3.5 mr-1" /> QR Tara
                </RxButton>
                <div className="flex items-center gap-2">
                  <RxButton variant="ghost" size="sm" onClick={() => setShowJoinForm(false)} className="flex-1">İptal</RxButton>
                  <RxButton size="sm" className="flex-1" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
                    {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Ekle"}
                  </RxButton>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowJoinForm(true)}
              className="group flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-6 transition-all hover:border-primary/50 hover:bg-primary/5"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <Plus className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                Yeni İşletme Ekle
              </span>
              <span className="text-xs text-muted-foreground text-center">
                Kod ile kolayca bağlanın
              </span>
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export function CustomerDashboard({ defaultTab = "kesfet" }: { defaultTab?: TabView }) {
  const router = useRouter()
  const { user } = useCurrentUser()
  const supabase = createClient()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<any[]>([])
  const [profile, setProfile] = useState<{ name: string; phone: string; notification_settings: any }>({
    name: "",
    phone: "",
    notification_settings: { push: true, email: true, sms: false }
  })
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Sprint 5: Family & Stats
  const [familyProfiles, setFamilyProfiles] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<TabView>(defaultTab)
  const [stats, setStats] = useState<any>(null)
  const [loadingFamily, setLoadingFamily] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 0. Fetch user profile from public.users for Sprint 2 data
      const { data: userData } = await supabase
        .from("users")
        .select("name, phone, notification_settings")
        .eq("id", user.id)
        .single()

      if (userData) {
        setProfile({
          name: userData.name || "",
          phone: userData.phone || "",
          notification_settings: userData.notification_settings || { push: true, email: true, sms: false }
        })
      }

      // Fetch notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      setNotifications(notifData || [])

      // 1. Fetch appointments
      const { data: aptData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, business_id, business:businesses(name, category), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("customer_user_id", user.id)
        .order("appointment_date", { ascending: false })
        .order("start_time", { ascending: false })

      const mappedApts: Appointment[] = (aptData || []).map((a) => {
        const bRow = Array.isArray(a.business) ? a.business[0] : a.business
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null

        const svcNames = aptSvcs.map((s) => {
          const svc = Array.isArray(s.service) ? s.service[0] : s.service
          return svc?.name || ""
        }).filter(Boolean).join(", ")

        const dateStr = a.appointment_date + "T00:00:00"
        const fullDateObj = new Date(`${a.appointment_date}T${a.start_time}`)
        const timeParts = String(a.start_time).split(":")
        const endParts = String(a.end_time).split(":")

        const diffMs = fullDateObj.getTime() - new Date().getTime()
        const isWithinHour = diffMs > 0 && diffMs <= 60 * 60 * 1000

        return {
          id: a.id,
          businessId: a.business_id,
          businessName: bRow?.name || "?",
          businessInitials: (bRow?.name || "?").substring(0, 2).toUpperCase(),
          services: svcNames || "Hizmet belirtilmedi",
          date: new Date(dateStr).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" }),
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
          fullDate: fullDateObj,
          staffName: staffUser?.name || "?",
          status: a.status as any,
          price: `${a.total_price} TL`,
          isWithinHour
        }
      })
      setAppointments(mappedApts)

      // 2. Fetch businesses
      const { data: bData, error: bqErr } = await supabase
        .from("business_customers")
        .select("*, business:businesses(id, name, category, logo_url)")
        .eq("user_id", user.id)
        .eq("is_blocked", false)

      // Fetch favorites
      const { data: favData } = await supabase
        .from("user_favorites")
        .select("business_id")
        .eq("user_id", user.id)

      const favIds = new Set(favData?.map(f => f.business_id) || [])

      const mappedBiz: Business[] = (bData || []).map((b) => {
        const bRow = Array.isArray(b.business) ? b.business[0] : b.business
        if (!bRow) return null
        return {
          id: bRow.id,
          name: bRow.name || "?",
          initials: (bRow.name || "?").substring(0, 2).toUpperCase(),
          category: bRow.category || "Genel",
          isFavorite: favIds.has(bRow.id)
        }
      }).filter(Boolean) as Business[]

      // Sort favorites to top
      mappedBiz.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1
        if (!a.isFavorite && b.isFavorite) return 1
        return 0
      })

      setBusinesses(mappedBiz)

      // Fetch Family and Stats
      setLoadingFamily(true)
      setLoadingStats(true)
      const [familyRes, statsRes] = await Promise.all([
        getFamilyProfilesAction(),
        getCustomerStatsAction()
      ])
      if (familyRes.success) setFamilyProfiles(familyRes.data || [])
      if (statsRes.success) setStats(statsRes.data)
      setLoadingFamily(false)
      setLoadingStats(false)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFamilyProfile = async (fullName: string, relationship: string) => {
    const res = await addFamilyProfileAction({ fullName, relationship })
    if (res.success) {
      toast.success("Aile profili eklendi.")
      // Re-fetch family
      const familyRes = await getFamilyProfilesAction()
      if (familyRes.success) setFamilyProfiles(familyRes.data || [])
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  const handleDeleteFamilyProfile = async (id: string) => {
    if (!confirm("Bu profili silmek istediğinize emin misiniz?")) return
    const res = await deleteFamilyProfileAction(id)
    if (res.success) {
      toast.success("Profil silindi.")
      setFamilyProfiles(prev => prev.filter(p => p.id !== id))
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  useEffect(() => {
    fetchData()
  }, [user, supabase])

  const handleCancelAppointment = async (aptId: string, bizId: string, fullDate: Date) => {
    const { data: bData } = await supabase.from("businesses").select("cancellation_buffer_minutes").eq("id", bizId).single()
    const buffer = bData?.cancellation_buffer_minutes || 60

    const diffMs = fullDate.getTime() - new Date().getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < buffer) {
      toast.error(`Randevuya ${buffer} dakikadan az kaldığı için iptal edilemez. Lütfen işletme ile iletişime geçin.`)
      return
    }

    const reasons = ["Plan değişikliği", "Acil durum", "Hatalı kayıt", "Diğer"]
    const reason = prompt("İptal nedeninizi seçin:\n" + reasons.join(", "), reasons[0])

    if (reason === null) return // Cancelled prompt
    if (!confirm("Randevuyu iptal etmek istediğinize emin misiniz?")) return

    const res = await cancelAppointmentAction(aptId, bizId, reason)

    if (res.success) {
      toast.success("Randevu başarıyla iptal edildi.")
      // Notify staff
      try {
        const { data: aptRow } = await supabase.from("appointments").select("staff_business_id, appointment_date, start_time").eq("id", aptId).maybeSingle()
        if (aptRow?.staff_business_id) {
          const { data: sb } = await supabase.from("staff_business").select("user_id").eq("id", aptRow.staff_business_id).maybeSingle()
          if (sb?.user_id) {
            await createNotificationAction({
              userId: sb.user_id,
              type: "appointment_cancelled",
              title: "Müşteri randevuyu iptal etti",
              body: `${aptRow.appointment_date} tarihinde saat ${String(aptRow.start_time).slice(0, 5)}\nNeden: ${reason}`,
              relatedId: aptId,
              relatedType: "appointment"
            })
          }
        }
      } catch (e) { console.error("[Notification]", e) }

      try {
        await logAuditAction({ action: "updated", targetTable: "appointments", targetId: aptId })
      } catch (err) { console.error("[Audit]", err) }

      fetchData()
      if (showDetails) setShowDetails(false)
    } else {
      toast.error(res.error || "İptal işleminde bir sorun oluştu.")
    }
  }

  const handleViewDetails = async (id: string) => {
    setSelectedAppointment(null)
    setShowDetails(true)
    setDetailLoading(true)

    const res = await getAppointmentDetailsAction(id)
    if (res.success) {
      setSelectedAppointment(res.data)
    } else {
      toast.error(res.error || "Randevu detayları yüklenemedi.")
      setShowDetails(false)
    }
    setDetailLoading(false)
  }

  const handleOpenReviewModal = (apt: Appointment) => {
    setReviewAppointment(apt)
    setRating(5)
    setComment("")
    setReviewModalOpen(true)
  }

  const handleAddReview = async () => {
    if (!reviewAppointment) return
    setIsSubmittingReview(true)
    const res = await addReviewAction({
      businessId: reviewAppointment.businessId,
      rating,
      comment,
      appointmentId: reviewAppointment.id
    })
    setIsSubmittingReview(false)
    if (res.success) {
      toast.success("Değerlendirmeniz için teşekkürler!")
      setReviewModalOpen(false)
      fetchData()
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  const generateCalendarUrl = (apt: any) => {
    if (!apt) return ""
    const start = new Date(`${apt.appointment_date}T${apt.start_time}`).toISOString().replace(/-|:|\.\d+/g, "")
    const end = new Date(new Date(`${apt.appointment_date}T${apt.start_time}`).getTime() + apt.total_duration_minutes * 60000).toISOString().replace(/-|:|\.\d+/g, "")
    const title = `${apt.businesses?.name} Randevusu`
    const details = `Hizmetler: ${apt.appointment_services?.map((s: any) => s.services?.name).join(", ")}`
    const location = apt.businesses?.address || ""

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  }

  const handleJoinBusiness = async (code: string) => {
    if (!user) return
    const cleanedCode = code.replace(/\s+/g, '').toUpperCase()
    if (!cleanedCode) return

    // Debugging: Log the attempt
    console.log("[Join] Attempting to join with code:", cleanedCode)

    const { data: matchedBiz, error: searchError } = await supabase
      .from("businesses")
      .select("id, name")
      .or(`qr_code.eq.${cleanedCode},invite_code.eq.${cleanedCode}`)
      .maybeSingle()

    if (searchError) {
      console.error("[Join] Search error:", searchError)
      toast.error("İşletme aranırken bir hata oluştu: " + searchError.message)
      return
    }

    if (!matchedBiz) {
      toast.error("İşletme kodu bulunamadı veya geçersiz. Lütfen kodu kontrol edin.")
      return
    }

    console.log("[Join] Found business:", matchedBiz.name, matchedBiz.id)

    const { error: joinError } = await supabase.from("business_customers").insert({
      user_id: user.id,
      business_id: matchedBiz.id
    })

    if (!joinError || joinError.code === "23505") { // Success or unique constraint violation (already joined)
      toast.success(`${matchedBiz.name} başarıyla eklendi! ✨`)
      fetchData()
    } else {
      console.error("[Join] Join error:", joinError)
      toast.error("İşletmeye katılırken bir hata oluştu: " + joinError.message)
    }
  }

  const handleNavigate = (tab: TabView) => {
    if (tab === "genel") router.push("/musteri-panel")
    if (tab === "randevularim") router.push("/randevularim")
    if (tab === "isletmelerim") router.push("/isletme")
    if (tab === "profil") router.push("/profil")
    if (tab === "kesfet") router.push("/kesfet") // Assuming a route for discovery
  }

  const handleRebook = (businessId: string, services: string) => {
    // Basic service extraction for prefill. It roughly works if services match names to IDs somewhat, but usually, Next app might need ID, we pass string that booking-flow might fail to parse perfectly if it expects IDs. 
    // Ideally we'd store service IDs in the appointment_services and pass them.
    // For now, we'll route to booking flow. Since we don't have exact IDs easily available in this view's compact mode without a query update, we route to the business.
    router.push(`/isletme/${businessId}`)
    toast.info("İşletme sayfasına yönlendirildiniz, buradan aynı hizmetleri seçebilirsiniz.")
  }

  const handleLeaveBusiness = async (businessId: string) => {
    if (!confirm("Bu işletmeden ayrılmak istediğinize emin misiniz?")) return

    const res = await leaveBusinessAction(businessId)
    if (res.success) {
      toast.success("İşletmeden başarıyla ayrıldınız.")
      fetchData() // Refresh
    } else {
      const errorMsg = typeof res.error === 'string' ? res.error : res.error?.message
      toast.error(errorMsg || "İşletmeden ayrılırken bir hata oluştu.")
    }
  }

  const handleUpdateProfile = async (name: string, phone: string, settings: any) => {
    const res = await updateUserProfileAction(name, phone, settings)
    if (res.success) {
      toast.success("Profiliniz güncellendi.")
      fetchData()
    } else {
      const errorMsg = typeof res.error === 'string' ? res.error : res.error?.message
      toast.error(errorMsg || "Profil güncellenirken bir hata oluştu.")
    }
  }

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-10 p-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
        </div>
        <div className="h-32 w-full bg-muted rounded-2xl" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-muted rounded-md" />
            <div className="h-4 w-16 bg-muted rounded-md" />
          </div>
          <div className="h-24 w-full bg-muted rounded-xl" />
          <div className="h-24 w-full bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  const now = new Date().getTime()
  const upcoming = appointments.filter(a => (a.status === "Onaylandı" || a.status === "Bekliyor") && a.fullDate.getTime() > now).reverse() // We ordered desc, reverse so nearest is first
  const past = appointments.filter(a => !upcoming.find(u => u.id === a.id))

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || ""

  return (
    <>
      {activeTab === "kesfet" && (
        <DiscoveryTab
          userName={userName}
          upcomingAppointment={upcoming[0]}
          onViewDetails={handleViewDetails}
        />
      )}
      {activeTab === "genel" && (
        <OverviewTab
          upcoming={upcoming}
          past={past}
          businesses={businesses}
          onNavigate={setActiveTab}
          onCancel={handleCancelAppointment}
          userName={userName}
          onJoinBusiness={handleJoinBusiness}
          onRebook={handleRebook}
          onLeave={handleLeaveBusiness}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onViewDetails={handleViewDetails}
          onReview={handleOpenReviewModal}
          router={router}
        />
      )}
      {activeTab === "randevularim" && (
        <AppointmentsTab
          allAppointments={appointments}
          onCancel={handleCancelAppointment}
          onRebook={handleRebook}
          onViewDetails={handleViewDetails}
          onReview={handleOpenReviewModal}
        />
      )}
      {activeTab === "isletmelerim" && (
        <BusinessesTab
          businesses={businesses}
          onJoinBusiness={handleJoinBusiness}
          onLeave={handleLeaveBusiness}
        />
      )}
      {activeTab === "profil" && (
        <ProfilTab
          profile={profile}
          onUpdate={handleUpdateProfile}
          familyProfiles={familyProfiles}
          onAddFamily={handleAddFamilyProfile}
          onDeleteFamily={handleDeleteFamilyProfile}
          loadingFamily={loadingFamily}
          stats={stats}
          loadingStats={loadingStats}
        />
      )}

      {/* Appointment Details Modal */}
      <RxModal
        open={showDetails}
        onClose={() => setShowDetails(false)}
        title="Randevu Detayları"
      >
        {detailLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Randevu detayları yükleniyor...</p>
          </div>
        ) : selectedAppointment ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4 border border-border">
              <div className="flex items-center justify-between font-bold">
                <span className="text-lg">{selectedAppointment.businesses?.name}</span>
                <span className="text-primary">{selectedAppointment.total_price} TL</span>
              </div>
              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" />
                  <span>{new Date(selectedAppointment.appointment_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" />
                  <span>{String(selectedAppointment.start_time).slice(0, 5)} - {selectedAppointment.total_duration_minutes} dk</span>
                </div>
                {selectedAppointment.staff_business?.users?.name && (
                  <div className="flex items-center gap-2">
                    <User className="size-4" />
                    <span>Uzman: {selectedAppointment.staff_business.users.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              <h4 className="text-sm font-bold uppercase text-muted-foreground">Alınan Hizmetler</h4>
              <div className="grid gap-2">
                {selectedAppointment.appointment_services?.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                    <span>{s.services?.name}</span>
                    <span className="font-medium">{s.price_snapshot} TL</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedAppointment.businesses?.address && (
              <div className="grid gap-2">
                <h4 className="text-sm font-bold uppercase text-muted-foreground">Konum</h4>
                <div className="flex items-start gap-2 text-sm">
                  <Building2 className="mt-1 size-4 shrink-0" />
                  <p>{selectedAppointment.businesses.address}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedAppointment.businesses.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  Haritada Gör <ArrowRight className="size-3" />
                </a>
              </div>
            )}

            <div className="grid gap-3 pt-4 border-t border-border">
              <div className="flex flex-col gap-2">
                <a
                  href={generateCalendarUrl(selectedAppointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  <CalendarPlus className="size-4" /> Takvime Ekle
                </a>

                {(selectedAppointment.status === 'confirmed' || selectedAppointment.status === 'pending') && (
                  <RxButton
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleCancelAppointment(selectedAppointment.id, selectedAppointment.business_id, new Date(`${selectedAppointment.appointment_date}T${selectedAppointment.start_time}`))}
                  >
                    Randevuyu İptal Et
                  </RxButton>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">Randevu detayları bulunamadı.</div>
        )}
      </RxModal>

      {/* Review Modal */}
      <RxModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="Randevuyu Değerlendir"
        footer={
          <div className="flex gap-2 w-full">
            <RxButton variant="ghost" className="flex-1" onClick={() => setReviewModalOpen(false)}>Vazgeç</RxButton>
            <RxButton
              variant="primary"
              className="flex-1"
              onClick={handleAddReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? <Loader2 className="size-4 animate-spin" /> : "Gönder"}
            </RxButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            {reviewAppointment?.businessName} işletmesindeki randevunuz nasıldı?
          </p>

          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setRating(s)}
                className="transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              >
                <Star
                  className={cn(
                    "size-8",
                    s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Yorumunuz (İsteğe bağlı)</label>
            <textarea
              className="min-h-[100px] w-full rounded-xl border border-border bg-muted/30 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Deneyiminizi paylaşın..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </RxModal>
    </>
  )
}
