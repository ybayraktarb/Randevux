import { useState, useEffect } from "react"
import { Calendar, Sun, Moon, Trash2, Heart, Plus, X } from "lucide-react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { SectionHeader } from "./SectionHeader"
import { AppointmentCard } from "./AppointmentCard"
import { NotificationBell } from "./NotificationBell"
import { QrScanner } from "./QrScanner"
import { Appointment, Business, TabView, Notification } from "./types"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export function OverviewTab({
  upcoming,
  past,
  businesses,
  onNavigate,
  onCancel,
  onJoinBusiness,
  onRebook,
  onLeave,
  notifications,
  onMarkAsRead,
  onViewDetails,
  onReview,
  router,
}: {
  upcoming: Appointment[]
  past: Appointment[]
  businesses: Business[]
  onNavigate: (tab: TabView) => void
  onCancel: (id: string, businessId: string, fullDate: Date) => void
  onJoinBusiness: (code: string) => Promise<void>
  onRebook: (businessId: string, services: string) => void
  onLeave: (id: string) => Promise<void>
  notifications: Notification[]
  onMarkAsRead: (id: string) => Promise<void>
  onViewDetails: (id: string) => void
  onReview?: (apt: Appointment) => void
  router: AppRouterInstance
}) {
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const ThemeToggle = () => {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    if (!mounted) {
      return (
        <button className="flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted cursor-pointer">
          <Sun className="size-5 text-muted-foreground" />
        </button>
      )
    }

    return (
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex size-9 items-center justify-center rounded-lg border border-border bg-background transition-colors hover:bg-muted cursor-pointer"
      >
        {theme === "dark" ? <Sun className="size-5 text-yellow-500" /> : <Moon className="size-5 text-slate-700" />}
      </button>
    )
  }

  const submitJoin = async () => {
    if (!joinCode.trim()) return
    setIsJoining(true)
    await onJoinBusiness(joinCode.trim())
    setIsJoining(false)
    setShowJoinForm(false)
    setJoinCode("")
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900">Genel Bakış</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Randevularını ve işletmelerini yönet</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell
            notifications={notifications}
            onMarkAsRead={onMarkAsRead}
          />
          <RxButton variant="secondary" size="sm" onClick={handleLogout} className="text-red-500 border-red-200 hover:bg-red-50">
            Çıkış Yap
          </RxButton>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title={upcoming.length > 0 ? "Diğer Yaklaşan Randevular" : "Yaklaşan Randevular"}
          linkText="Tumunu Gor"
          onLink={() => onNavigate("randevularim")}
        />

        {upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-gray-100 bg-gray-50/30 px-6 py-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-[24px] bg-white shadow-lg shadow-gray-200/50">
              <Calendar className="size-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-black text-gray-900">
              Şu an planlı bir randevunuz yok
            </h3>
            <p className="mt-1 text-xs font-bold text-muted-foreground max-w-[280px]">
              Hayatınıza biraz bakım katmaya ne dersiniz? Hemen yeni bir randevu alabilirsiniz.
            </p>
            <RxButton className="mt-6 rounded-full px-8 h-12 font-black uppercase tracking-widest text-[11px]" onClick={() => onNavigate("isletmelerim")}>
              İşletmelerimi Gör
            </RxButton>
          </div>
        ) : (
          <div className="grid gap-6">
            {upcoming.map((a) => (
              <AppointmentCard key={a.id} appointment={a} onCancel={onCancel} onViewDetails={onViewDetails} onReview={onReview} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Isletmelerim"
          linkText="Tumunu Gor"
          onLink={() => onNavigate("isletmelerim")}
        />
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="flex w-[200px] shrink-0 flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative"
            >
              <RxAvatar name={b.name} size="lg" />
              {b.isFavorite && (
                <Heart className="absolute right-4 top-4 size-4 fill-red-500 text-red-500" />
              )}
              <span className="text-center text-sm font-semibold text-foreground">
                {b.name}
              </span>
              <span className="text-center text-xs text-muted-foreground">
                {b.category}
              </span>
              <RxButton size="sm" className="w-full" onClick={() => router.push(`/isletme/${b.id}`)}>
                Profili Gor
              </RxButton>
              <RxButton
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => onLeave(b.id)}
              >
                <Trash2 className="size-4" />
              </RxButton>
            </div>
          ))}

          {showJoinForm ? (
            <div className="flex w-[200px] shrink-0 flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Isletme Ekle</span>
                <button onClick={() => setShowJoinForm(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="size-4" />
                </button>
              </div>
              <input
                type="text"
                placeholder="QR/DAVET KODU"
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none uppercase"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
              />
              <div className="flex gap-2">
                <RxButton size="sm" variant="secondary" className="flex-1" onClick={() => setShowScanner(true)}> Tara </RxButton>
                <RxButton size="sm" className="flex-1" onClick={submitJoin} disabled={isJoining || !joinCode.trim()}>
                  {isJoining ? "..." : "Katil"}
                </RxButton>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowJoinForm(true)}
              className="flex w-[200px] shrink-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card p-5 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Plus className="size-5 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                Isletme Ekle
              </span>
            </button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Gecmis Randevular"
          linkText="Tumunu Gor"
          onLink={() => onNavigate("randevularim")}
        />
        <div className="flex flex-col gap-3">
          {past.length === 0 ? (
            <p className="text-sm text-muted-foreground">Geçmiş randevunuz bulunmuyor.</p>
          ) : (
            past.slice(0, 3).map((a) => (
              <AppointmentCard key={a.id} appointment={a} compact onRebook={onRebook} onViewDetails={onViewDetails} />
            ))
          )}
        </div>
      </section>

      {showScanner && (
        <QrScanner
          onScan={(code) => {
            setJoinCode(code)
            onJoinBusiness(code)
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  )
}
