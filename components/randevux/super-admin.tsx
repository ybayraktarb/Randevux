"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import {
  LayoutDashboard,
  Building2,
  Users,
  Puzzle,
  BarChart3,
  ScrollText,
  Settings,
  CalendarDays,
  Calendar,
  TrendingUp,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Download,
  Search,
  MoreHorizontal,
  Scissors,
  Sparkles,
  PawPrint,
  Plus,
  Copy,
  Phone,
  ExternalLink,
  Info,
  Trash2,
  Edit3,
  Heart,
  Stethoscope,
  Briefcase,
  Dumbbell,
  GraduationCap,
  Palette,
  Camera,
  Music,
  Utensils,
  Car,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import { RxModal } from "./rx-modal"
import { RxInput, RxTextarea } from "./rx-input"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  Tooltip as RechartsTooltip,
} from "recharts"

// ─── Sidebar ────────────────────────────────────────────────────────────────────

const adminNav = [
  { label: "Genel Bakış", icon: LayoutDashboard, key: "overview" },
  { label: "İşletmeler", icon: Building2, key: "businesses" },
  { label: "Kullanıcılar", icon: Users, key: "users" },
  { label: "Modül Yönetimi", icon: Puzzle, key: "modules" },
  { label: "Platform İstatistikleri", icon: BarChart3, key: "stats" },
  { label: "Sistem Logları", icon: ScrollText, key: "logs" },
  { label: "Ayarlar", icon: Settings, key: "settings" },
]

