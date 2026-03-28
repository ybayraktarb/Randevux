"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    Loader2, Plus, Package, Pencil, Check, Star,
    ChevronDown, AlertCircle, Layers, X, TrendingUp, Crown,
    Sparkles, ToggleLeft, ToggleRight, Info, DollarSign,
    Target, Settings2, ShieldCheck, Zap, Filter, Trash2, CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import * as Sentry from "@sentry/nextjs"

import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"

// ─── Tipler ───────────────────────────────────────────────────────────────────
interface Sektor {
    id: string
    name: string
    display_name: string
    color: string
    icon: string
}

interface Ozellik {
    id: string
    key: string
    display_name: string
    description: string
}

interface Paket {
    id: string
    name: string
    description: string
    price_monthly: number
    price_yearly: number
    is_active: boolean
    is_featured: boolean
    sort_order: number
    module_id: string | null
    sektor_adi: string | null
    sektor_renk: string | null
    ozellik_ids: string[]
}

// ─── Özellik Kategorileri ─────────────────────────────────────────────────────
const OZELLIK_KATEGORILER: Record<string, { label: string; icon: any; keys: string[] }> = {
    temel: {
        label: "Temel İşlemler",
        icon: Settings2,
        keys: ["appointment_system", "service_management", "staff_management", "customer_management"],
    },
    finans: {
        label: "Finans & Stok",
        icon: DollarSign,
        keys: ["finance_management", "inventory_management", "online_payment"],
    },
    dijital: {
        label: "Dijital & AI",
        icon: Zap,
        keys: ["ai_assistant", "advanced_analytics", "online_booking", "sms_notifications"],
    },
}

function kategoriOzellikler(ozellikler: Ozellik[], kategoriKeys: string[]) {
    return ozellikler.filter((o) => kategoriKeys.includes(o.key))
}

function digerOzellikler(ozellikler: Ozellik[]) {
    const tumKeys = Object.values(OZELLIK_KATEGORILER).flatMap((k) => k.keys)
    return ozellikler.filter((o) => !tumKeys.includes(o.key))
}

