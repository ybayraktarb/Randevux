"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { RxButton } from "./rx-button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { logAuditAction } from "@/app/actions/audit.actions" // DEĞİŞTİRİLDİ
import { RxBadge } from "./rx-badge"
import {
    addClosedDateAction, removeClosedDateAction, getClosedDatesAction,
    upsertBusinessHoursAction, getBusinessHoursAction,
    type BusinessHour,
} from "@/app/actions/business-settings.actions"

export function BusinessSettings() {
    const { user } = useCurrentUser()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"business" | "appointment" | "profile" | "hours" | "closed" | "announcements">("business")

    // Business fields
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [bizName, setBizName] = useState("")
    const [bizAddress, setBizAddress] = useState("")
    const [bizPhone, setBizPhone] = useState("")
    const [bizDesc, setBizDesc] = useState("")
    const [logoUrl, setLogoUrl] = useState("")
    const [inviteCode, setInviteCode] = useState("")
    const [qrCode, setQrCode] = useState("")
    const [savingBiz, setSavingBiz] = useState(false)

    // Appointment settings
    const [autoApprove, setAutoApprove] = useState(false)
    const [cancelBuffer, setCancelBuffer] = useState(60)
    const [savingAppt, setSavingAppt] = useState(false)

    // Profile fields
    const [profileName, setProfileName] = useState("")
    const [profilePhone, setProfilePhone] = useState("")
    const [profileEmail, setProfileEmail] = useState("")
    const [savingProfile, setSavingProfile] = useState(false)

    // Password
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [changingPw, setChangingPw] = useState(false)

    useEffect(() => {
        if (!user) return
        async function load() {
            // Get business
            const { data: ownerData } = await supabase.from("business_owners").select("business_id").eq("user_id", user!.id).maybeSingle()
            if (ownerData?.business_id) {
                setBusinessId(ownerData.business_id)
                const { data: biz } = await supabase.from("businesses").select("*").eq("id", ownerData.business_id).maybeSingle()
                if (biz) {
                    setBizName(biz.name || "")
                    setBizAddress(biz.address || "")
                    setBizPhone(biz.phone || "")
                    setBizDesc(biz.description || "")
                    setLogoUrl(biz.logo_url || "")
                    setInviteCode(biz.invite_code || "")
                    setQrCode(biz.qr_code || "")
                    setAutoApprove(biz.auto_approve || false)
                    setCancelBuffer(biz.cancellation_buffer_minutes || 60)
                }
            }
            // Get profile
            const { data: prof } = await supabase.from("users").select("name, phone, email").eq("id", user!.id).maybeSingle()
            if (prof) {
                setProfileName(prof.name || "")
                setProfilePhone(prof.phone || "")
                setProfileEmail(prof.email || "")
            }
            setLoading(false)
        }
        load()
    }, [user])

    const handleSaveBusiness = async () => {
        if (!businessId) return
        console.log("[Settings] Saving business info for:", businessId, { bizName, qrCode })
        const { error } = await supabase.from("businesses").update({
            name: bizName, address: bizAddress || null, phone: bizPhone || null,
            description: bizDesc || null, logo_url: logoUrl || null,
            qr_code: qrCode || null
        }).eq("id", businessId)
        setSavingBiz(false)
        if (error) {
            console.error("[Settings] Save error:", error)
            toast?.error?.("İşletme bilgileri güncellenemedi: " + error.message)
            return
        }
        // Audit
        try {
            await logAuditAction({ action: "updated", targetTable: "businesses", targetId: businessId })
        } catch (err) { console.error("[Audit]", err) }
        toast?.success?.("Isletme bilgileri guncellendi!")
    }

    const handleRefreshInviteCode = async () => {
        if (!businessId) return
        const newCode = crypto.randomUUID().slice(0, 8).toUpperCase()
        const { error } = await supabase.from("businesses").update({ invite_code: newCode }).eq("id", businessId)
        if (!error) { setInviteCode(newCode); toast?.success?.("Davet kodu yenilendi!") }
    }

    const handleSaveAppointment = async () => {
        if (!businessId) return
        setSavingAppt(true)
        const { error } = await supabase.from("businesses").update({
            auto_approve: autoApprove, cancellation_buffer_minutes: cancelBuffer,
        }).eq("id", businessId)
        setSavingAppt(false)
        if (error) { toast?.error?.("Ayarlar guncellenemedi."); return }
        try {
            await logAuditAction({ action: "updated", targetTable: "businesses", targetId: businessId })
        } catch (err) { console.error("[Audit]", err) }
        toast?.success?.("Randevu ayarlari guncellendi!")
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setSavingProfile(true)
        const { error } = await supabase.from("users").update({ name: profileName, phone: profilePhone || null }).eq("id", user.id)
        setSavingProfile(false)
        if (error) { toast?.error?.("Profil guncellenemedi."); return }
        try {
            await logAuditAction({ action: "updated", targetTable: "users", targetId: user!.id })
        } catch (err) { console.error("[Audit]", err) }
        toast?.success?.("Profil guncellendi!")
    }

    const handleChangePassword = async () => {
        if (newPassword.length < 8) { toast?.error?.("Şifre en az 8 karakter olmalı."); return }
        if (newPassword !== confirmPassword) { toast?.error?.("Sifreler uyusmuyor."); return }
        setChangingPw(true)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        setChangingPw(false)
        if (error) { toast?.error?.("Sifre degistirilemedi."); return }
        toast?.success?.("Sifre basariyla degistirildi!")
        setNewPassword(""); setConfirmPassword("")
    }

    const downloadQRCode = () => {
        const svg = document.getElementById("BusinessQRCode") as unknown as SVGElement;
        if (!svg) return;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `${bizName || "business"}_qrcode.png`;
            downloadLink.href = `${pngFile}`;
            downloadLink.click();
        };
        img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    };

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="size-8 animate-spin text-primary" /></div>

    const tabs = [
        { key: "business" as const, label: "İşletme", icon: Building2 },
        { key: "hours" as const, label: "Çalışma Saatleri", icon: Clock },
        { key: "closed" as const, label: "Kapalı Günler", icon: CalendarOff },
        { key: "announcements" as const, label: "Duyurular", icon: QrCode },
        { key: "appointment" as const, label: "Randevu Ayarları", icon: Calendar },
        { key: "profile" as const, label: "Profil", icon: User },
    ]

    const inputClass = "h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-foreground">Ayarlar</h1>

            {/* Tab bar */}
            <div className="flex gap-1 flex-wrap rounded-lg border border-border bg-card p-1">
                {tabs.map(t => (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key as any)} className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors", activeTab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-primary-light")}>
                        <t.icon className="size-4" />{t.label}
                    </button>
                ))}
            </div>

            {/* Business Tab */}
            {activeTab === "business" && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-col gap-4 max-w-lg">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Isletme Adi</label>
                            <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Adres</label>
                            <input type="text" value={bizAddress} onChange={e => setBizAddress(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Telefon</label>
                            <input type="tel" value={bizPhone} onChange={e => setBizPhone(e.target.value)} className={inputClass} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Aciklama</label>
                            <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)} className="min-h-[80px] rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Logo URL</label>
                            <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                        </div>

                        {/* QR Code / Custom Code Entry */}
                        <div className="flex flex-col gap-1.5 mt-2">
                            <label className="text-sm font-medium text-foreground">Özel İşletme Kodu (Örn: msn2026)</label>
                            <p className="text-xs text-muted-foreground">
                                Müşterileriniz bu kodu girerek işletmenize katılabilir. Benzersiz olmalıdır.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={qrCode}
                                    onChange={e => setQrCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                                    className={cn(inputClass, "flex-1 font-mono text-sm uppercase")}
                                    placeholder="Kendi kodunuzu girin..."
                                />
                                <button type="button" onClick={() => { navigator.clipboard.writeText(qrCode); toast?.success?.("Kopyalandı!") }} className="flex h-10 items-center gap-1.5 rounded-lg border border-input bg-card px-3 text-sm text-muted-foreground hover:text-foreground transition-colors" title="Kopyala">
                                    <Copy className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* System Invite Code (Read-only Backup) */}
                        <div className="flex flex-col gap-1.5 mt-2 opacity-80">
                            <label className="text-xs font-medium text-muted-foreground">Sistem Davet Kodu (Yedek)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inviteCode}
                                    readOnly
                                    className={cn(inputClass, "flex-1 font-mono text-xs bg-muted cursor-not-allowed")}
                                />
                                <button type="button" onClick={handleRefreshInviteCode} className="flex h-10 items-center justify-center rounded-lg border border-input bg-card px-3 text-muted-foreground hover:text-foreground transition-colors" title="Yeni Kod Üret">
                                    <RefreshCw className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* QR Code */}
                        {qrCode && (
                            <div className="flex flex-col gap-1.5 mt-2 p-4 rounded-xl border border-dashed border-primary/20 bg-primary/5">
                                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <QrCode className="size-4 text-primary" />
                                    Müşteri Randevu QR Kodu
                                </label>
                                <p className="text-xs text-muted-foreground mb-2">
                                    Müşterileriniz bu QR kodu okutarak işletmenize bağlanabilir ve randevu alabilir.
                                </p>
                                <div className="flex flex-col items-center gap-4 bg-white p-4 rounded-lg w-fit border border-border">
                                    <QRCode
                                        id="BusinessQRCode"
                                        value={qrCode}
                                        size={180}
                                        level="M"
                                    />
                                    <RxButton onClick={downloadQRCode} variant="secondary" className="w-full text-xs h-8">
                                        <Download className="size-3 mr-1" /> QR Kodu İndir
                                    </RxButton>
                                </div>
                            </div>
                        )}

                        <RxButton onClick={handleSaveBusiness} disabled={savingBiz} className="w-fit mt-2">
                            {savingBiz ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Kaydet
                        </RxButton>
                    </div>
                </div>
            )}

            {/* Appointment Settings Tab */}
            {activeTab === "appointment" && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <div className="flex flex-col gap-5 max-w-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-sm font-medium text-foreground">Otomatik Onay</span>
                                <span className="text-xs text-muted-foreground">Randevular olusturulunca otomatik olarak onaylansin.</span>
                            </div>
                            <button type="button" onClick={() => setAutoApprove(!autoApprove)} className={cn("relative h-6 w-11 rounded-full transition-colors", autoApprove ? "bg-primary" : "bg-muted-foreground/30")}>
                                <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", autoApprove ? "translate-x-[22px]" : "translate-x-0.5")} />
                            </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Iptal Suresi (dakika)</label>
                            <span className="text-xs text-muted-foreground">Musteri randevudan bu kadar dakika once iptal edebilir.</span>
                            <input type="number" value={cancelBuffer} onChange={e => setCancelBuffer(Number(e.target.value))} min={0} className={cn(inputClass, "w-32")} />
                        </div>
                        <RxButton onClick={handleSaveAppointment} disabled={savingAppt} className="w-fit mt-2">
                            {savingAppt ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Kaydet
                        </RxButton>
                    </div>
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
                <div className="flex flex-col gap-6">
                    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8_rgba(0,0,0,0.06)]">
                        <div className="flex items-center gap-2 mb-5"><User className="size-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">Profil Bilgileri</h2></div>
                        <div className="flex flex-col gap-4 max-w-md">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Ad Soyad</label>
                                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Telefon</label>
                                <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className={inputClass} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">E-posta (salt okunur)</label>
                                <input type="email" value={profileEmail} readOnly className={cn(inputClass, "bg-muted cursor-not-allowed")} />
                            </div>
                            <RxButton onClick={handleSaveProfile} disabled={savingProfile} className="w-fit mt-2">
                                {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Kaydet
                            </RxButton>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center gap-2 mb-5"><Lock className="size-5 text-primary" /><h2 className="text-lg font-semibold text-foreground">Sifre Degistir</h2></div>
                        <div className="flex flex-col gap-4 max-w-md">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Yeni Sifre</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="En az 8 karakter" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">Sifre Tekrar</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} placeholder="Sifrenizi tekrar girin" />
                            </div>
                            <RxButton onClick={handleChangePassword} disabled={changingPw} className="w-fit mt-2">
                                {changingPw ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Sifreyi Degistir
                            </RxButton>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === "hours" && businessId && (
                <BusinessHoursTab businessId={businessId} />
            )}

            {activeTab === "closed" && businessId && (
                <ClosedDatesTab businessId={businessId} />
            )}

            {activeTab === "announcements" && businessId && (
                <AnnouncementsTab businessId={businessId} />
            )}
        </div>
    )
}

