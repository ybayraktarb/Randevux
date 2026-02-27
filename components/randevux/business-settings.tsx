"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { RxButton } from "./rx-button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Loader2, Save, Lock, User, Building2, Calendar, RefreshCw, Copy, QrCode } from "lucide-react"

export function BusinessSettings() {
    const { user } = useCurrentUser()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"business" | "appointment" | "profile">("business")

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
        setSavingBiz(true)
        const { error } = await supabase.from("businesses").update({
            name: bizName, address: bizAddress || null, phone: bizPhone || null,
            description: bizDesc || null, logo_url: logoUrl || null,
        }).eq("id", businessId)
        setSavingBiz(false)
        if (error) { toast?.error?.("Isletme bilgileri guncellenemedi."); return }
        // Audit
        try { const { logAudit } = await import("@/lib/audit"); await logAudit(supabase, { userId: user!.id, action: "updated", targetTable: "businesses", targetId: businessId }) } catch { }
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
        try { const { logAudit } = await import("@/lib/audit"); await logAudit(supabase, { userId: user!.id, action: "updated", targetTable: "businesses", targetId: businessId }) } catch { }
        toast?.success?.("Randevu ayarlari guncellendi!")
    }

    const handleSaveProfile = async () => {
        if (!user) return
        setSavingProfile(true)
        const { error } = await supabase.from("users").update({ name: profileName, phone: profilePhone || null }).eq("id", user.id)
        setSavingProfile(false)
        if (error) { toast?.error?.("Profil guncellenemedi."); return }
        try { const { logAudit } = await import("@/lib/audit"); await logAudit(supabase, { userId: user!.id, action: "updated", targetTable: "users", targetId: user!.id }) } catch { }
        toast?.success?.("Profil guncellendi!")
    }

    const handleChangePassword = async () => {
        if (newPassword.length < 6) { toast?.error?.("Sifre en az 6 karakter olmali."); return }
        if (newPassword !== confirmPassword) { toast?.error?.("Sifreler uyusmuyor."); return }
        setChangingPw(true)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        setChangingPw(false)
        if (error) { toast?.error?.("Sifre degistirilemedi."); return }
        toast?.success?.("Sifre basariyla degistirildi!")
        setNewPassword(""); setConfirmPassword("")
    }

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="size-8 animate-spin text-primary" /></div>

    const tabs = [
        { key: "business" as const, label: "Isletme Bilgileri", icon: Building2 },
        { key: "appointment" as const, label: "Randevu Ayarlari", icon: Calendar },
        { key: "profile" as const, label: "Profil", icon: User },
    ]

    const inputClass = "h-10 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold text-foreground">Ayarlar</h1>

            {/* Tab bar */}
            <div className="flex gap-2 rounded-lg border border-border bg-card p-1">
                {tabs.map(t => (
                    <button key={t.key} type="button" onClick={() => setActiveTab(t.key)} className={cn("flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors", activeTab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-primary-light")}>
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

                        {/* Invite Code */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Davet Kodu</label>
                            <div className="flex gap-2">
                                <div className="flex h-10 flex-1 items-center rounded-lg border border-input bg-muted px-3 text-sm font-mono text-foreground">{inviteCode || "—"}</div>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(inviteCode); toast?.success?.("Kopyalandi!") }} className="flex h-10 items-center gap-1.5 rounded-lg border border-input px-3 text-sm text-muted-foreground hover:text-foreground transition-colors" title="Kopyala"><Copy className="size-4" /></button>
                                <button type="button" onClick={handleRefreshInviteCode} className="flex h-10 items-center gap-1.5 rounded-lg border border-input px-3 text-sm text-muted-foreground hover:text-foreground transition-colors" title="Yenile"><RefreshCw className="size-4" /></button>
                            </div>
                        </div>

                        {/* QR Code */}
                        {qrCode && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-foreground">QR Kod</label>
                                <div className="flex items-center gap-2">
                                    <QrCode className="size-5 text-muted-foreground" />
                                    <span className="font-mono text-sm text-muted-foreground">{qrCode}</span>
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
                    <div className="rounded-xl border border-border bg-card p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
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
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} placeholder="En az 6 karakter" />
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
        </div>
    )
}
