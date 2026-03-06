"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, Puzzle } from "lucide-react"
import {
    Scissors, Sparkles, PawPrint, Heart, Stethoscope,
    Briefcase, Dumbbell, GraduationCap, Palette, Camera,
    Music, Utensils,
} from "lucide-react"
import { RxButton } from "../../rx-button"
import { RxModal } from "../../rx-modal"
import { RxInput, RxTextarea } from "../../rx-input"

const iconOptions = [
    { icon: Scissors, label: "Scissors" },
    { icon: Sparkles, label: "Sparkles" },
    { icon: PawPrint, label: "PawPrint" },
    { icon: Heart, label: "Heart" },
    { icon: Stethoscope, label: "Stethoscope" },
    { icon: Briefcase, label: "Briefcase" },
    { icon: Dumbbell, label: "Dumbbell" },
    { icon: GraduationCap, label: "GraduationCap" },
    { icon: Palette, label: "Palette" },
    { icon: Camera, label: "Camera" },
    { icon: Music, label: "Music" },
    { icon: Utensils, label: "Utensils" },
]

export function ModulesTab() {
    const supabase = createClient()
    const [modules, setModules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Add Modal State
    const [newModalOpen, setNewModalOpen] = useState(false)
    const [moduleName, setModuleName] = useState("")
    const [moduleSlug, setModuleSlug] = useState("")
    const [moduleDesc, setModuleDesc] = useState("")
    const [selectedIcon, setSelectedIcon] = useState("Scissors")
    const [requiredFields, setRequiredFields] = useState({
        personel: true, hizmet: true, hayvan: false, dosya: false, asset: false,
    })
    const [optionalFeatures, setOptionalFeatures] = useState({
        notes: true, noshow: true, multiResource: false,
    })

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editModId, setEditModId] = useState("")
    const [editModuleName, setEditModuleName] = useState("")
    const [editModuleSlug, setEditModuleSlug] = useState("")
    const [editModuleDesc, setEditModuleDesc] = useState("")
    const [editSelectedIcon, setEditSelectedIcon] = useState("Scissors")
    const [editRequiredFields, setEditRequiredFields] = useState({
        personel: false, hizmet: false, hayvan: false, dosya: false, asset: false,
    })
    const [editOptionalFeatures, setEditOptionalFeatures] = useState({
        notes: false, noshow: false, multiResource: false,
    })

    useEffect(() => {
        fetchModules()
    }, [])

    async function fetchModules() {
        setLoading(true)
        const { data: modsData } = await supabase
            .from("modules")
            .select(`*, businesses(id)`)
            .order("created_at", { ascending: true })

        if (modsData) {
            const mapped = modsData.map((m: any) => {
                const config = m.config || {}
                return {
                    id: m.id,
                    name: m.display_name,
                    slug: m.name,
                    iconLabel: config.icon || "Puzzle",
                    description: config.description || "Modül açıklaması",
                    businesses: m.businesses?.length || 0,
                    appts: 0,
                    required: config.required || [],
                    optional: config.optional || [],
                    active: m.is_active,
                    comingSoon: false,
                }
            })
            setModules(mapped)
        }
        setLoading(false)
    }

    const handleNameChange = (val: string) => {
        setModuleName(val)
        setModuleSlug(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
    }

    const handleEditNameChange = (val: string) => {
        setEditModuleName(val)
        setEditModuleSlug(val.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""))
    }

    function openEditModal(mod: any) {
        setEditModId(mod.id)
        setEditModuleName(mod.name)
        setEditModuleSlug(mod.slug)
        setEditModuleDesc(mod.description)
        setEditSelectedIcon(mod.iconLabel)

        const rf = { personel: false, hizmet: false, hayvan: false, dosya: false, asset: false }
        mod.required.forEach((k: any) => { if (k in rf) rf[k as keyof typeof rf] = true })
        setEditRequiredFields(rf)

        const of_ = { notes: false, noshow: false, multiResource: false }
        mod.optional.forEach((k: any) => { if (k in of_) of_[k as keyof typeof of_] = true })
        setEditOptionalFeatures(of_)

        setEditModalOpen(true)
    }

    async function handleAddModule() {
        const config = {
            icon: selectedIcon, description: moduleDesc,
            required: Object.entries(requiredFields).filter(([_, v]) => v).map(([k]) => k),
            optional: Object.entries(optionalFeatures).filter(([_, v]) => v).map(([k]) => k),
        }
        const { error } = await supabase.from("modules").insert({
            name: moduleSlug, display_name: moduleName, is_active: true, config,
        })
        if (!error) {
            setNewModalOpen(false)
            setModuleName(""); setModuleSlug(""); setModuleDesc("")
            fetchModules()
        } else {
            alert("Hata: " + error.message)
        }
    }

    async function handleUpdateModule() {
        const config = {
            icon: editSelectedIcon, description: editModuleDesc,
            required: Object.entries(editRequiredFields).filter(([_, v]) => v).map(([k]) => k),
            optional: Object.entries(editOptionalFeatures).filter(([_, v]) => v).map(([k]) => k),
        }
        const { error } = await supabase.from("modules").update({
            name: editModuleSlug, display_name: editModuleName, config,
        }).eq("id", editModId)
        if (!error) { setEditModalOpen(false); fetchModules() }
        else alert("Hata: " + error.message)
    }

    async function toggleStatus(id: string, current: boolean) {
        const { error } = await supabase.from("modules").update({ is_active: !current }).eq("id", id)
        if (!error) fetchModules()
    }

    if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>

    const modalFields = (isEdit: boolean) => {
        const name = isEdit ? editModuleName : moduleName
        const slug = isEdit ? editModuleSlug : moduleSlug
        const desc = isEdit ? editModuleDesc : moduleDesc
        const icon = isEdit ? editSelectedIcon : selectedIcon
        const req = isEdit ? editRequiredFields : requiredFields
        const opt = isEdit ? editOptionalFeatures : optionalFeatures
        const onName = isEdit ? handleEditNameChange : handleNameChange
        const onSlug = isEdit ? setEditModuleSlug : setModuleSlug
        const onDesc = isEdit ? setEditModuleDesc : setModuleDesc
        const onIcon = isEdit ? setEditSelectedIcon : setSelectedIcon
        const onReq = isEdit
            ? (v: typeof editRequiredFields) => setEditRequiredFields(v)
            : (v: typeof requiredFields) => setRequiredFields(v)
        const onOpt = isEdit
            ? (v: typeof editOptionalFeatures) => setEditOptionalFeatures(v)
            : (v: typeof optionalFeatures) => setOptionalFeatures(v)

        return (
            <div className="flex flex-col gap-5">
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Temel Bilgiler</h4>
                    <div className="flex flex-col gap-3">
                        <RxInput label="Modül Adı" placeholder="Örn: Sağlık Kliniği" value={name} onChange={(e) => onName(e.target.value)} />
                        <RxInput label="Sistem Adı" placeholder="health_clinic" value={slug} onChange={(e) => onSlug(e.target.value)} />
                        <RxTextarea label="Açıklama" placeholder="Modül hakkında kısa açıklama..." value={desc} onChange={(e) => onDesc(e.target.value)} className="min-h-[80px]" />
                    </div>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{"İkon Seçimi"}</h4>
                    <div className="grid grid-cols-6 gap-2">
                        {iconOptions.map((opt_) => {
                            const OptIcon = opt_.icon
                            return (
                                <button key={opt_.label} type="button" onClick={() => onIcon(opt_.label)}
                                    className={cn("flex size-10 items-center justify-center rounded-lg border transition-colors",
                                        icon === opt_.label ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                                    )}>
                                    <OptIcon className="size-5" />
                                </button>
                            )
                        })}
                    </div>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Zorunlu Alanlar</h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { key: "personel" as const, label: "Personel Seçimi" },
                            { key: "hizmet" as const, label: "Hizmet Seçimi" },
                            { key: "hayvan" as const, label: "Hayvan Profili" },
                            { key: "dosya" as const, label: "Dosya Yükleme" },
                            { key: "asset" as const, label: "Asset Rezervasyonu (Ameliyathane vb.)" },
                        ].map((field) => (
                            <label key={field.key} className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={req[field.key]} onChange={(e) => onReq({ ...req, [field.key]: e.target.checked } as any)} className="size-4 rounded border-border text-primary accent-primary" />
                                <span className="text-sm text-foreground">{field.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{"Opsiyonel Özellikler"}</h4>
                    <div className="flex flex-col gap-2">
                        {[
                            { key: "notes" as const, label: "Müşteri Notları" },
                            { key: "noshow" as const, label: "No-Show Takibi" },
                            { key: "multiResource" as const, label: "Çoklu Kaynak Yönetimi" },
                        ].map((feat) => (
                            <label key={feat.key} className="flex items-center gap-2.5 cursor-pointer">
                                <input type="checkbox" checked={opt[feat.key]} onChange={(e) => onOpt({ ...opt, [feat.key]: e.target.checked } as any)} className="size-4 rounded border-border text-primary accent-primary" />
                                <span className="text-sm text-foreground">{feat.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">{"Modüller"}</h2>
                    <p className="text-sm text-muted-foreground">{"Platform modüllerini yönetin"}</p>
                </div>
                <RxButton size="sm" onClick={() => setNewModalOpen(true)}>
                    <Plus className="size-4" />
                    {"Yeni Modül Ekle"}
                </RxButton>
            </div>

            {/* Module Cards */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {modules.map((mod) => {
                    const IconObj = iconOptions.find(o => o.label === mod.iconLabel)
                    const Icon = IconObj ? IconObj.icon : Puzzle
                    return (
                        <div key={mod.id} className={cn("relative overflow-hidden rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]", !mod.active && "opacity-70")}>
                            {mod.comingSoon && (
                                <span className="absolute right-4 top-4 z-10 inline-flex items-center rounded-md bg-badge-yellow-bg px-2.5 py-0.5 text-xs font-medium text-badge-yellow-text">{"Yakında"}</span>
                            )}
                            <div className="flex items-center justify-between bg-primary-light px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary">
                                        <Icon className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-base font-semibold text-foreground">{mod.name}</span>
                                </div>
                                <button type="button" onClick={() => toggleStatus(mod.id, mod.active)}
                                    className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200", mod.active ? "bg-success" : "bg-muted")}
                                    role="switch" aria-checked={mod.active}>
                                    <span className={cn("pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200", mod.active ? "translate-x-[18px]" : "translate-x-0.5")} style={{ marginTop: "2px" }} />
                                </button>
                            </div>
                            <div className="flex flex-col gap-3 px-5 py-4">
                                <p className="text-[13px] text-muted-foreground leading-relaxed">{mod.description}</p>
                                <div className="flex items-center gap-1.5 text-[13px]">
                                    <span className="font-medium text-foreground">{mod.businesses} {"işletme kullanıyor"}</span>
                                    <span className="text-muted-foreground">&middot;</span>
                                    <span className="text-muted-foreground">{mod.appts > 0 ? `${mod.appts.toLocaleString("tr-TR")} randevu` : "Henüz aktif değil"}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium text-foreground">Zorunlu:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {mod.required.map((f: string) => (
                                            <span key={f} className="rounded-md bg-badge-purple-bg px-2 py-0.5 text-[11px] font-medium text-badge-purple-text">{f}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <span className="text-xs font-medium text-foreground">Opsiyonel:</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {mod.optional.map((f: string) => (
                                            <span key={f} className="rounded-md bg-badge-gray-bg px-2 py-0.5 text-[11px] font-medium text-badge-gray-text">{f}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    <button type="button" onClick={() => openEditModal(mod)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">{"Düzenle"}</button>
                                    <button type="button" onClick={() => alert("Modül Detayları hazır değil.")} className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">Detay</button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* New Module Modal */}
            <RxModal open={newModalOpen} onClose={() => setNewModalOpen(false)} title="Yeni Modül Ekle" className="max-w-[560px]"
                footer={<><RxButton variant="ghost" size="sm" onClick={() => setNewModalOpen(false)}>{"Vazgeç"}</RxButton><RxButton size="sm" onClick={handleAddModule}>{"Modülü Kaydet"}</RxButton></>}>
                {modalFields(false)}
            </RxModal>

            {/* Edit Module Modal */}
            <RxModal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Modülü Düzenle" className="max-w-[560px]"
                footer={<><RxButton variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>{"Vazgeç"}</RxButton><RxButton size="sm" onClick={handleUpdateModule}>{"Modülü Güncelle"}</RxButton></>}>
                {modalFields(true)}
            </RxModal>
        </div>
    )
}
