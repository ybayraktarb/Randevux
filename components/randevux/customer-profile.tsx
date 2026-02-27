"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Users,
  UserPlus,
  UserX,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  CalendarPlus,
  FileText,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxTextarea } from "./rx-input"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  totalAppointments: number
  noShow: number
  lastAppointment: string
  status: "aktif" | "no-show-risk"
  createdAt?: string
}

interface AppointmentHistory {
  id: string
  dayNum: string
  month: string
  service: string
  duration: string
  staff: string
  time: string
  price: string
  status: "confirmed" | "completed" | "pending" | "cancelled" | "no_show"
}

interface StaffNote {
  id: string
  author: string
  date: string
  appointmentChip: string
  text: string
}

// ─── Tab 1: Musteri Listesi ─────────────────────────────────────────────────────

function CustomerListTab({ customers, loading, totalCount, noShowRiskCount, onViewProfile }: {
  customers: Customer[]
  loading: boolean
  totalCount: number
  noShowRiskCount: number
  onViewProfile: (c: Customer) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")

  const filtered = customers.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())
    if (filter === "duzenli") return matchesSearch && c.status === "aktif" && c.totalAppointments >= 5
    if (filter === "no-show") return matchesSearch && c.status === "no-show-risk"
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">Musteriler</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{totalCount} kayitli musteri</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Musteri ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-[300px] max-w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          >
            <option value="all">Tum Musteriler</option>
            <option value="duzenli">Duzenli</option>
            <option value="no-show">No-Show Riski</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
            <Users className="size-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-foreground">{totalCount}</span>
            <span className="text-[13px] text-muted-foreground">Toplam Musteri</span>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#ECFDF5]">
            <UserPlus className="size-5 text-[#10B981]" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-foreground">{customers.filter(c => {
              if (!c.createdAt) return false
              const d = new Date(c.createdAt)
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}</span>
            <span className="text-[13px] text-muted-foreground">Bu Ay Yeni</span>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F3]">
            <UserX className="size-5 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-semibold text-foreground">{noShowRiskCount}</span>
            <span className="text-[13px] text-muted-foreground">No-Show Riski</span>
            <span className="text-xs text-accent">{"3+ no-show kaydi olan"}</span>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Musteri</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Telefon</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Toplam Randevu</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">No-Show</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Son Randevu</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Durum</th>
                <th className="px-5 py-3 text-left text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">Musteri bulunamadi</td></tr>
              )}
              {filtered.map((customer) => (
                <tr key={customer.id} className={cn("border-b border-border transition-colors hover:bg-primary-light", customer.status === "no-show-risk" && "bg-[#FFF0F3]/40")}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <RxAvatar name={customer.name} size="sm" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-foreground">{customer.phone}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold text-foreground">{customer.totalAppointments}</td>
                  <td className="px-5 py-3">
                    {customer.noShow >= 3 ? (
                      <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                        <UserX className="size-3.5" />
                        {customer.noShow}
                      </span>
                    ) : (
                      <span className={cn("text-[13px]", customer.noShow === 0 ? "text-[#10B981] font-medium" : "text-foreground")}>{customer.noShow}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{customer.lastAppointment}</td>
                  <td className="px-5 py-3">
                    {customer.status === "aktif" ? (
                      <RxBadge variant="success">Aktif</RxBadge>
                    ) : (
                      <RxBadge variant="danger">No-Show Riski</RxBadge>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onViewProfile(customer)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary"
                    >
                      <Eye className="size-3.5" />
                      Profil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
          <span className="text-[13px] text-muted-foreground">{filtered.length} musteri gosteriliyor</span>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 2: Musteri Profili ─────────────────────────────────────────────────────

function CustomerProfileTab({ customer, onBack, businessId }: { customer: Customer; onBack: () => void; businessId: string }) {
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "upcoming" | "past">("all")
  const [appointments, setAppointments] = useState<AppointmentHistory[]>([])
  const [notes, setNotes] = useState<StaffNote[]>([])
  const [newNoteText, setNewNoteText] = useState("")
  const [linkedAppointmentId, setLinkedAppointmentId] = useState<string | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [totalSpent, setTotalSpent] = useState(0)
  const [mostUsedService, setMostUsedService] = useState("")
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { user } = useCurrentUser()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
        setDeleteConfirmId(null)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    async function fetchCustomerData() {
      // Appointments
      const { data: aptData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, total_price, services:appointment_services(service:services(name), duration_snapshot), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("customer_user_id", customer.id)
        .eq("business_id", businessId)
        .order("appointment_date", { ascending: false })
        .limit(20)

      const mapped: AppointmentHistory[] = (aptData || []).map((a) => {
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const totalDuration = aptSvcs.reduce((sum, s) => sum + (s.duration_snapshot || 0), 0)
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const dateObj = new Date(a.appointment_date + "T00:00:00")
        const startParts = String(a.start_time).split(":")
        const endParts = String(a.end_time).split(":")
        return {
          id: a.id,
          dayNum: String(dateObj.getDate()),
          month: dateObj.toLocaleDateString("tr-TR", { month: "short" }),
          service: svcObj?.name || "?",
          duration: `${totalDuration} dk`,
          staff: staffUser?.name || "?",
          time: `${startParts[0]?.padStart(2, "0")}:${startParts[1]?.padStart(2, "0")} - ${endParts[0]?.padStart(2, "0")}:${endParts[1]?.padStart(2, "0")}`,
          price: String(Number(a.total_price) || 0),
          status: a.status as AppointmentHistory["status"],
        }
      })
      setAppointments(mapped)

      // Total spent
      const spent = (aptData || []).filter(a => a.status === "completed").reduce((sum, a) => sum + (Number(a.total_price) || 0), 0)
      setTotalSpent(spent)

      // Most used service
      const svcCounts: Record<string, number> = {}
        ; (aptData || []).forEach(a => {
          const aptSvcs = Array.isArray(a.services) ? a.services : []
          aptSvcs.forEach(as => {
            const svc = Array.isArray(as.service) ? as.service[0] : as.service
            if (svc?.name) svcCounts[svc.name] = (svcCounts[svc.name] || 0) + 1
          })
        })
      const top = Object.entries(svcCounts).sort((a, b) => b[1] - a[1])[0]
      setMostUsedService(top ? top[0] : "-")

      // Notes
      const { data: noteData } = await supabase
        .from("customer_notes")
        .select("id, note, created_at, staff:staff_business(user:users(name))")
        .eq("customer_user_id", customer.id)
        .order("created_at", { ascending: false })

      setNotes((noteData || []).map(n => {
        const staffRow = Array.isArray(n.staff) ? n.staff[0] : n.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        return {
          id: n.id,
          author: staffUser?.name || "?",
          date: new Date(n.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
          appointmentChip: "",
          text: n.note,
        }
      }))
    }
    fetchCustomerData()
  }, [customer.id, businessId, supabase])

  const filteredAppointments = appointments.filter((a) => {
    if (appointmentFilter === "upcoming") return a.status === "confirmed" || a.status === "pending"
    if (appointmentFilter === "past") return a.status === "completed"
    return true
  })

  const handleSaveNote = async () => {
    if (!newNoteText.trim() || !user) return

    // Find staff_business_id for current user
    const { data: staffRow } = await supabase
      .from("staff_business")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle()

    if (!staffRow) {
      // Fallback: may be business owner
      const { data: ownerRow } = await supabase
        .from("business_owners")
        .select("id")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .maybeSingle()
      if (!ownerRow) return
    }

    const insertPayload: Record<string, unknown> = {
      business_id: businessId,
      customer_user_id: customer.id,
      staff_business_id: staffRow?.id,
      note: newNoteText,
    }
    if (linkedAppointmentId) insertPayload.appointment_id = linkedAppointmentId

    const { data: inserted } = await supabase
      .from("customer_notes")
      .insert(insertPayload)
      .select("id, created_at")
      .single()

    if (inserted) {
      const userName = user.user_metadata?.name || user.email?.split("@")[0] || "?"
      const linkedApt = linkedAppointmentId ? appointments.find(a => a.id === linkedAppointmentId) : null
      setNotes([{
        id: inserted.id,
        author: userName,
        date: new Date(inserted.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
        appointmentChip: linkedApt ? `${linkedApt.dayNum} ${linkedApt.month} — ${linkedApt.service}` : "",
        text: newNoteText,
      }, ...notes])
      setNewNoteText("")
      setLinkedAppointmentId(null)
    }
  }

  const handleEditNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setEditingNoteId(noteId)
      setEditingText(note.text)
      setMenuOpenId(null)
    }
  }

  const handleSaveEdit = async (noteId: string) => {
    await supabase.from("customer_notes").update({ note: editingText }).eq("id", noteId)
    setNotes(notes.map((n) => n.id === noteId ? { ...n, text: editingText } : n))
    setEditingNoteId(null)
    setEditingText("")
  }

  const handleDeleteNote = async (noteId: string) => {
    await supabase.from("customer_notes").delete().eq("id", noteId)
    setNotes(notes.filter((n) => n.id !== noteId))
    setDeleteConfirmId(null)
    setMenuOpenId(null)
  }

  const appointmentTabs = [
    { key: "all" as const, label: "Tumu" },
    { key: "upcoming" as const, label: "Yaklasan" },
    { key: "past" as const, label: "Gecmis" },
  ]

  const initials = customer.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[13px]">
        <button type="button" onClick={onBack} className="text-muted-foreground transition-colors hover:text-primary">Musteriler</button>
        <ChevronRight className="size-3.5 text-muted-foreground" />
        <span className="font-medium text-foreground">{customer.name}</span>
      </nav>

      {/* Two Column Layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column - Profile Card */}
        <div className="w-full shrink-0 lg:w-[35%]">
          <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            {/* Avatar Header */}
            <div className="relative flex h-20 items-end justify-center rounded-t-xl bg-primary-light">
              <div className="absolute -bottom-9">
                <div className="flex size-[72px] items-center justify-center rounded-full border-[3px] border-card bg-primary-light text-lg font-semibold text-primary">
                  {initials}
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-col items-center px-5 pt-12 pb-5">
              <h3 className="text-lg font-semibold text-foreground">{customer.name}</h3>
              <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
                {customer.status === "aktif" ? <RxBadge variant="success">Duzenli Musteri</RxBadge> : <RxBadge variant="danger">No-Show Riski</RxBadge>}
              </div>

              <div className="my-4 h-px w-full bg-border" />

              {/* Info Rows */}
              <div className="flex w-full flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{customer.phone}</span>
                  </div>
                  <button type="button" className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary-light hover:text-primary">
                    <Phone className="size-3" /> Ara
                  </button>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{customer.email}</span>
                </div>
                {customer.createdAt && (
                  <div className="flex items-center gap-2.5">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Kayit: {new Date(customer.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                )}
              </div>

              <div className="my-4 h-px w-full bg-border" />

              {/* Stats Grid */}
              <div className="grid w-full grid-cols-2 divide-x divide-y divide-border rounded-lg border border-border">
                <div className="flex flex-col items-center gap-0.5 p-3">
                  <span className="text-[22px] font-semibold text-primary">{customer.totalAppointments}</span>
                  <span className="text-xs text-muted-foreground">Toplam Randevu</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-3">
                  <span className={cn("text-[22px] font-semibold", customer.noShow === 0 ? "text-[#10B981]" : "text-accent")}>{customer.noShow}</span>
                  <span className="text-xs text-muted-foreground">No-Show</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-3">
                  <span className="text-[22px] font-semibold text-primary">₺{totalSpent.toLocaleString("tr-TR")}</span>
                  <span className="text-xs text-muted-foreground">Toplam Harcama</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 p-3">
                  <span className="text-base font-semibold text-foreground">{mostUsedService}</span>
                  <span className="text-xs text-muted-foreground">En Cok Alan</span>
                </div>
              </div>

              <div className="my-4 h-px w-full bg-border" />

              {/* No-Show History */}
              <div className="w-full">
                <h4 className="text-sm font-semibold text-foreground">No-Show Gecmisi</h4>
                {customer.noShow === 0 ? (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] text-[#10B981]">
                    <CheckCircle className="size-4" />
                    Hic no-show kaydi yok
                  </p>
                ) : (
                  <p className="mt-2 text-[13px] text-accent">{customer.noShow} no-show kaydi</p>
                )}
              </div>

              <div className="my-4 h-px w-full bg-border" />

              {/* Quick Actions */}
              <div className="flex w-full flex-col gap-2">
                <RxButton size="sm" className="w-full justify-center">
                  <CalendarPlus className="size-4" />
                  Randevu Olustur
                </RxButton>
                <RxButton size="sm" variant="ghost" className="w-full justify-center">
                  <FileText className="size-4" />
                  Musteri Notlari
                </RxButton>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-1 flex-col gap-6">
          {/* Appointment History Card */}
          <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Randevu Gecmisi</h3>
              <div className="flex gap-1">
                {appointmentTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setAppointmentFilter(tab.key)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                      appointmentFilter === tab.key
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-border">
              {filteredAppointments.length === 0 && (
                <div className="px-5 py-8 text-center text-sm text-muted-foreground">Randevu bulunamadi</div>
              )}
              {filteredAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Date Block */}
                  <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-sm font-bold leading-none">{apt.dayNum}</span>
                    <span className="text-[10px] leading-none">{apt.month}</span>
                  </div>

                  {/* Center */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">{apt.service}</span>
                      <span className="text-xs text-muted-foreground">{apt.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RxAvatar name={apt.staff} size="sm" className="!size-6 !text-[10px]" />
                      <span className="text-[13px] text-muted-foreground">{apt.staff}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{apt.time}</span>
                  </div>

                  {/* Right */}
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-foreground">₺{apt.price}</span>
                    {apt.status === "confirmed" || apt.status === "pending" ? (
                      <RxBadge variant="purple">Onaylandi</RxBadge>
                    ) : apt.status === "completed" ? (
                      <RxBadge variant="success">Tamamlandi</RxBadge>
                    ) : apt.status === "cancelled" ? (
                      <RxBadge variant="gray">Iptal</RxBadge>
                    ) : (
                      <RxBadge variant="danger">No-Show</RxBadge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff Notes Card */}
          <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]" ref={menuRef}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Personel Notlari</h3>
              <RxButton size="sm" onClick={() => {
                const el = document.getElementById("note-textarea")
                el?.focus()
              }}>
                <Plus className="size-4" />
                Not Ekle
              </RxButton>
            </div>

            <div className="px-5 py-4">
              {/* Info Banner */}
              <div className="mb-4 rounded-xl border-l-[3px] border-l-primary bg-primary-light px-4 py-3">
                <p className="text-xs text-muted-foreground">Bu notlar sadece isletme icinde gorulur. Musteriye gosterilmez.</p>
              </div>

              {/* Note Entries */}
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <div key={note.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RxAvatar name={note.author} size="sm" className="!size-7 !text-[10px]" />
                        <span className="text-[13px] font-semibold text-foreground">{note.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{note.date}</span>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setMenuOpenId(menuOpenId === note.id ? null : note.id)
                              setDeleteConfirmId(null)
                            }}
                            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                          {menuOpenId === note.id && !deleteConfirmId && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-32 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                              <button type="button" onClick={() => handleEditNote(note.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light">
                                <Pencil className="size-3.5" /> Duzenle
                              </button>
                              <button type="button" onClick={() => setDeleteConfirmId(note.id)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent transition-colors hover:bg-[#FFF0F3]">
                                <Trash2 className="size-3.5" /> Sil
                              </button>
                            </div>
                          )}
                          {deleteConfirmId === note.id && (
                            <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                              <p className="mb-2 text-sm text-foreground">Silmek istediginize emin misiniz?</p>
                              <div className="flex items-center justify-end gap-2">
                                <button type="button" onClick={() => { setDeleteConfirmId(null); setMenuOpenId(null) }} className="rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary-light">Hayir</button>
                                <button type="button" onClick={() => handleDeleteNote(note.id)} className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90">Evet</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {note.appointmentChip && (
                      <div className="mt-2">
                        <span className="inline-flex items-center rounded-md bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                          {note.appointmentChip}
                        </span>
                      </div>
                    )}

                    {editingNoteId === note.id ? (
                      <div className="mt-2 flex flex-col gap-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="min-h-[80px] w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <RxButton size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>Vazgec</RxButton>
                          <RxButton size="sm" onClick={() => handleSaveEdit(note.id)}>Kaydet</RxButton>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-relaxed text-foreground">{note.text}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Note Area */}
              <div className="mt-4 border-t border-border pt-4">
                {/* Link to appointment dropdown */}
                {appointments.length > 0 && (
                  <div className="mb-3">
                    <label className="text-xs font-medium text-muted-foreground">Randevuya Bagla (istege bagli)</label>
                    <select
                      value={linkedAppointmentId || ""}
                      onChange={(e) => setLinkedAppointmentId(e.target.value || null)}
                      className="mt-1 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Baglama</option>
                      {appointments.map(apt => (
                        <option key={apt.id} value={apt.id}>{apt.dayNum} {apt.month} — {apt.service} ({apt.staff})</option>
                      ))}
                    </select>
                  </div>
                )}
                <RxTextarea
                  id="note-textarea"
                  placeholder="Bu musteri icin not ekleyin... Orn: Saci sert, X makine kullanildi."
                  value={newNoteText}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setNewNoteText(e.target.value)
                  }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{newNoteText.length}/500</span>
                  <RxButton size="sm" onClick={handleSaveNote} disabled={!newNoteText.trim()}>
                    Notu Kaydet
                  </RxButton>
                </div>
              </div>
            </div>
          </div>

          {/* No-Show Records Card */}
          <div className="rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-accent">No-Show Kayitlari</h3>
            </div>
            <div className="px-5 py-6">
              {customer.noShow === 0 ? (
                <p className="flex items-center justify-center gap-1.5 text-[13px] text-[#10B981]">
                  <CheckCircle className="size-4" />
                  Hic no-show kaydi yok
                </p>
              ) : (
                <p className="text-center text-[13px] text-accent">{customer.noShow} no-show kaydi bulunmaktadir</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function CustomerProfile() {
  const { user } = useCurrentUser()
  const [activeTab, setActiveTab] = useState<"list" | "profile">("list")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    async function fetchBid() {
      const { data } = await supabase.from("business_owners").select("business_id").eq("user_id", user!.id).maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBid()
  }, [user, supabase])

  const fetchCustomers = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      // Get all unique customers that have appointments with this business
      const { data: aptData } = await supabase
        .from("appointments")
        .select("customer_user_id, status, appointment_date, customer:users!appointments_customer_user_id_fkey(id, name, email, phone, created_at)")
        .eq("business_id", businessId)

      const customerMap = new Map<string, { id: string; name: string; email: string; phone: string; createdAt: string; total: number; noShow: number; lastApt: string }>()

        ; (aptData || []).forEach((a) => {
          const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
          if (!cust?.id) return
          const existing = customerMap.get(cust.id)
          if (existing) {
            existing.total++
            if (a.status === "no_show") existing.noShow++
            if (a.appointment_date > existing.lastApt) existing.lastApt = a.appointment_date
          } else {
            customerMap.set(cust.id, {
              id: cust.id,
              name: cust.name || "?",
              email: cust.email || "",
              phone: cust.phone || "",
              createdAt: cust.created_at || "",
              total: 1,
              noShow: a.status === "no_show" ? 1 : 0,
              lastApt: a.appointment_date,
            })
          }
        })

      const mapped: Customer[] = Array.from(customerMap.values()).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        totalAppointments: c.total,
        noShow: c.noShow,
        lastAppointment: new Date(c.lastApt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
        status: c.noShow >= 3 ? "no-show-risk" as const : "aktif" as const,
        createdAt: c.createdAt,
      }))

      mapped.sort((a, b) => b.totalAppointments - a.totalAppointments)
      setCustomers(mapped)
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleViewProfile = (c: Customer) => {
    setSelectedCustomer(c)
    setActiveTab("profile")
  }

  const noShowRiskCount = customers.filter(c => c.status === "no-show-risk").length

  const tabs = [
    { key: "list" as const, label: "Musteri Listesi" },
    { key: "profile" as const, label: "Musteri Profili" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Switcher */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <CustomerListTab
          customers={customers}
          loading={loading}
          totalCount={customers.length}
          noShowRiskCount={noShowRiskCount}
          onViewProfile={handleViewProfile}
        />
      )}
      {activeTab === "profile" && selectedCustomer && businessId && (
        <CustomerProfileTab customer={selectedCustomer} onBack={() => setActiveTab("list")} businessId={businessId} />
      )}
    </div>
  )
}
