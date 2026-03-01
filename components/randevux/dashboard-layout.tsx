"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    Briefcase,
    Settings,
    Bell,
    Menu,
    X,
    ChevronDown,
    LogOut,
    Building2
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

interface LayoutProps {
    children: React.ReactNode
    user: any
    role: string
}

const navItems = [
    { label: "Özet", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Takvim", icon: CalendarDays, href: "/dashboard/calendar" },
    { label: "Personel", icon: Users, href: "/dashboard/staff" },
    { label: "Hizmetler", icon: Briefcase, href: "/dashboard/services" },
    { label: "Müşteriler", icon: Users, href: "/dashboard/customers" }, // İkonlar değişebilir Müşteri için ayrı bişey
    { label: "Ayarlar", icon: Settings, href: "/dashboard/settings" },
]

export function ClientDashboardLayout({ children, user, role }: LayoutProps) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Mobil Menü Arkaplan Karartması */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-card transition-all duration-300 lg:static",
                    collapsed ? "w-[72px]" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* Logo Alanı */}
                <div className={cn("flex h-16 shrink-0 items-center justify-between border-b border-border px-4", collapsed && "justify-center px-0")}>
                    <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
                            <CalendarDays className="size-4 text-primary-foreground" />
                        </div>
                        {!collapsed && <span className="text-xl font-bold text-primary">RandevuX</span>}
                    </div>
                    {/* Mobil Kapatma Butonu */}
                    <button className="lg:hidden p-1 text-muted-foreground" onClick={() => setMobileOpen(false)}>
                        <X className="size-5" />
                    </button>
                </div>

                {/* Role Göstergesi (Örn: İşletme Sahibi) */}
                {!collapsed && (
                    <div className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground capitalize">
                            {role === "patron" ? "İşletme Sahibi" : "Personel"}
                        </span>
                    </div>
                )}

                {/* Menü Linkleri */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-none">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (pathname !== '/dashboard' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                        const Icon = item.icon

                        const btn = (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileOpen(false)}
                                className={cn(
                                    "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                                    collapsed ? "justify-center" : "gap-3",
                                    isActive ? "bg-primary-light text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                                )}
                                <Icon className={cn("size-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        )

                        if (collapsed) {
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                                    <TooltipContent side="right" sideOffset={12}>{item.label}</TooltipContent>
                                </Tooltip>
                            )
                        }
                        return btn
                    })}
                </nav>

                {/* Profil Alt Kısım */}
                <div className="border-t border-border p-4">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <RxAvatar name={user?.user_metadata?.name || "Kullanıcı"} size="sm" online />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm font-medium text-foreground">{user?.user_metadata?.name || "İsimsiz Kullanıcı"}</span>
                                <span className="truncate text-[10px] text-muted-foreground">{user?.email}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <RxAvatar name={user?.user_metadata?.name || "U"} size="sm" online />
                        </div>
                    )}
                </div>
            </aside>

            {/* Sağ İçerik Alanı */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top Navbar */}
                <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-muted-foreground hover:bg-muted rounded-lg" onClick={() => setMobileOpen(true)}>
                            <Menu className="size-5" />
                        </button>
                        <button className="hidden lg:flex p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors border border-transparent" onClick={() => setCollapsed(!collapsed)}>
                            <Menu className="size-4" />
                        </button>
                        <h1 className="text-lg font-semibold text-foreground hidden sm:block">Patron Paneli</h1>
                    </div>

                    <div className="flex items-center gap-3">

                        {/* İşletme (Branch) Değiştirici - Sahte Veri Şimdilik */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted focus:outline-none">
                                    <Building2 className="size-4 text-muted-foreground" />
                                    <span className="max-w-[120px] truncate">Merkez Şube</span>
                                    <ChevronDown className="size-3.5 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">İşletmelerim</div>
                                <DropdownMenuItem className="cursor-pointer">Merkez Şube</DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer text-muted-foreground">Kadıköy Şube</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-primary" onClick={() => router.push("/register-business")}>
                                    + Yeni Şube Ekle
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <button className="relative p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                            <Bell className="size-5" />
                            <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-destructive" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-muted focus:outline-none">
                                    <RxAvatar name={user?.user_metadata?.name || "Kullanıcı"} size="sm" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem className="cursor-pointer py-2">
                                    Hesabım
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer py-2 text-danger focus:bg-red-50 focus:text-danger" onClick={handleLogout}>
                                    <LogOut className="mr-2 size-4" />
                                    Çıkış Yap
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </div>
                </header>

                {/* Dinamik Sayfa İçeriği */}
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}

// Bu kod dosyanın Next.js Link kütüphanesini içermesi gerekiyor.. Yukarı import geçtik.
import Link from 'next/link'
