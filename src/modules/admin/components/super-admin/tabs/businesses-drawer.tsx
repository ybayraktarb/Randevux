"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    Tooltip as RechartsTooltip,
} from "recharts"
import {
    Loader2, X, Sparkles, PackageCheck, Zap, Plus,
    Layers, Package, Wrench, ShieldCheck, KeyRound,
    UserX, Info, FileText, Trash2, ShieldAlert, LogIn
} from "lucide-react"
import { useRouter } from "next/navigation"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import {
    getBusinessFeaturesAction,
    updateBusinessPackageAction,
    updateBusinessBrandingAction,
    toggleBusinessFeatureAction,
    addManualFeatureAction,
    updateBusinessContractAction,
} from "@/src/modules/admin/actions/admin.actions"
import { toggleBusinessActiveAction, deleteBusinessAction } from "@/src/modules/business/actions/business.actions"
import { impersonateUserAction } from "@/src/modules/auth/actions/auth.actions"
import { toast } from "sonner"

// ─── Kaynak Rozeti ─────────────────────────────────────────────────────────────
type FeatureSource = "sector" | "package" | "manual" | null

function KaynakRozeti({ source }: { source: FeatureSource }) {
    if (!source) return null
    const conf: Record<string, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
        sector: { label: "Sektör", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: Layers },
        package: { label: "Paket", cls: "bg-blue-50 text-blue-700 border-blue-200", Icon: Package },
        manual: { label: "Manuel", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: Wrench },
    }
    const c = conf[source]
    if (!c) return null
    const { label, cls, Icon } = c
    return (
        <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold", cls)}>
            <Icon className="size-2.5" />
            {label}
        </span>
    )
}

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Business {
    id: string
    name: string
    city: string
    module: string
    patron: string
    patronEmail: string
    patronPhone: string
    staff: number
    customers: number
    appts: number
    date: string
    active: boolean
    onboarding_status: "contract_pending" | "payment_pending" | "setup" | "live"
    raw: any
}

