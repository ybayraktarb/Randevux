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
  X
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── Types ──────────────────────────────────────────────────────────────────────

type TabView = "genel" | "randevularim" | "isletmelerim" | "profil"

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
  status: "confirmed" | "pending" | "completed" | "cancelled" | "no_show"
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
}: {
  appointment: Appointment
  compact?: boolean
  onCancel?: (id: string, businessId: string, fullDate: Date) => void
}) {
  const statusMap: Record<
    string,
    { label: string; variant: "success" | "warning" | "danger" | "gray" }
  > = {
    confirmed: { label: "Onaylandi", variant: "success" },
    pending: { label: "Bekliyor", variant: "warning" },
    completed: { label: "Tamamlandi", variant: "success" },
    cancelled: { label: "Iptal Edildi", variant: "gray" },
    no_show: { label: "Gelinmedi", variant: "danger" },
  }
  const s = statusMap[appointment.status] || { label: appointment.status, variant: "gray" }

  if (compact) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <RxAvatar name={appointment.businessName} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">
              {appointment.businessName}
            </span>
            <RxBadge variant={s.variant}>{s.label}</RxBadge>
          </div>
          <span className="truncate text-[13px] text-muted-foreground">
            {appointment.services}
          </span>
          <span className="text-[13px] text-muted-foreground">
            {appointment.date}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {appointment.price && (
            <span className="text-sm font-semibold text-primary">
              {appointment.price}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      {/* Left colored strip */}
      <div className={cn("w-1 shrink-0", appointment.status === "cancelled" || appointment.status === "no_show" ? "bg-muted-foreground" : "bg-primary")} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <RxAvatar name={appointment.businessName} size="md" />
            <span className="text-[15px] font-semibold text-foreground">
              {appointment.businessName}
            </span>
          </div>
          <RxBadge variant={s.variant}>{s.label}</RxBadge>
        </div>

        {/* Services */}
        <p className="text-sm text-muted-foreground">{appointment.services}</p>

        {/* Details row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5" />
            {appointment.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {appointment.time}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="size-3.5" />
            {appointment.staffName}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2">
          {appointment.isWithinHour && (appointment.status === "confirmed" || appointment.status === "pending") ? (
            <RxButton variant="danger" size="sm" onClick={() => alert("İşletmeyi aramak için mobil cihaz kullanın.")}>
              <Phone className="size-3.5" />
              Berberi Ara
            </RxButton>
          ) : (
            <>
              {(appointment.status === "confirmed" || appointment.status === "pending") && onCancel && (
                <RxButton variant="danger" size="sm" onClick={() => onCancel(appointment.id, appointment.businessId, appointment.fullDate)}>
                  Iptal Et
                </RxButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Genel Bakis (Overview) ─────────────────────────────────────────────────────

function OverviewTab({
  upcoming,
  past,
  businesses,
  onNavigate,
  onCancel,
  userName,
  onJoinBusiness
}: {
  upcoming: Appointment[],
  past: Appointment[],
  businesses: Business[],
  onNavigate: (tab: TabView) => void,
  onCancel: (id: string, businessId: string, fullDate: Date) => void,
  userName: string,
  onJoinBusiness: (code: string) => Promise<void>
}) {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
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
        <h1 className="text-xl font-bold">Hosgeldin, {userName || "Misafir"}</h1>
        <RxButton variant="secondary" size="sm" onClick={handleLogout} className="text-red-500 border-red-200 hover:bg-red-50">
          Cikis Yap
        </RxButton>
      </div>
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {`Merhaba, ${userName} \uD83D\uDC4B`}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Yaklasan randevulariniz ve bagli isletmeleriniz asagida.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Yaklasan Randevular"
          linkText="Tumunu Gor"
          onLink={() => onNavigate("randevularim")}
        />

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-light text-primary">
              <Calendar className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Yaklasan randevunuz bulunmuyor
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Hemen yeni bir randevu olusturun.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onCancel={onCancel} />
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
              className="flex w-[200px] shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <RxAvatar name={b.name} size="lg" />
              <span className="text-center text-sm font-semibold text-foreground">
                {b.name}
              </span>
              <span className="text-center text-xs text-muted-foreground">
                {b.category}
              </span>
              <RxButton size="sm" className="w-full" onClick={() => window.location.href = `/isletme/${b.id}`}>
                Profili Gor
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
                placeholder="QR/Davet Kodu"
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <RxButton size="sm" className="w-full" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
                {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Katil"}
              </RxButton>
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
            <p className="text-sm text-muted-foreground">Gecmis randevunuz bulunmuyor.</p>
          ) : (
            past.slice(0, 3).map((a) => (
              <AppointmentCard key={a.id} appointment={a} compact />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

// ─── Randevularim Tab ───────────────────────────────────────────────────────────

function AppointmentsTab({
  allAppointments,
  onCancel,
}: {
  allAppointments: Appointment[]
  onCancel: (id: string, businessId: string, fullDate: Date) => void
}) {
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const filters: {
    id: "all" | "upcoming" | "completed" | "cancelled"
    label: string
  }[] = [
      { id: "all", label: "Tumu" },
      { id: "upcoming", label: "Yaklasan" },
      { id: "completed", label: "Tamamlanan" },
      { id: "cancelled", label: "Iptal/No-Show" },
    ]

  const filtered = allAppointments.filter((a) => {
    if (filter === "all") return true
    if (filter === "upcoming")
      return a.status === "confirmed" || a.status === "pending"
    if (filter === "completed") return a.status === "completed"
    if (filter === "cancelled") return a.status === "cancelled" || a.status === "no_show"
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setFilter(f.id)
              setCurrentPage(1)
            }}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-primary-light"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Appointment List */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary-light text-primary">
              <Calendar className="size-7" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              Randevu bulunamadi
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bu filtreyle eslesen randevu yok.
            </p>
          </div>
        ) : (
          filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a) => <AppointmentCard key={a.id} appointment={a} onCancel={onCancel} />)
        )}
      </div>

      {/* Pagination */}
      {filtered.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
            Onceki
          </button>
          <span className="text-sm font-medium text-muted-foreground px-4">Sayfa {currentPage}</span>
          <button
            type="button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage * itemsPerPage >= filtered.length}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Sonraki
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Isletmelerim Tab ───────────────────────────────────────────────────────────

function BusinessesTab({ businesses, onJoinBusiness }: { businesses: Business[], onJoinBusiness: (c: string) => Promise<void> }) {
  const [showJoinForm, setShowJoinForm] = useState(false)
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

      {/* Add Business Card */}
      {showJoinForm ? (
        <div className="flex min-h-[220px] flex-col justify-center gap-3 rounded-xl border border-border bg-card p-6">
          <span className="text-sm font-semibold">Isletme Kodunu Girin</span>
          <input
            type="text"
            placeholder="QR/Davet Kodu"
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
          />
          <div className="flex items-center gap-2 mt-2">
            <RxButton variant="ghost" size="sm" onClick={() => setShowJoinForm(false)} className="flex-1">Iptal</RxButton>
            <RxButton size="sm" className="flex-1" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
              {isJoining ? <Loader2 className="size-4 animate-spin" /> : "Ekle"}
            </RxButton>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowJoinForm(true)}
          className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-primary-light"
        >
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Plus className="size-6 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            Isletme Ekle
          </span>
          <span className="text-xs text-muted-foreground">
            QR kod veya davet koduyla baglanin
          </span>
        </button>
      )}
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export function CustomerDashboard({ defaultTab = "genel" }: { defaultTab?: "genel" | "randevularim" | "isletmelerim" | "profil" }) {
  const router = useRouter()
  const { user } = useCurrentUser()
  const supabase = createClient()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!user) return
    setLoading(true)

    try {
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
      const { data: bData } = await supabase
        .from("business_customers")
        .select("*, business:businesses(id, name, category)")
        .eq("user_id", user.id)
        .eq("is_blocked", false)

      const mappedBiz: Business[] = (bData || []).map((b) => {
        const bRow = Array.isArray(b.business) ? b.business[0] : b.business
        if (!bRow) return null
        return {
          id: bRow.id,
          name: bRow.name || "?",
          initials: (bRow.name || "?").substring(0, 2).toUpperCase(),
          category: bRow.category || "Genel"
        }
      }).filter(Boolean) as Business[]
      setBusinesses(mappedBiz)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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
      toast?.error ? toast.error(`Randevuya ${buffer} dakikadan az kaldıgı icin iptal edilemez.`) : alert(`Hata: Randevuya ${buffer} dakikadan az kaldıgı icin iptal edilemez. lutfen isletmeyi arayin.`)
      return
    }

    if (!confirm("Randevuyu iptal etmek istediginize emin misiniz?")) return

    const { error } = await supabase.from("appointments").update({
      status: 'cancelled',
      cancelled_by: 'customer',
      cancelled_at: new Date().toISOString()
    }).eq("id", aptId)

    if (!error) {
      toast?.success ? toast.success("Randevu iptal edildi") : null

      // Notify staff
      try {
        const { createNotification } = await import("@/lib/notifications")
        const { data: aptRow } = await supabase.from("appointments").select("staff_business_id, appointment_date, start_time").eq("id", aptId).maybeSingle()
        if (aptRow?.staff_business_id) {
          const { data: sb } = await supabase.from("staff_business").select("user_id").eq("id", aptRow.staff_business_id).maybeSingle()
          if (sb?.user_id) {
            await createNotification(supabase, { userId: sb.user_id, type: "appointment_cancelled", title: "Musteri randevuyu iptal etti", body: `${aptRow.appointment_date} tarihinde saat ${String(aptRow.start_time).slice(0, 5)}`, relatedId: aptId, relatedType: "appointment" })
          }
        }
      } catch (e) { console.error("[Notification]", e) }

      // Audit
      try { const { logAudit } = await import("@/lib/audit"); if (user) await logAudit(supabase, { userId: user.id, action: "updated", targetTable: "appointments", targetId: aptId }) } catch { }

      fetchData()
    } else {
      toast?.error ? toast.error("Iptal isleminde bir sorun olustu") : null
    }
  }

  const handleJoinBusiness = async (code: string) => {
    if (!user) return
    const { data: matchedBiz } = await supabase
      .from("businesses")
      .select("id")
      .or(`qr_code.eq.${code},invite_code.eq.${code}`)
      .maybeSingle()

    if (!matchedBiz) {
      toast?.error ? toast.error("Isletme kodu bulunamadi veya gecersiz.") : alert("Isletme kodu bulunamadi.")
      return
    }

    const { error } = await supabase.from("business_customers").insert({
      user_id: user.id,
      business_id: matchedBiz.id
    })

    if (!error || error.code === "23505") { // Success or unique constraint violation (already joined)
      toast?.success ? toast.success("Isletme basariyla eklendi!") : alert("Isletme başarıyla eklendi!")
      fetchData()
    } else {
      toast?.error ? toast.error("Isletme eklenirken bir hata olustu.") : null
    }
  }

  const handleNavigate = (tab: "genel" | "randevularim" | "isletmelerim" | "profil") => {
    if (tab === "genel") router.push("/musteri-panel")
    if (tab === "randevularim") router.push("/randevularim")
    if (tab === "isletmelerim") router.push("/isletme")
    if (tab === "profil") router.push("/profil")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  const now = new Date().getTime()
  const upcoming = appointments.filter(a => (a.status === "confirmed" || a.status === "pending") && a.fullDate.getTime() > now).reverse() // We ordered desc, reverse so nearest is first
  const past = appointments.filter(a => !upcoming.find(u => u.id === a.id))

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || ""

  return (
    <>
      {defaultTab === "genel" && (
        <OverviewTab
          upcoming={upcoming}
          past={past}
          businesses={businesses}
          onNavigate={handleNavigate}
          onCancel={handleCancelAppointment}
          userName={userName}
          onJoinBusiness={handleJoinBusiness}
        />
      )}
      {defaultTab === "randevularim" && (
        <AppointmentsTab
          allAppointments={appointments}
          onCancel={handleCancelAppointment}
        />
      )}
      {defaultTab === "isletmelerim" && (
        <BusinessesTab
          businesses={businesses}
          onJoinBusiness={handleJoinBusiness}
        />
      )}
      {defaultTab === "profil" && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary-light text-primary mb-4">
            <User className="size-8" />
          </div>
          <h2 className="text-xl font-semibold">Profilim</h2>
          <p className="text-muted-foreground mt-2">Profil ayarlari cok yakinda eklenecek.</p>
        </div>
      )}
    </>
  )
}
