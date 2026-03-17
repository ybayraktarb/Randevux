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
    Sparkles
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from "@/components/ui/tooltip"
import type { NavItem } from "@/lib/nav-config"
import { getEnabledFeaturesAction } from "@/src/modules/business/actions/business.actions"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { useNotifications } from "@/src/modules/core/hooks/use-notifications"
import { SubscriptionBanner } from "@/src/modules/business/components/subscription-banner"
import React, { useMemo } from "react"
import { PlatformAnnouncementBanner } from "@/src/modules/admin/components/platform-announcement-banner"

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
    businessId,
}: {
    navItems: NavItem[]
    pathname: string
    collapsed: boolean
    businessName?: string
    userName: string
    userBadge: string
    role: string
    businessId: string | null
}) {
    const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])

    useEffect(() => {
        if (!businessId) return

        async function fetchFeatures() {
            // Role-based logic: Super admin might still want to see everything
            // or we just trust the enabled_features list for consistent experience.
            
            // Note: If we need Super Admin to see everything regardless of the business settings:
            if (role === 'admin') {
                setEnabledFeatures(navItems.map(i => i.featureKey).filter(Boolean) as string[])
                return
            }

            const res = await getEnabledFeaturesAction(businessId as string)
            if (res.success && res.data) {
                setEnabledFeatures(res.data)
            }
        }
        fetchFeatures()
    }, [businessId, navItems, role])

    const filteredNavItems = navItems.filter(item => {
        if (!item.featureKey) return true
        return enabledFeatures.includes(item.featureKey)
    })

    return (
        <div className="flex h-full flex-col p-4">
            {/* Logo */}
            <div
                className={cn(
                    "flex items-center gap-3 px-2 py-4 mb-4",
                    collapsed && "justify-center px-0"
                )}
            >
                <div className="size-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <CalendarDays className="size-6 text-white" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col">
                        <span className="text-xl font-black text-gray-900 tracking-tight leading-none">RandevuX</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">Premium Platform</span>
                    </div>
                )}
            </div>

            {/* Business Switcher - Enhanced */}
            {!collapsed && businessName && (
                <div className="px-2 mb-6">
                    <button
                        type="button"
                        className="w-full flex items-center justify-between gap-2 rounded-2xl bg-white border border-gray-100 p-3 text-left transition-all hover:border-primary/20 hover:shadow-md group shadow-sm"
                    >
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Aktif İşletme</span>
                            <span className="truncate text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                                {businessName}
                            </span>
                        </div>
                        <ChevronDown className="size-4 shrink-0 text-gray-400" />
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex flex-1 flex-col gap-2">
                {filteredNavItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    const linkContent = (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all duration-300",
                                collapsed && "justify-center px-0",
                                isActive
                                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                                    : "text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-100"
                            )}
                        >
                            <div className={cn(
                                "flex size-6 items-center justify-center transition-transform group-hover:scale-110",
                                collapsed && "size-8"
                            )}>
                                <Icon className="size-5 shrink-0" />
                            </div>
                            {!collapsed && <span className="truncate tracking-wide">{item.label}</span>}
                            {isActive && !collapsed && (
                                <motion.div
                                    layoutId="active-pill"
                                    className="absolute right-3 size-1.5 rounded-full bg-white/40"
                                />
                            )}
                        </Link>
                    )

                    if (collapsed) {
                        return (
                            <Tooltip key={item.href}>
                                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                <TooltipContent side="right" sideOffset={12} className="font-bold text-xs uppercase tracking-widest bg-gray-900 text-white border-none py-2 px-4 rounded-xl">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        )
                    }

                    return linkContent
                })}
            </nav>

            {/* Profile Section - Redesigned as a Ticket/Card */}
            <div className="mt-auto pt-6 border-t border-dashed border-gray-200">
                {collapsed ? (
                    <div className="flex flex-col items-center gap-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="relative cursor-pointer group"
                                    aria-label="Profil Menüsü"
                                >
                                    <RxAvatar name={userName} size="sm" online className="ring-2 ring-primary/10 transition-all group-hover:ring-primary/30" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="bg-white text-gray-900 shadow-xl border border-gray-100 p-0 rounded-2xl overflow-hidden min-w-[120px]">
                                <div className="p-3 bg-primary text-white">
                                    <p className="font-black text-xs leading-none">{userName}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mt-1">{userBadge}</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>

                        <button
                            type="button"
                            onClick={async () => {
                                const supabase = createClient()
                                await supabase.auth.signOut()
                                window.location.href = "/login"
                            }}
                            className="size-10 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-500 transition-all hover:bg-red-50 hover:text-red-500"
                            aria-label="Çıkış Yap"
                        >
                            <LogOut className="size-5" />
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-[24px] border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        {/* Decorative Gradient */}
                        <div className="absolute top-0 right-0 size-20 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10" />

                        <div className="flex items-center gap-3 relative z-10">
                            <RxAvatar name={userName} size="md" online className="ring-4 ring-primary/5" />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-black text-gray-900">
                                    {userName}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="size-3 text-primary" />
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.1em]">
                                        {userBadge}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    const supabase = createClient()
                                    await supabase.auth.signOut()
                                    globalThis.location.href = "/login"
                                }}
                                className="shrink-0 size-8 flex items-center justify-center rounded-xl text-gray-300 transition-all hover:bg-red-50 hover:text-red-500"
                                aria-label="Çıkış Yap"
                            >
                                <LogOut className="size-4" />
                            </button>
                        </div>
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

    useEffect(() => {
        if (unreadCount > prevUnread && prevUnread !== 0) {
            setPulse(true)
            const timer = setTimeout(() => setPulse(false), 1500)
            return () => clearTimeout(timer)
        }
        setPrevUnread(unreadCount)
    }, [unreadCount, prevUnread])

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
        if (diffMin < 1) return "Az önce"
        if (diffMin < 60) return `${diffMin} dk önce`
        const diffH = Math.floor(diffMin / 60)
        if (diffH < 24) return `${diffH} saat önce`
        return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
    }

    return (
        <header className="flex h-20 shrink-0 items-center justify-between bg-background/80 backdrop-blur-md px-6 lg:px-12 sticky top-0 z-30">
            <div className="flex items-center gap-4">
                {showMenuButton && (
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        className="rounded-2xl bg-white border border-gray-100 p-2.5 text-gray-500 shadow-sm transition-all hover:text-primary hover:border-primary/20"
                        aria-label="Menüyü aç"
                    >
                        <Menu className="size-6" />
                    </button>
                )}
                <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{pageTitle}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistem Aktif</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Visual Search Trigger */}
                <button
                    type="button"
                    className="hidden md:flex items-center gap-3 bg-gray-100/50 border border-gray-100 px-4 py-2 rounded-2xl w-64 group cursor-pointer hover:bg-white hover:shadow-md transition-all text-left"
                >
                    <Search className="size-4 text-gray-400 group-hover:text-primary transition-colors" />
                    <span className="text-xs font-bold text-gray-400">Her şeyi ara...</span>
                </button>

                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div ref={notifRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setNotifOpen(!notifOpen)}
                            className={cn(
                                "relative size-11 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 shadow-sm transition-all hover:text-primary hover:border-primary/20",
                                pulse && "animate-pulse ring-2 ring-primary/20"
                            )}
                            aria-label="Bildirimler"
                        >
                            <Bell className="size-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-lg shadow-primary/20 border-2 border-background">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {notifOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full z-50 mt-4 w-[320px] rounded-[32px] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 p-2 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between border-b border-gray-50 px-4 py-4 mb-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-gray-900">Bildirimler</span>
                                        {unreadCount > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => markAllAsRead()}
                                                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                            >
                                                Hepsini Oku
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {recent.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-10 px-4">
                                                <div className="size-16 rounded-3xl bg-gray-50 flex items-center justify-center">
                                                    <Bell className="size-8 text-gray-200" />
                                                </div>
                                                <p className="text-xs font-bold text-gray-400">Henüz bildiriminiz yok</p>
                                            </div>
                                        ) : (
                                            recent.map((n) => (
                                                <button
                                                    key={n.id}
                                                    type="button"
                                                    onClick={() => { if (!n.isRead) markAsRead(n.id) }}
                                                    className={cn(
                                                        "flex w-full gap-4 px-4 py-4 text-left transition-all hover:bg-gray-50 rounded-2xl mb-1",
                                                        !n.isRead && "bg-primary/5"
                                                    )}
                                                >
                                                    <div className="shrink-0 mt-1">
                                                        {!n.isRead ? (
                                                            <div className="size-2 rounded-full bg-primary shadow-sm shadow-primary/40" />
                                                        ) : (
                                                            <div className="size-2 rounded-full bg-gray-200" />
                                                        )}
                                                    </div>
                                                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                                                        <span className={cn("text-sm text-gray-900 leading-tight", !n.isRead ? "font-black" : "font-bold")}>{n.title}</span>
                                                        {n.body && <span className="text-[11px] font-bold text-gray-500 leading-relaxed line-clamp-2">{n.body}</span>}
                                                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 mt-1">{formatTime(n.createdAt)}</span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Trigger - Unified with Sidebar Look */}
                    <button
                        type="button"
                        className="hidden sm:flex items-center gap-3 bg-white border border-gray-100 rounded-full pl-2 pr-4 py-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer group ml-2"
                    >
                        <RxAvatar name={userName} size="sm" online />
                        <div className="flex flex-col gap-0.5 min-w-[60px] text-left">
                            <span className="text-xs font-black text-gray-900 leading-none truncate overflow-hidden max-w-[80px]">
                                {userName}
                            </span>
                        </div>
                        <ChevronDown className="size-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                </div>
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
    businessId,
}: {
    open: boolean
    onClose: () => void
    navItems: NavItem[]
    pathname: string
    businessName?: string
    userName: string
    userBadge: string
    role: string
    businessId: string | null
}) {
    return (
        <>
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
                aria-hidden="true"
            />

            {/* Drawer */}
            <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 z-50 w-[300px] bg-gray-50 shadow-2xl overflow-hidden"
            >
                <div className="absolute right-4 top-6 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-10 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 shadow-sm transition-all hover:text-primary hover:border-primary/20"
                        aria-label="Menüyü kapat"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                <SidebarContent
                    navItems={navItems}
                    pathname={pathname}
                    collapsed={false}
                    businessName={businessName}
                    userName={userName}
                    userBadge={userBadge}
                    role={role}
                    businessId={businessId}
                />
            </motion.aside>
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
    const { businessId } = useCurrentUser()
    const pathname = usePathname()
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [windowWidth, setWindowWidth] = useState(1200)

    useEffect(() => {
        const handleResize = () => setWindowWidth(globalThis.innerWidth)
        handleResize()
        globalThis.addEventListener("resize", handleResize)
        return () => globalThis.removeEventListener("resize", handleResize)
    }, [])

    const isMobile = windowWidth < 1024
    const sidebarCollapsed = windowWidth >= 1024 && windowWidth < 1280

    // Derive page title from current path
    const activeNav = navItems.find((item) => pathname === item.href)
    const pageTitle = activeNav?.label ?? "RandevuX"

    return (
        <TooltipProvider delayDuration={100}>
            <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
                {/* Desktop / Tablet Sidebar */}
                {!isMobile && (
                    <aside
                        className={cn(
                            "hidden shrink-0 bg-gray-50/50 backdrop-blur-xl transition-all duration-500 md:flex md:flex-col border-r border-gray-100",
                            sidebarCollapsed ? "w-[100px]" : "w-[280px]"
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
                            businessId={businessId}
                        />
                    </aside>
                )}

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isMobile && drawerOpen && (
                        <MobileDrawer
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                            navItems={navItems}
                            pathname={pathname}
                            businessName={businessName}
                            userName={userName}
                            userBadge={userBadge}
                            role={role}
                            businessId={businessId}
                        />
                    )}
                </AnimatePresence>

                {/* Main Area */}
                <div className="flex flex-1 flex-col overflow-hidden relative">
                    {/* Floating Glow Effect */}
                    <div className="absolute top-0 right-0 size-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />

                    <TopNavbar
                        pageTitle={pageTitle}
                        onMenuToggle={() => setDrawerOpen(true)}
                        showMenuButton={isMobile}
                        userName={userName}
                    />

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-12 relative z-10 scroll-smooth">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="max-w-[1600px] mx-auto"
                        >
                             <SubscriptionBanner businessId={businessId!} role={role as any} />
                             <PlatformAnnouncementBanner role={role} />
                            {children}
                        </motion.div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    )
}