// ─── Business Hours Tab ─────────────────────────────────────────────────────

const DAYS_TR = [
    { key: 1, label: "Pazartesi" }, { key: 2, label: "Salı" }, { key: 3, label: "Çarşamba" },
    { key: 4, label: "Perşembe" }, { key: 5, label: "Cuma" }, { key: 6, label: "Cumartesi" }, { key: 0, label: "Pazar" },
]

function BusinessHoursTab({ businessId }: { businessId: string }) {
    const defaultHours: BusinessHour[] = DAYS_TR.map(d => ({
        day_of_week: d.key,
        open_time: "09:00",
        close_time: "18:00",
        is_open: d.key !== 0,
    }))
    const [hours, setHours] = useState<BusinessHour[]>(defaultHours)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        async function load() {
            const res = await getBusinessHoursAction(businessId)
            if (res.success && res.data.length > 0) {
                const merged = defaultHours.map(def => {
                    const found = res.data.find(h => h.day_of_week === def.day_of_week)
                    return found ? { ...def, ...found } : def
                })
                setHours(merged)
            }
            setLoading(false)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businessId])

    function updateHour(dayKey: number, field: keyof BusinessHour, value: any) {
        setHours(prev => prev.map(h => h.day_of_week === dayKey ? { ...h, [field]: value } : h))
    }

    async function save() {
        setSaving(true)
        const res = await upsertBusinessHoursAction(businessId, hours)
        if (res.success) toast.success("Çalışma saatleri kaydedildi.")
        else toast.error(res.error?.message || "Hata")
        setSaving(false)
    }

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">İşletme Çalışma Saatleri</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">İşletmenizin genel açılış-kapanış saatlerini ayarlayın.</p>
                </div>
                <RxButton onClick={save} loading={saving} size="sm">
                    <Save className="size-3.5" /> Kaydet
                </RxButton>
            </div>
            <div className="flex flex-col gap-2">
                {DAYS_TR.map(day => {
                    const h = hours.find(x => x.day_of_week === day.key)!
                    return (
                        <div key={day.key} className={cn("flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all", h.is_open ? "border-border bg-card" : "border-dashed border-border/60 bg-muted/30 opacity-60")}>
                            <button
                                onClick={() => updateHour(day.key, "is_open", !h.is_open)}
                                className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors", h.is_open ? "bg-primary" : "bg-muted-foreground/40")}
                            >
                                <span className={cn("inline-block size-3.5 rounded-full bg-white shadow transition-transform", h.is_open ? "translate-x-4" : "translate-x-0.5")} />
                            </button>
                            <span className="w-24 text-sm font-medium text-foreground">{day.label}</span>
                            {h.is_open ? (
                                <div className="ml-auto flex items-center gap-2">
                                    <input type="time" value={h.open_time} onChange={e => updateHour(day.key, "open_time", e.target.value)}
                                        className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                    <span className="text-muted-foreground text-xs">—</span>
                                    <input type="time" value={h.close_time} onChange={e => updateHour(day.key, "close_time", e.target.value)}
                                        className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                </div>
                            ) : (
                                <span className="ml-auto text-xs text-muted-foreground">Kapalı</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Closed Dates Tab ───────────────────────────────────────────────────────

type ClosedDate = { id: string; date: string; reason: string | null }

function ClosedDatesTab({ businessId }: { businessId: string }) {
    const [dates, setDates] = useState<ClosedDate[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const today = new Date().toISOString().split("T")[0]
    const [form, setForm] = useState({ date: today, reason: "" })

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getClosedDatesAction(businessId)
        setDates(res.data as ClosedDate[])
        setLoading(false)
    }, [businessId])

    useEffect(() => { load() }, [load])

    async function handleAdd() {
        if (!form.date) { toast.error("Tarih seçin."); return }
        setSaving(true)
        const res = await addClosedDateAction(businessId, form.date, form.reason || undefined)
        if (res.success) {
            toast.success("Kapalı gün eklendi.")
            setForm({ date: today, reason: "" })
            load()
        } else {
            toast.error(res.error?.message || "Bu tarih zaten kapalı günler listesinde.")
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const res = await removeClosedDateAction(id)
        if (res.success) {
            toast.success("Kapalı gün silindi.")
            setDates(prev => prev.filter(d => d.id !== id))
        } else {
            toast.error(res.error?.message || "Hata")
        }
        setDeletingId(null)
    }

    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="mb-5">
                <h2 className="text-lg font-semibold text-foreground">İşletme Kapalı Günleri</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Belirlediğiniz günlerde müşterilerin randevu alması engellenir.</p>
            </div>

            {/* Add form */}
            <div className="flex items-end gap-3 flex-wrap mb-6 p-4 bg-muted/40 rounded-lg border border-dashed border-border">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Tarih</label>
                    <input
                        type="date" value={form.date} min={today}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                        className="h-9 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                    <label className="text-xs font-medium text-muted-foreground">Açıklama (Opsiyonel)</label>
                    <input
                        type="text" value={form.reason}
                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                        placeholder="Örn: Ulusal tatil, tadilat..."
                        className="h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <RxButton size="sm" onClick={handleAdd} loading={saving}>
                    <Plus className="size-3.5" /> Ekle
                </RxButton>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div>
            ) : dates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 py-10 text-center">
                    <CalendarOff className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Henüz kapalı gün tanımlanmadı.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {dates.map(d => (
                        <div key={d.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                            <CalendarOff className="size-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">
                                    {new Date(d.date + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                </p>
                                {d.reason && <p className="text-xs text-muted-foreground mt-0.5">{d.reason}</p>}
                            </div>
                            <button
                                onClick={() => handleDelete(d.id)}
                                disabled={deletingId === d.id}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-badge-red-bg rounded-md transition-colors"
                            >
                                {deletingId === d.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Announcements Tab ───────────────────────────────────────────────────────

import { getAllAnnouncementsAction, upsertAnnouncementAction, deleteAnnouncementAction, type BusinessAnnouncement } from "@/app/actions/announcement.actions"

function AnnouncementsTab({ businessId }: { businessId: string }) {
    const [announcements, setAnnouncements] = useState<BusinessAnnouncement[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<BusinessAnnouncement | null>(null)

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true)
        const res = await getAllAnnouncementsAction(businessId)
        if (res.success && res.data) {
            setAnnouncements(res.data)
        }
        setLoading(false)
    }, [businessId])

    useEffect(() => {
        fetchAnnouncements()
    }, [fetchAnnouncements])

    const handleDelete = async (id: string) => {
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return
        const res = await deleteAnnouncementAction(id)
        if (res.success) {
            toast.success("Duyuru silindi.")
            fetchAnnouncements()
        } else {
            toast.error("Hata: " + res.error)
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Duyuru ve Kampanyalar</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Randevu sayfasında müşterilerinize göstermek istediğiniz duyuruları yönetin.</p>
                </div>
                <RxButton variant="primary" onClick={() => { setEditingItem(null); setIsModalOpen(true) }} size="sm">
                    <Plus className="size-4 mr-1" /> Yeni Duyuru
                </RxButton>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
                ) : announcements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                        <QrCode className="size-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground">Henüz duyuru veya kampanya eklemediniz.</p>
                    </div>
                ) : (
                    announcements.map((item) => (
                        <div key={item.id} className={cn(
                            "group relative overflow-hidden rounded-2xl border bg-card p-5 transition-all hover:shadow-md",
                            item.is_active ? "border-border" : "border-dashed border-border/60 opacity-60 bg-muted/30"
                        )}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                                        {!item.is_active && <RxBadge variant="warning" className="text-[10px] px-1.5 py-0">Taslak</RxBadge>}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">{item.content}</p>

                                    <div className="flex items-center gap-4 mt-3">
                                        {(item.start_date || item.end_date) && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Calendar className="size-3" />
                                                <span>
                                                    {item.start_date ? new Date(item.start_date).toLocaleDateString("tr-TR") : "..."}
                                                    {" - "}
                                                    {item.end_date ? new Date(item.end_date).toLocaleDateString("tr-TR") : "..."}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <TrendingUp className="size-3" />
                                            <span>Öncelik: {item.priority}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingItem(item); setIsModalOpen(true) }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Düzenle">
                                        <Edit2 className="size-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors" title="Sil">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {isModalOpen && (
                <AnnouncementModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    businessId={businessId}
                    item={editingItem}
                    onSaved={fetchAnnouncements}
                />
            )}
        </div>
    )
}

function AnnouncementModal({ open, onClose, businessId, item, onSaved }: { open: boolean, onClose: () => void, businessId: string, item: BusinessAnnouncement | null, onSaved: () => void }) {
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        title: item?.title || "",
        content: item?.content || "",
        start_date: item?.start_date ? new Date(item.start_date).toISOString().split("T")[0] : "",
        end_date: item?.end_date ? new Date(item.end_date).toISOString().split("T")[0] : "",
        priority: item?.priority || 0,
        is_active: item?.is_active ?? true
    })

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.title) { toast.error("Başlık zorunludur."); return }

        setLoading(true)
        console.log("Saving Announcement:", { ...item, ...form, business_id: businessId })

        const payload: any = {
            ...form,
            business_id: businessId,
            start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
            end_date: form.end_date ? new Date(form.end_date).toISOString() : null
        }

        if (item?.id) {
            payload.id = item.id
        }

        const res = await upsertAnnouncementAction(payload)
        setLoading(false)
        if (res.success) {
            toast.success("Duyuru başarıyla kaydedildi.")
            onSaved()
            onClose()
        } else {
            console.error("Save Error:", res.error)
            toast.error("Kaydedilemedi: " + res.error)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-card rounded-[32px] shadow-2xl relative overflow-hidden border border-border">
                <div className="flex items-center justify-between border-b border-border px-8 py-5">
                    <h2 className="text-xl font-bold text-foreground">{item ? "Duyuruyu Düzenle" : "Yeni Duyuru"}</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"><X className="size-5" /></button>
                </div>
                <form onSubmit={handleSave} className="p-8 flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-muted-foreground">Başlık *</label>
                        <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-12 rounded-2xl border border-input bg-card px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="Kampanya İsmi veya Duyuru Başlığı" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-muted-foreground">İçerik</label>
                        <textarea rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="rounded-2xl border border-input bg-card px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all" placeholder="Müşterilere verilecek detaylı bilgi..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-muted-foreground">Başlangıç</label>
                            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-12 rounded-2xl border border-input bg-card px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-muted-foreground">Bitiş</label>
                            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-12 rounded-2xl border border-input bg-card px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-muted-foreground">Öncelik (0-100)</label>
                            <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} className="h-12 rounded-2xl border border-input bg-card px-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-muted-foreground">Durum</label>
                            <div className="flex items-center gap-3 h-12">
                                <button
                                    type="button"
                                    onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                                    className={cn(
                                        "relative h-7 w-12 rounded-full transition-all duration-300",
                                        form.is_active ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-muted-foreground/30"
                                    )}
                                >
                                    <div className={cn(
                                        "absolute top-1 size-5 rounded-full bg-white shadow-lg transition-all duration-300",
                                        form.is_active ? "left-6" : "left-1"
                                    )} />
                                </button>
                                <span className={cn("text-sm font-bold tracking-tight", form.is_active ? "text-primary" : "text-muted-foreground")}>
                                    {form.is_active ? "Aktif" : "Taslak"}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 border-t border-border pt-4">
                        <RxButton type="button" variant="ghost" onClick={onClose}>Vazgeç</RxButton>
                        <RxButton type="submit" variant="primary" loading={loading} className="px-8">
                            <Save className="size-4 mr-2" /> Kaydet
                        </RxButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

import { TrendingUp, Edit2, X, Loader2, Save, Lock, User, Building2, Calendar, RefreshCw, Copy, QrCode, Download, Clock, CalendarOff, Plus, Trash2, ChevronDown } from "lucide-react"
import QRCode from "react-qr-code"
