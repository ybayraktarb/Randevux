"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Clock,
  UserCheck,
  Settings,
  ClipboardList,
  Umbrella,
  Search,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  CalendarDays,
  X,
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip"

// ─── Types ──────────────────────────────────────────────────────────────────────

type UserRole = "patron" | "personel"

interface NavItem {
  label: string
  icon: React.ElementType
  href: string
}

const patronNav: NavItem[] = [
  { label: "Genel Bakış", icon: LayoutDashboard, href: "/" },
  { label: "Randevular", icon: Calendar, href: "/randevular" },
  { label: "Personel", icon: Users, href: "/personel" },
  { label: "Hizmetler", icon: Scissors, href: "/hizmetler" },
  { label: "Takvim & Vardiyalar", icon: Clock, href: "/takvim" },
  { label: "Müşteriler", icon: UserCheck, href: "/musteriler" },
  { label: "Ayarlar", icon: Settings, href: "/ayarlar" },
]

const personelNav: NavItem[] = [
  { label: "Takvimim", icon: Calendar, href: "/takvimim" },
  { label: "Randevularım", icon: ClipboardList, href: "/randevularim" },
  { label: "İzin Talepleri", icon: Umbrella, href: "/izin" },
  { label: "Ayarlar", icon: Settings, href: "/ayarlar" },
]

// ─── Sidebar Content ────────────────────────────────────────────────────────────

function SidebarContent({
  role,
  activeItem,
  onNavigate,
  collapsed,
}: {
  role: UserRole
  activeItem: string
  onNavigate: (item: NavItem) => void
  collapsed: boolean
}) {
  const navItems = role === "patron" ? patronNav : personelNav
  const userName = role === "patron" ? "Ahmet Yılmaz" : "Zeynep Kaya"

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex items-center gap-2.5 border-b border-border px-5 py-4", collapsed && "justify-center px-0")}>
        <CalendarDays className="size-7 shrink-0 text-primary" />
        {!collapsed && (
          <span className="text-lg font-bold text-primary">RandevuX</span>
        )}
      </div>

      {/* Business Switcher */}
      {!collapsed && (
        <button
          type="button"
          className="mx-4 mt-4 flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary-light"
        >
          <span className="truncate text-xs text-muted-foreground">
            {"Güzellik Salonu Bella"}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      )}

      {/* Navigation */}
      <nav className={cn("mt-4 flex flex-1 flex-col gap-1", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive = activeItem === item.href
          const Icon = item.icon
          const linkContent = (
            <button
              key={item.href}
              type="button"
              onClick={() => onNavigate(item)}
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
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          }

          return linkContent
        })}
      </nav>

      {/* User Section */}
      <div className={cn("border-t border-border p-4", collapsed && "flex flex-col items-center gap-2 px-2")}>
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <RxAvatar name={userName} size="sm" online />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                <p>{userName}</p>
                <p className="text-[10px] opacity-70">{role === "patron" ? "Patron" : "Personel"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary-light hover:text-accent"
                  aria-label="Çıkış Yap"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {"Çıkış Yap"}
              </TooltipContent>
            </Tooltip>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <RxAvatar name={userName} size="md" online />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-foreground">
                {userName}
              </span>
              <RxBadge variant={role === "patron" ? "purple" : "gray"}>
                {role === "patron" ? "Patron" : "Personel"}
              </RxBadge>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary-light hover:text-accent"
              aria-label="Çıkış Yap"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Top Navbar ─────────────────────────────────────────────────────────────────

function TopNavbar({
  pageTitle,
  onMenuToggle,
  showMenuButton,
}: {
  pageTitle: string
  onMenuToggle: () => void
  showMenuButton: boolean
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
      <div className="flex items-center gap-3">
        {showMenuButton && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground"
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground"
          aria-label="Ara"
        >
          <Search className="size-5" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground"
          aria-label="Bildirimler"
        >
          <Bell className="size-5" />
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
            3
          </span>
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

        {/* Profile */}
        <button
          type="button"
          className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-light sm:flex"
        >
          <RxAvatar name="Ahmet Yılmaz" size="sm" />
          <span className="text-sm font-medium text-foreground">
            Ahmet Yılmaz
          </span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  )
}

// ─── Mobile Drawer ──────────────────────────────────────────────────────────────

function MobileDrawer({
  open,
  onClose,
  role,
  activeItem,
  onNavigate,
}: {
  open: boolean
  onClose: () => void
  role: UserRole
  activeItem: string
  onNavigate: (item: NavItem) => void
}) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 transition-opacity duration-300",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-primary-light hover:text-foreground"
          aria-label="Menüyü kapat"
        >
          <X className="size-5" />
        </button>
        <SidebarContent
          role={role}
          activeItem={activeItem}
          onNavigate={(item) => {
            onNavigate(item)
            onClose()
          }}
          collapsed={false}
        />
      </aside>
    </>
  )
}

// ─── Main App Shell ─────────────────────────────────────────────────────────────

export function AppShell({ children }: { children?: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("patron")
  const [activeItem, setActiveItem] = useState("/")
  const [pageTitle, setPageTitle] = useState("Genel Bakış")
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

  const handleNavigate = useCallback((item: NavItem) => {
    setActiveItem(item.href)
    setPageTitle(item.label)
  }, [])

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop / Tablet Sidebar */}
        {!isMobile && (
          <aside
            className={cn(
              "hidden shrink-0 border-r border-border bg-card transition-all duration-200 md:flex md:flex-col",
              sidebarCollapsed ? "w-[60px]" : "w-[260px]"
            )}
          >
            <SidebarContent
              role={role}
              activeItem={activeItem}
              onNavigate={handleNavigate}
              collapsed={sidebarCollapsed}
            />
          </aside>
        )}

        {/* Mobile Drawer */}
        {isMobile && (
          <MobileDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            role={role}
            activeItem={activeItem}
            onNavigate={handleNavigate}
          />
        )}

        {/* Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNavbar
            pageTitle={pageTitle}
            onMenuToggle={() => setDrawerOpen(true)}
            showMenuButton={isMobile}
          />

          {/* Content */}
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children || (
              <div className="flex flex-col gap-6">
                {/* Role Switcher Demo */}
                <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">
                  Rol seçimi:
                </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRole("patron")
                      setActiveItem("/")
                      setPageTitle("Genel Bakış")
                    }}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      role === "patron"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border hover:bg-primary-light"
                    )}
                  >
                    Patron
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole("personel")
                      setActiveItem("/takvimim")
                      setPageTitle("Takvimim")
                    }}
                    className={cn(
                      "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                      role === "personel"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground border border-border hover:bg-primary-light"
                    )}
                  >
                    Personel
                  </button>
                </div>

                {/* Viewport Indicator */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "size-2.5 rounded-full",
                    isMobile ? "bg-accent" : isTablet ? "bg-badge-yellow-text" : "bg-success"
                  )} />
                  <span className="text-sm text-muted-foreground">
                    {isMobile
                      ? "Mobil görünüm (< 768px) - Hamburger menü + çekmece"
                      : isTablet
                        ? "Tablet görünüm (768-1024px) - Simge modu kenar çubuğu"
                        : "Masaüstü görünüm (> 1024px) - Tam kenar çubuğu"}
                  </span>
                </div>

                {/* Placeholder Content */}
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <p className="text-center text-muted-foreground">
                    Sayfa içeriği burada görünecek
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  )
}