function AdminSidebar({ collapsed, activeItem, onNavClick }: { collapsed: boolean; activeItem: string; onNavClick: (key: string) => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex items-center gap-2.5 border-b border-border px-5 py-4", collapsed && "justify-center px-2")}>
        <CalendarDays className="size-7 shrink-0 text-primary" />
        {!collapsed && <span className="text-lg font-bold text-primary">RandevuX</span>}
      </div>

      {!collapsed && (
        <div className="mx-4 mt-3 px-2">
          <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
            {"Süper Admin"}
          </span>
        </div>
      )}

      <nav className={cn("mt-4 flex flex-1 flex-col gap-1", collapsed ? "px-2" : "px-3")}>
        {adminNav.map((item) => {
          const isActive = activeItem === item.key
          const Icon = item.icon
          const btn = (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavClick(item.key)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-primary-light text-primary"
                  : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
          if (collapsed) {
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>{btn}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
              </Tooltip>
            )
          }
          return <div key={item.key}>{btn}</div>
        })}
      </nav>

      <div className={cn("border-t border-border p-4", collapsed && "flex flex-col items-center gap-2 px-2")}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div><RxAvatar name="Admin" size="sm" online /></div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>Admin</TooltipContent>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <RxAvatar name="Admin" size="md" online />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">Admin</span>
              <span className="inline-flex w-fit items-center rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                {"Süper Admin"}
              </span>
            </div>
            <button type="button" className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary-light hover:text-accent" aria-label="Çıkış Yap">
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Top Navbar ─────────────────────────────────────────────────────────────────

function AdminTopNav({ title, onMenuToggle, showMenu }: { title: string; onMenuToggle: () => void; showMenu: boolean }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {showMenu && (
          <button type="button" onClick={onMenuToggle} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground" aria-label="Menü">
            <Menu className="size-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground" aria-label="Bildirimler">
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">5</span>
        </button>
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />
        <button type="button" className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-light sm:flex">
          <RxAvatar name="Admin" size="sm" />
          <span className="text-sm font-medium text-foreground">Admin</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}

function OverviewTab() {
  const supabase = createClient()
  const [stats, setStats] = useState({ totalBiz: 0, totalUsers: 0, totalAppts: 0, todayAppts: 0 })
  const [recentBiz, setRecentBiz] = useState<{ id: string; name: string; moduleName: string; date: string; staffCount: number; apptCount: number; active: boolean }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const todayStr = new Date().toISOString().slice(0, 10)
      const [{ count: bc }, { count: uc }, { count: ac }, { count: tc }] = await Promise.all([
        supabase.from("businesses").select("id", { count: "exact", head: true }),
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", todayStr),
      ])
      setStats({ totalBiz: bc || 0, totalUsers: uc || 0, totalAppts: ac || 0, todayAppts: tc || 0 })

      const { data: bizData } = await supabase.from("businesses").select("id, name, is_active, created_at, module:modules(display_name)").order("created_at", { ascending: false }).limit(5)
      const mapped = (bizData || []).map((b: any) => {
        const mod = Array.isArray(b.module) ? b.module[0] : b.module
        return { id: b.id, name: b.name, moduleName: mod?.display_name || "?", date: new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), staffCount: 0, apptCount: 0, active: b.is_active }
      })
      setRecentBiz(mapped)
      setLoading(false)
    }
    load()
  }, [supabase])

  const statCards = [
    { label: "Toplam Isletme", icon: Building2, value: String(stats.totalBiz), trend: "", trendColor: "text-muted-foreground" },
    { label: "Toplam Kullanici", icon: Users, value: String(stats.totalUsers), trend: "", trendColor: "text-muted-foreground" },
    { label: "Toplam Randevu", icon: Calendar, value: String(stats.totalAppts), trend: "", trendColor: "text-muted-foreground" },
    { label: "Bugunun Randevulari", icon: TrendingUp, value: String(stats.todayAppts), trend: "", trendColor: "text-success" },
  ]

  if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[22px] font-semibold text-foreground">Platform Ozeti</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] text-muted-foreground">{card.label}</span>
                <span className="text-2xl font-bold text-foreground">{card.value}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-foreground">Son Isletmeler</h3>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <table className="w-full min-w-[600px]">
            <thead><tr className="border-b border-border">
              {["Isletme", "Modul", "Kayit Tarihi", "Durum"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}
            </tr></thead>
            <tbody>
              {recentBiz.map(biz => (
                <tr key={biz.id} className="border-b border-border last:border-0 hover:bg-primary-light/50">
                  <td className="px-5 py-3"><div className="flex items-center gap-2.5"><RxAvatar name={biz.name} size="sm" /><span className="text-sm font-medium text-foreground">{biz.name}</span></div></td>
                  <td className="px-5 py-3"><span className="inline-flex items-center rounded-md bg-badge-purple-bg px-2.5 py-0.5 text-xs font-medium text-badge-purple-text">{biz.moduleName}</span></td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{biz.date}</td>
                  <td className="px-5 py-3">{biz.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="gray">Pasif</RxBadge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


// ─── TAB 2: İşletmeler ──────────────────────────────────────────────────────────

const allBusinesses = [
  { name: "Güzellik Salonu Bella", city: "Bağcılar, İstanbul", module: "Güzellik", patron: "Mehmet Yılmaz", staff: 3, customers: 184, appts: 1240, date: "15 Oca 2024", active: true },
  { name: "Barber King", city: "Kadıköy, İstanbul", module: "Berber", patron: "Ahmet Demir", staff: 2, customers: 92, appts: 876, date: "20 Mar 2024", active: true },
  { name: "Stil Kuaför", city: "Üsküdar, İstanbul", module: "Berber", patron: "Fatma Arslan", staff: 1, customers: 45, appts: 312, date: "05 Haz 2024", active: true },
  { name: "Nails & More", city: "Beşiktaş, İstanbul", module: "Güzellik", patron: "Zeynep Kaya", staff: 2, customers: 67, appts: 524, date: "12 Tem 2024", active: true },
  { name: "Elite Barber", city: "Şişli, İstanbul", module: "Berber", patron: "Can Öztürk", staff: 4, customers: 220, appts: 1890, date: "01 Oca 2024", active: true },
  { name: "Beauty Center", city: "Maltepe, İstanbul", module: "Güzellik", patron: "Ayşe Çelik", staff: 3, customers: 156, appts: 980, date: "28 Şub 2024", active: true },
  { name: "Demo İşletme", city: "Ankara", module: "Berber", patron: "Test Admin", staff: 0, customers: 0, appts: 0, date: "10 Şub 2026", active: false },
  { name: "Trend Salon", city: "İzmir", module: "Güzellik", patron: "Selin Yıldız", staff: 2, customers: 78, appts: 645, date: "15 Eki 2024", active: true },
]

const weeklyBarData = [
  { week: "1. Hafta", randevu: 42 },
  { week: "2. Hafta", randevu: 38 },
  { week: "3. Hafta", randevu: 51 },
  { week: "4. Hafta", randevu: 47 },
]

const drawerStaff = [
  { name: "Ayşe Hanım", role: "Kuaför", appts: 82 },
  { name: "Fatma Çelik", role: "Güzellik Uzmanı", appts: 64 },
  { name: "Zeynep Kara", role: "Manikürist", appts: 38 },
]

function BusinessesTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<"general" | "staff" | "stats">("general")
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null)

  const filtered = allBusinesses.filter((b) => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (moduleFilter !== "all" && b.module !== moduleFilter) return false
    if (statusFilter === "active" && !b.active) return false
    if (statusFilter === "passive" && b.active) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">{"İşletmeler"}</h2>
          <p className="text-sm text-muted-foreground">{"124 kayıtlı işletme"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="İşletme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          >
            <option value="all">{"Modül"}</option>
            <option value="Berber">Berber</option>
            <option value="Güzellik">{"Güzellik"}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          >
            <option value="all">Durum</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-border">
              {["İşletme", "Modül", "Patron", "Personel", "Müşteri", "Randevu", "Kayıt Tarihi", "Durum", "İşlemler"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((biz, idx) => (
              <tr key={biz.name} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <RxAvatar name={biz.name} size="sm" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{biz.name}</span>
                      <span className="text-xs text-muted-foreground">{biz.city}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                    biz.module === "Berber" ? "bg-badge-purple-bg text-badge-purple-text" : "bg-badge-green-bg text-badge-green-text"
                  )}>
                    {biz.module}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-foreground">{biz.patron}</td>
                <td className="px-4 py-3 text-[13px] text-foreground">{biz.staff}</td>
                <td className="px-4 py-3 text-[13px] text-foreground">{biz.customers}</td>
                <td className="px-4 py-3 text-[13px] font-semibold text-foreground">{biz.appts}</td>
                <td className="px-4 py-3 text-[13px] text-muted-foreground">{biz.date}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                      biz.active ? "bg-success" : "bg-muted"
                    )}
                    role="switch"
                    aria-checked={biz.active}
                  >
                    <span className={cn(
                      "pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200",
                      biz.active ? "translate-x-[18px]" : "translate-x-0.5"
                    )} style={{ marginTop: "2px" }} />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => { setDrawerOpen(true); setDrawerTab("general") }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light"
                    >
                      Detay
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                      {menuOpenIdx === idx && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setMenuOpenIdx(null)} aria-hidden="true" />
                          <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light" onClick={() => setMenuOpenIdx(null)}>
                              <Edit3 className="size-3.5" /> {"Düzenle"}
                            </button>
                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light" onClick={() => setMenuOpenIdx(null)}>
                              <Settings className="size-3.5" /> Pasife Al
                            </button>
                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-accent transition-colors hover:bg-badge-red-bg" onClick={() => setMenuOpenIdx(null)}>
                              <Trash2 className="size-3.5" /> Sil
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border bg-card shadow-xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <RxAvatar name="Güzellik Salonu Bella" size="lg" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground">{"Güzellik Salonu Bella"}</span>
                  <RxBadge variant="success">Aktif</RxBadge>
                </div>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat">
                <X className="size-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-border">
              {(["general", "staff", "stats"] as const).map((tab) => {
                const labels = { general: "Genel", staff: "Personel", stats: "İstatistik" }
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDrawerTab(tab)}
                    className={cn(
                      "flex-1 py-3 text-sm font-medium transition-colors",
                      drawerTab === tab
                        ? "border-b-2 border-primary text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {labels[tab]}
                  </button>
                )
              })}
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {drawerTab === "general" && (
                <div className="flex flex-col gap-6">
                  {/* Info */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{"İşletme Bilgileri"}</h4>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">{"Modül"}</span>
                        <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2.5 py-0.5 text-xs font-medium text-badge-green-text">{"Güzellik Salonu"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Adres</span>
                        <span className="text-[13px] text-foreground">{"Bağcılar, İstanbul"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Telefon</span>
                        <span className="text-[13px] text-foreground">+90 212 000 00 00</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">{"Kayıt Tarihi"}</span>
                        <span className="text-[13px] text-foreground">15 Ocak 2024</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">QR Kodu</span>
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 items-center justify-center rounded border border-border bg-muted">
                            <span className="text-[8px] font-mono text-muted-foreground">QR</span>
                          </div>
                          <button type="button" className="rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-light">{"İndir"}</button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Davet Kodu</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium text-foreground">BELLA24</span>
                          <button type="button" className="text-muted-foreground transition-colors hover:text-primary" aria-label="Kopyala">
                            <Copy className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patron */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Patron</h4>
                    <div className="flex items-center gap-3">
                      <RxAvatar name="Mehmet Yılmaz" size="md" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{"Mehmet Yılmaz"}</span>
                        <span className="text-xs text-muted-foreground">mehmet@bella.com</span>
                        <span className="text-xs text-muted-foreground">+90 532 000 00 00</span>
                      </div>
                    </div>
                    <button type="button" className="mt-3 text-sm font-medium text-primary transition-colors hover:text-primary-hover">
                      {"Patron Profili Gör →"}
                    </button>
                  </div>

                  {/* Settings */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Ayarlar</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">Otomatik Onay</span>
                        <div className="relative inline-flex h-5 w-9 cursor-pointer rounded-full bg-success transition-colors">
                          <span className="pointer-events-none inline-block size-4 translate-x-[18px] transform rounded-full bg-card shadow-sm ring-0 transition-transform" style={{ marginTop: "2px" }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">{"İptal Süresi"}</span>
                        <span className="text-[13px] text-muted-foreground">60 dakika</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">{"Modül"}</span>
                        <select className="h-8 rounded-lg border border-input bg-card px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                          <option>{"Güzellik Salonu"}</option>
                          <option>Berber</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-lg border-t-[3px] border-t-accent border border-border bg-card p-4">
                    <div className="flex flex-col gap-3">
                      <RxButton variant="ghost" size="sm" className="w-full justify-center text-accent hover:bg-badge-red-bg">
                        {"İşletmeyi Pasife Al"}
                      </RxButton>
                      <RxButton variant="danger" size="sm" className="w-full justify-center">
                        {"İşletmeyi Kalıcı Sil"}
                      </RxButton>
                      <p className="text-center text-xs text-muted-foreground">{"Bu işlem geri alınamaz."}</p>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === "staff" && (
                <div className="flex flex-col gap-3">
                  {drawerStaff.map((s) => (
                    <div key={s.name} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-primary-light/50">
                      <RxAvatar name={s.name} size="sm" />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.role}</span>
                      </div>
                      <span className="text-sm font-medium text-primary">{s.appts} randevu</span>
                    </div>
                  ))}
                </div>
              )}

              {drawerTab === "stats" && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-foreground">{"₺12.400"}</span>
                      <span className="text-xs text-muted-foreground">{"Bu ay gelir"}</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-foreground">184</span>
                      <span className="text-xs text-muted-foreground">Randevu</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-accent">3</span>
                      <span className="text-xs text-muted-foreground">No-Show</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Son 4 Hafta Aktivite</h4>
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyBarData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="week" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
                          <Bar dataKey="randevu" name="Randevu" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  )
}

// ─── TAB 3: Modül Yönetimi ──────────────────────────────────────────────────────

const iconOptions = [
  { icon: Scissors, label: "Scissors" },
  { icon: Sparkles, label: "Sparkles" },
  { icon: PawPrint, label: "PawPrint" },
  { icon: Heart, label: "Heart" },
  { icon: Stethoscope, label: "Stethoscope" },
  { icon: Briefcase, label: "Briefcase" },
  { icon: Dumbbell, label: "Dumbbell" },
  { icon: GraduationCap, label: "GraduationCap" },
  { icon: Palette, label: "Palette" },
  { icon: Camera, label: "Camera" },
  { icon: Music, label: "Music" },
  { icon: Utensils, label: "Utensils" },
]

const modulesData = [
  {
    name: "Berber",
    icon: Scissors,
    description: "Berber ve kuaför salonları için randevu yönetim modülü.",
    businesses: 84,
    appts: 18420,
    required: ["Personel Seçimi", "Hizmet Seçimi"],
    optional: ["Müşteri Notu", "No-Show"],
    active: true,
    comingSoon: false,
  },
  {
    name: "Güzellik Salonu",
    icon: Sparkles,
    description: "Güzellik salonu ve spa merkezleri için özel modül.",
    businesses: 30,
    appts: 8240,
    required: ["Personel Seçimi", "Hizmet Seçimi"],
    optional: ["Müşteri Notu", "No-Show"],
    active: true,
    comingSoon: false,
  },
  {
    name: "Veterinerlik",
    icon: PawPrint,
    description: "Veteriner klinikleri için randevu ve hasta takip modülü.",
    businesses: 0,
    appts: 0,
    required: ["Personel Seçimi", "Hayvan Profili", "Dosya Yükleme"],
    optional: ["Ameliyathane Rezervasyonu", "Röntgen Odası"],
    active: false,
    comingSoon: true,
  },
]

function ModulesTab() {
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [moduleName, setModuleName] = useState("")
  const [moduleSlug, setModuleSlug] = useState("")
  const [moduleDesc, setModuleDesc] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("Scissors")
  const [requiredFields, setRequiredFields] = useState({
    personel: true,
    hizmet: true,
    hayvan: false,
    dosya: false,
    asset: false,
  })
  const [optionalFeatures, setOptionalFeatures] = useState({
    notes: true,
    noshow: true,
    multiResource: false,
  })

  const handleNameChange = (val: string) => {
    setModuleName(val)
    setModuleSlug(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">{"Modüller"}</h2>
          <p className="text-sm text-muted-foreground">{"Platform modüllerini yönetin"}</p>
        </div>
        <RxButton size="sm" onClick={() => setNewModalOpen(true)}>
          <Plus className="size-4" />
          {"Yeni Modül Ekle"}
        </RxButton>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {modulesData.map((mod) => {
          const Icon = mod.icon
          return (
            <div
              key={mod.name}
              className={cn(
                "relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]",
                !mod.active && "opacity-70"
              )}
            >
              {mod.comingSoon && (
                <span className="absolute right-4 top-4 z-10 inline-flex items-center rounded-md bg-badge-yellow-bg px-2.5 py-0.5 text-xs font-medium text-badge-yellow-text">
                  {"Yakında"}
                </span>
              )}

              {/* Card Header */}
              <div className="flex items-center justify-between bg-primary-light px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                    <Icon className="size-5 text-primary-foreground" />
                  </div>
                  <span className="text-base font-semibold text-foreground">{mod.name}</span>
                </div>
                <button
                  type="button"
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                    mod.active ? "bg-success" : "bg-muted"
                  )}
                  role="switch"
                  aria-checked={mod.active}
                >
                  <span className={cn(
                    "pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200",
                    mod.active ? "translate-x-[18px]" : "translate-x-0.5"
                  )} style={{ marginTop: "2px" }} />
                </button>
              </div>

              {/* Card Body */}
              <div className="flex flex-col gap-3 px-5 py-4">
                <p className="text-[13px] text-muted-foreground leading-relaxed">{mod.description}</p>

                <div className="flex items-center gap-1.5 text-[13px]">
                  <span className="font-medium text-foreground">{mod.businesses} {"işletme kullanıyor"}</span>
                  <span className="text-muted-foreground">&middot;</span>
                  <span className="text-muted-foreground">{mod.appts > 0 ? `${mod.appts.toLocaleString("tr-TR")} randevu` : "Henüz aktif değil"}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-foreground">Zorunlu:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.required.map((f) => (
                      <span key={f} className="rounded-md bg-badge-purple-bg px-2 py-0.5 text-[11px] font-medium text-badge-purple-text">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-foreground">Opsiyonel:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.optional.map((f) => (
                      <span key={f} className="rounded-md bg-badge-gray-bg px-2 py-0.5 text-[11px] font-medium text-badge-gray-text">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">{"Düzenle"}</button>
                  <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">Detay</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Module Modal */}
      <RxModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Yeni Modül Ekle"
        className="max-w-[560px]"
        footer={
          <>
            <RxButton variant="ghost" size="sm" onClick={() => setNewModalOpen(false)}>{"Vazgeç"}</RxButton>
            <RxButton size="sm" onClick={() => setNewModalOpen(false)}>{"Modülü Kaydet"}</RxButton>
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {/* Basic info */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Temel Bilgiler</h4>
            <div className="flex flex-col gap-3">
              <RxInput
                label="Modül Adı"
                placeholder="Örn: Sağlık Kliniği"
                value={moduleName}
                onChange={(e) => handleNameChange(e.target.value)}
              />
              <RxInput
                label="Sistem Adı"
                placeholder="health_clinic"
                value={moduleSlug}
                onChange={(e) => setModuleSlug(e.target.value)}
              />
              <RxTextarea
                label="Açıklama"
                placeholder="Modül hakkında kısa açıklama..."
                value={moduleDesc}
                onChange={(e) => setModuleDesc(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Icon selection */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{"İkon Seçimi"}</h4>
            <div className="grid grid-cols-6 gap-2">
              {iconOptions.map((opt) => {
                const OptIcon = opt.icon
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setSelectedIcon(opt.label)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border transition-colors",
                      selectedIcon === opt.label
                        ? "border-primary bg-primary-light text-primary"
                        : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                    )}
                  >
                    <OptIcon className="size-5" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Required fields */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Zorunlu Alanlar</h4>
            <div className="flex flex-col gap-2">
              {[
                { key: "personel" as const, label: "Personel Seçimi" },
                { key: "hizmet" as const, label: "Hizmet Seçimi" },
                { key: "hayvan" as const, label: "Hayvan Profili" },
                { key: "dosya" as const, label: "Dosya Yükleme" },
                { key: "asset" as const, label: "Asset Rezervasyonu (Ameliyathane vb.)" },
              ].map((field) => (
                <label key={field.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requiredFields[field.key]}
                    onChange={(e) => setRequiredFields({ ...requiredFields, [field.key]: e.target.checked })}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  <span className="text-sm text-foreground">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional features */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{"Opsiyonel Özellikler"}</h4>
            <div className="flex flex-col gap-2">
              {[
                { key: "notes" as const, label: "Müşteri Notları" },
                { key: "noshow" as const, label: "No-Show Takibi" },
                { key: "multiResource" as const, label: "Çoklu Kaynak Yönetimi" },
              ].map((feat) => (
                <label key={feat.key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optionalFeatures[feat.key]}
                    onChange={(e) => setOptionalFeatures({ ...optionalFeatures, [feat.key]: e.target.checked })}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  <span className="text-sm text-foreground">{feat.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </RxModal>
    </div>
  )
}

// ─── TAB 4: Sistem Logları ──────────────────────────────────────────────────────

const logsData = [
  { time: "24 Şub 14:32", user: "Mehmet Yılmaz", role: "Patron", action: "viewed", table: "appointments", record: "#184", ip: "192.168.1.1" },
  { time: "24 Şub 14:28", user: "Ayşe Hanım", role: "Personel", action: "viewed", table: "customers", record: "#48", ip: "192.168.1.2" },
  { time: "24 Şub 13:45", user: "Mehmet Yılmaz", role: "", action: "updated", table: "services", record: "#6", ip: "192.168.1.1" },
  { time: "24 Şub 12:15", user: "Admin", role: "", action: "viewed", table: "users", record: "#3847", ip: "10.0.0.1" },
  { time: "24 Şub 11:30", user: "Zeynep Arslan", role: "Müşteri", action: "updated", table: "appointments", record: "#183", ip: "95.0.0.1" },
  { time: "24 Şub 10:22", user: "Mehmet Yılmaz", role: "", action: "deleted", table: "staff", record: "#12", ip: "192.168.1.1" },
  { time: "24 Şub 09:45", user: "Admin", role: "", action: "updated", table: "businesses", record: "#5", ip: "10.0.0.1" },
  { time: "24 Şub 09:00", user: "Sistem", role: "", action: "viewed", table: "audit_logs", record: "#7823", ip: "10.0.0.1" },
]

function LogsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)

  const actionBadge = (action: string) => {
    switch (action) {
      case "viewed":
        return <span className="inline-flex items-center rounded-md bg-badge-purple-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-gray-text">viewed</span>
      case "updated":
        return <span className="inline-flex items-center rounded-md bg-badge-yellow-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-yellow-text">updated</span>
      case "deleted":
        return <span className="inline-flex items-center rounded-md bg-badge-red-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-red-text">deleted</span>
      default:
        return <span className="inline-flex items-center rounded-md bg-badge-gray-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-gray-text">{action}</span>
    }
  }

  const filtered = logsData.filter((log) => {
    if (searchQuery && !log.user.toLowerCase().includes(searchQuery.toLowerCase()) && !log.action.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (actionFilter !== "all" && log.action !== actionFilter) return false
    if (tableFilter !== "all" && log.table !== tableFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">{"Sistem Logları"}</h2>
          <p className="text-[13px] text-muted-foreground">{"KVKK uyarınca tüm veri işlemleri kayıt altındadır."}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
          <RxButton variant="ghost" size="sm">
            <Download className="size-4" />
            {"Dışa Aktar"}
          </RxButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Kullanıcı veya işlem ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">{"Tüm İşlemler"}</option>
          <option value="viewed">viewed</option>
          <option value="updated">updated</option>
          <option value="deleted">deleted</option>
        </select>
        <select
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">{"Tüm Tablolar"}</option>
          <option value="appointments">appointments</option>
          <option value="users">users</option>
          <option value="customers">customers</option>
          <option value="staff">staff</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-border">
              {["Zaman", "Kullanıcı", "İşlem", "Tablo", "Kayıt ID", "IP Adresi"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, idx) => (
              <tr key={idx} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{log.time}</td>
                <td className="px-4 py-3">
                  <span className="text-[13px] text-foreground">{log.user}</span>
                  {log.role && (
                    <span className="ml-1 text-[11px] text-muted-foreground">({log.role})</span>
                  )}
                </td>
                <td className="px-4 py-3">{actionBadge(log.action)}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-foreground">{log.table}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-primary">{log.record}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-1">
        <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground">
          <ChevronLeft className="size-4" />
        </button>
        {[1, 2, 3].map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => setCurrentPage(page)}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
              currentPage === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
            )}
          >
            {page}
          </button>
        ))}
        <span className="px-1 text-sm text-muted-foreground">...</span>
        <button
          type="button"
          onClick={() => setCurrentPage(892)}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg text-sm font-medium transition-colors",
            currentPage === 892 ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
          )}
        >
          892
        </button>
        <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-border border-l-[3px] border-l-primary bg-primary-light px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p className="text-[13px] text-foreground leading-relaxed">
          {"Log kayıtları 5651 sayılı kanun ve KVKK uyarınca 2 yıl süreyle saklanmaktadır."}
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "modules" | "logs">("overview")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(1200)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = windowWidth < 768
  const isTablet = windowWidth >= 768 && windowWidth < 1024
  const sidebarCollapsed = isTablet

  const tabs = [
    { key: "overview" as const, label: "Genel Bakış" },
    { key: "businesses" as const, label: "İşletmeler" },
    { key: "modules" as const, label: "Modül Yönetimi" },
    { key: "logs" as const, label: "Sistem Logları" },
  ]

  const handleNavClick = (key: string) => {
    const tabMap: Record<string, typeof activeTab> = {
      overview: "overview",
      businesses: "businesses",
      modules: "modules",
      logs: "logs",
    }
    if (tabMap[key]) {
      setActiveTab(tabMap[key])
      setDrawerOpen(false)
    }
  }

  const pageTitle = tabs.find((t) => t.key === activeTab)?.label || "Genel Bakış"

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop/Tablet Sidebar */}
        {!isMobile && (
          <aside className={cn("hidden shrink-0 border-r border-border bg-card transition-all duration-200 md:flex md:flex-col", sidebarCollapsed ? "w-[60px]" : "w-[260px]")}>
            <AdminSidebar collapsed={sidebarCollapsed} activeItem={activeTab} onNavClick={handleNavClick} />
          </aside>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <>
            <div
              className={cn("fixed inset-0 z-40 bg-foreground/30 transition-opacity duration-300", drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className={cn("fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-xl transition-transform duration-300 ease-in-out", drawerOpen ? "translate-x-0" : "-translate-x-full")}>
              <button type="button" onClick={() => setDrawerOpen(false)} className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-primary-light hover:text-foreground" aria-label="Kapat">
                <X className="size-5" />
              </button>
              <AdminSidebar collapsed={false} activeItem={activeTab} onNavClick={handleNavClick} />
            </aside>
          </>
        )}

        {/* Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminTopNav title={pageTitle} onMenuToggle={() => setDrawerOpen(true)} showMenu={isMobile} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            {/* Tab Switcher */}
            <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "businesses" && <BusinessesTab />}
            {activeTab === "modules" && <ModulesTab />}
            {activeTab === "logs" && <LogsTab />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
