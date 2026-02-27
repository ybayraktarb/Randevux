"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    CalendarDays,
    ChevronDown,
    LogOut,
    Search,
    Bell,
    Menu,
    X,
    Check,
    CheckCheck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip"
import type { NavItem } from "@/lib/nav-config"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useNotifications } from "@/hooks/use-notifications"

// ─── Props ──────────────────────────────────────────────────────────────────────

interface AppShellLayoutProps {
    children: React.ReactNode
    role: "patron" | "personel" | "musteri" | "admin"
    navItems: NavItem[]
    userName: string
    userBadge: string
    businessName?: string
}

// ─── Sidebar Content ────────────────────────────────────────────────────────────

function SidebarContent({
    navItems,
    pathname,
    collapsed,
    businessName,
    userName,
    userBadge,
    role,
}: {
    navItems: NavItem[]
    pathname: string
    collapsed: boolean
    businessName?: string
    userName: string
    userBadge: string
    role: string
}) {
    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div
                className={cn(
                    "flex items-center gap-2.5 border-b border-border px-5 py-4",
                    collapsed && "justify-center px-0"
                )}
            >
                <CalendarDays className="size-7 shrink-0 text-primary" />
                {!collapsed && (
                    <span className="text-lg font-bold text-primary">RandevuX</span>
                )}
            </div>

            {/* Business Switcher */}
            {!collapsed && businessName && (
                <button
                    type="button"
                    className="mx-4 mt-4 flex items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-primary-light"
                >
                    <span className="truncate text-xs text-muted-foreground">
                        {businessName}
                    </span>
                    <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                </button>
            )}

            {/* Navigation */}
            <nav
                className={cn(
                    "mt-4 flex flex-1 flex-col gap-1",
                    collapsed ? "px-2" : "px-3"
                )}
            >
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
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
                            <Icon
                                className={cn(
                                    "size-5 shrink-0",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-foreground"
                                )}
                            />
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
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
            <div
                className={cn(
                    "border-t border-border p-4",
                    collapsed && "flex flex-col items-center gap-2 px-2"
                )}
            >
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
                                <p className="text-[10px] opacity-70">{userBadge}</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const supabase = createClient()
                                        await supabase.auth.signOut()
                                        window.location.href = "/login"
                                    }}
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
                            <RxBadge
                                variant={role === "patron" || role === "admin" ? "purple" : "gray"}
                            >
                                {userBadge}
                            </RxBadge>
                        </div>
                        <button
                            type="button"
                            onClick={async () => {
                                const supabase = createClient()
                                await supabase.auth.signOut()
                                window.location.href = "/login"
                            }}
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
    userName,
}: {
    pageTitle: string
    onMenuToggle: () => void
    showMenuButton: boolean
    userName: string
}) {
    const { user } = useCurrentUser()
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id)
    const [notifOpen, setNotifOpen] = useState(false)
    const notifRef = useRef<HTMLDivElement>(null)
    const [prevUnread, setPrevUnread] = useState(0)
    const [pulse, setPulse] = useState(false)

    // Pulse animation when unread count increases
    useEffect(() => {
        if (unreadCount > prevUnread && prevUnread !== 0) {
            setPulse(true)
            const timer = setTimeout(() => setPulse(false), 1500)
            return () => clearTimeout(timer)
        }
        setPrevUnread(unreadCount)
    }, [unreadCount, prevUnread])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    const recent = notifications.slice(0, 10)

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        const now = new Date()
        const diffMs = now.getTime() - d.getTime()
        const diffMin = Math.floor(diffMs / 60000)
        if (diffMin < 1) return "Az once"
        if (diffMin < 60) return `${diffMin} dk once`
        const diffH = Math.floor(diffMin / 60)
        if (diffH < 24) return `${diffH} saat once`
        return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
    }

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
                <div ref={notifRef} className="relative">
                    <button
                        type="button"
                        onClick={() => setNotifOpen(!notifOpen)}
                        className={cn(
                            "relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary-light hover:text-foreground",
                            pulse && "animate-pulse"
                        )}
                        aria-label="Bildirimler"
                    >
                        <Bell className="size-5" />
                        {unreadCount > 0 && (
                            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {notifOpen && (
                        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card shadow-xl">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <span className="text-sm font-semibold text-foreground">Bildirimler</span>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => markAllAsRead()}
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        <CheckCheck className="size-3.5" />
                                        Tumunu okundu isaretle
                                    </button>
                                )}
                            </div>
                            <div className="max-h-[360px] overflow-y-auto">
                                {recent.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-8">
                                        <Bell className="size-8 text-muted-foreground/40" />
                                        <p className="text-sm text-muted-foreground">Bildiriminiz yok</p>
                                    </div>
                                ) : (
                                    recent.map((n) => (
                                        <button
                                            key={n.id}
                                            type="button"
                                            onClick={() => { if (!n.isRead) markAsRead(n.id) }}
                                            className={cn(
                                                "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-light/50",
                                                !n.isRead && "bg-primary-light/30"
                                            )}
                                        >
                                            <div className="mt-0.5 flex size-2 shrink-0 items-center justify-center">
                                                {!n.isRead && <span className="size-2 rounded-full bg-primary" />}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className={cn("text-[13px] text-foreground", !n.isRead && "font-semibold")}>{n.title}</span>
                                                {n.body && <span className="text-xs text-muted-foreground truncate">{n.body}</span>}
                                                <span className="text-[11px] text-muted-foreground/70">{formatTime(n.createdAt)}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="mx-1 hidden h-8 w-px bg-border sm:block" />

                {/* Profile */}
                <button
                    type="button"
                    className="hidden items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-primary-light sm:flex"
                >
                    <RxAvatar name={userName} size="sm" />
                    <span className="text-sm font-medium text-foreground">
                        {userName}
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
    navItems,
    pathname,
    businessName,
    userName,
    userBadge,
    role,
}: {
    open: boolean
    onClose: () => void
    navItems: NavItem[]
    pathname: string
    businessName?: string
    userName: string
    userBadge: string
    role: string
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
                    open
                        ? "pointer-events-auto opacity-100"
                        : "pointer-events-none opacity-0"
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
                    navItems={navItems}
                    pathname={pathname}
                    collapsed={false}
                    businessName={businessName}
                    userName={userName}
                    userBadge={userBadge}
                    role={role}
                />
            </aside>
        </>
    )
}

// ─── Main App Shell Layout ──────────────────────────────────────────────────────

export function AppShellLayout({
    children,
    role,
    navItems,
    userName,
    userBadge,
    businessName,
}: AppShellLayoutProps) {
    const pathname = usePathname()
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

    // Derive page title from current path
    const activeNav = navItems.find((item) => pathname === item.href)
    const pageTitle = activeNav?.label ?? "RandevuX"

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
                            navItems={navItems}
                            pathname={pathname}
                            collapsed={sidebarCollapsed}
                            businessName={businessName}
                            userName={userName}
                            userBadge={userBadge}
                            role={role}
                        />
                    </aside>
                )}

                {/* Mobile Drawer */}
                {isMobile && (
                    <MobileDrawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        navItems={navItems}
                        pathname={pathname}
                        businessName={businessName}
                        userName={userName}
                        userBadge={userBadge}
                        role={role}
                    />
                )}

                {/* Main Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <TopNavbar
                        pageTitle={pageTitle}
                        onMenuToggle={() => setDrawerOpen(true)}
                        showMenuButton={isMobile}
                        userName={userName}
                    />

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-5 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}