// ─── Paket Form Modal ─────────────────────────────────────────────────────────
function PaketFormModal({
    acik,
    onKapat,
    onKaydet,
    sektorler,
    ozellikler,
    duzenlenecekPaket,
}: {
    acik: boolean
    onKapat: () => void
    onKaydet: () => void
    sektorler: Sektor[]
    ozellikler: Ozellik[]
    duzenlenecekPaket: Paket | null
}) {
    const supabase = createClient()

    const [ad, setAd] = useState("")
    const [aciklama, setAciklama] = useState("")
    const [aylik, setAylik] = useState("0")
    const [yillik, setYillik] = useState("0")
    const [sektorId, setSektorId] = useState<string | null>(null)
    const [onecikar, setOnecikar] = useState(false)
    const [seciliOzellikler, setSeciliOzellikler] = useState<string[]>([])
    const [isleniyor, setIsleniyor] = useState(false)
    const [adim, setAdim] = useState(1)
    const [hata, setHata] = useState("")
    const [acikKategori, setAcikKategori] = useState<string | null>("temel")

    useEffect(() => {
        if (acik) {
            setAdim(1)
            if (duzenlenecekPaket) {
                setAd(duzenlenecekPaket.name)
                setAciklama(duzenlenecekPaket.description || "")
                setAylik(duzenlenecekPaket.price_monthly.toString())
                setYillik(duzenlenecekPaket.price_yearly.toString())
                setSektorId(duzenlenecekPaket.module_id)
                setOnecikar(duzenlenecekPaket.is_featured)
                setSeciliOzellikler(duzenlenecekPaket.ozellik_ids)
            } else {
                setAd(""); setAciklama(""); setAylik("0"); setYillik("0")
                setSektorId(null); setOnecikar(false); setSeciliOzellikler([])
            }
            setHata(""); setAcikKategori("temel")
        }
    }, [acik, duzenlenecekPaket])

    const toggleOzellik = (id: string) =>
        setSeciliOzellikler((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        )

    async function kaydet() {
        if (!ad.trim()) { setHata("Paket adı zorunludur."); return }
        setIsleniyor(true); setHata("")
        try {
            const paketData = {
                name: ad.trim(),
                description: aciklama.trim(),
                price_monthly: parseFloat(aylik) || 0,
                price_yearly: parseFloat(yillik) || 0,
                module_id: sektorId || null,
                is_featured: onecikar,
                is_active: true,
            }

            let paketId = duzenlenecekPaket?.id
            if (duzenlenecekPaket) {
                const { error } = await supabase.from("packages").update(paketData).eq("id", paketId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from("packages").insert(paketData).select().single()
                if (error) throw error
                paketId = data.id
            }

            // Paket özelliklerini güncelle
            await supabase.from("package_features").delete().eq("package_id", paketId)
            if (seciliOzellikler.length > 0) {
                const { error } = await supabase.from("package_features").insert(
                    seciliOzellikler.map((fId) => ({ package_id: paketId, feature_id: fId }))
                )
                if (error) throw error
            }

            onKaydet()
            onKapat()
            toast.success("Paket başarıyla kaydedildi")
        } catch (e: any) {
            Sentry.captureException(e, { tags: { module: 'billing', action: 'kaydetPaket' } })
            setHata(e.message || "Bir hata oluştu.")
            toast.error("Paket kaydedilemedi", { description: e.message || "Bilinmeyen bir hata oluştu." })
        } finally {
            setIsleniyor(false)
        }
    }

    // Aktif sektörün rengi
    const aktifSektor = sektorler.find((s) => s.id === sektorId)

    const OzellikGrubu = ({ kategoriKey, label, icon: Icon, items }: { kategoriKey: string; label: string; icon: any; items: Ozellik[] }) => {
        if (items.length === 0) return null
        const acik = acikKategori === kategoriKey
        return (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm transition-all duration-200">
                <button
                    type="button"
                    onClick={() => setAcikKategori(acik ? null : kategoriKey)}
                    className={cn(
                        "flex w-full items-center justify-between px-4 py-3.5 transition-colors",
                        acik ? "bg-muted/40" : "bg-muted/10 hover:bg-muted/30"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className={cn("rounded-lg p-1.5", acik ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>
                            <Icon className="size-4" />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-[13px] font-bold text-foreground uppercase tracking-tight">{label}</span>
                            <span className="text-[11px] text-muted-foreground italic leading-none">
                                {items.filter((i) => seciliOzellikler.includes(i.id)).length} özellik aktif
                            </span>
                        </div>
                    </div>
                    <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-300", acik && "rotate-180")} />
                </button>
                {acik && (
                    <div className="divide-y divide-border/60 bg-card">
                        {items.map((o) => {
                            const aktif = seciliOzellikler.includes(o.id)
                            return (
                                <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => toggleOzellik(o.id)}
                                    className={cn(
                                        "flex w-full items-center gap-4 px-5 py-3 text-left transition-all duration-200 group",
                                        aktif ? "bg-primary/5 shadow-inner" : "hover:bg-muted/20"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-300",
                                        aktif ? "border-primary bg-primary text-white scale-110 shadow-lg" : "border-muted-foreground/30 bg-muted group-hover:border-primary/50"
                                    )}>
                                        {aktif && <Check className="size-3.5" strokeWidth={3} />}
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("text-sm font-semibold transition-colors", aktif ? "text-primary" : "text-foreground")}>
                                                {o.display_name}
                                            </span>
                                            {aktif && <Sparkles className="size-3 text-amber-500 animate-pulse" />}
                                        </div>
                                        {o.description && (
                                            <span className="text-[11px] text-muted-foreground line-clamp-1 italic">{o.description}</span>
                                        )}
                                    </div>
                                    <span className="shrink-0 font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded opacity-60">ID: {o.key}</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        )
    }

    return (
        <RxModal
            open={acik}
            onClose={onKapat}
            title={
                <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-2.5">
                        <div className="rounded-lg bg-primary/10 p-2 text-primary">
                            <Package className="size-5" />
                        </div>
                        <span className="truncate">{duzenlenecekPaket ? "Paketi Düzenle" : "Yeni Paket Oluştur"}</span>
                    </div>
                    {/* Adım Göstergesi */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                        <div className={cn("h-1.5 rounded-full transition-all duration-300", adim === 1 ? "w-8 bg-primary" : "w-2 bg-muted")} />
                        <div className={cn("h-1.5 rounded-full transition-all duration-300", adim === 2 ? "w-8 bg-primary" : "w-2 bg-muted")} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">ADIM {adim} / 2</span>
                    </div>
                </div>
            }
            className="max-w-[800px]"
            footer={
                <div className="flex w-full items-center justify-between bg-muted/30 px-6 py-4 rounded-b-xl border-t border-border">
                    <div>
                        {hata && (
                            <p className="text-xs text-danger flex items-center gap-1.5 font-medium italic">
                                <AlertCircle className="size-3.5" /> {hata}
                            </p>
                        )}
                        {!hata && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <ShieldCheck className="size-3.5 text-success" />
                                <span className="text-[11px] font-medium uppercase tracking-wider">{adim === 1 ? "Önce temel bilgileri doldurun" : "Tüm değişiklikler güvenli kaydedilir"}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {adim === 1 ? (
                            <>
                                <RxButton variant="secondary" size="sm" onClick={onKapat} className="h-9 px-5">Vazgeç</RxButton>
                                <RxButton size="sm" onClick={() => setAdim(2)} className="h-9 px-6 font-bold tracking-tight">
                                    Sonraki Adım
                                    <ChevronDown className="size-4 ml-2 -rotate-90" />
                                </RxButton>
                            </>
                        ) : (
                            <>
                                <RxButton variant="ghost" size="sm" onClick={() => setAdim(1)} className="h-9 px-4">
                                    <ChevronDown className="size-4 mr-2 rotate-90" />
                                    Geri
                                </RxButton>
                                <RxButton size="sm" onClick={kaydet} disabled={isleniyor} className="h-9 px-6 font-bold tracking-tight bg-primary shadow-lg shadow-primary/20">
                                    {isleniyor ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                                    {duzenlenecekPaket ? "Paketi Güncelle" : "Hemen Oluştur"}
                                </RxButton>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-6 py-2 animate-in fade-in slide-in-from-bottom-2 duration-500 max-h-[min(620px,72vh)] overflow-y-auto pr-3 custom-scrollbar overflow-x-hidden">
                {adim === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in slide-in-from-left-4 duration-500 p-2">
                        {/* Sol Sütun: Kimlik */}
                        <section className="flex flex-col gap-5">
                            <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                                <Info className="size-4 text-primary" />
                                <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">1. Kimlik Bilgileri</h4>
                            </div>
                            <div className="space-y-5">
                                <RxInput 
                                    label="Paket Adı" 
                                    value={ad} 
                                    onChange={(e) => setAd(e.target.value)} 
                                    placeholder="Örn: Profesyonel Çözüm" 
                                    className="bg-card shadow-sm focus:ring-2 focus:ring-primary/20 h-11"
                                />
                                <RxTextarea 
                                    label="Görünür Açıklama" 
                                    value={aciklama} 
                                    onChange={(e) => setAciklama(e.target.value)}
                                    placeholder="Bu paketin sunduğu en büyük avantajları kısaca yazın..." 
                                    className="min-h-[120px] bg-card shadow-sm resize-none italic text-sm" 
                                />
                            </div>
                        </section>

                        {/* Sağ Sütun: Fiyatlandırma & Durum */}
                        <section className="flex flex-col gap-5">
                            <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                                <DollarSign className="size-4 text-success" />
                                <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">2. Satış & Öne Çıkarma</h4>
                            </div>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="relative group">
                                        <RxInput 
                                            label="Aylık Abonelik" 
                                            type="number" 
                                            value={aylik} 
                                            onChange={(e) => setAylik(e.target.value)} 
                                            className="pl-8 font-bold"
                                        />
                                        <span className="absolute left-3 top-[36px] text-muted-foreground font-bold group-focus-within:text-primary transition-colors">₺</span>
                                    </div>
                                    <div className="relative group">
                                        <RxInput 
                                            label="Yıllık Abonelik (Peşin)" 
                                            type="number" 
                                            value={yillik} 
                                            onChange={(e) => setYillik(e.target.value)} 
                                            className="pl-8 font-bold border-success/30 focus:border-success"
                                        />
                                        <span className="absolute left-3 top-[36px] text-muted-foreground font-bold group-focus-within:text-success transition-colors">₺</span>
                                    </div>
                                </div>

                                <div 
                                    className={cn(
                                        "flex items-center justify-between cursor-pointer rounded-2xl border-2 p-4 mt-2 transition-all duration-300 group relative overflow-hidden",
                                        onecikar 
                                            ? "border-amber-400 bg-amber-500/5 shadow-sm ring-2 ring-amber-400/10" 
                                            : "border-border bg-muted/20 hover:border-muted-foreground/30"
                                    )}
                                    onClick={() => setOnecikar(!onecikar)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex size-9 items-center justify-center rounded-lg transition-all duration-300",
                                            onecikar ? "bg-amber-400 text-white shadow-md scale-105" : "bg-muted text-muted-foreground"
                                        )}>
                                            <Crown className={cn("size-4", onecikar && "animate-pulse")} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={cn("text-[11px] font-bold uppercase", onecikar ? "text-amber-700 font-black" : "text-foreground")}>
                                                Öne Çıkan Paket
                                            </span>
                                            <span className="text-[9px] text-muted-foreground italic truncate">Arama sonuçlarında üstte görünür.</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "relative inline-flex h-4 w-8 shrink-0 rounded-full transition-colors duration-300",
                                        onecikar ? "bg-amber-500" : "bg-muted-foreground/30"
                                    )}>
                                        <span className={cn(
                                            "inline-block size-3 transform rounded-full bg-white transition-transform duration-300",
                                            onecikar ? "translate-x-4" : "translate-x-1"
                                        )} style={{ marginTop: "2px" }} />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {adim === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-12 animate-in slide-in-from-right-4 duration-500 p-2">
                        {/* Sol Sütun: Sektörler */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 px-1 border-b border-border/50 pb-2 mb-1">
                                <Target className="size-4 text-primary" />
                                <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Sektör Seçimi</h4>
                            </div>
                            <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                <button
                                    type="button"
                                    onClick={() => setSektorId(null)}
                                    className={cn(
                                        "flex items-center gap-3 w-full rounded-xl border-2 p-3 text-[12px] font-bold transition-all duration-200",
                                        !sektorId
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                    )}
                                >
                                    <div className={cn("size-2 rounded-full", !sektorId ? "bg-primary animate-pulse" : "bg-muted")} />
                                    Tüm Sektörler
                                </button>
                                {sektorler.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => setSektorId(s.id)}
                                        className={cn(
                                            "flex items-center gap-3 w-full rounded-xl border-2 p-3 text-[12px] font-bold transition-all duration-200",
                                            sektorId === s.id
                                                ? "border-transparent text-white"
                                                : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                        )}
                                        style={sektorId === s.id ? { backgroundColor: s.color } : {}}
                                    >
                                        <div className={cn("size-2 rounded-full", sektorId === s.id ? "bg-white animate-pulse" : "bg-muted")} />
                                        {s.display_name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Sağ Sütun: Özellikler */}
                        <section className="flex flex-col gap-4">
                            <div className="flex items-center justify-between px-1 border-b border-border/50 pb-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <Layers className="size-4 text-primary" />
                                    <h4 className="text-[12px] font-bold text-foreground uppercase tracking-widest">Özellik Havuzu</h4>
                                </div>
                                <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                                    <span className="text-[10px] font-black text-primary uppercase">{seciliOzellikler.length} Seçili</span>
                                </div>
                            </div>
                            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {Object.entries(OZELLIK_KATEGORILER).map(([key, { label, icon, keys }]) => (
                                    <OzellikGrubu
                                        key={key}
                                        kategoriKey={key}
                                        label={label}
                                        icon={icon}
                                        items={kategoriOzellikler(ozellikler, keys)}
                                    />
                                ))}
                                {digerOzellikler(ozellikler).length > 0 && (
                                    <OzellikGrubu
                                        kategoriKey="diger"
                                        label="Digerleri"
                                        icon={Settings2}
                                        items={digerOzellikler(ozellikler)}
                                    />
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </RxModal>
    )
}

// ─── Paket Kartı ──────────────────────────────────────────────────────────────
function PaketKarti({
    paket,
    ozellikler,
    onDuzenle,
    onDurumDegistir,
}: {
    paket: Paket
    ozellikler: Ozellik[]
    onDuzenle: (p: Paket) => void
    onDurumDegistir: (p: Paket) => void
}) {
    const yuzdeindirim =
        paket.price_monthly > 0 && paket.price_yearly > 0
            ? Math.round((1 - paket.price_yearly / (paket.price_monthly * 12)) * 100)
            : 0

    return (
        <div className={cn(
            "group relative flex flex-col rounded-[24px] border-2 bg-card shadow-sm transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:-translate-y-1.5 overflow-hidden",
            paket.is_featured ? "border-amber-400 ring-4 ring-amber-400/5" : "border-border/60 hover:border-primary/30",
            !paket.is_active && "opacity-60 grayscale-[0.5]"
        )}>
            {/* Üst Vurgu Çizgisi */}
            <div className="absolute top-0 left-0 w-full h-1.5 opacity-80" style={{ backgroundColor: paket.sektor_renk || "var(--primary)" }} />

            {/* Öne Çıkan Rozeti */}
            {paket.is_featured && (
                <div className="absolute top-5 right-5 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-[10px] font-black text-white shadow-lg animate-in zoom-in duration-500">
                    <Star className="size-3 fill-white" />
                    <span>EN POPÜLER</span>
                </div>
            )}

            <div className="flex flex-col p-7">
                {/* Başlık ve İkon */}
                <div className="mb-6 flex items-center gap-4">
                    <div className={cn(
                        "flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-inner transition-transform duration-500 group-hover:rotate-6",
                        paket.is_featured ? "bg-amber-100 text-amber-600" : "bg-primary/10 text-primary"
                    )}>
                        {paket.is_featured ? <Crown className="size-7" /> : <Package className="size-7" />}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h3 className="text-lg font-black text-foreground tracking-tight leading-none group-hover:text-primary transition-colors">
                            {paket.name}
                        </h3>
                        {paket.sektor_adi ? (
                            <span
                                className="inline-flex w-fit items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest mt-1"
                                style={{
                                    backgroundColor: (paket.sektor_renk || "#6366f1") + "15",
                                    color: paket.sektor_renk || "#6366f1",
                                }}
                            >
                                <Target className="size-2.5" />
                                {paket.sektor_adi}
                            </span>
                        ) : (
                            <span className="inline-flex w-fit items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                                <Sparkles className="size-2.5 text-amber-500" />
                                Global Sürüm
                            </span>
                        )}
                    </div>
                </div>

                <p className="mb-8 text-sm text-muted-foreground leading-relaxed italic line-clamp-2 min-h-[40px]">
                    "{paket.description || "Bu paket için henüz bir açıklama girilmemiş."}"
                </p>

                {/* Fiyat Tasarımı (SaaS Style) */}
                <div className="mb-8 p-6 rounded-2xl bg-muted/20 border border-border/40 relative overflow-hidden group/price">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/price:opacity-100 transition-opacity" />
                    <div className="flex flex-col gap-5 relative">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Aylık Plan</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-foreground tracking-tighter">₺{paket.price_monthly}</span>
                                <span className="text-sm font-medium text-muted-foreground">/ay</span>
                            </div>
                        </div>
                        <div className="flex flex-col pt-4 border-t border-border/40">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Yıllık Plan</span>
                                {yuzdeindirim > 0 && (
                                    <span className="bg-success/15 text-success text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse tracking-wide">
                                        %{yuzdeindirim} TASARRUF
                                    </span>
                                )}
                            </div>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-2xl font-bold text-foreground">₺{paket.price_yearly}</span>
                                <span className="text-xs font-medium text-muted-foreground">/yıl (peşin)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Özellikler (Pills) */}
                <div className="mb-8 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border/60" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] px-2 whitespace-nowrap">
                            Kilit Özellikler
                        </span>
                        <div className="h-px flex-1 bg-border/60" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {paket.ozellik_ids.length > 0 ? (
                            paket.ozellik_ids.slice(0, 6).map((fId) => {
                                const f = ozellikler.find((o) => o.id === fId)
                                return (
                                    <span key={fId}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-2.5 py-1.5 text-[11px] font-bold text-foreground shadow-sm transition-all hover:scale-105 hover:border-primary/30">
                                        <Check className="size-3 text-success" strokeWidth={3} />
                                        {f?.display_name || "?"}
                                    </span>
                                )
                            })
                        ) : (
                            <div className="w-full py-4 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl">
                                <AlertCircle className="size-4 text-muted-foreground/30 mb-1" />
                                <span className="text-[10px] italic text-muted-foreground">Henüz özellik tanımlanmamış</span>
                            </div>
                        )}
                        {paket.ozellik_ids.length > 6 && (
                            <span className="inline-flex items-center rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1.5 text-[11px] font-black text-primary italic">
                                +{paket.ozellik_ids.length - 6} DİĞER...
                            </span>
                        )}
                    </div>
                </div>

                {/* Aksiyon Barı */}
                <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-6">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onDurumDegistir(paket)}
                            className={cn(
                                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-all duration-300 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                                paket.is_active ? "bg-success shadow-[0_0_12px_rgba(34,197,94,0.3)]" : "bg-muted-foreground/30"
                            )}
                            role="switch"
                            aria-checked={paket.is_active}
                        >
                            <span className={cn(
                                "pointer-events-none block size-5 transform rounded-full bg-white shadow-xl ring-0 transition-transform duration-300",
                                paket.is_active ? "translate-x-5" : "translate-x-0.5"
                            )} style={{ marginTop: "2px" }} />
                        </button>
                        <span className={cn("text-[11px] font-black uppercase tracking-widest", paket.is_active ? "text-success" : "text-muted-foreground")}>
                            {paket.is_active ? "AKTİF" : "PASİF"}
                        </span>
                    </div>
                    
                    <RxButton
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuzenle(paket)}
                        className="h-9 px-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/5 text-primary font-bold transition-all active:scale-95"
                    >
                        <Pencil className="size-3.5 mr-2" />
                        DÜZENLE
                    </RxButton>
                </div>
            </div>
        </div>
    )
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function PackagesTab() {
    const supabase = createClient()
    const [paketler, setPaketler] = useState<Paket[]>([])
    const [ozellikler, setOzellikler] = useState<Ozellik[]>([])
    const [sektorler, setSektorler] = useState<Sektor[]>([])
    const [yukleniyor, setYukleniyor] = useState(true)

    const [aktifSektorTab, setAktifSektorTab] = useState<string | null>("hepsi")
    const [modalAcik, setModalAcik] = useState(false)
    const [duzenlenecek, setDuzenlenecek] = useState<Paket | null>(null)

    const veriCek = useCallback(async () => {
        setYukleniyor(true)
        const [pkgRes, featRes, pfRes, secRes] = await Promise.all([
            supabase.from("packages").select("*, sector:modules(id, display_name, color)").order("sort_order", { ascending: true }),
            supabase.from("features").select("*").order("display_name"),
            supabase.from("package_features").select("*"),
            supabase.from("modules").select("id, name, display_name, color, icon").eq("is_active", true).order("display_name"),
        ])

        if (pkgRes.data && featRes.data) {
            const mapped: Paket[] = pkgRes.data.map((p: any) => {
                const sek = Array.isArray(p.sector) ? p.sector[0] : p.sector
                return {
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    price_monthly: p.price_monthly || 0,
                    price_yearly: p.price_yearly || 0,
                    is_active: p.is_active,
                    is_featured: p.is_featured || false,
                    sort_order: p.sort_order || 0,
                    module_id: p.module_id || p.sector_id || null, // fallback for legacy
                    sektor_adi: sek?.display_name || null,
                    sektor_renk: sek?.color || null,
                    ozellik_ids: pfRes.data?.filter((pf) => pf.package_id === p.id).map((pf) => pf.feature_id) || [],
                }
            })
            setPaketler(mapped)
            setOzellikler(featRes.data)
        }
        if (secRes.data) setSektorler(secRes.data)
        setYukleniyor(false)
    }, [supabase])

    useEffect(() => { veriCek() }, [veriCek])

    async function durumDegistir(paket: Paket) {
        await supabase.from("packages").update({ is_active: !paket.is_active }).eq("id", paket.id)
        veriCek()
    }

    function duzenleAc(paket: Paket) {
        setDuzenlenecek(paket)
        setModalAcik(true)
    }

    function yeniPaketAc() {
        setDuzenlenecek(null)
        setModalAcik(true)
    }

    function modal_kapat() {
        setModalAcik(false)
        setDuzenlenecek(null)
    }

    // Filtreli paketler
    const filtrePaketler = paketler.filter((p) => {
        if (aktifSektorTab === "hepsi") return true
        if (aktifSektorTab === "genel") return !p.module_id
        return p.module_id === aktifSektorTab
    })

    // Sektör bazlı istatistikler
    const sektorStats = (sId: string | null) => {
        const list = sId ? paketler.filter((p) => p.module_id === sId) : paketler.filter((p) => !p.module_id)
        return { paket_sayi: list.length, aktif: list.filter((p) => p.is_active).length }
    }

    if (yukleniyor) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-8 animate-in fade-in duration-700">
            {/* ── Başlık ── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-6 rounded-[24px] border border-border/60 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Layers className="size-7" />
                    </div>
                    <div>
                        <h2 className="text-[24px] font-black text-foreground tracking-tight leading-none">Paket Yönetimi</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                {paketler.length} Toplam Paket Tanımlı
                            </span>
                            <span className="size-1 rounded-full bg-muted-foreground/30" />
                            <span className="text-[11px] font-bold text-success uppercase italic">
                                {paketler.filter(p => p.is_active).length} Aktif Satışta
                            </span>
                        </div>
                    </div>
                </div>
                <RxButton size="sm" onClick={yeniPaketAc} className="h-11 px-6 rounded-xl font-bold tracking-tight shadow-lg shadow-primary/20">
                    <Plus className="size-5 mr-2" />
                    Yeni Paket Oluştur
                </RxButton>
            </div>

            {/* ── Sektör Sekmeleri (Businesses Style) ── */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 px-1">
                    <Filter className="size-4 text-primary" />
                    <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">Sektör Filtreleme</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                    {/* Hepsi */}
                    <button
                        type="button"
                        onClick={() => setAktifSektorTab("hepsi")}
                        className={cn(
                            "group flex items-center gap-2.5 rounded-xl border-2 px-5 py-2.5 text-[13px] font-bold transition-all duration-300",
                            aktifSektorTab === "hepsi"
                                ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                    >
                        <Layers className="size-4 group-hover:rotate-12 transition-transform" />
                        Tüm Katalog
                        <span className={cn(
                            "ml-1 flex size-5 items-center justify-center rounded-lg text-[10px] font-black",
                            aktifSektorTab === "hepsi" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                        )}>
                            {paketler.length}
                        </span>
                    </button>

                    {/* Genel */}
                    <button
                        type="button"
                        onClick={() => setAktifSektorTab("genel")}
                        className={cn(
                            "group flex items-center gap-2.5 rounded-xl border-2 px-5 py-2.5 text-[13px] font-bold transition-all duration-300",
                            aktifSektorTab === "genel"
                                ? "border-primary bg-primary/10 text-primary shadow-sm"
                                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                    >
                        <Sparkles className="size-4 text-amber-500" />
                        Genel Paketler
                        <span className={cn(
                            "ml-1 flex size-5 items-center justify-center rounded-lg text-[10px] font-black",
                            aktifSektorTab === "genel" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                            {sektorStats(null).paket_sayi}
                        </span>
                    </button>

                    {/* Sektöre Özel Sekmeler */}
                    {sektorler.map((s) => {
                        const stats = sektorStats(s.id)
                        const aktif = aktifSektorTab === s.id
                        return (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setAktifSektorTab(s.id)}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-xl border-2 px-5 py-2.5 text-[13px] font-bold transition-all duration-300 shadow-sm",
                                    aktif ? "border-transparent text-white scale-105" : "border-border bg-card text-muted-foreground hover:border-primary/40"
                                )}
                                style={aktif ? { backgroundColor: s.color, boxShadow: `0 4px 12px ${s.color}40` } : {}}
                            >
                                {s.display_name}
                                <span className={cn(
                                    "ml-1 flex size-5 items-center justify-center rounded-lg text-[10px] font-black",
                                    aktif ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {stats.paket_sayi}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Paket Grid ── */}
            {filtrePaketler.length > 0 ? (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {/* Öne Çıkanlar önce */}
                    {[...filtrePaketler]
                        .sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || a.sort_order - b.sort_order)
                        .map((p) => (
                            <PaketKarti
                                key={p.id}
                                paket={p}
                                ozellikler={ozellikler}
                                onDuzenle={duzenleAc}
                                onDurumDegistir={durumDegistir}
                            />
                        ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center gap-6 rounded-[32px] border-2 border-dashed border-border/60 bg-muted/5 py-24 text-center">
                    <div className="relative">
                        <div className="absolute -inset-4 rounded-full bg-primary/5 animate-ping" />
                        <div className="relative rounded-full bg-muted/50 p-6">
                            <Package className="size-16 text-muted-foreground/30" />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 max-w-sm">
                        <h4 className="text-xl font-black text-foreground tracking-tight">
                            {aktifSektorTab === "hepsi" ? "Katalog Boş Grünüyor" : "Bu Sektörde Paket Bulunamadı"}
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium px-4">
                            İşletmelere sunmak istediğiniz hizmet ve fiyatlandırma paketlerini buradan oluşturmaya başlayabilirsiniz.
                        </p>
                    </div>
                    <RxButton size="sm" onClick={yeniPaketAc} className="rounded-xl px-8 h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                        <Plus className="size-5 mr-2" />
                        İlk Paketi Hemen Oluştur
                    </RxButton>
                </div>
            )}

            {/* ── Paket Form Modal ── */}
            <PaketFormModal
                acik={modalAcik}
                onKapat={modal_kapat}
                onKaydet={veriCek}
                sektorler={sektorler}
                ozellikler={ozellikler}
                duzenlenecekPaket={duzenlenecek}
            />
        </div>
    )
}