interface DrawerProps {
    business: Business
    isOpen: boolean
    onClose: () => void
    onStatusChange: () => void
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function BusinessesDrawer({ business, isOpen, onClose, onStatusChange }: DrawerProps) {
    const supabase = createClient()
    const [drawerTab, setDrawerTab] = useState<"general" | "staff" | "stats" | "features">("general")
    const [drawerStaff, setDrawerStaff] = useState<any[]>([])
    const [weeklyBarData, setWeeklyBarData] = useState<any[]>([])
    const [revenueStats, setRevenueStats] = useState({ revenue: 0, appts: 0, noShows: 0 })

    // Özellikler
    const [features, setFeatures] = useState<any[]>([])
    const [packages, setPackages] = useState<any[]>([])
    const [allFeaturesList, setAllFeaturesList] = useState<any[]>([])
    const [loadingFeatures, setLoadingFeatures] = useState(false)
    const [selectedPkgId, setSelectedPkgId] = useState<string | null>(business.raw.package_id || null)
    const [customPrice, setCustomPrice] = useState<string>(business.raw.custom_price?.toString() || "")
    const [updatingPackage, setUpdatingPackage] = useState(false)

    // Manuel özellik ekleme
    const [manuelPanelAcik, setManuelPanelAcik] = useState(false)
    const [manuelEkleniyor, setManuelEkleniyor] = useState<string | null>(null)

    // Branding
    const [branding, setBranding] = useState<any>(business.raw.branding_config || {})
    const [updatingBranding, setUpdatingBranding] = useState(false)

    // Contract
    const initialSub = business.raw.subscriptions?.[0] || {}
    const [contractUrl, setContractUrl] = useState<string>(initialSub.contract_url || "")
    const [endsAt, setEndsAt] = useState<string>(initialSub.ends_at ? initialSub.ends_at.split("T")[0] : "")
    const [updatingContract, setUpdatingContract] = useState(false)
    const router = useRouter()

    // Impersonation
    const [isImpersonating, setIsImpersonating] = useState(false)

    // Hard Delete
    const [showHardDelete, setShowHardDelete] = useState(false)
    const [confirmName, setConfirmName] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    // Filtre
    const [filtre, setFiltre] = useState<"hepsi" | "aktif" | "pasif">("hepsi")

    const fetchFeatures = useCallback(async () => {
        setLoadingFeatures(true)
        const [featRes, pkgRes, allFeatRes] = await Promise.all([
            getBusinessFeaturesAction(business.id),
            supabase.from("packages").select("id, name, price_monthly").eq("is_active", true),
            supabase.from("features").select("id, key, display_name, description").order("display_name"),
        ])
        if (featRes.success) setFeatures(featRes.data || [])
        if (pkgRes.data) setPackages(pkgRes.data)
        if (allFeatRes.data) setAllFeaturesList(allFeatRes.data)
        setLoadingFeatures(false)
    }, [business.id, supabase])

    async function handleUpdatePackage(pkgId: string | null) {
        setUpdatingPackage(true)
        const res = await updateBusinessPackageAction(business.id, pkgId, customPrice ? parseFloat(customPrice) : undefined)
        if (res.success) {
            toast.success("İşletme planı güncellendi")
            setSelectedPkgId(pkgId)
            fetchFeatures()
            onStatusChange()
        } else {
            toast.error(res.error || "Güncelleme başarısız")
        }
        setUpdatingPackage(false)
    }

    async function handleUpdateBranding() {
        setUpdatingBranding(true)
        const res = await updateBusinessBrandingAction(business.id, branding)
        if (res.success) {
            toast.success("Markalama ayarları kaydedildi")
        } else {
            toast.error(res.error || "Hata: " + res.error)
        }
        setUpdatingBranding(false)
    }

    async function handleUpdateContract() {
        setUpdatingContract(true)
        const payload = {
            contract_url: contractUrl || null,
            ends_at: endsAt ? new Date(endsAt).toISOString() : null
        }
        const res = await updateBusinessContractAction(business.id, payload)
        if (res.success) {
            toast.success("Sözleşme bilgileri kaydedildi")
            onStatusChange()
        } else {
            toast.error(res.error || "Sözleşme güncellenemedi")
        }
        setUpdatingContract(false)
    }

    async function handleToggleFeature(featureId: string, currentStatus: boolean) {
        const res = await toggleBusinessFeatureAction(business.id, featureId, !currentStatus)
        if (res.success) {
            toast.success(`Özellik ${!currentStatus ? "aktif edildi" : "devre dışı bırakıldı"}`)
            fetchFeatures()
        } else {
            toast.error(res.error || "Güncelleme başarısız")
        }
    }

    async function handleManuelEkle(featureId: string) {
        setManuelEkleniyor(featureId)
        const res = await addManualFeatureAction(business.id, featureId)
        if (res.success) {
            toast.success("Özellik manuel olarak eklendi")
            fetchFeatures()
        } else {
            toast.error(res.error || "Eklenemedi")
        }
        setManuelEkleniyor(null)
    }

    useEffect(() => {
        if (!isOpen || !business) return
        if (drawerTab === "features") fetchFeatures()
    }, [drawerTab, isOpen, business?.id, fetchFeatures])

    useEffect(() => {
        if (!isOpen || !business) return
        setDrawerTab("general")
        setDrawerStaff([])
        setWeeklyBarData([])
        setRevenueStats({ revenue: 0, appts: business.appts, noShows: 0 })
        setFeatures([])
        setManuelPanelAcik(false)
        
        const sub = business.raw.subscriptions?.[0] || {}
        setContractUrl(sub.contract_url || "")
        setEndsAt(sub.ends_at ? sub.ends_at.split("T")[0] : "")

        supabase.from("staff_business").select("id, is_active, users(name)").eq("business_id", business.id)
            .then(({ data: staffData }) => {
                if (staffData) {
                    setDrawerStaff(staffData.map((s: any) => ({
                        name: s.users?.name || "İsimsiz", role: "Personel", appts: 0,
                    })))
                }
            })

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        supabase.from("appointments")
            .select("id, appointment_date, total_price, status")
            .eq("business_id", business.id)
            .gte("appointment_date", thirtyDaysAgo.toISOString().split("T")[0])
            .then(({ data: apptData }) => {
                if (apptData) {
                    const weekly = [
                        { week: "1. Hafta", randevu: 0 }, { week: "2. Hafta", randevu: 0 },
                        { week: "3. Hafta", randevu: 0 }, { week: "4. Hafta", randevu: 0 },
                    ]
                    let revenue = 0; let noShowCount = 0
                    apptData.forEach((a: any) => {
                        revenue += Number(a.total_price || 0)
                        if (a.status === "no_show") noShowCount++
                        const day = new Date(a.appointment_date).getDate()
                        if (day <= 7) weekly[0].randevu++
                        else if (day <= 14) weekly[1].randevu++
                        else if (day <= 21) weekly[2].randevu++
                        else weekly[3].randevu++
                    })
                    setWeeklyBarData(weekly)
                    setRevenueStats({ revenue, appts: apptData.length, noShows: noShowCount })
                }
            })
    }, [isOpen, business?.id, supabase])

    async function toggleStatus() {
        const res = await toggleBusinessActiveAction(business.id, !business.active)
        if (res.success) {
            toast.success(business.active ? "İşletme pasifleştirildi ve arşivlendi." : "İşletme tekrar aktif edildi.")
            onStatusChange()
        } else {
            toast.error(res.error?.message || "İşlem başarısız oldu.")
        }
    }

    async function handleImpersonate() {
        setIsImpersonating(true)
        const res = await impersonateUserAction(business.raw.owners?.[0]?.user_id)
        if (res.success) {
            toast.success(`${business.name} olarak görüntüleniyor...`)
            router.push("/patron/dashboard")
            router.refresh()
        } else {
            toast.error(res.error?.message || "Hata oluştu.")
        }
        setIsImpersonating(false)
    }

    async function handleHardDelete() {
        if (confirmName !== business.name) {
            toast.error("İşletme adı eşleşmedi!")
            return
        }
        setIsDeleting(true)
        const res = await deleteBusinessAction(business.id)
        if (res.success) {
            toast.success("İşletme ve tüm verileri kalıcı olarak silindi.")
            onStatusChange()
            onClose()
        } else {
            toast.error(res.error?.message || "Silme işlemi başarısız.")
        }
        setIsDeleting(false)
    }

    async function handleUpdateOnboardingStatus(newStatus: "contract_pending" | "payment_pending" | "setup" | "live") {
        const { error } = await supabase.from("businesses").update({ onboarding_status: newStatus }).eq("id", business.id)
        if (!error) {
            toast.success("Kurulum aşaması güncellendi")
            onStatusChange()
        } else {
            toast.error("Aşama güncellenirken hata oluştu")
        }
    }

    if (!isOpen || !business) return null

    const filtreliOzellikler = features.filter((f) => {
        if (filtre === "aktif") return f.isEnabled
        if (filtre === "pasif") return !f.isEnabled
        return true
    })

    const manuelEklenebilir = allFeaturesList.filter(
        (af) => !features.find((f) => f.id === af.id)
    )

    const TABS = [
        { key: "general" as const, label: "Genel" },
        { key: "staff" as const, label: "Personel" },
        { key: "stats" as const, label: "İstatistik" },
        { key: "features" as const, label: "Özellikler" },
    ]

    const featureIcon = (key: string) => {
        if (key === "ai_assistant") return <Sparkles className="size-4" />
        if (key === "online_payment") return <PackageCheck className="size-4" />
        if (key?.includes("analytics")) return <Zap className="size-4" />
        return <ShieldCheck className="size-4" />
    }

    return (
        <>
            <div className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[540px] flex-col border-l border-border bg-card shadow-xl">

                {/* ── Header ── */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <RxAvatar name={business.name} size="lg" />
                        <div className="flex flex-col gap-0.5">
                            <span className="text-lg font-semibold text-foreground leading-tight">{business.name}</span>
                            <div className="flex items-center gap-2">
                                {business.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="gray">Pasif</RxBadge>}
                                <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                    {business.module}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat">
                        <X className="size-5" />
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex border-b border-border">
                    {TABS.map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setDrawerTab(tab.key)}
                            className={cn("flex-1 py-3 text-sm font-medium transition-colors",
                                drawerTab === tab.key
                                    ? "border-b-2 border-primary text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto p-5">

                    {/* ─── Genel ─── */}
                    {drawerTab === "general" && (
                        <div className="flex flex-col gap-4">

                            {/* Kurulum Aşaması (Pipeline) */}
                            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
                                    🚀 Kurulum Süreci (Pipeline)
                                </h4>
                                <div className="flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-blue-200 before:z-0 px-2 sm:px-6">
                                    {[
                                        { id: "contract_pending", label: "Sözleşme Bekliyor" },
                                        { id: "payment_pending", label: "Ödeme Bekliyor" },
                                        { id: "setup", label: "Kurulum" },
                                        { id: "live", label: "Canlı" }
                                    ].map((stage, idx, arr) => {
                                        const currentIndex = arr.findIndex(s => s.id === (business.onboarding_status || 'live'))
                                        const isCompleted = idx <= currentIndex
                                        const isCurrent = idx === currentIndex

                                        return (
                                            <div key={stage.id} 
                                                 onClick={() => handleUpdateOnboardingStatus(stage.id as any)}
                                                 className={cn(
                                                    "relative z-10 flex flex-col items-center gap-2 text-center cursor-pointer group transition-all",
                                                )}>
                                                <div className={cn(
                                                    "flex size-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all",
                                                    isCompleted ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-blue-200 text-blue-300",
                                                    isCurrent && "ring-4 ring-blue-100",
                                                    "group-hover:scale-110 group-hover:border-blue-400 group-hover:text-blue-500"
                                                )}>
                                                    {isCompleted ? "✓" : (idx + 1)}
                                                </div>
                                                <span className={cn(
                                                    "text-[10px] font-medium sm:text-xs",
                                                    isCurrent ? "text-blue-900 font-bold" : "text-blue-600/70 group-hover:text-blue-800"
                                                )}>
                                                    {stage.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* İşletme Bilgileri */}
                            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                <h4 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Info className="size-4 text-primary" />
                                    İşletme Bilgileri
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                                    {[
                                        { label: "Sektör", value: <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2.5 py-0.5 text-xs font-medium text-badge-green-text">{business.module}</span> },
                                        { label: "Aktif Paket", value: <span className="text-[13px] font-semibold text-primary">{business.raw.packages?.name || "Paket Yok"}</span> },
                                        { label: "Şehir", value: <span className="text-[13px] text-foreground">{business.city}</span> },
                                        { label: "Telefon", value: <span className="text-[13px] text-foreground font-mono">{business.raw.phone || "—"}</span> },
                                        { label: "Kayıt", value: <span className="text-[13px] text-foreground">{business.date}</span> },
                                        { label: "Sistem", value: business.active ? <span className="text-xs text-success font-bold">Aktif</span> : <span className="text-xs text-danger font-bold">Pasif</span> },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex flex-col gap-0.5 border-b border-border/30 pb-1 last:border-0 sm:border-0 sm:pb-0">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
                                            <div className="truncate">{value}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sözleşme & Abonelik Yönetimi */}
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <FileText className="size-4 text-emerald-600" />
                                    Sözleşme & Abonelik Yönetimi
                                </h4>
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold uppercase text-muted-foreground">Sözleşme Belgesi (URL)</label>
                                        <input type="text" value={contractUrl} onChange={(e) => setContractUrl(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-semibold uppercase text-muted-foreground">Erişim Bitiş Tarihi (Opsiyonel)</label>
                                        <input type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)}
                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary uppercase" />
                                        <p className="text-[10px] text-muted-foreground">Bu tarih geçtiğinde sistem aboneliği durdurabilir (Cronjob ile).</p>
                                    </div>
                                    <RxButton variant="ghost" size="sm" className="border border-dashed border-emerald-400/40 text-emerald-600 hover:bg-emerald-50 mt-1"
                                        onClick={handleUpdateContract} disabled={updatingContract}>
                                        {updatingContract && <Loader2 className="size-4 animate-spin" />}
                                        Sözleşme Kaydet
                                    </RxButton>
                                </div>
                            </div>

                            {/* İşletme Sahibi */}
                            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                                <h4 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-primary" />
                                    İşletme Sahibi
                                </h4>
                                <div className="flex items-start gap-4">
                                    <RxAvatar name={business.patron} size="lg" />
                                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Ad Soyad</span>
                                            <span className="text-[13px] font-medium text-foreground">{business.patron}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">E-posta</span>
                                            <span className="text-[13px] font-medium text-foreground truncate">{business.patronEmail}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 sm:col-span-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Telefon</span>
                                            <span className="text-[13px] font-medium text-foreground">{business.patronPhone}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Hızlı Aksiyonlar */}
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Hızlı Aksiyonlar</h4>
                                <div className="flex flex-col gap-2">
                                    <button type="button" onClick={handleImpersonate} disabled={isImpersonating}
                                        className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors">
                                        {isImpersonating ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4 text-primary" />}
                                        İşletme Sahibi Olarak Gör (Patron Görünümü)
                                    </button>
                                    <button type="button"
                                        onClick={() => toast.info("Şifre sıfırlama e-postası gönderildi (yakında aktif)")}
                                        className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors">
                                        <KeyRound className="size-4 text-muted-foreground" />
                                        Şifre Sıfırlama E-postası Gönder
                                    </button>
                                    <button type="button" onClick={toggleStatus}
                                        className={cn(
                                            "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                                            business.active
                                                ? "border-destructive/30 text-destructive hover:bg-destructive/5"
                                                : "border-success/30 text-success hover:bg-success/5"
                                        )}>
                                        <UserX className="size-4" />
                                        {business.active ? "İşletmeyi Pasife Al (Arşivle)" : "İşletmeyi Aktif Et"}
                                    </button>
                                </div>
                            </div>

                            {/* KALICI SİLME (Danger Zone) */}
                            <div className="rounded-xl border border-red-200 bg-red-50/30 p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-bold text-red-800 uppercase tracking-tight">
                                    <ShieldAlert className="size-4" />
                                    Tehlikeli Bölge
                                </h4>
                                {!showHardDelete ? (
                                    <button type="button" onClick={() => setShowHardDelete(true)}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-all shadow-sm">
                                        <Trash2 className="size-3.5" />
                                        İŞLETMEYİ KALICI OLARAK SİL
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                                        <p className="text-[11px] font-medium text-red-700 leading-tight">
                                            Bu işlem <strong>GERİ ALINAMAZ</strong>. Tüm personeller, randevular ve hizmetler kalıcı olarak silinecektir.
                                        </p>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-[10px] font-bold text-red-900 uppercase">Onay için işletme adını yazın:</label>
                                            <input type="text" value={confirmName} onChange={(e) => setConfirmName(e.target.value)}
                                                placeholder={business.name}
                                                className="h-9 w-full rounded-lg border border-red-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                                        </div>
                                        <div className="flex gap-2">
                                            <RxButton variant="secondary" size="sm" className="flex-1" onClick={() => { setShowHardDelete(false); setConfirmName(""); }}>Vazgeç</RxButton>
                                            <RxButton variant="danger" size="sm" className="flex-1 gap-1.5" onClick={handleHardDelete} disabled={isDeleting || confirmName !== business.name}>
                                                {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                                SİLMEYİ ONAYLA
                                            </RxButton>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Markalama */}
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <Zap className="size-4 text-amber-500" />
                                    Markalama (White-label)
                                </h4>
                                <div className="flex flex-col gap-3">
                                    <input type="text" value={branding.appName || ""} onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
                                        placeholder={business.name}
                                        className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex gap-2">
                                            <input type="color" value={branding.primaryColor || "#6C63FF"} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="size-9 rounded-lg cursor-pointer border-none p-0 bg-transparent" />
                                            <input type="text" value={branding.primaryColor || "#6C63FF"} onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                                                className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-[12px] uppercase focus:outline-none focus:ring-2 focus:ring-primary" />
                                        </div>
                                        <input type="text" value={branding.logoUrl || ""} onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                                            placeholder="Logo URL"
                                            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    </div>
                                    <RxButton variant="ghost" size="sm" className="border border-dashed border-amber-400/40 text-amber-600 hover:bg-amber-50"
                                        onClick={handleUpdateBranding} disabled={updatingBranding}>
                                        {updatingBranding && <Loader2 className="size-4 animate-spin" />}
                                        Markalama Uygula
                                    </RxButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Personel ─── */}
                    {drawerTab === "staff" && (
                        <div className="flex flex-col gap-3">
                            {drawerStaff.map((s, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-muted/30 transition-colors">
                                    <RxAvatar name={s.name} size="sm" />
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                                        <span className="text-xs text-muted-foreground">{s.role}</span>
                                    </div>
                                </div>
                            ))}
                            {drawerStaff.length === 0 && (
                                <div className="py-12 text-center text-sm text-muted-foreground">Personel bulunamadı</div>
                            )}
                        </div>
                    )}

                    {/* ─── İstatistik ─── */}
                    {drawerTab === "stats" && (
                        <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center rounded-xl border border-border p-3">
                                    <span className="text-lg font-bold text-foreground">₺{revenueStats.revenue.toLocaleString("tr-TR")}</span>
                                    <span className="text-xs text-muted-foreground text-center">Son 30 Gün</span>
                                </div>
                                <div className="flex flex-col items-center rounded-xl border border-border p-3">
                                    <span className="text-lg font-bold text-foreground">{revenueStats.appts}</span>
                                    <span className="text-xs text-muted-foreground">Randevu</span>
                                </div>
                                <div className="flex flex-col items-center rounded-xl border border-border p-3">
                                    <span className="text-lg font-bold text-destructive">{revenueStats.noShows}</span>
                                    <span className="text-xs text-muted-foreground">No-Show</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Son 30 Gün Aktivite</h4>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyBarData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="week" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
                                            <Bar dataKey="randevu" name="Randevu" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Özellikler (Source Tracking) ─── */}
                    {drawerTab === "features" && (
                        <div className="flex flex-col gap-4">

                            {/* Plan Yönetimi */}
                            <div className="rounded-xl border border-border bg-card p-4">
                                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <PackageCheck className="size-4 text-primary" />
                                    Plan Yönetimi
                                </h4>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedPkgId || ""}
                                        onChange={(e) => {
                                            const pkgId = e.target.value || null
                                            setSelectedPkgId(pkgId)
                                            if (pkgId) {
                                                const pkg = packages.find((p) => p.id === pkgId)
                                                if (pkg) setCustomPrice(pkg.price_monthly?.toString() || "")
                                            }
                                        }}
                                        className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Paksetsiz (Özel)</option>
                                        {packages.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name} — ₺{p.price_monthly}/ay</option>
                                        ))}
                                    </select>
                                    <input type="number" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
                                        placeholder="₺"
                                        className="h-9 w-20 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <RxButton size="sm" onClick={() => handleUpdatePackage(selectedPkgId)} disabled={updatingPackage}>
                                        {updatingPackage ? <Loader2 className="size-4 animate-spin" /> : "Uygula"}
                                    </RxButton>
                                </div>
                            </div>

                            {/* Açıklama */}
                            <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                                <Info className="size-4 shrink-0 text-blue-500 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    <strong>Sektör</strong> (zorunlu), <strong>Paket</strong> (abonelikle gelen) veya <strong>Manuel</strong> (Süper Admin ataması).
                                    Manuel özellikler paket değişimlerinden etkilenmez.
                                </p>
                            </div>

                            {/* Filtre + Manuel Ekle */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex gap-1 rounded-lg border border-border p-1">
                                    {(["hepsi", "aktif", "pasif"] as const).map((f) => (
                                        <button key={f} type="button" onClick={() => setFiltre(f)}
                                            className={cn(
                                                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                                                filtre === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                            )}>
                                            {f === "hepsi" ? "Hepsi" : f === "aktif" ? "Aktif" : "Pasif"}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setManuelPanelAcik(!manuelPanelAcik)}
                                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                                    <Plus className="size-3.5" />
                                    Manuel Ekle
                                </button>
                            </div>

                            {/* Manuel Ekleme Paneli */}
                            {manuelPanelAcik && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                                    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                                        Manuel Eklenebilir ({manuelEklenebilir.length})
                                    </p>
                                    <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
                                        {manuelEklenebilir.length > 0 ? manuelEklenebilir.map((f) => (
                                            <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-100 bg-white px-3 py-2">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{f.display_name}</p>
                                                    <p className="font-mono text-[10px] text-muted-foreground">{f.key}</p>
                                                </div>
                                                <button type="button" onClick={() => handleManuelEkle(f.id)} disabled={manuelEkleniyor === f.id}
                                                    className="flex items-center gap-1 rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors">
                                                    {manuelEkleniyor === f.id ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                                                    Ekle
                                                </button>
                                            </div>
                                        )) : (
                                            <p className="py-4 text-center text-xs text-muted-foreground">Tüm özellikler zaten tanımlı.</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Özellik Listesi */}
                            {loadingFeatures ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 className="size-8 animate-spin text-primary/40" />
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        Özellik Denetimi ({filtreliOzellikler.length})
                                    </p>
                                    {filtreliOzellikler.map((f) => (
                                        <div key={f.id}
                                            className={cn(
                                                "flex items-center gap-2.5 rounded-lg border p-2.5 transition-all",
                                                f.isEnabled
                                                    ? "border-primary/20 bg-primary/5"
                                                    : "border-border bg-muted/5 opacity-50"
                                            )}>
                                            {/* İkon */}
                                            <div className={cn(
                                                "flex size-7 shrink-0 items-center justify-center rounded-md",
                                                f.isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                                            )}>
                                                {featureIcon(f.key)}
                                            </div>

                                            {/* Ad + Kaynak */}
                                            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                                                    {f.isEnabled && <KaynakRozeti source={f.source as FeatureSource} />}
                                                </div>
                                                {f.description && (
                                                    <span className="text-[11px] text-muted-foreground truncate">{f.description}</span>
                                                )}
                                            </div>

                                            {/* Toggle */}
                                            <button
                                                type="button"
                                                onClick={() => handleToggleFeature(f.id, f.isEnabled)}
                                                disabled={f.source === "sector"}
                                                title={f.source === "sector" ? "Sektör varsayılanı — değiştirilemez" : undefined}
                                                className={cn(
                                                    "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200",
                                                    f.isEnabled ? "bg-primary" : "bg-muted",
                                                    f.source === "sector" && "cursor-not-allowed opacity-40"
                                                )}
                                            >
                                                <span className={cn(
                                                    "pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200",
                                                    f.isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                                                )} style={{ marginTop: "2px" }} />
                                            </button>
                                        </div>
                                    ))}

                                    {filtreliOzellikler.length === 0 && !loadingFeatures && (
                                        <div className="py-12 text-center text-sm text-muted-foreground">
                                            Bu filtreye uyan özellik bulunamadı.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}
