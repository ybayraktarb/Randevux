import { useState } from "react"
import { TrendingUp, Loader2, Users, X, Plus, Trash2, User, Bell, Smartphone, Mail, Phone, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"

export function ProfilTab({
  profile,
  onUpdate,
  familyProfiles,
  onAddFamily,
  onDeleteFamily,
  loadingFamily,
  stats,
  loadingStats
}: {
  profile: { name: string; phone: string; notification_settings: any },
  onUpdate: (name: string, phone: string, settings: any) => Promise<void>,
  familyProfiles: any[],
  onAddFamily: (name: string, rel: string) => Promise<void>,
  onDeleteFamily: (id: string) => Promise<void>,
  loadingFamily: boolean,
  stats: any,
  loadingStats: boolean
}) {
  const [name, setName] = useState(profile.name)
  const [phone, setPhone] = useState(profile.phone)
  const [settings, setSettings] = useState(profile.notification_settings)
  const [isSaving, setIsSaving] = useState(false)

  const [showAddFamily, setShowAddFamily] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState("")
  const [newFamilyRel, setNewFamilyRel] = useState("Çocuk")

  const handleSave = async () => {
    setIsSaving(true)
    await onUpdate(name, phone, settings)
    setIsSaving(false)
  }

  const handleAddSubmit = async () => {
    if (!newFamilyName) return
    await onAddFamily(newFamilyName, newFamilyRel)
    setNewFamilyName("")
    setShowAddFamily(false)
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-foreground">Profil Ayarlarım</h2>
        <p className="text-muted-foreground">Hesap bilgilerinizi, ailenizi ve istatistiklerinizi buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid gap-6">
        {/* Spending Insights */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="font-semibold">İstatistiklerim</h3>
          </div>

          {loadingStats ? (
            <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
          ) : stats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Toplam Harcama</span>
                <span className="text-2xl font-bold text-primary">{stats.totalSpent.toLocaleString('tr-TR')} TL</span>
              </div>
              <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted/50 border border-border">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Randevu Sayısı</span>
                <span className="text-2xl font-bold">{stats.appointmentCount}</span>
              </div>
              {stats.topServices?.length > 0 && (
                <div className="col-span-2 mt-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase mb-2 block">En Çok Alınan Hizmetler</span>
                  <div className="flex flex-wrap gap-2">
                    {stats.topServices.map((s: any, i: number) => (
                      <span key={i} className="px-3 py-1 bg-background border border-border rounded-full text-xs font-medium">
                        {s.name} ({s.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">Henüz istatistik bulunmuyor.</p>
          )}
        </div>

        {/* Family Profiles */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="font-semibold">Aile Profilleri</h3>
            </div>
            <RxButton size="sm" variant="secondary" onClick={() => setShowAddFamily(!showAddFamily)}>
              {showAddFamily ? <X className="size-4" /> : <Plus className="size-4" />}
            </RxButton>
          </div>

          {showAddFamily && (
            <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-200">
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold">Ad Soyad</label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Örn: Mehmet Yılmaz"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold">Yakınlık Derecesi</label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={newFamilyRel}
                    onChange={(e) => setNewFamilyRel(e.target.value)}
                  >
                    <option>Çocuk</option>
                    <option>Eş</option>
                    <option>Ebeveyn</option>
                    <option>Diğer</option>
                  </select>
                </div>
                <RxButton size="sm" className="w-full mt-1" onClick={handleAddSubmit}>Ekle</RxButton>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {loadingFamily ? (
              <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
            ) : familyProfiles.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">Henüz ekli aile profili yok.</p>
            ) : (
              familyProfiles.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      {p.full_name.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{p.full_name}</span>
                      <span className="text-[11px] text-muted-foreground">{p.relationship}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteFamily(p.id)} className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))
            )}
          </div>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Telefon</label>
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+90 5XX XXX XX XX"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="size-5 text-primary" />
            <h3 className="font-semibold">Bildirim Tercihleri</h3>
          </div>
          <div className="grid gap-4">
            {[
              { id: 'push', label: 'Push Bildirimleri', desc: 'Randevu güncellemelerini anlık al.', icon: <Smartphone className="size-4" /> },
              { id: 'email', label: 'E-posta', desc: 'Detaylı özetler e-postanıza gelsin.', icon: <Mail className="size-4" /> },
              { id: 'sms', label: 'SMS', desc: 'Önemli hatırlatmalar için kısa mesaj.', icon: <Phone className="size-4" /> },
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
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    settings[item.id] ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    settings[item.id] ? "translate-x-4" : "translate-x-1"
                  )} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <RxButton onClick={handleSave} disabled={isSaving} className="w-full sm:w-fit sm:ml-auto gap-2">
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Degisiklikleri Kaydet
        </RxButton>
      </div>
    </div>
  )
}
