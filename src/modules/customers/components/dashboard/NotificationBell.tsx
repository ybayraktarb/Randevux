import { Bell } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Notification } from "./types"

export function NotificationBell({ notifications, onMarkAsRead }: { notifications: Notification[], onMarkAsRead: (id: string) => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted cursor-pointer"
      >
        <Bell className="size-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-11 z-50 w-72 origin-top-right rounded-xl border border-border bg-card p-2 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-2 px-2 py-1 flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-bold text-foreground">Bildirimler</span>
              {unreadCount > 0 && <span className="text-[10px] text-muted-foreground">{unreadCount} okunmamış</span>}
            </div>
            <div className="flex max-h-[300px] flex-col overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Henüz bildiriminiz yok.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "group relative flex flex-col gap-1 rounded-lg p-2 transition-colors hover:bg-muted cursor-pointer",
                      !n.is_read && "bg-primary/5"
                    )}
                    onClick={() => onMarkAsRead(n.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{n.title}</span>
                      {!n.is_read && <div className="size-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-tight">{n.body}</p>
                    <span className="text-[10px] text-muted-foreground/60">{new Date(n.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
