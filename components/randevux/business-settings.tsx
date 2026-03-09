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
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, Edit2, X, Loader2, Save, Lock, User, Building2, Calendar, RefreshCw, Copy, QrCode, Download, Clock, CalendarOff, Plus, Trash2, ChevronDown, Sparkles } from "lucide-react"
import QRCode from "react-qr-code"
import { getAllAnnouncementsAction, upsertAnnouncementAction, deleteAnnouncementAction, type BusinessAnnouncement } from "@/app/actions/announcement.actions"
import React from "react"

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
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ayarlar</h1>
                <p className="text-sm font-bold text-muted-foreground">İşletme ve profil ayarlarınızı buradan yönetebilirsiniz.</p>
            </div>

            {/* Tab bar - Apple Style Segmented Control */}
            <div className="flex p-1.5 bg-gray-100/80 rounded-[20px] w-fit self-start border border-gray-200/50 sticky top-24 z-20 backdrop-blur-md">
                <div className="flex gap-1 relative">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.key
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setActiveTab(t.key as any)}
                                className={cn(
                                    "relative z-10 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    isActive
                                        ? "text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="settings-tab-active"
                                        className="absolute inset-0 bg-white rounded-2xl shadow-md -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <t.icon className="size-4" />
                                <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="relative mt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >

                        {/* Business Info Section */}
                        {activeTab === "business" && (
                            <div className="flex flex-col gap-8">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-6">
                                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                                <Building2 className="size-5 text-primary" />
                                                Genel Bilgiler
                                            </h2>
                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İşletme Adı</label>
                                                    <input type="text" value={bizName} onChange={e => setBizName(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İletişim Telefonu</label>
                                                    <input type="tel" value={bizPhone} onChange={e => setBizPhone(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Adres</label>
                                                    <input type="text" value={bizAddress} onChange={e => setBizAddress(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Hakkımızda / Açıklama</label>
                                                    <textarea value={bizDesc} onChange={e => setBizDesc(e.target.value)} className="min-h-[120px] rounded-2xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                                            <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                                <Sparkles className="size-5 text-primary" />
                                                Marka ve Görünüm
                                            </h2>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Logo URL</label>
                                                <div className="flex gap-4">
                                                    <input type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} className="h-12 flex-1 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="https://..." />
                                                    {logoUrl && (
                                                        <div className="size-12 rounded-2xl bg-gray-100 overflow-hidden border border-gray-200">
                                                            <img src={logoUrl} alt="Preview" className="size-full object-cover" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-primary rounded-[32px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                                            <h2 className="text-lg font-black mb-6 flex items-center gap-2">
                                                <QrCode className="size-5" />
                                                Dijital Erişim
                                            </h2>

                                            <div className="space-y-6">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70">Özel Kod (URL)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={qrCode}
                                                            onChange={e => setQrCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                                                            className="h-12 flex-1 rounded-2xl bg-white/10 border border-white/20 px-4 text-sm font-black uppercase tracking-widest outline-none focus:bg-white/20 transition-all placeholder:text-white/40"
                                                            placeholder="URL KODU..."
                                                        />
                                                        <button onClick={() => { navigator.clipboard.writeText(qrCode); toast?.success?.("Kopyalandı!") }} className="size-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/20">
                                                            <Copy className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {qrCode && (
                                                    <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 text-gray-900 shadow-lg">
                                                        <div className="p-2 bg-gray-50 rounded-2xl border border-gray-100">
                                                            <QRCode id="BusinessQRCode" value={qrCode} size={140} level="M" />
                                                        </div>
                                                        <button onClick={downloadQRCode} className="w-full h-11 rounded-2xl bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                                                            <Download className="size-4" />
                                                            QR İndir
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="pt-4 border-t border-white/10">
                                                    <label className="text-[10px] font-black uppercase tracking-widest opacity-70 block mb-3">Sistem Davet Kodu</label>
                                                    <div className="flex items-center justify-between gap-4 bg-white/10 rounded-2xl p-3 border border-white/10">
                                                        <code className="text-xs font-black tracking-widest">{inviteCode}</code>
                                                        <button onClick={handleRefreshInviteCode} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                                            <RefreshCw className="size-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <RxButton onClick={handleSaveBusiness} disabled={savingBiz} className="h-14 px-12 rounded-[20px] shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02]">
                                        {savingBiz ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5 mr-1" />} Değişiklikleri Kaydet
                                    </RxButton>
                                </div>
                            </div>
                        )}

                        {/* Appointment Settings Tab */}
                        {activeTab === "appointment" && (
                            <div className="flex flex-col gap-6 max-w-2xl">
                                <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                                    <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                        <Calendar className="size-5 text-primary" />
                                        Randevu Politikaları
                                    </h2>

                                    <div className="space-y-8">
                                        <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Otomatik Onay</span>
                                                <span className="text-[11px] font-bold text-gray-500">Gelen randevular sistem tarafından otomatik onaylansın mı?</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAutoApprove(!autoApprove)}
                                                className={cn(
                                                    "relative h-7 w-12 rounded-full transition-all duration-300",
                                                    autoApprove ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-gray-200"
                                                )}
                                            >
                                                <div className={cn(
                                                    "absolute top-1 size-5 rounded-full bg-white shadow-lg transition-all duration-300",
                                                    autoApprove ? "left-6" : "left-1"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İptal Süresi (Dakika)</label>
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    value={cancelBuffer}
                                                    onChange={e => setCancelBuffer(Number(e.target.value))}
                                                    min={0}
                                                    className="h-12 w-32 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                />
                                                <span className="text-xs font-bold text-gray-500">Dakika öncesine kadar iptal edilebilir.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <RxButton onClick={handleSaveAppointment} disabled={savingAppt} className="h-14 px-12 rounded-[20px] shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02]">
                                        {savingAppt ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5 mr-1" />} Ayarları Kaydet
                                    </RxButton>
                                </div>
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl">
                                <div className="flex flex-col gap-6">
                                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm h-full">
                                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <User className="size-5 text-primary" />
                                            Profil Bilgileri
                                        </h2>
                                        <div className="space-y-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Ad Soyad</label>
                                                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Telefon</label>
                                                <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">E-posta</label>
                                                <div className="h-12 rounded-2xl border border-gray-100 bg-gray-100/50 px-4 flex items-center text-sm font-bold text-gray-500 cursor-not-allowed">
                                                    {profileEmail}
                                                </div>
                                                <p className="text-[10px] font-bold text-gray-400 italic pl-1">E-posta adresi değiştirilemez.</p>
                                            </div>
                                            <RxButton onClick={handleSaveProfile} disabled={savingProfile} className="w-full h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px] transition-all mt-4">
                                                {savingProfile ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 mr-1" />} Profili Güncelle
                                            </RxButton>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm h-full">
                                        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                            <Lock className="size-5 text-primary" />
                                            Güvenlik
                                        </h2>
                                        <div className="space-y-6 text-gray-900">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Yeni Şifre</label>
                                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Şifre Tekrar</label>
                                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" placeholder="••••••••" />
                                            </div>
                                            <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                                                <p className="text-[11px] font-bold text-orange-700 leading-relaxed uppercase tracking-tighter">
                                                    Şifreniz en az 8 karakter olmalı ve kolay tahmin edilemez bir kombinasyon seçmelisiniz.
                                                </p>
                                            </div>
                                            <RxButton onClick={handleChangePassword} disabled={changingPw} className="w-full h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px] transition-all bg-gray-900 hover:bg-gray-800 text-white mt-4">
                                                {changingPw ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4 mr-1" />} Şifreyi Değiştir
                                            </RxButton>
                                        </div>
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
                    </motion.div>
                </AnimatePresence>
            </div>
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
        <div className="flex flex-col gap-8 max-w-4xl">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
                <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                    <CalendarOff className="size-5 text-primary" />
                    İşletme Kapalı Günleri
                </h2>

                <div className="bg-gray-50/50 rounded-[24px] p-6 border border-gray-100 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tarih Seçimi</label>
                            <input
                                type="date"
                                value={form.date}
                                min={today}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className="h-12 rounded-2xl border border-gray-100 bg-white px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama (Opsiyonel)</label>
                            <input
                                type="text"
                                value={form.reason}
                                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                placeholder="Örn: Tatil, Tadilat..."
                                className="h-12 rounded-2xl border border-gray-100 bg-white px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <RxButton onClick={handleAdd} loading={saving} className="w-full mt-4 h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px]">
                        <Plus className="size-4 mr-2" /> Listeye Ekle
                    </RxButton>
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
                    ) : dates.length === 0 ? (
                        <div className="bg-white rounded-[24px] border border-dashed border-gray-200 py-12 text-center">
                            <Calendar className="size-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-sm font-bold text-gray-400">Henüz kapalı bir gün tanımlanmadı.</p>
                        </div>
                    ) : (
                        dates.map(d => (
                            <div key={d.id} className="group flex items-center justify-between p-4 rounded-[20px] border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                                        <CalendarOff className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {new Date(d.date + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                        {d.reason && <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{d.reason}</p>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(d.id)}
                                    disabled={deletingId === d.id}
                                    className="size-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                    {deletingId === d.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

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
        <div className="flex flex-col gap-8 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Sparkles className="size-6 text-primary" />
                        Duyuru ve Kampanyalar
                    </h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Müşterilerinize özel teklifler ve duyurular yayınlayın</p>
                </div>
                <RxButton onClick={() => { setEditingItem(null); setIsModalOpen(true) }} className="h-12 px-6 rounded-2xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]">
                    <Plus className="size-4 mr-2" /> Yeni Duyuru
                </RxButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
                ) : announcements.length === 0 ? (
                    <div className="col-span-full bg-white rounded-[40px] border border-dashed border-gray-100 py-24 text-center">
                        <div className="size-16 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-6">
                            <TrendingUp className="size-8 text-gray-200" />
                        </div>
                        <p className="text-sm font-bold text-gray-400">Henüz yayınlanmış bir duyuru bulunmuyor.</p>
                    </div>
                ) : (
                    announcements.map((item) => (
                        <div key={item.id} className={cn(
                            "group relative bg-white rounded-[32px] border transition-all duration-300 overflow-hidden",
                            item.is_active ? "border-gray-100 shadow-sm hover:shadow-md" : "border-dashed border-gray-100 opacity-60 grayscale"
                        )}>
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            item.is_active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-gray-300"
                                        )} />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {item.is_active ? "Yayında" : "Taslak"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true) }} className="size-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                                            <Edit2 className="size-4" />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="size-9 flex items-center justify-center rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all">
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-gray-900 mb-2 leading-tight">{item.title}</h3>
                                <p className="text-sm font-bold text-gray-500 line-clamp-2 mb-4">{item.content}</p>

                                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-gray-50 flex items-center justify-center">
                                            <Calendar className="size-3.5 text-gray-400" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter leading-none">Geçerlilik</span>
                                            <span className="text-[11px] font-bold text-gray-700">
                                                {item.start_date ? new Date(item.start_date).toLocaleDateString("tr-TR") : "..."} - {item.end_date ? new Date(item.end_date).toLocaleDateString("tr-TR") : "..."}
                                            </span>
                                        </div>
                                    </div>
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
        const payload: any = {
            ...form,
            business_id: businessId,
            start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
            end_date: form.end_date ? new Date(form.end_date).toISOString() : null
        }

        if (item?.id) payload.id = item.id

        const res = await upsertAnnouncementAction(payload)
        setLoading(false)
        if (res.success) {
            toast.success("Duyuru başarıyla kaydedildi.")
            onSaved()
            onClose()
        } else {
            toast.error("Hata: " + res.error)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
                onClick={onClose}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100"
            >
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900">{item ? "Duyuruyu Düzenle" : "Yeni Duyuru"}</h3>
                    <button onClick={onClose} className="size-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
                        <X className="size-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Başlık</label>
                        <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">İçerik</label>
                        <textarea rows={3} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} className="rounded-2xl border border-gray-100 bg-gray-50/30 px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Başlangıç</label>
                            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Bitiş</label>
                            <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="h-12 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest leading-none">Yayında mı?</span>
                            <span className="text-[11px] font-bold text-gray-400">Duyuruyu hemen aktif et</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                            className={cn(
                                "relative h-7 w-12 rounded-full transition-all duration-300",
                                form.is_active ? "bg-primary" : "bg-gray-200"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 size-5 rounded-full bg-white shadow-lg transition-all duration-300",
                                form.is_active ? "left-6" : "left-1"
                            )} />
                        </button>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <RxButton type="button" variant="ghost" onClick={onClose} className="flex-1 h-12 rounded-2xl font-black uppercase tracking-widest text-[11px]">Vazgeç</RxButton>
                        <RxButton type="submit" loading={loading} className="flex-[2] h-12 rounded-2xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]">
                            <Save className="size-4 mr-2" /> Duyuruyu Kaydet
                        </RxButton>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
