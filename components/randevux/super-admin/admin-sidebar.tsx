"use client"

import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Building2,
    Users,
    Puzzle,
    BarChart3,
    ScrollText,
    Settings,
    CalendarDays,
    LogOut,
} from "lucide-react"
import { RxAvatar } from "../rx-avatar"
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from "@/components/ui/tooltip"

const adminNav = [
    { label: "Genel Bakış", icon: LayoutDashboard, key: "overview" },
    { label: "İşletmeler", icon: Building2, key: "businesses" },
    { label: "Kullanıcılar", icon: Users, key: "users" },
    { label: "Modül Yönetimi", icon: Puzzle, key: "modules" },
    { label: "Platform İstatistikleri", icon: BarChart3, key: "stats" },
    { label: "Sistem Logları", icon: ScrollText, key: "logs" },
    { label: "Ayarlar", icon: Settings, key: "settings" },
]

export function AdminSidebar({ collapsed, activeItem, onNavClick }: {
    collapsed: boolean
    activeItem: string
    onNavClick: (key: string) => void
}) {
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
