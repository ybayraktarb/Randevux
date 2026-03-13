"use client"

import { useState } from "react"
import {
  TrendingUp,
  User,
  Bell,
  Phone,
  Mail,
  Smartphone,
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"

interface CustomerStats {
  totalSpent: number
  appointmentCount: number
  topServices?: { name: string; count: number }[]
}

interface CustomerProfileSettingsProps {
  profile: {
    name: string
    phone: string
    notification_settings: Record<string, boolean>
  }
  stats: CustomerStats | null
  loadingStats: boolean
  onUpdate: (name: string, phone: string, settings: Record<string, boolean>) => Promise<void>
}

export function CustomerProfileSettings({
  profile,
  stats,
  loadingStats,
  onUpdate,
}: CustomerProfileSettingsProps) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)
  const [settings, setSettings] = useState(profile.notification_settings)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await onUpdate(name, phone, settings)
    setIsSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-2xl mx-auto">
      {/* Stats */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="size-5 text-primary" />
          <h3 className="font-semibold">İstatistiklerim</h3>
        </div>
        {loadingStats ? (
          <div className="flex justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Toplam Harcama
              </span>
              <span className="text-2xl font-bold text-primary">
                {stats.totalSpent.toLocaleString("tr-TR")} TL
              </span>
            </div>
            <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border border-border">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                Randevu Sayısı
              </span>
              <span className="text-2xl font-bold">{stats.appointmentCount}</span>
            </div>
            {stats.topServices && stats.topServices.length > 0 && (
              <div className="col-span-2 mt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                  En Çok Alınan Hizmetler
                </span>
                <div className="flex flex-wrap gap-2">
                  {stats.topServices.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-background border border-border rounded-full text-xs font-medium"
                    >
                      {s.name} ({s.count})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Henüz istatistik bulunmuyor.
          </p>
        )}
      </div>

      {/* Personal Info */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <User className="size-5 text-primary" />
          <h3 className="font-semibold">Kişisel Bilgiler</h3>
        </div>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Ad Soyad</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Telefon</label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+90 5XX XXX XX XX"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="size-5 text-primary" />
          <h3 className="font-semibold">Bildirim Tercihleri</h3>
        </div>
        <div className="grid gap-4">
          {[
            { id: "push", label: "Push Bildirimleri", desc: "Randevu güncellemelerini anlık al.", icon: <Smartphone className="size-4" /> },
            { id: "email", label: "E-posta", desc: "Detaylı özetler e-postanıza gelsin.", icon: <Mail className="size-4" /> },
            { id: "sms", label: "SMS", desc: "Önemli hatırlatmalar için kısa mesaj.", icon: <Phone className="size-4" /> },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-muted-foreground">{item.icon}</div>
                <div className="grid gap-0.5">
                  <span className="text-sm font-medium leading-none">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.desc}</span>
                </div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [item.id]: !settings[item.id] })}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                  settings[item.id] ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    settings[item.id] ? "translate-x-4" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <RxButton onClick={handleSave} disabled={isSaving} className="w-full sm:w-fit sm:ml-auto gap-2">
        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Değişiklikleri Kaydet
      </RxButton>
    </div>
  )
}
