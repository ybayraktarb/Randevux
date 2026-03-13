"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    Bell,
    ChevronDown,
    Menu,
    LogOut,
    Settings,
} from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
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

export function AdminTopNav({ title, onMenuToggle, showMenu, onSettingsClick }: {
    title: string
    onMenuToggle: () => void
    showMenu: boolean
    onSettingsClick?: () => void
}) {
    const supabase = createClient()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        async function loadNotifications() {
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
