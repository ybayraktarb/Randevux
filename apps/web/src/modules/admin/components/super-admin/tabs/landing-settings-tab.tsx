"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
    Loader2, Save, Globe, Eye, ChevronDown, ChevronRight,
    AlertCircle, CheckCircle2, ImageIcon, Plus, Trash2,
    Star, Mail, Phone, MapPin, Layers, Info, Package,
    LayoutTemplate, Calendar, Users, BarChart3, Bell,
    Shield, Smartphone, Clock, Zap, GlobeIcon, RefreshCw,
} from "lucide-react"
import { toast } from "sonner"

import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"

import { HeroSection } from "@/src/modules/landing/components/hero-section"
import { FeaturesSection } from "@/src/modules/landing/components/features-section"
import { PricingSection } from "@/src/modules/landing/components/pricing-section"
import { AboutSection } from "@/src/modules/landing/components/about-section"
import { ContactSection } from "@/src/modules/landing/components/contact-section"

import {
    getLandingSettingsAction,
    getLandingPackagesAction,
    updateLandingSettingsAction,
} from "@/src/modules/admin/actions/landing.actions"
import { landingPageFallback } from "@/src/modules/landing/lib/landing-constants"
import type { LandingPageProps, FeatureProps, PackageProps } from "@/src/modules/landing/lib/types"

// ─── İkon Seçenekleri ────────────────────────────────────────────────────────
const ICON_OPTIONS = [
    { key: "calendar", label: "Takvim", Icon: Calendar },
    { key: "users", label: "Kullanıcılar", Icon: Users },
    { key: "bar-chart", label: "Grafik", Icon: BarChart3 },
    { key: "bell", label: "Bildirim", Icon: Bell },
    { key: "shield", label: "Güvenlik", Icon: Shield },
    { key: "smartphone", label: "Mobil", Icon: Smartphone },
    { key: "clock", label: "Saat", Icon: Clock },
    { key: "zap", label: "Hız", Icon: Zap },
    { key: "globe", label: "Küresel", Icon: GlobeIcon },
]

