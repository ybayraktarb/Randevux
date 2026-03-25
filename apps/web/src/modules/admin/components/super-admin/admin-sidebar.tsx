"use client"

import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    Layers,
    BarChart3,
    ScrollText,
    Settings,
    CalendarDays,
    LogOut,
    Package,
    Megaphone,
    CreditCard,
    Zap
} from "lucide-react"

import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip"

const adminNavGroups = [
    {
        title: "ANA YÖNETİM",
        items: [
            { label: "Genel Bakış", icon: LayoutDashboard, key: "overview" },
            { label: "İşletmeler", icon: Building2, key: "businesses" },
            { label: "Kullanıcılar", icon: Users, key: "users" },
            { label: "Özellik Havuzu", icon: Zap, key: "features" },
        ]
    },
    {
        title: "FİNANS & YAPILANDIRMA",
        items: [
            { label: "Abonelik ve Finans", icon: CreditCard, key: "finance" },
            { label: "Paket Yönetimi", icon: Package, key: "packages" },
            { label: "Sektör & Modüller", icon: Layers, key: "modules" },
        ]
    },
    {
        title: "SİSTEM MERKEZİ",
        items: [
            { label: "Duyurular", icon: Megaphone, key: "announcements" },
            { label: "Platform İstatistikleri", icon: BarChart3, key: "stats" },
            { label: "Sistem Logları", icon: ScrollText, key: "logs" },
            { label: "Genel Ayarlar", icon: Settings, key: "settings" },
        ]
    }
]

export function AdminSidebar({ collapsed, activeItem, onNavClick }: Readonly<{
    collapsed: boolean
    activeItem: string
    onNavClick: (key: string) => void
}>) {
    return (
        <div className="flex h-full flex-col bg-card border-r border-border shadow-sm">
            {/* Logo Alanı */}
            <div className={cn("flex items-center gap-3 border-b border-border px-5 py-4", collapsed && "justify-center px-2")}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <CalendarDays className="size-5" />
                </div>
                {!collapsed && <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">RandevuX</span>}
            </div>

            {/* Süper Admin Rozeti */}
            {!collapsed && (
                <div className="mx-4 mt-4 px-2">
                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-[11px] font-bold text-purple-700 uppercase tracking-widest shadow-sm border border-purple-100/50">
                        Süper Admin
                    </span>
                </div>
            )}

            {/* Navigasyon Listesi */}
            <nav className={cn("mt-4 flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden", collapsed ? "px-2" : "px-4")}>
                {adminNavGroups.map((group) => (
                    <div key={group.title} className="flex flex-col gap-1">
                        {!collapsed && (
                            <h4 className="px-2 mb-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {group.title}
                            </h4>
                        )}
                        {group.items.map((item) => {
                            const isActive = activeItem === item.key
                            const Icon = item.icon
                            const btn = (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => onNavClick(item.key)}
                                    className={cn(
                                        "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all duration-200",
                                        collapsed && "justify-center px-0 py-2.5",
                                        isActive
                                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                                            : "text-muted-foreground/80 font-medium hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    {isActive && !collapsed && (
                                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-md bg-primary shadow-[0_0_8px_rgba(var(--primary),0.6)]" />
                                    )}
                                    <Icon className={cn(
                                        "shrink-0 transition-all duration-200", 
                                        collapsed ? "size-6" : "size-[18px]",
                                        isActive ? "text-primary fill-primary/10" : "text-muted-foreground/70 group-hover:text-foreground"
                                    )} />
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </button>
                            )
                            if (collapsed) {
                                return (
                                    <Tooltip key={item.key} delayDuration={0}>
                                        <TooltipTrigger asChild>{btn}</TooltipTrigger>
                                        <TooltipContent side="right" sideOffset={12} className="font-medium">{item.label}</TooltipContent>
                                    </Tooltip>
                                )
                            }
                            return <div key={item.key}>{btn}</div>
                        })}
                        {/* Gruplar arası ayrıştırıcı çizgi (son grup hariç) */}
                        {!collapsed && group.title !== adminNavGroups[adminNavGroups.length - 1].title && (
                            <div className="mx-2 mt-3 mb-1 h-px bg-border/50" />
                        )}
                    </div>
                ))}
            </nav>

            {/* Profil ve Çıkış */}
            <div className={cn("border-t border-border bg-card/50 p-4 transition-all", collapsed && "flex flex-col items-center gap-2 px-2")}>
                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <div><RxAvatar name="Admin" size="sm" online /></div>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={12}>Admin Profili</TooltipContent>
                    </Tooltip>
                ) : (
                    <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors">
                        <RxAvatar name="Admin" size="md" online />
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-semibold text-foreground">Admin</span>
                            <span className="truncate text-[11px] text-muted-foreground">admin@randevux.com</span>
                        </div>
                        <button type="button" className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" title="Çıkış Yap">
                            <LogOut className="size-[18px]" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
