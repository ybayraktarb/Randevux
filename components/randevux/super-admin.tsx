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
import { UsersTab } from "./users-tab"
import { StatsTab } from "./stats-tab"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SettingsTab } from "./settings-tab"
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

function AdminTopNav({ title, onMenuToggle, showMenu, onSettingsClick }: { title: string; onMenuToggle: () => void; showMenu: boolean; onSettingsClick?: () => void }) {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadNotifications() {
      // In a real app we'd fetch the user's notifications. For super-admin we'll fetch global or their specified notifications.
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.is_read).length)
      }
    }
    loadNotifications()

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        loadNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

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
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground flex items-center justify-center focus:outline-none" aria-label="Bildirimler">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 shadow-lg" sideOffset={8}>
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-card rounded-t-lg">
                <span className="font-semibold text-sm text-foreground">Bildirimler</span>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllAsRead} className="text-xs font-medium text-primary hover:underline">
                    Tümünü Okundu İşaretle
                  </button>
                )}
              </div>
              <div className="flex max-h-[320px] flex-col overflow-y-auto bg-card rounded-b-lg scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-muted/50 last:border-0",
                        !notif.is_read ? "bg-primary-light/30" : "bg-card"
                      )}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className={cn("text-xs font-semibold", !notif.is_read ? "text-foreground" : "text-foreground/80")}>
                          {notif.title}
                        </span>
                        {!notif.is_read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      {notif.body && (
                        <span className="line-clamp-2 text-xs text-muted-foreground leading-relaxed mt-0.5">{notif.body}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                        {new Date(notif.created_at).toLocaleDateString("tr-TR")} {new Date(notif.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Bell className="mb-3 size-10 opacity-20" />
                    <span className="text-sm font-medium">Hiç bildiriminiz yok</span>
                    <span className="text-xs opacity-70 mt-1">Yeni bir bildirim geldiğinde burada görünecektir.</span>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-light sm:flex focus:outline-none">
              <RxAvatar name="Admin" size="sm" />
              <span className="text-sm font-medium text-foreground">Admin</span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48" sideOffset={8}>
            <DropdownMenuItem className="cursor-pointer py-2.5">
              <RxAvatar name="Admin" size="sm" className="mr-2" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Hesabım</span>
                <span className="text-[10px] text-muted-foreground">Süper Admin</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer py-2" onClick={onSettingsClick}>
              <Settings className="mr-2 size-4" />
              Ayarlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer py-2 text-red-600 focus:text-red-700 focus:bg-red-50" onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

function BusinessesTab() {
  const supabase = createClient()
  const [businesses, setBusinesses] = useState<any[]>([])
  const [modulesList, setModulesList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Server-side Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [moduleFilter, setModuleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<"general" | "staff" | "stats">("general")
  const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null)

  const [selectedBiz, setSelectedBiz] = useState<any>(null)
  const [drawerStaff, setDrawerStaff] = useState<any[]>([])
  const [weeklyBarData, setWeeklyBarData] = useState<any[]>([])
  const [revenueStats, setRevenueStats] = useState({ revenue: 0, appts: 0, noShows: 0 })

  // Add Business Modal
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newBiz, setNewBiz] = useState({
    name: "", city: "", phone: "", moduleId: "", description: "",
    autoApprove: true, cancellationBuffer: 60, ownerId: ""
  })

  // Owner Search State
  const [ownerSearchQuery, setOwnerSearchQuery] = useState("")
  const [ownerSearchResults, setOwnerSearchResults] = useState<any[]>([])
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<any>(null)

  useEffect(() => {
    supabase.from("modules").select("id, display_name").then(({ data }) => {
      if (data) setModulesList(data)
    })
  }, [])

  useEffect(() => {
    // Delay search to avoid spamming the DB while typing
    const delayDebounceFn = setTimeout(() => {
      fetchBusinesses()
    }, 400)
    return () => clearTimeout(delayDebounceFn)
  }, [currentPage, moduleFilter, statusFilter, searchQuery])

  async function fetchBusinesses() {
    setLoading(true)
    let query = supabase
      .from("businesses")
      .select(`
        *,
        module:modules(display_name),
        owners:business_owners( users(name, email, phone) ),
        staff:staff_business(id),
        customers:business_customers(id),
        appts:appointments(id)
      `, { count: 'exact' })
      .order("created_at", { ascending: false })

    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`)
    }
    if (moduleFilter !== "all") {
      query = query.eq("module_id", moduleFilter)
    }
    if (statusFilter === "active") {
      query = query.eq("is_active", true)
    }
    if (statusFilter === "passive") {
      query = query.eq("is_active", false)
    }

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data: bizData, count } = await query

    if (bizData) {
      const mapped = bizData.map((b: any) => {
        const mod = Array.isArray(b.module) ? b.module[0] : b.module
        const owner = b.owners?.[0]?.users
        return {
          id: b.id,
          name: b.name,
          city: b.address || "Belirtilmemiş",
          module: mod?.display_name || "?",
          patron: owner?.name || "Bilinmiyor",
          patronEmail: owner?.email || "-",
          patronPhone: owner?.phone || "-",
          staff: b.staff?.length || 0,
          customers: b.customers?.length || 0,
          appts: b.appts?.length || 0,
          date: new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
          active: b.is_active,
          raw: b
        }
      })
      setBusinesses(mapped)
    }
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }

  async function handleAddBusiness() {
    if (!newBiz.name || !newBiz.moduleId || !newBiz.ownerId) {
      alert("Lütfen zorunlu alanları (İşletme Adı, Modül ve İşletme Sahibi) doldurun.")
      return
    }

    // 1. İşletmeyi (businesses tablosuna) Ekle
    const { data: bData, error: bError } = await supabase
      .from("businesses")
      .insert({
        name: newBiz.name,
        address: newBiz.city,
        phone: newBiz.phone,
        module_id: newBiz.moduleId,
        auto_approve: newBiz.autoApprove,
        cancellation_buffer_minutes: newBiz.cancellationBuffer,
        is_active: true
      })
      .select("id")
      .single()

    if (bError || !bData) {
      alert("İşletme eklenirken hata: " + bError?.message)
      return
    }

    const businessId = bData.id

    // 2. İşletme Sahibini (business_owners tablosuna) Ekle
    const { error: oError } = await supabase
      .from("business_owners")
      .insert({
        business_id: businessId,
        user_id: newBiz.ownerId
      })

    if (oError) {
      // Rollback mantığı yapılabilir ama şimdilik en azından uyaralım
      alert("İşletme eklendi fakat Sahip ataması sırasında hata oluştu: " + oError.message)
    }

    // 3. Varsayılan Çalışma Saatlerini (business_hours tablosuna) Ekle (Pzt-Paz)
    const defaultHours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
      business_id: businessId,
      day_of_week: day,
      open_time: "09:00",
      close_time: "18:00",
      is_closed: false
    }))

    const { error: hError } = await supabase
      .from("business_hours")
      .insert(defaultHours)

    if (hError) {
      console.error("Çalışma saatleri eklenemedi:", hError)
    }

    // Başarılı Senaryo - UI Reset & Refetch
    setAddModalOpen(false)
    setNewBiz({
      name: "", city: "", phone: "", moduleId: "", description: "",
      autoApprove: true, cancellationBuffer: 60, ownerId: ""
    })
    setSelectedOwner(null)
    fetchBusinesses()

    // Not: Normalde Sonner (toast) kullanılabilir, alert yerine.
  }

  async function openDrawer(biz: any) {
    setSelectedBiz(biz)
    setDrawerStaff([])
    setWeeklyBarData([])
    setRevenueStats({ revenue: 0, appts: biz.appts, noShows: 0 })
    setDrawerOpen(true)
    setDrawerTab("general")

    const { data: staffData } = await supabase
      .from("staff_business")
      .select("id, is_active, users(name)")
      .eq("business_id", biz.id)

    if (staffData) {
      setDrawerStaff(staffData.map((s: any) => ({
        name: s.users?.name || "İsimsiz",
        role: "Personel",
        appts: 0
      })))
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: apptData } = await supabase
      .from("appointments")
      .select("id, appointment_date, total_price, status")
      .eq("business_id", biz.id)
      .gte("appointment_date", thirtyDaysAgo.toISOString().split('T')[0])

    if (apptData) {
      const weekly = [
        { week: "1. Hafta", randevu: 0 },
        { week: "2. Hafta", randevu: 0 },
        { week: "3. Hafta", randevu: 0 },
        { week: "4. Hafta", randevu: 0 },
      ]
      let revenue = 0;
      let noShowCount = 0;
      apptData.forEach((a: any) => {
        revenue += Number(a.total_price || 0);
        if (a.status === "no_show") noShowCount++;

        const day = new Date(a.appointment_date).getDate()
        if (day <= 7) weekly[0].randevu++
        else if (day <= 14) weekly[1].randevu++
        else if (day <= 21) weekly[2].randevu++
        else weekly[3].randevu++
      })
      setWeeklyBarData(weekly)
      setRevenueStats({ revenue, appts: apptData.length, noShows: noShowCount })
    }
  }

  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase.from("businesses").update({ is_active: !current }).eq("id", id)
    if (!error) {
      fetchBusinesses()
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-foreground">{"İşletmeler"}</h2>
          <p className="text-sm text-muted-foreground">{totalCount} kayıtlı işletme</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RxButton size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus className="size-4" />
            {"Yeni İşletme Ekle"}
          </RxButton>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="İşletme ara..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <select
            value={moduleFilter}
            onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          >
            <option value="all">{"Tüm Modüller"}</option>
            {modulesList.map((m) => (
              <option key={m.id} value={m.id}>{m.display_name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
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
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-border">
                {["İşletme", "Modül", "Patron", "Personel", "Müşteri", "Randevu", "Kayıt Tarihi", "Durum", "İşlemler"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz, idx) => (
                <tr key={biz.id} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
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
                      onClick={() => toggleStatus(biz.id, biz.active)}
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
                        onClick={() => openDrawer(biz)}
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
                              <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light" onClick={() => { setMenuOpenIdx(null); toggleStatus(biz.id, biz.active); }}>
                                <Settings className="size-3.5" /> {biz.active ? "Pasife Al" : "Aktif Et"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {businesses.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">İşletme bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-muted-foreground">
            Toplam {totalCount} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} arası gösteriliyor
          </span>
          <div className="flex items-center shadow-sm rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded-l-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="size-4" /> Önceki
            </button>
            <div className="h-4 w-px bg-border" />
            <span className="px-4 text-sm font-medium text-muted-foreground">
              Sayfa {currentPage} / {totalPages}
            </span>
            <div className="h-4 w-px bg-border" />
            <button
              type="button"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded-r-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Sonraki <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && selectedBiz && (
        <>
          <div className="fixed inset-0 z-40 bg-foreground/30" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border bg-card shadow-xl transition-transform duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <RxAvatar name={selectedBiz.name} size="lg" />
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-foreground">{selectedBiz.name}</span>
                  {selectedBiz.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="gray">Pasif</RxBadge>}
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
                        <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2.5 py-0.5 text-xs font-medium text-badge-green-text">{selectedBiz.module}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Adres</span>
                        <span className="text-[13px] text-foreground">{selectedBiz.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Telefon</span>
                        <span className="text-[13px] text-foreground">{selectedBiz.raw.phone || "+90 --- --- -- --"}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">{"Kayıt Tarihi"}</span>
                        <span className="text-[13px] text-foreground">{selectedBiz.date}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-muted-foreground">Davet Kodu</span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-medium text-foreground">{selectedBiz.raw.invite_code || "-"}</span>
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
                      <RxAvatar name={selectedBiz.patron} size="md" />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">{selectedBiz.patron}</span>
                        <span className="text-xs text-muted-foreground">{selectedBiz.patronEmail}</span>
                        <span className="text-xs text-muted-foreground">{selectedBiz.patronPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Ayarlar</h4>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">Otomatik Onay</span>
                        <div className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors", selectedBiz.raw.auto_approve ? "bg-success" : "bg-muted")}>
                          <span className={cn("inline-block size-4 transform rounded-full bg-card shadow-sm transition-transform", selectedBiz.raw.auto_approve ? "translate-x-[18px]" : "translate-x-0.5")} style={{ marginTop: "2px" }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">{"İptal Süresi"}</span>
                        <span className="text-[13px] text-muted-foreground">{selectedBiz.raw.cancellation_buffer_minutes} dakika</span>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-lg border-t-[3px] border-t-accent border border-border bg-card p-4">
                    <div className="flex flex-col gap-3">
                      <RxButton variant="ghost" size="sm" className="w-full justify-center text-accent hover:bg-badge-red-bg" onClick={() => toggleStatus(selectedBiz.id, selectedBiz.active)}>
                        {selectedBiz.active ? "İşletmeyi Pasife Al" : "İşletmeyi Aktif Et"}
                      </RxButton>
                    </div>
                  </div>
                </div>
              )}

              {drawerTab === "staff" && (
                <div className="flex flex-col gap-3">
                  {drawerStaff.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-primary-light/50">
                      <RxAvatar name={s.name} size="sm" />
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.role}</span>
                      </div>
                    </div>
                  ))}
                  {drawerStaff.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-4">Personel bulunamadı</div>
                  )}
                </div>
              )}

              {drawerTab === "stats" && (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-foreground">₺{revenueStats.revenue.toLocaleString('tr-TR')}</span>
                      <span className="text-xs text-muted-foreground">{"Son 30 Gün Gelir"}</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-foreground">{revenueStats.appts}</span>
                      <span className="text-xs text-muted-foreground">Randevu</span>
                    </div>
                    <div className="flex flex-col items-center rounded-lg border border-border p-3">
                      <span className="text-lg font-bold text-accent">{revenueStats.noShows}</span>
                      <span className="text-xs text-muted-foreground">No-Show</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Son 30 Gün Aktivite</h4>
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

      {/* Add Business Modal (Grid Form) */}
      <RxModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Yeni İşletme Ekle"
        className="max-w-[800px]" // Modal'ı genişlettik
        footer={
          <>
            <RxButton variant="ghost" size="sm" onClick={() => setAddModalOpen(false)}>İptal</RxButton>
            <RxButton size="sm" onClick={handleAddBusiness}>Kaydet</RxButton>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Sol Kolon - Temel İşletme Bilgileri */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Temel Bilgiler</h4>
            <RxInput
              label="İşletme Adı (*)"
              placeholder="Örn: X Güzellik Merkezi"
              value={newBiz.name}
              onChange={(e) => setNewBiz({ ...newBiz, name: e.target.value })}
            />
            <RxTextarea
              label="Kısa Açıklama"
              placeholder="İşletme hakkında kısa bir not..."
              value={newBiz.description}
              onChange={(e) => setNewBiz({ ...newBiz, description: e.target.value })}
              className="resize-none h-20"
            />
            <RxInput
              label="Telefon"
              placeholder="+90 555 444 33 22"
              value={newBiz.phone}
              onChange={(e) => setNewBiz({ ...newBiz, phone: e.target.value })}
            />
            <RxInput
              label="Adres/Şehir"
              placeholder="Örn: Kadıköy, İstanbul"
              value={newBiz.city}
              onChange={(e) => setNewBiz({ ...newBiz, city: e.target.value })}
            />
          </div>

          {/* Sağ Kolon - Konfigürasyon ve Sahip */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold text-foreground border-b border-border pb-2">Sistem Ayarları</h4>

            {/* Modül Seçimi */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground">Sektör / Modül (*)</label>
              <select
                value={newBiz.moduleId}
                onChange={(e) => setNewBiz({ ...newBiz, moduleId: e.target.value })}
                className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Lütfen Modül Seçin</option>
                {modulesList.map((m) => (
                  <option key={m.id} value={m.id}>{m.display_name}</option>
                ))}
              </select>
            </div>

            {/* Owner (Patron) Seçimi - Custom Combobox */}
            <div className="flex flex-col gap-1.5 relative">
              <label className="text-[13px] font-semibold text-foreground">İşletme Sahibi (Owner) (*)</label>
              <div
                className="flex items-center w-full h-10 border border-input rounded-lg px-3 bg-card"
                onClick={() => setIsOwnerDropdownOpen(true)}
              >
                {selectedOwner ? (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-sm text-foreground">{selectedOwner.name} ({selectedOwner.email})</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedOwner(null); setNewBiz({ ...newBiz, ownerId: "" }) }}>
                      <X className="size-4 text-muted-foreground hover:text-danger" />
                    </button>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="İsim ile abone ara..."
                    className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
                    value={ownerSearchQuery}
                    onChange={(e) => setOwnerSearchQuery(e.target.value)}
                    onFocus={() => setIsOwnerDropdownOpen(true)}
                  />
                )}
              </div>

              {/* Owner Search Dropdown */}
              {isOwnerDropdownOpen && !selectedOwner && (
                <div className="absolute top-[4.5rem] left-0 w-full z-10 bg-card border border-border shadow-lg rounded-lg overflow-hidden">
                  {ownerSearchResults.length > 0 ? (
                    ownerSearchResults.map(u => (
                      <div
                        key={u.id}
                        className="flex flex-col p-2.5 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                        onClick={() => {
                          setSelectedOwner(u)
                          setNewBiz({ ...newBiz, ownerId: u.id })
                          setIsOwnerDropdownOpen(false)
                          setOwnerSearchQuery("")
                        }}
                      >
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      {ownerSearchQuery.length > 1 ? "Kullanıcı bulunamadı." : "Aramak için yazın..."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ek Configs */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <RxInput
                label="Min. İptal Süresi (Dk)"
                type="number"
                value={newBiz.cancellationBuffer.toString()}
                onChange={(e) => setNewBiz({ ...newBiz, cancellationBuffer: Number(e.target.value) })}
              />
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer w-full p-2 border border-border rounded-lg hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={newBiz.autoApprove}
                    onChange={(e) => setNewBiz({ ...newBiz, autoApprove: e.target.checked })}
                    className="size-4 rounded border-border text-primary accent-primary"
                  />
                  <span className="text-xs font-semibold text-foreground">Oto Randevu Onayı</span>
                </label>
              </div>
            </div>

          </div>
        </div>
      </RxModal>

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

function ModulesTab() {
  const supabase = createClient()
  const [modules, setModules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Add Modal State
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

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editModId, setEditModId] = useState("")
  const [editModuleName, setEditModuleName] = useState("")
  const [editModuleSlug, setEditModuleSlug] = useState("")
  const [editModuleDesc, setEditModuleDesc] = useState("")
  const [editSelectedIcon, setEditSelectedIcon] = useState("Scissors")
  const [editRequiredFields, setEditRequiredFields] = useState({
    personel: false, hizmet: false, hayvan: false, dosya: false, asset: false
  })
  const [editOptionalFeatures, setEditOptionalFeatures] = useState({
    notes: false, noshow: false, multiResource: false
  })

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    setLoading(true)
    const { data: modsData } = await supabase
      .from("modules")
      .select(`
        *,
        businesses(id)
      `)
      .order("created_at", { ascending: true })

    if (modsData) {
      const mapped = modsData.map((m: any) => {
        const config = m.config || {};
        return {
          id: m.id,
          name: m.display_name,
          slug: m.name,
          iconLabel: config.icon || "Puzzle",
          description: config.description || "Modül açıklaması",
          businesses: m.businesses?.length || 0,
          appts: 0,
          required: config.required || [],
          optional: config.optional || [],
          active: m.is_active,
          comingSoon: false
        }
      })
      setModules(mapped)
    }
    setLoading(false)
  }

  const handleNameChange = (val: string) => {
    setModuleName(val)
    setModuleSlug(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
  }

  const handleEditNameChange = (val: string) => {
    setEditModuleName(val)
    setEditModuleSlug(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
  }

  function openEditModal(mod: any) {
    setEditModId(mod.id)
    setEditModuleName(mod.name)
    setEditModuleSlug(mod.slug)
    setEditModuleDesc(mod.description)
    setEditSelectedIcon(mod.iconLabel)

    const rf = { personel: false, hizmet: false, hayvan: false, dosya: false, asset: false }
    mod.required.forEach((k: any) => { if (k in rf) rf[k as keyof typeof rf] = true })
    setEditRequiredFields(rf)

    const of = { notes: false, noshow: false, multiResource: false }
    mod.optional.forEach((k: any) => { if (k in of) of[k as keyof typeof of] = true })
    setEditOptionalFeatures(of)

    setEditModalOpen(true)
  }

  async function handleAddModule() {
    const config = {
      icon: selectedIcon,
      description: moduleDesc,
      required: Object.entries(requiredFields).filter(([_, v]) => v).map(([k]) => k),
      optional: Object.entries(optionalFeatures).filter(([_, v]) => v).map(([k]) => k),
    }

    const { error } = await supabase.from("modules").insert({
      name: moduleSlug,
      display_name: moduleName,
      is_active: true,
      config: config
    })

    if (!error) {
      setNewModalOpen(false)
      setModuleName("")
      setModuleSlug("")
      setModuleDesc("")
      fetchModules()
    } else {
      alert("Hata: " + error.message)
    }
  }

  async function handleUpdateModule() {
    const config = {
      icon: editSelectedIcon,
      description: editModuleDesc,
      required: Object.entries(editRequiredFields).filter(([_, v]) => v).map(([k]) => k),
      optional: Object.entries(editOptionalFeatures).filter(([_, v]) => v).map(([k]) => k),
    }

    const { error } = await supabase.from("modules").update({
      name: editModuleSlug,
      display_name: editModuleName,
      config: config
    }).eq("id", editModId)

    if (!error) {
      setEditModalOpen(false)
      fetchModules()
    } else {
      alert("Hata: " + error.message)
    }
  }

  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase.from("modules").update({ is_active: !current }).eq("id", id)
    if (!error) {
      fetchModules()
    }
  }

  if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>

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
        {modules.map((mod) => {
          const IconObj = iconOptions.find(o => o.label === mod.iconLabel)
          const Icon = IconObj ? IconObj.icon : Puzzle
          return (
            <div
              key={mod.id}
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
                  onClick={() => toggleStatus(mod.id, mod.active)}
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
                    {mod.required.map((f: string) => (
                      <span key={f} className="rounded-md bg-badge-purple-bg px-2 py-0.5 text-[11px] font-medium text-badge-purple-text">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-foreground">Opsiyonel:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mod.optional.map((f: string) => (
                      <span key={f} className="rounded-md bg-badge-gray-bg px-2 py-0.5 text-[11px] font-medium text-badge-gray-text">{f}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <button type="button" onClick={() => openEditModal(mod)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">{"Düzenle"}</button>
                  <button type="button" onClick={() => alert("Modül Detayları hazır değil.")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">Detay</button>
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
            <RxButton size="sm" onClick={handleAddModule}>{"Modülü Kaydet"}</RxButton>
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
                    checked={requiredFields[field.key as keyof typeof requiredFields]}
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
                    checked={optionalFeatures[feat.key as keyof typeof optionalFeatures]}
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

      {/* Edit Module Modal */}
      <RxModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modülü Düzenle"
        className="max-w-[560px]"
        footer={
          <>
            <RxButton variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>{"Vazgeç"}</RxButton>
            <RxButton size="sm" onClick={handleUpdateModule}>{"Modülü Güncelle"}</RxButton>
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
                value={editModuleName}
                onChange={(e) => handleEditNameChange(e.target.value)}
              />
              <RxInput
                label="Sistem Adı"
                placeholder="health_clinic"
                value={editModuleSlug}
                onChange={(e) => setEditModuleSlug(e.target.value)}
              />
              <RxTextarea
                label="Açıklama"
                placeholder="Modül hakkında kısa açıklama..."
                value={editModuleDesc}
                onChange={(e) => setEditModuleDesc(e.target.value)}
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
                    onClick={() => setEditSelectedIcon(opt.label)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border transition-colors",
                      editSelectedIcon === opt.label
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
                    checked={editRequiredFields[field.key as keyof typeof editRequiredFields]}
                    onChange={(e) => setEditRequiredFields({ ...editRequiredFields, [field.key]: e.target.checked })}
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
                    checked={editOptionalFeatures[feat.key as keyof typeof editOptionalFeatures]}
                    onChange={(e) => setEditOptionalFeatures({ ...editOptionalFeatures, [feat.key]: e.target.checked })}
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

function LogsTab() {
  const supabase = createClient()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [tableFilter, setTableFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    fetchLogs()
  }, [currentPage, actionFilter, tableFilter, dateFilter])

  async function fetchLogs() {
    setLoading(true)
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        users (name, auth_provider)
      `, { count: 'exact' })
      .order("created_at", { ascending: false })

    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter)
    }
    if (tableFilter !== "all") {
      query = query.eq("target_table", tableFilter)
    }
    if (dateFilter) {
      const startDate = new Date(dateFilter)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)
      query = query.gte("created_at", startDate.toISOString())
      query = query.lte("created_at", endDate.toISOString())
    }

    const from = (currentPage - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (data) {
      const mapped = data.map((log: any) => ({
        time: new Date(log.created_at).toLocaleString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        user: log.users?.name || "Bilinmeyen Kullanıcı",
        role: log.users?.auth_provider === "google" ? "Google Login" : "Email",
        action: log.action,
        table: log.target_table,
        record: log.target_id ? `#${log.target_id.substring(0, 8)}` : "-",
        ip: log.ip_address || "Bilinmiyor",
        rawUser: log.user
      }))
      setLogs(mapped)
    }
    if (count !== null) setTotalCount(count)
    setLoading(false)
  }

  async function handleExportCSV() {
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        users (name, auth_provider)
      `)
      .order("created_at", { ascending: false })
      .limit(2000) // limit arbitrary large number for safety

    if (actionFilter !== "all") query = query.eq("action", actionFilter)
    if (tableFilter !== "all") query = query.eq("target_table", tableFilter)
    if (dateFilter) {
      const startDate = new Date(dateFilter)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(startDate)
      endDate.setHours(23, 59, 59, 999)
      query = query.gte("created_at", startDate.toISOString())
      query = query.lte("created_at", endDate.toISOString())
    }

    const { data } = await query
    if (!data || data.length === 0) {
      alert("Dışa aktarılacak kayıt bulunamadı.")
      return
    }

    const headers = ["Zaman", "Kullanıcı", "Giris Tipi", "Islem", "Tablo", "Kayit ID", "IP Adresi"]
    const rows = data.map((log: any) => {
      const time = new Date(log.created_at).toLocaleString("tr-TR")
      const user = log.users?.name || "Bilinmeyen Kullanıcı"
      const role = log.users?.auth_provider === "google" ? "Google" : "Email"
      const action = log.action
      const table = log.target_table
      const record = log.target_id || "-"
      const ip = log.ip_address || "Bilinmiyor"
      return [time, user, role, action, table, record, ip].map(v => `"${v}"`).join(",")
    })

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `sistem_loglari_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const actionBadge = (action: string) => {
    switch (action) {
      case "viewed":
        return <span className="inline-flex items-center rounded-md bg-badge-purple-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-purple-text">viewed</span>
      case "created":
        return <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-green-text">created</span>
      case "updated":
        return <span className="inline-flex items-center rounded-md bg-badge-yellow-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-yellow-text">updated</span>
      case "deleted":
        return <span className="inline-flex items-center rounded-md bg-badge-red-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-red-text">deleted</span>
      default:
        return <span className="inline-flex items-center rounded-md bg-badge-gray-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-gray-text">{action}</span>
    }
  }

  const filtered = logs.filter((log) => {
    if (searchQuery && !log.user.toLowerCase().includes(searchQuery.toLowerCase()) && !log.action.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

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
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
          <RxButton variant="ghost" size="sm" onClick={handleExportCSV}>
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
            placeholder="Mevcut sayfada ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">{"Tüm İşlemler"}</option>
          <option value="viewed">viewed</option>
          <option value="created">created</option>
          <option value="updated">updated</option>
          <option value="deleted">deleted</option>
        </select>
        <select
          value={tableFilter}
          onChange={(e) => { setTableFilter(e.target.value); setCurrentPage(1); }}
          className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">{"Tüm Tablolar"}</option>
          <option value="appointments">appointments</option>
          <option value="businesses">businesses</option>
          <option value="users">users</option>
          <option value="customers">customers</option>
          <option value="staff">staff</option>
          <option value="modules">modules</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : (
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Kayıt bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Toplam {totalCount} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} arası gösteriliyor
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground disabled:opacity-50"
          >
            <ChevronLeft className="size-4" />
          </button>

          <span className="text-sm font-medium px-2">Sayfa {currentPage} / {totalPages}</span>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground disabled:opacity-50"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
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
  const [activeTab, setActiveTab] = useState<"overview" | "businesses" | "users" | "modules" | "stats" | "logs" | "settings">("overview")
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
    { key: "users" as const, label: "Kullanıcılar" },
    { key: "modules" as const, label: "Modül Yönetimi" },
    { key: "stats" as const, label: "Platform İstatistikleri" },
    { key: "logs" as const, label: "Sistem Logları" },
    { key: "settings" as const, label: "Ayarlar" },
  ]

  const handleNavClick = (key: string) => {
    const tabMap: Record<string, typeof activeTab> = {
      overview: "overview",
      businesses: "businesses",
      users: "users",
      modules: "modules",
      stats: "stats",
      logs: "logs",
      settings: "settings",
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
          <AdminTopNav title={pageTitle} onMenuToggle={() => setDrawerOpen(true)} showMenu={isMobile} onSettingsClick={() => handleNavClick("settings")} />

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
            {activeTab === "users" && <UsersTab />}
            {activeTab === "modules" && <ModulesTab />}
            {activeTab === "stats" && <StatsTab />}
            {activeTab === "logs" && <LogsTab />}
            {activeTab === "settings" && <SettingsTab />}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
