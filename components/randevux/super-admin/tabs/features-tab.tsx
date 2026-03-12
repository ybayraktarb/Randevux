"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
    Plus, Search, Edit2, Trash2, Zap, 
    MoreHorizontal, Filter, RefreshCw,
    ShieldCheck, Activity, Key, Type,
    Loader2, Check, X
} from "lucide-react"
import { RxButton } from "../../rx-button"
import { RxModal } from "../../rx-modal"
import { RxInput, RxTextarea } from "../../rx-input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Feature {
    id: string
    key: string
    display_name: string
    description: string
    is_active: boolean
    created_at: string
}

export function FeaturesTab() {
    const supabase = createClient()
    const [features, setFeatures] = useState<Feature[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Form states
    const [key, setKey] = useState("")
    const [displayName, setDisplayName] = useState("")
    const [description, setDescription] = useState("")
    const [isActive, setIsActive] = useState(true)

    const fetchFeatures = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from("features")
                .select("*")
                .order("created_at", { ascending: false })

            if (error) throw error
            setFeatures(data || [])
        } catch (error: any) {
            toast.error("Özellikler yüklenemedi", { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFeatures()
    }, [])

    const handleOpenModal = (feature?: Feature) => {
        if (feature) {
            setEditingFeature(feature)
            setKey(feature.key)
            setDisplayName(feature.display_name)
            setDescription(feature.description || "")
            setIsActive(feature.is_active)
        } else {
            setEditingFeature(null)
            setKey("")
            setDisplayName("")
            setDescription("")
            setIsActive(true)
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!key.trim() || !displayName.trim()) {
            toast.error("Lütfen tüm alanları doldurun")
            return
        }

        setIsSaving(true)
        try {
            const featureData = {
                key: key.trim(),
                display_name: displayName.trim(),
                description: description.trim(),
                is_active: isActive
            }

            if (editingFeature) {
                const { error } = await supabase
                    .from("features")
                    .update(featureData)
                    .eq("id", editingFeature.id)
                if (error) throw error
                toast.success("Özellik güncellendi")
            } else {
                const { error } = await supabase
                    .from("features")
                    .insert(featureData)
                if (error) throw error
                toast.success("Yeni özellik eklendi")
            }

            setIsModalOpen(false)
            fetchFeatures()
        } catch (error: any) {
            toast.error("İşlem başarısız", { description: error.message })
        } finally {
            setIsSaving(false)
        }
    }

    const toggleFeatureStatus = async (feature: Feature) => {
        try {
            const { error } = await supabase
                .from("features")
                .update({ is_active: !feature.is_active })
                .eq("id", feature.id)
            
            if (error) throw error
            toast.success(`${feature.display_name} ${!feature.is_active ? 'aktif edildi' : 'pasif edildi'}`)
            setFeatures(prev => prev.map(f => f.id === feature.id ? { ...f, is_active: !f.is_active } : f))
        } catch (error: any) {
            toast.error("Durum güncellenemedi", { description: error.message })
        }
    }

    const filteredFeatures = features.filter(f => 
        f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.key.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                        <Zap className="size-6" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-foreground">Özellik Havuzu (Feature Pool)</h2>
                        <p className="text-sm text-muted-foreground italic">Platform genelindeki tüm modül ve paket özelliklerini buradan yönetin.</p>
                    </div>
                </div>
                <RxButton onClick={() => handleOpenModal()} className="shadow-lg shadow-primary/20">
                    <Plus className="mr-2 size-4" /> Yeni Özellik Tanımla
                </RxButton>
            </div>

            {/* Toolbar Area */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center bg-card/50 p-4 rounded-xl border border-border/60">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Özellik adı veya anahtar kelime ile ara..."
                        className="w-full rounded-lg border border-border bg-background px-9 py-2 text-sm outline-none ring-primary/20 transition-all focus:border-primary focus:ring-4"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => fetchFeatures()}
                        className="flex items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted transition-colors"
                        title="Yenile"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                    </button>
                    <button className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
                        <Filter className="size-4" /> Filtrele
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            {loading ? (
                <div className="flex h-64 flex-col items-center justify-center gap-3 bg-card/20 rounded-2xl border border-dashed border-border/60">
                    <Loader2 className="size-8 animate-spin text-primary/60" />
                    <span className="text-sm font-medium text-muted-foreground">Özellikler yükleniyor...</span>
                </div>
            ) : filteredFeatures.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4 bg-card/20 rounded-2xl border border-dashed border-border/60">
                    <div className="rounded-full bg-muted/50 p-4">
                        <X className="size-8 text-muted-foreground/40" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-bold text-foreground">Sonuç bulunamadı</span>
                        <span className="text-xs text-muted-foreground">{searchQuery ? 'Arama kriterlerinize uygun özellik yok.' : 'Henüz tanımlanmış bir özellik bulunmuyor.'}</span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFeatures.map((feature) => (
                        <div 
                            key={feature.id}
                            className={cn(
                                "group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
                                feature.is_active ? "border-border/60 bg-card hover:border-primary/40" : "border-border/40 bg-muted/20 opacity-80"
                            )}
                        >
                            {/* Feature Header */}
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={cn(
                                        "rounded-xl p-2.5 transition-colors",
                                        feature.is_active ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Zap className="size-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(feature)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-md transition-all"
                                            title="Düzenle"
                                        >
                                            <Edit2 className="size-4" />
                                        </button>
                                        <button 
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-md transition-all"
                                            title="Sil"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 mb-3">
                                    <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{feature.display_name}</h3>
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded border border-border/40">
                                        <Key className="size-3" /> {feature.key}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] mb-6">
                                    {feature.description || "Bu özellik için henüz bir açıklama girilmemiş."}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-border/40">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("size-2 rounded-full shadow-[0_0_8px]", feature.is_active ? "bg-emerald-500 shadow-emerald-500/50" : "bg-muted-foreground/40 shadow-transparent")} />
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                            {feature.is_active ? 'AKTİF' : 'PASİF'}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => toggleFeatureStatus(feature)}
                                        className={cn(
                                            "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border",
                                            feature.is_active 
                                                ? "bg-muted/30 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20" 
                                                : "bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary/20"
                                        )}
                                    >
                                        {feature.is_active ? (
                                            <>Durdur</>
                                        ) : (
                                            <>Yayına Al</>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Accent line on hover */}
                            <div className={cn(
                                "absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300 w-0 group-hover:w-full",
                                !feature.is_active && "bg-muted-foreground/30"
                            )} />
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <RxModal
                acik={isModalOpen}
                onKapat={() => setIsModalOpen(false)}
                baslik={editingFeature ? "Özellik Düzenle" : "Yeni Özellik Tanımla"}
                aciklama="Sistem özelliklerini (key) tanımlarken teknik isimlendirme standartlarına (örn: ai_assistant) uymanız önerilir."
            >
                <div className="flex flex-col gap-5 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold flex items-center gap-2">
                                <Key className="size-4 text-primary" /> Teknik Key
                            </label>
                            <RxInput
                                placeholder="örn: premium_analytics"
                                value={key}
                                onChange={(e) => setKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                                disabled={!!editingFeature}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold flex items-center gap-2">
                                <Type className="size-4 text-primary" /> Görünen Ad
                            </label>
                            <RxInput
                                placeholder="örn: Gelişmiş Analizler"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold flex items-center gap-2">
                            Açıklama
                        </label>
                        <RxTextarea
                            placeholder="Özelliğin işlevi hakkında kısa bir bilgi..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold">Durum</span>
                            <span className="text-[11px] text-muted-foreground">Özellik hemen kullanılabilir olsun mu?</span>
                        </div>
                        <button 
                            onClick={() => setIsActive(!isActive)}
                            className={cn(
                                "relative h-6 w-11 rounded-full p-1 transition-colors outline-none ring-primary/20 focus:ring-4",
                                isActive ? "bg-primary" : "bg-muted-foreground/30"
                            )}
                        >
                            <div className={cn(
                                "h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                                isActive ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    <div className="flex items-center justify-end gap-3 mt-4">
                        <RxButton variant="ghost" onClick={() => setIsModalOpen(false)}>Vazgeç</RxButton>
                        <RxButton onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <><Loader2 className="mr-2 size-4 animate-spin" /> Kaydediliyor...</>
                            ) : (
                                editingFeature ? "Değişiklikleri Kaydet" : "Özelliği Oluştur"
                            )}
                        </RxButton>
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
