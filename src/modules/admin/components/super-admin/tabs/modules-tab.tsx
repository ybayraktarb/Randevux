"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    Loader2, Plus, ChevronRight, Power, Settings2, X,
    Scissors, Sparkles, PawPrint, Heart, Stethoscope,
    Briefcase, Dumbbell, GraduationCap, Palette, Camera,
    Music, Utensils, Layers, Check, AlertCircle, Pencil,
    Eye, EyeOff, Info, LayoutGrid, ShieldCheck, Type, Trash2, AlertTriangle
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"

// ─── İkon Haritası ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    scissors: Scissors,
    sparkles: Sparkles,
    "paw-print": PawPrint,
    heart: Heart,
    "heart-pulse": Heart,
    stethoscope: Stethoscope,
    briefcase: Briefcase,
    dumbbell: Dumbbell,
    "graduation-cap": GraduationCap,
    palette: Palette,
    camera: Camera,
    music: Music,
    utensils: Utensils,
}

const ICON_OPTIONS = [
    { key: "scissors", Icon: Scissors, label: "Makas" },
    { key: "sparkles", Icon: Sparkles, label: "Güzellik" },
    { key: "paw-print", Icon: PawPrint, label: "Patik" },
    { key: "heart", Icon: Heart, label: "Kalp" },
    { key: "stethoscope", Icon: Stethoscope, label: "Steteskop" },
    { key: "briefcase", Icon: Briefcase, label: "Çanta" },
    { key: "dumbbell", Icon: Dumbbell, label: "Halter" },
    { key: "graduation-cap", Icon: GraduationCap, label: "Eğitim" },
    { key: "palette", Icon: Palette, label: "Palet" },
    { key: "camera", Icon: Camera, label: "Kamera" },
    { key: "music", Icon: Music, label: "Müzik" },
    { key: "utensils", Icon: Utensils, label: "Mutfak" },
]

const COLOR_OPTIONS = [
    "#8b5cf6", "#6366f1", "#3b82f6", "#10b981",
    "#f59e0b", "#ef4444", "#ec4899", "#14b8a6",
]

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Sektor {
    id: string
    name: string
    display_name: string
    description: string
    icon: string
    color: string
    is_active: boolean
    is_available_for_new_businesses: boolean
    business_count: number
    defaultFeatures: { id: string; name: string; key: string }[]
}

interface Ozellik {
    id: string
    key: string
    display_name: string
    description: string
}