// ─── Accordion Bölümü ────────────────────────────────────────────────────────
function AccordionSection({
    sectionKey,
    label,
    icon: Icon,
    isOpen,
    onToggle,
    children,
}: {
    sectionKey: string
    label: string
    icon: any
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <button
                type="button"
                onClick={onToggle}
                className={cn(
                    "flex w-full items-center justify-between px-5 py-4 transition-colors",
                    isOpen ? "bg-primary/5 text-primary" : "bg-card hover:bg-muted/30 text-foreground"
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-1.5", isOpen ? "bg-primary/10" : "bg-muted/50")}>
                        <Icon className="size-4" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
                </div>
                <ChevronDown className={cn("size-4 transition-transform duration-300", isOpen && "rotate-180")} />
            </button>
            {isOpen && (
                <div className="p-5 flex flex-col gap-4 bg-card border-t border-border animate-in fade-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    )
}

// ─── Feature Kartı Editörü ───────────────────────────────────────────────────
function FeatureCardEditor({
    feature,
    index,
    onChange,
    onRemove,
}: {
    feature: FeatureProps
    index: number
    onChange: (f: FeatureProps) => void
    onRemove: () => void
}) {
    const selectedIcon = ICON_OPTIONS.find((i) => i.key === feature.icon)
    const SelectedIconComp = selectedIcon?.Icon || Calendar
    const [showIconPicker, setShowIconPicker] = useState(false)

    return (
        <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kart {index + 1}</span>
                <button
                    type="button"
                    onClick={onRemove}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors"
                >
                    <Trash2 className="size-3.5" />
                </button>
            </div>
            {/* İkon seçici */}
            <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">İkon</span>
                <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors"
                >
                    <SelectedIconComp className="size-4 text-primary" />
                    <span>{selectedIcon?.label || "Seç"}</span>
                    <ChevronRight className={cn("size-4 ml-auto text-muted-foreground transition-transform", showIconPicker && "rotate-90")} />
                </button>
                {showIconPicker && (
                    <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-2">
                        {ICON_OPTIONS.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => { onChange({ ...feature, icon: key }); setShowIconPicker(false) }}
                                className={cn(
                                    "flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all",
                                    feature.icon === key
                                        ? "bg-primary/10 text-primary border border-primary/30"
                                        : "hover:bg-muted/50 text-muted-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <RxInput
                label="Başlık"
                value={feature.title}
                onChange={(e) => onChange({ ...feature, title: e.target.value })}
                placeholder="Özellik adı"
            />
            <RxTextarea
                label="Açıklama"
                value={feature.description}
                onChange={(e) => onChange({ ...feature, description: e.target.value })}
                placeholder="Kısa açıklama..."
                className="min-h-[80px]"
            />
        </div>
    )
}

// ─── Canlı Önizleme Paneli ───────────────────────────────────────────────────
const PREVIEW_CONTENT_WIDTH = 1280

function LivePreviewPanel({
    draft,
    packages,
}: {
    draft: LandingPageProps
    packages: PackageProps[]
}) {
    const outerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0.4)
    const [innerHeight, setInnerHeight] = useState(3000)

    useEffect(() => {
        const updateScale = () => {
            if (outerRef.current) {
                const w = outerRef.current.offsetWidth
                setScale(w / PREVIEW_CONTENT_WIDTH)
            }
        }
        updateScale()
        const ro = new ResizeObserver(updateScale)
        if (outerRef.current) ro.observe(outerRef.current)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (innerRef.current) {
            const ro = new ResizeObserver((entries) => {
                setInnerHeight(entries[0].contentRect.height)
            })
            ro.observe(innerRef.current)
            return () => ro.disconnect()
        }
    }, [])

    const outerHeight = Math.ceil(innerHeight * scale)

    return (
        <div
            ref={outerRef}
            className="relative overflow-hidden rounded-xl border border-border bg-background shadow-inner"
            style={{ height: `${outerHeight}px`, minHeight: "400px" }}
        >
            <div
                ref={innerRef}
                style={{
                    width: `${PREVIEW_CONTENT_WIDTH}px`,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    pointerEvents: "none",
                    userSelect: "none",
                }}
            >
                <HeroSection hero={draft.hero} />
                <FeaturesSection features={draft.features} />
                <PricingSection packages={packages} />
                <AboutSection about={draft.about} />
                <ContactSection contact={draft.contact} />
            </div>
        </div>
    )
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export function LandingSettingsTab() {
    const [draft, setDraft] = useState<LandingPageProps>(landingPageFallback)
    const [packages, setPackages] = useState<PackageProps[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [openSection, setOpenSection] = useState<string>("hero")

    // ── Veri Çekme ──────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        const [settingsRes, packagesRes] = await Promise.all([
            getLandingSettingsAction(),
            getLandingPackagesAction(),
        ])

        if (settingsRes.success && settingsRes.data) {
            const s = settingsRes.data
            setDraft({
                hero: {
                    title: s.hero_title,
                    subtitle: s.hero_subtitle,
                    imageUrl: s.hero_image_url || landingPageFallback.hero.imageUrl,
                    ctaText: s.hero_cta_text,
                },
                features: (s.features_json as FeatureProps[]) || landingPageFallback.features,
                packages: packagesRes.data || [],
                about: {
                    title: s.about_title,
                    subtitle: s.about_subtitle,
                    vision: { title: s.about_vision_title, description: s.about_vision_description },
                    mission: { title: s.about_mission_title, description: s.about_mission_description },
                    story: s.about_story,
                    imageUrl: s.about_image_url || landingPageFallback.about.imageUrl,
                },
                contact: {
                    title: s.contact_title,
                    subtitle: s.contact_subtitle,
                    info: {
                        email: s.contact_email || "",
                        phone: s.contact_phone || "",
                        address: s.contact_address || "",
                    },
                    formLabels: s.contact_form_labels,
                },
            })
        } else {
            toast.error("Landing ayarları yüklenemedi", { description: settingsRes.error })
        }

        if (packagesRes.success && packagesRes.data) {
            setPackages(packagesRes.data)
        }

        setLoading(false)
        setHasChanges(false)
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Güncelleme Helper'ları ───────────────────────────────────────────────
    function updateHero(key: keyof LandingPageProps["hero"], value: string) {
        setDraft((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }))
        setHasChanges(true)
    }

    function updateAbout(key: keyof LandingPageProps["about"], value: any) {
        setDraft((prev) => ({ ...prev, about: { ...prev.about, [key]: value } }))
        setHasChanges(true)
    }

    function updateContact(key: keyof LandingPageProps["contact"], value: any) {
        setDraft((prev) => ({ ...prev, contact: { ...prev.contact, [key]: value } }))
        setHasChanges(true)
    }

    function updateFeatureCard(index: number, f: FeatureProps) {
        setDraft((prev) => {
            const updated = [...prev.features]
            updated[index] = f
            return { ...prev, features: updated }
        })
        setHasChanges(true)
    }

    function addFeatureCard() {
        setDraft((prev) => ({
            ...prev,
            features: [
                ...prev.features,
                { icon: "calendar", title: "Yeni Özellik", description: "Açıklama..." },
            ],
        }))
        setHasChanges(true)
    }

    function removeFeatureCard(index: number) {
        setDraft((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }))
        setHasChanges(true)
    }

    // ── Kaydet ──────────────────────────────────────────────────────────────
    async function handleSave() {
        setSaving(true)
        const res = await updateLandingSettingsAction(draft)
        if (res.success) {
            toast.success("Değişiklikler kaydedildi", {
                description: "Landing sayfası güncellendi ve yayınlandı.",
                icon: <CheckCircle2 className="size-4 text-success" />,
            })
            setHasChanges(false)
        } else {
            toast.error("Kayıt başarısız", { description: res.error })
        }
        setSaving(false)
    }

    const toggleSection = (key: string) =>
        setOpenSection((prev) => (prev === key ? "" : key))

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary/40" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* ── Başlık ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Globe className="size-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground tracking-tight">Landing Sayfası</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Değişiklikler önizlemede anında yansır. Kaydet butonuyla yayına alınır.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <RxButton variant="ghost" size="sm" onClick={fetchData} disabled={loading} title="Yenile">
                        <RefreshCw className="size-4" />
                    </RxButton>
                    <RxButton
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={cn(
                            "h-10 px-5 font-bold transition-all",
                            hasChanges
                                ? "bg-primary shadow-lg shadow-primary/20"
                                : "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                        {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </RxButton>
                </div>
            </div>

            {hasChanges && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-amber-700">
                    <AlertCircle className="size-4 shrink-0" />
                    <span className="text-sm font-medium">Kaydedilmemiş değişiklikler var. Kaydet butonunu kullanarak yayınlayabilirsiniz.</span>
                </div>
            )}

            {/* ── 2 Sütun Layout ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-[480px_1fr] gap-6 items-start">

                {/* ── Sol: Editör ─────────────────────────────────────────── */}
                <div className="flex flex-col gap-3 xl:sticky xl:top-4 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto xl:pr-1 custom-scrollbar">

                    {/* Hero */}
                    <AccordionSection
                        sectionKey="hero"
                        label="Hero Bölümü"
                        icon={LayoutTemplate}
                        isOpen={openSection === "hero"}
                        onToggle={() => toggleSection("hero")}
                    >
                        <RxInput
                            label="Ana Başlık"
                            value={draft.hero.title}
                            onChange={(e) => updateHero("title", e.target.value)}
                            placeholder="Ana başlık..."
                        />
                        <RxTextarea
                            label="Alt Başlık"
                            value={draft.hero.subtitle}
                            onChange={(e) => updateHero("subtitle", e.target.value)}
                            placeholder="Alt başlık metni..."
                            className="min-h-[100px]"
                        />
                        <RxInput
                            label="CTA Butonu Metni"
                            value={draft.hero.ctaText}
                            onChange={(e) => updateHero("ctaText", e.target.value)}
                            placeholder="Hemen Başla"
                        />
                        <div className="flex flex-col gap-1.5">
                            <RxInput
                                label="Görsel URL"
                                value={draft.hero.imageUrl}
                                onChange={(e) => updateHero("imageUrl", e.target.value)}
                                placeholder="https://..."
                                icon={<ImageIcon className="size-4" />}
                            />
                            {draft.hero.imageUrl && (
                                <img
                                    src={draft.hero.imageUrl}
                                    alt="Hero önizleme"
                                    className="mt-1 h-24 w-full rounded-lg object-cover border border-border"
                                    onError={(e) => {
                                        ;(e.target as HTMLImageElement).style.display = "none"
                                    }}
                                />
                            )}
                        </div>
                    </AccordionSection>

                    {/* Özellikler */}
                    <AccordionSection
                        sectionKey="features"
                        label="Özellik Kartları"
                        icon={Layers}
                        isOpen={openSection === "features"}
                        onToggle={() => toggleSection("features")}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                                {draft.features.length} kart tanımlı
                            </span>
                            <RxButton variant="ghost" size="sm" onClick={addFeatureCard}>
                                <Plus className="size-4 mr-1" /> Kart Ekle
                            </RxButton>
                        </div>
                        {draft.features.map((f, i) => (
                            <FeatureCardEditor
                                key={i}
                                feature={f}
                                index={i}
                                onChange={(updated) => updateFeatureCard(i, updated)}
                                onRemove={() => removeFeatureCard(i)}
                            />
                        ))}
                        {draft.features.length === 0 && (
                            <div className="rounded-xl border-2 border-dashed border-border py-8 text-center">
                                <Layers className="size-6 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-xs text-muted-foreground">Henüz kart yok. Ekle butonuyla başlayın.</p>
                            </div>
                        )}
                    </AccordionSection>

                    {/* Fiyatlandırma Bilgisi */}
                    <AccordionSection
                        sectionKey="pricing"
                        label="Fiyatlandırma"
                        icon={Package}
                        isOpen={openSection === "pricing"}
                        onToggle={() => toggleSection("pricing")}
                    >
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
                            <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-700">Paketler ayrı yönetilir</p>
                                <p className="text-xs text-blue-600 mt-0.5">
                                    Landing page'deki fiyatlandırma kartları doğrudan "Paket Yönetimi" sekmesinden besleniyor.
                                    Paket eklemek veya düzenlemek için sol menüdeki <strong>Paket Yönetimi</strong> sekmesini kullanın.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            {packages.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic">Aktif paket bulunamadı.</p>
                            ) : (
                                packages.map((p) => (
                                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className={cn("size-2 rounded-full", p.is_featured ? "bg-amber-400" : "bg-success")} />
                                            <span className="text-sm font-semibold text-foreground">{p.name}</span>
                                            {p.is_featured && (
                                                <Star className="size-3 text-amber-400 fill-amber-400" />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-primary">₺{p.price_monthly}/ay</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </AccordionSection>

                    {/* Hakkımızda */}
                    <AccordionSection
                        sectionKey="about"
                        label="Hakkımızda"
                        icon={Star}
                        isOpen={openSection === "about"}
                        onToggle={() => toggleSection("about")}
                    >
                        <RxInput
                            label="Bölüm Başlığı"
                            value={draft.about.title}
                            onChange={(e) => updateAbout("title", e.target.value)}
                        />
                        <RxTextarea
                            label="Bölüm Alt Başlık"
                            value={draft.about.subtitle}
                            onChange={(e) => updateAbout("subtitle", e.target.value)}
                            className="min-h-[80px]"
                        />
                        <div className="rounded-xl border border-border p-4 flex flex-col gap-3 bg-muted/20">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Vizyon</span>
                            <RxInput
                                label="Vizyon Başlığı"
                                value={draft.about.vision.title}
                                onChange={(e) =>
                                    updateAbout("vision", { ...draft.about.vision, title: e.target.value })
                                }
                            />
                            <RxTextarea
                                label="Vizyon Açıklaması"
                                value={draft.about.vision.description}
                                onChange={(e) =>
                                    updateAbout("vision", { ...draft.about.vision, description: e.target.value })
                                }
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="rounded-xl border border-border p-4 flex flex-col gap-3 bg-muted/20">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Misyon</span>
                            <RxInput
                                label="Misyon Başlığı"
                                value={draft.about.mission.title}
                                onChange={(e) =>
                                    updateAbout("mission", { ...draft.about.mission, title: e.target.value })
                                }
                            />
                            <RxTextarea
                                label="Misyon Açıklaması"
                                value={draft.about.mission.description}
                                onChange={(e) =>
                                    updateAbout("mission", { ...draft.about.mission, description: e.target.value })
                                }
                                className="min-h-[100px]"
                            />
                        </div>
                        <RxTextarea
                            label="Hikayemiz"
                            value={draft.about.story}
                            onChange={(e) => updateAbout("story", e.target.value)}
                            className="min-h-[120px]"
                        />
                        <div className="flex flex-col gap-1.5">
                            <RxInput
                                label="Görsel URL"
                                value={draft.about.imageUrl}
                                onChange={(e) => updateAbout("imageUrl", e.target.value)}
                                placeholder="https://..."
                                icon={<ImageIcon className="size-4" />}
                            />
                            {draft.about.imageUrl && (
                                <img
                                    src={draft.about.imageUrl}
                                    alt="About önizleme"
                                    className="mt-1 h-24 w-full rounded-lg object-cover border border-border"
                                    onError={(e) => { ; (e.target as HTMLImageElement).style.display = "none" }}
                                />
                            )}
                        </div>
                    </AccordionSection>

                    {/* İletişim */}
                    <AccordionSection
                        sectionKey="contact"
                        label="İletişim"
                        icon={Mail}
                        isOpen={openSection === "contact"}
                        onToggle={() => toggleSection("contact")}
                    >
                        <RxInput
                            label="Bölüm Başlığı"
                            value={draft.contact.title}
                            onChange={(e) => updateContact("title", e.target.value)}
                        />
                        <RxTextarea
                            label="Alt Başlık"
                            value={draft.contact.subtitle}
                            onChange={(e) => updateContact("subtitle", e.target.value)}
                            className="min-h-[80px]"
                        />
                        <div className="grid grid-cols-1 gap-3">
                            <RxInput
                                label="E-posta"
                                value={draft.contact.info.email}
                                onChange={(e) =>
                                    updateContact("info", { ...draft.contact.info, email: e.target.value })
                                }
                                icon={<Mail className="size-4" />}
                                placeholder="destek@randesk.com"
                            />
                            <RxInput
                                label="Telefon"
                                value={draft.contact.info.phone}
                                onChange={(e) =>
                                    updateContact("info", { ...draft.contact.info, phone: e.target.value })
                                }
                                icon={<Phone className="size-4" />}
                                placeholder="+90 212 555 0123"
                            />
                            <RxInput
                                label="Adres"
                                value={draft.contact.info.address}
                                onChange={(e) =>
                                    updateContact("info", { ...draft.contact.info, address: e.target.value })
                                }
                                icon={<MapPin className="size-4" />}
                                placeholder="Şehir / İlçe"
                            />
                        </div>
                        <div className="rounded-xl border border-border p-4 flex flex-col gap-3 bg-muted/20">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Form Etiketleri</span>
                            {(["name", "email", "subject", "message", "submit"] as const).map((field) => (
                                <RxInput
                                    key={field}
                                    label={
                                        field === "name" ? "Ad Soyad Etiketi"
                                            : field === "email" ? "E-posta Etiketi"
                                                : field === "subject" ? "Konu Etiketi"
                                                    : field === "message" ? "Mesaj Etiketi"
                                                        : "Gönder Butonu"
                                    }
                                    value={draft.contact.formLabels[field]}
                                    onChange={(e) =>
                                        updateContact("formLabels", {
                                            ...draft.contact.formLabels,
                                            [field]: e.target.value,
                                        })
                                    }
                                />
                            ))}
                        </div>
                    </AccordionSection>
                </div>

                {/* ── Sağ: Canlı Önizleme ─────────────────────────────────── */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-1">
                        <Eye className="size-4 text-primary" />
                        <span className="text-sm font-bold text-foreground">Canlı Önizleme</span>
                        <span className="ml-auto text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
                            Gerçek Zamanlı
                        </span>
                    </div>

                    {/* Mini tarayıcı çerçevesi */}
                    <div className="rounded-2xl border border-border shadow-xl overflow-hidden">
                        <div className="flex items-center gap-2 bg-muted/80 px-4 py-2.5 border-b border-border">
                            <div className="flex gap-1.5">
                                <div className="size-3 rounded-full bg-red-400" />
                                <div className="size-3 rounded-full bg-amber-400" />
                                <div className="size-3 rounded-full bg-green-400" />
                            </div>
                            <div className="flex-1 mx-3 rounded-md bg-card border border-border px-3 py-1 text-[11px] text-muted-foreground font-mono">
                                randesk.com
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
                            <LivePreviewPanel draft={draft} packages={packages} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