// ─── Varsayılan Özellik Drawer ────────────────────────────────────────────────
function VarsayilanOzellikDrawer({
    sektor,
    ozellikler,
    onClose,
    onSaved,
}: {
    sektor: Sektor
    ozellikler: Ozellik[]
    onClose: () => void
    onSaved: () => void
}) {
    const supabase = createClient()
    const [secili, setSecili] = useState<string[]>(
        sektor.defaultFeatures.map((f) => f.id)
    )
    const [yukleniyor, setYukleniyor] = useState(false)
    const [hata, setHata] = useState("")

    async function kaydet() {
        setYukleniyor(true)
        setHata("")
        try {
            // Mevcut varsayılan özellikleri sil
            const { error: silHata } = await supabase
                .from("sector_default_features")
                .delete()
                .eq("sector_id", sektor.id)

            if (silHata) throw silHata

            // Yeni seçilenleri ekle
            if (secili.length > 0) {
                const { error: ekleHata } = await supabase
                    .from("sector_default_features")
                    .insert(
                        secili.map((fId) => ({
                            sector_id: sektor.id,
                            feature_id: fId,
                        }))
                    )
                if (ekleHata) throw ekleHata
            }

            onSaved()
            onClose()
        } catch (e: any) {
            setHata(e.message || "Bir hata oluştu.")
        } finally {
            setYukleniyor(false)
        }
    }

    const toggle = (id: string) =>
        setSecili((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Drawer */}
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
                {/* Başlık */}
                <div
                    className="flex items-center justify-between px-6 py-5 border-b border-border"
                    style={{ borderLeftColor: sektor.color, borderLeftWidth: 4 }}
                >
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-base font-semibold text-foreground">
                            Varsayılan Özellikler
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {sektor.display_name} · Bu sektördeki tüm işletmelere otomatik tanımlanır
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Özellik Listesi */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Platform Özellikleri ({ozellikler.length})
                    </p>
                    {ozellikler.map((o) => {
                        const aktif = secili.includes(o.id)
                        return (
                            <button
                                key={o.id}
                                type="button"
                                onClick={() => toggle(o.id)}
                                className={cn(
                                    "flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all",
                                    aktif
                                        ? "border-primary bg-primary/5"
                                        : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                                )}
                            >
                                <div
                                    className={cn(
                                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border transition-colors",
                                        aktif
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-input bg-card"
                                    )}
                                >
                                    {aktif && <Check className="size-3" strokeWidth={3} />}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-sm font-medium text-foreground">
                                        {o.display_name}
                                    </span>
                                    {o.description && (
                                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                                            {o.description}
                                        </span>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                    {ozellikler.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                            <AlertCircle className="size-8 opacity-40" />
                            <span className="text-sm">Henüz platform özelliği eklenmemiş.</span>
                        </div>
                    )}
                </div>

                {/* Alt çubuk */}
                <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-3">
                    {hata ? (
                        <p className="text-xs text-destructive flex items-center gap-1.5">
                            <AlertCircle className="size-3.5" /> {hata}
                        </p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            {secili.length} özellik seçildi
                        </p>
                    )}
                    <div className="flex gap-2">
                        <RxButton variant="ghost" size="sm" onClick={onClose}>
                            Vazgeç
                        </RxButton>
                        <RxButton size="sm" onClick={kaydet} disabled={yukleniyor}>
                            {yukleniyor && <Loader2 className="size-4 animate-spin" />}
                            Kaydet
                        </RxButton>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Sektör Form Alanları ─────────────────────────────────────────────────────
interface SektorFormProps {
    ad: string
    slug: string
    aciklama: string
    ikon: string
    renk: string
    yeniKayitlara: boolean
    onAd: (v: string) => void
    onSlug: (v: string) => void
    onAciklama: (v: string) => void
    onIkon: (v: string) => void
    onRenk: (v: string) => void
    onYeniKayitlara: (v: boolean) => void
    slugDuzenleme?: boolean
}

function SektorForm({
    ad, slug, aciklama, ikon, renk, yeniKayitlara,
    onAd, onSlug, onAciklama, onIkon, onRenk, onYeniKayitlara,
    slugDuzenleme = true,
}: SektorFormProps) {
    return (
        <div className="flex flex-col gap-8 py-2">
            {/* 1. Kimlik Bilgileri */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                    <Type className="size-4 text-primary" />
                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Temel Bilgiler</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <RxInput
                        label="Sektör Adı"
                        placeholder="Örn: Güzellik Salonu"
                        value={ad}
                        onChange={(e) => onAd(e.target.value)}
                        className="bg-card shadow-sm h-11"
                    />
                    {slugDuzenleme && (
                        <RxInput
                            label="Sistem Kodu (slug)"
                            placeholder="guzellik_salonu"
                            value={slug}
                            onChange={(e) => onSlug(e.target.value)}
                            className="bg-muted/30 font-mono text-[13px]"
                        />
                    )}
                    <RxTextarea
                        label="Açıklama"
                        placeholder="Bu sektör hakkında kısa bir açıklama..."
                        value={aciklama}
                        onChange={(e) => onAciklama(e.target.value)}
                        className="min-h-[100px] bg-card shadow-sm resize-none text-[13px] italic"
                    />
                </div>
            </section>

            {/* 2. Görsel & Tema */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                    <Palette className="size-4 text-primary" />
                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Görsel Stil & Tema</h4>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <p className="mb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">İkon Seçimi</p>
                        <div className="grid grid-cols-6 gap-3">
                            {ICON_OPTIONS.map(({ key, Icon: Ic }) => (
                                <button
                                    key={key}
                                    type="button"
                                    title={key}
                                    onClick={() => onIkon(key)}
                                    className={cn(
                                        "flex size-11 items-center justify-center rounded-xl border-2 transition-all duration-300",
                                        ikon === key
                                            ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)] scale-110"
                                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 active:scale-95"
                                    )}
                                >
                                    <Ic className="size-5" />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <p className="mb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Marka Rengi</p>
                        <div className="flex flex-wrap gap-3">
                            {COLOR_OPTIONS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => onRenk(c)}
                                    className={cn(
                                        "size-9 rounded-full border-4 transition-all duration-300 hover:scale-110 active:scale-95",
                                        renk === c ? "border-foreground/20 ring-2 ring-primary ring-offset-2 scale-110 shadow-lg" : "border-transparent"
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Durum & Kayıt Erişimi */}
            <section className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                    <ShieldCheck className="size-4 text-success" />
                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Erişim & Durum</h4>
                </div>
                <div 
                    className={cn(
                        "flex items-center justify-between cursor-pointer rounded-2xl border-2 p-4 transition-all duration-300 group",
                        yeniKayitlara 
                            ? "border-success/50 bg-success/5 shadow-sm ring-2 ring-success/10" 
                            : "border-border bg-muted/20 hover:border-muted-foreground/30"
                    )}
                    onClick={() => onYeniKayitlara(!yeniKayitlara)}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex size-10 items-center justify-center rounded-xl transition-colors duration-300",
                            yeniKayitlara ? "bg-success text-white shadow-md shadow-success/20" : "bg-muted text-muted-foreground"
                        )}>
                            <Eye className="size-5" />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className={cn("text-[13px] font-bold", yeniKayitlara ? "text-success" : "text-foreground")}>
                                Yeni İşletmelere Açık
                            </span>
                            <span className="text-[11px] text-muted-foreground italic">Bu sektörde yeni işletme kaydına izin ver.</span>
                        </div>
                    </div>
                    <div className={cn(
                        "relative inline-flex h-5 w-10 shrink-0 rounded-full transition-colors duration-300",
                        yeniKayitlara ? "bg-success" : "bg-muted-foreground/30"
                    )}>
                        <span className={cn(
                            "inline-block size-4 transform rounded-full bg-white transition-transform duration-300",
                            yeniKayitlara ? "translate-x-5" : "translate-x-1"
                        )} style={{ marginTop: "2px" }} />
                    </div>
                </div>
            </section>
        </div>
    )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function ModulesTab() {
    const supabase = createClient()
    const [sektorler, setSektorler] = useState<Sektor[]>([])
    const [ozellikler, setOzellikler] = useState<Ozellik[]>([])
    const [yukleniyor, setYukleniyor] = useState(true)

    // Drawer state
    const [drawerSektor, setDrawerSektor] = useState<Sektor | null>(null)

    // Yeni Modal
    const [modalAcik, setModalAcik] = useState(false)
    const [yeniAd, setYeniAd] = useState("")
    const [yeniSlug, setYeniSlug] = useState("")
    const [yeniAciklama, setYeniAciklama] = useState("")
    const [yeniIkon, setYeniIkon] = useState("scissors")
    const [yeniRenk, setYeniRenk] = useState("#8b5cf6")
    const [yeniKayitlara, setYeniKayitlara] = useState(true)

    // Düzenle Modal
    const [duzenlemeModalAcik, setDuzenlemeModalAcik] = useState(false)
    const [duzenleId, setDuzenleId] = useState("")
    const [duzenleAd, setDuzenleAd] = useState("")
    const [duzenleSlug, setDuzenleSlug] = useState("")
    const [duzenleAciklama, setDuzenleAciklama] = useState("")
    const [duzenleIkon, setDuzenleIkon] = useState("scissors")
    const [duzenleRenk, setDuzenleRenk] = useState("#8b5cf6")
    const [duzenleKayitlara, setDuzenleKayitlara] = useState(true)
    const [kayitHata, setKayitHata] = useState("")
    const [kayitIsleniyor, setKayitIsleniyor] = useState(false)

    // Silme Modal
    const [silmeModalAcik, setSilmeModalAcik] = useState(false)
    const [silinecekSektor, setSilinecekSektor] = useState<Sektor | null>(null)
    const [silmeIsleniyor, setSilmeIsleniyor] = useState(false)

    const veriCek = useCallback(async () => {
        setYukleniyor(true)
        const [{ data: modData }, { data: featData }] = await Promise.all([
            supabase
                .from("modules")
                .select(`
                    *,
                    businesses(id),
                    sector_default_features(
                        feature_id,
                        feature:features(id, display_name, key)
                    )
                `)
                .order("created_at", { ascending: true }),
            supabase
                .from("features")
                .select("id, key, display_name, description")
                .order("display_name"),
        ])

        if (modData) {
            setSektorler(
                modData.map((m: any) => ({
                    id: m.id,
                    name: m.name,
                    display_name: m.display_name,
                    description: m.description || "",
                    icon: m.icon || "scissors",
                    color: m.color || "#6366f1",
                    is_active: m.is_active,
                    is_available_for_new_businesses: m.is_available_for_new_businesses ?? true,
                    business_count: m.businesses?.length || 0,
                    defaultFeatures: (m.sector_default_features || []).map((sdf: any) => ({
                        id: sdf.feature_id,
                        name: sdf.feature?.display_name || sdf.feature?.key || "?",
                        key: sdf.feature?.key || "",
                    })),
                }))
            )
        }
        if (featData) setOzellikler(featData)
        setYukleniyor(false)
    }, [supabase])

    useEffect(() => {
        veriCek()
    }, [veriCek])

    const adDegisti = (v: string) => {
        setYeniAd(v)
        setYeniSlug(v.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
    }

    const modalSifirla = () => {
        setYeniAd(""); setYeniSlug(""); setYeniAciklama("")
        setYeniIkon("scissors"); setYeniRenk("#8b5cf6"); setYeniKayitlara(true)
        setKayitHata("")
    }

    async function sektorEkle() {
        if (!yeniAd || !yeniSlug) { setKayitHata("Sektör adı ve kodu zorunludur."); return }
        setKayitIsleniyor(true); setKayitHata("")
        const { error } = await supabase.from("modules").insert({
            name: yeniSlug,
            display_name: yeniAd,
            description: yeniAciklama,
            icon: yeniIkon,
            color: yeniRenk,
            is_active: true,
            is_available_for_new_businesses: yeniKayitlara,
            config: {},
        })
        setKayitIsleniyor(false)
        if (error) { setKayitHata(error.message); return }
        setModalAcik(false); modalSifirla(); veriCek()
    }

    function duzenlemeAc(s: Sektor) {
        setDuzenleId(s.id); setDuzenleAd(s.display_name); setDuzenleSlug(s.name)
        setDuzenleAciklama(s.description); setDuzenleIkon(s.icon)
        setDuzenleRenk(s.color); setDuzenleKayitlara(s.is_available_for_new_businesses)
        setKayitHata(""); setDuzenlemeModalAcik(true)
    }

    async function sektorSil() {
        if (!silinecekSektor) return
        if (silinecekSektor.business_count > 0) {
            setKayitHata(`Bu sektöre bağlı ${silinecekSektor.business_count} işletme bulunduğu için silemezsiniz. Lütfen önce işletmeleri farklı bir sektöre aktarın veya silin.`)
            return
        }

        setSilmeIsleniyor(true)
        setKayitHata("")
        
        const { error } = await supabase
            .from("modules")
            .delete()
            .eq("id", silinecekSektor.id)

        setSilmeIsleniyor(false)
        
        if (error) {
            setKayitHata(error.message)
            return
        }

        setSilmeModalAcik(false)
        setSilinecekSektor(null)
        veriCek()
    }

    async function sektorGuncelle() {
        if (!duzenleAd) { setKayitHata("Sektör adı zorunludur."); return }
        setKayitIsleniyor(true); setKayitHata("")
        const { error } = await supabase.from("modules").update({
            display_name: duzenleAd,
            description: duzenleAciklama,
            icon: duzenleIkon,
            color: duzenleRenk,
            is_available_for_new_businesses: duzenleKayitlara,
        }).eq("id", duzenleId)
        setKayitIsleniyor(false)
        if (error) { setKayitHata(error.message); return }
        setDuzenlemeModalAcik(false); veriCek()
    }

    async function durumDegistir(id: string, mevcut: boolean) {
        await supabase.from("modules").update({ is_active: !mevcut }).eq("id", id)
        veriCek()
    }

    if (yukleniyor) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── Başlık ── */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                        <Layers className="size-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-[22px] font-semibold text-foreground">Sektör Yönetimi</h2>
                        <p className="text-sm text-muted-foreground">
                            {sektorler.length} sektör · İşletme kategorileri ve varsayılan özellikleri
                        </p>
                    </div>
                </div>
                <RxButton size="sm" onClick={() => { modalSifirla(); setModalAcik(true) }}>
                    <Plus className="size-4" />
                    Yeni Sektör
                </RxButton>
            </div>

            {/* ── Sektör Kartları ── */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {sektorler.map((s) => {
                    const Icon = ICON_MAP[s.icon] || Layers
                    return (
                        <div
                            key={s.id}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
                                !s.is_active && "opacity-60"
                            )}
                        >
                            {/* Renkli üst çizgi */}
                            <div
                                className="h-1 w-full"
                                style={{ backgroundColor: s.color }}
                            />

                            {/* Kart içeriği */}
                            <div className="p-5">
                                {/* Başlık satırı */}
                                <div className="flex items-start justify-between gap-3 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
                                            style={{ backgroundColor: s.color + "20", color: s.color }}
                                        >
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground leading-tight">{s.display_name}</h3>
                                            <span className="text-xs text-muted-foreground font-mono">{s.name}</span>
                                        </div>
                                    </div>

                                    {/* Durum toggle */}
                                    <button
                                        type="button"
                                        onClick={() => durumDegistir(s.id, s.is_active)}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                                            s.is_active ? "bg-success" : "bg-muted"
                                        )}
                                        role="switch"
                                        aria-checked={s.is_active}
                                        title={s.is_active ? "Pasife al" : "Aktif et"}
                                    >
                                        <span
                                            className={cn(
                                                "pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200",
                                                s.is_active ? "translate-x-[18px]" : "translate-x-0.5"
                                            )}
                                            style={{ marginTop: "2px" }}
                                        />
                                    </button>
                                </div>

                                {/* Açıklama */}
                                <p className="text-[13px] text-muted-foreground leading-relaxed mb-4 line-clamp-2 min-h-[36px]">
                                    {s.description || "Açıklama eklenmemiş."}
                                </p>

                                {/* İstatistikler */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-foreground">{s.business_count}</span>
                                        <span className="text-[11px] text-muted-foreground">İşletme</span>
                                    </div>
                                    <div className="h-8 w-px bg-border" />
                                    <div className="flex flex-col">
                                        <span className="text-lg font-bold text-foreground">{s.defaultFeatures.length}</span>
                                        <span className="text-[11px] text-muted-foreground">Varsayılan Özellik</span>
                                    </div>
                                    <div className="h-8 w-px bg-border" />
                                    <div className="flex items-center gap-1.5">
                                        {s.is_available_for_new_businesses ? (
                                            <>
                                                <Eye className="size-3.5 text-success" />
                                                <span className="text-[11px] text-success font-medium">Yeni Kayıta Açık</span>
                                            </>
                                        ) : (
                                            <>
                                                <EyeOff className="size-3.5 text-muted-foreground" />
                                                <span className="text-[11px] text-muted-foreground">Kapalı</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Varsayılan Özellik Etiketleri */}
                                {s.defaultFeatures.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {s.defaultFeatures.slice(0, 3).map((f) => (
                                            <span
                                                key={f.id}
                                                className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                                                style={{ backgroundColor: s.color + "15", color: s.color }}
                                            >
                                                {f.name}
                                            </span>
                                        ))}
                                        {s.defaultFeatures.length > 3 && (
                                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                +{s.defaultFeatures.length - 3} daha
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Aksiyonlar */}
                                <div className="flex items-center gap-2 pt-3 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={() => setDrawerSektor(s)}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
                                    >
                                        <Settings2 className="size-3.5" />
                                        Varsayılan Özellikler
                                    </button>
                                    <div className="h-4 w-px bg-border" />
                                    <button
                                        type="button"
                                        onClick={() => duzenlemeAc(s)}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                    >
                                        <Pencil className="size-3.5" />
                                        Düzenle
                                    </button>
                                    <div className="h-4 w-px bg-border" />
                                    <button
                                        type="button"
                                        onClick={() => { setSilinecekSektor(s); setKayitHata(""); setSilmeModalAcik(true) }}
                                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        title="Sektörü Sil"
                                    >
                                        <Trash2 className="size-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}

                {/* Boş Durum */}
                {sektorler.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/10 py-20">
                        <Layers className="size-12 text-muted-foreground/40" />
                        <div className="flex flex-col items-center gap-1">
                            <p className="font-semibold text-foreground">Henüz sektör eklenmemiş</p>
                            <p className="text-sm text-muted-foreground">İlk sektörünüzü ekleyerek başlayın</p>
                        </div>
                        <RxButton size="sm" onClick={() => { modalSifirla(); setModalAcik(true) }}>
                            <Plus className="size-4" />
                            Sektör Ekle
                        </RxButton>
                    </div>
                )}
            </div>

            {/* ── Yeni Sektör Modal ── */}
            <RxModal
                open={modalAcik}
                onClose={() => { setModalAcik(false); modalSifirla() }}
                title="Yeni Sektör Ekle"
                className="max-w-[560px]"
                footer={
                    <>
                        {kayitHata && (
                            <p className="flex-1 text-xs text-destructive flex items-center gap-1.5">
                                <AlertCircle className="size-3.5" /> {kayitHata}
                            </p>
                        )}
                        <RxButton variant="ghost" size="sm" onClick={() => { setModalAcik(false); modalSifirla() }}>
                            Vazgeç
                        </RxButton>
                        <RxButton size="sm" onClick={sektorEkle} disabled={kayitIsleniyor}>
                            {kayitIsleniyor && <Loader2 className="size-4 animate-spin" />}
                            Sektörü Oluştur
                        </RxButton>
                    </>
                }
            >
                <SektorForm
                    ad={yeniAd} slug={yeniSlug} aciklama={yeniAciklama}
                    ikon={yeniIkon} renk={yeniRenk} yeniKayitlara={yeniKayitlara}
                    onAd={adDegisti} onSlug={setYeniSlug} onAciklama={setYeniAciklama}
                    onIkon={setYeniIkon} onRenk={setYeniRenk} onYeniKayitlara={setYeniKayitlara}
                />
            </RxModal>

            {/* ── Düzenleme Modal ── */}
            <RxModal
                open={duzenlemeModalAcik}
                onClose={() => setDuzenlemeModalAcik(false)}
                title="Sektörü Düzenle"
                className="max-w-[560px]"
                footer={
                    <>
                        {kayitHata && (
                            <p className="flex-1 text-xs text-destructive flex items-center gap-1.5">
                                <AlertCircle className="size-3.5" /> {kayitHata}
                            </p>
                        )}
                        <RxButton variant="ghost" size="sm" onClick={() => setDuzenlemeModalAcik(false)}>
                            Vazgeç
                        </RxButton>
                        <RxButton size="sm" onClick={sektorGuncelle} disabled={kayitIsleniyor}>
                            {kayitIsleniyor && <Loader2 className="size-4 animate-spin" />}
                            Güncelle
                        </RxButton>
                    </>
                }
            >
                <SektorForm
                    ad={duzenleAd} slug={duzenleSlug} aciklama={duzenleAciklama}
                    ikon={duzenleIkon} renk={duzenleRenk} yeniKayitlara={duzenleKayitlara}
                    onAd={setDuzenleAd} onSlug={setDuzenleSlug} onAciklama={setDuzenleAciklama}
                    onIkon={setDuzenleIkon} onRenk={setDuzenleRenk} onYeniKayitlara={setDuzenleKayitlara}
                    slugDuzenleme={false}
                />
            </RxModal>

            {/* ── Silme Onay Modalı ── */}
            <RxModal
                open={silmeModalAcik}
                onClose={() => { setSilmeModalAcik(false); setSilinecekSektor(null) }}
                title="Sektörü Sil"
                className="max-w-[440px]"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => { setSilmeModalAcik(false); setSilinecekSektor(null) }}>
                            Vazgeç
                        </RxButton>
                        <RxButton 
                            variant="danger" 
                            size="sm" 
                            onClick={sektorSil} 
                            disabled={silmeIsleniyor || (silinecekSektor?.business_count || 0) > 0}
                        >
                            {silmeIsleniyor && <Loader2 className="size-4 animate-spin mr-2" />}
                            Sektörü Sil
                        </RxButton>
                    </>
                }
            >
                <div className="flex flex-col gap-4 py-2">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                        <AlertTriangle className="size-10 text-destructive shrink-0" />
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-destructive">Dikkat: Bu işlem geri alınamaz!</span>
                            <span className="text-[13px] text-muted-foreground">
                                <strong>{silinecekSektor?.display_name}</strong> sektörünü kalıcı olarak silmek üzeresiniz.
                            </span>
                        </div>
                    </div>
                    
                    {silinecekSektor && silinecekSektor.business_count > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-amber-700">Silme Engellendi</span>
                                <span className="text-[12px] text-amber-700/80 leading-relaxed">
                                    Bu sektöre bağlı <strong>{silinecekSektor.business_count}</strong> işletme mevcut. 
                                    Veri kaybını önlemek için aktif işletmesi olan sektörler silinemez.
                                </span>
                            </div>
                        </div>
                    )}

                    {kayitHata && (
                        <p className="text-xs text-destructive bg-destructive/5 p-3 rounded-lg border border-destructive/10">
                            {kayitHata}
                        </p>
                    )}
                </div>
            </RxModal>

            {/* ── Varsayılan Özellik Drawer ── */}
            {drawerSektor && (
                <VarsayilanOzellikDrawer
                    sektor={drawerSektor}
                    ozellikler={ozellikler}
                    onClose={() => setDrawerSektor(null)}
                    onSaved={veriCek}
                />
            )}
        </div>
    )
}
