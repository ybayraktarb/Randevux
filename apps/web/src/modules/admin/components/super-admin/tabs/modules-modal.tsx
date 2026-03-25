"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    Scissors, Sparkles, PawPrint, Heart, Stethoscope,
    Briefcase, Dumbbell, GraduationCap, Palette, Camera,
    Music, Utensils,
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxInput, RxTextarea } from "@/src/modules/core/components/rx-input"

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

interface ModulesModalProps {
    onSuccess: () => void
}

export function ModulesModal({ onSuccess }: ModulesModalProps) {
    const supabase = createClient()

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
            icon: selectedIcon,
            description: moduleDesc,
            required: Object.entries(requiredFields).filter(([_, v]) => v).map(([k]) => k),
            optional: Object.entries(optionalFeatures).filter(([_, v]) => v).map(([k]) => k),
        }

        const { error } = await supabase.from("modules").insert({
            name: moduleSlug,
            display_name: moduleName,
            is_active: true,
            config: config,
        })

        if (!error) {
            setNewModalOpen(false)
            setModuleName("")
            setModuleSlug("")
            setModuleDesc("")
            onSuccess()
        } else {
            alert("Hata: " + error.message)
        }
    }

    async function handleUpdateModule() {
        const config = {
            icon: editSelectedIcon,
            description: editModuleDesc,
            required: Object.entries(editRequiredFields).filter(([_, v]) => v).map(([k]) => k),
            optional: Object.entries(editOptionalFeatures).filter(([_, v]) => v).map(([k]) => k),
        }

        const { error } = await supabase.from("modules").update({
            name: editModuleSlug,
            display_name: editModuleName,
            config: config,
        }).eq("id", editModId)

        if (!error) {
            setEditModalOpen(false)
            onSuccess()
        } else {
            alert("Hata: " + error.message)
        }
    }

    const ModalForm = ({ isEdit }: { isEdit: boolean }) => {
        const name = isEdit ? editModuleName : moduleName
        const slug = isEdit ? editModuleSlug : moduleSlug
        const desc = isEdit ? editModuleDesc : moduleDesc
        const icon = isEdit ? editSelectedIcon : selectedIcon
        const reqFields = isEdit ? editRequiredFields : requiredFields
        const optFeats = isEdit ? editOptionalFeatures : optionalFeatures

        const setName = isEdit ? handleEditNameChange : handleNameChange
        const setSlug = isEdit ? setEditModuleSlug : setModuleSlug
        const setDesc = isEdit ? setEditModuleDesc : setModuleDesc
        const setIcon = isEdit ? setEditSelectedIcon : setSelectedIcon
        const setReq = isEdit
            ? (v: typeof editRequiredFields) => setEditRequiredFields(v)
            : (v: typeof requiredFields) => setRequiredFields(v)
        const setOpt = isEdit
            ? (v: typeof editOptionalFeatures) => setEditOptionalFeatures(v)
            : (v: typeof optionalFeatures) => setOptionalFeatures(v)

        return (
            <div className="flex flex-col gap-5">
                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Temel Bilgiler</h4>
                    <div className="flex flex-col gap-3">
                        <RxInput label="Modül Adı" placeholder="Örn: Sağlık Kliniği" value={name} onChange={(e) => setName(e.target.value)} />
                        <RxInput label="Sistem Adı" placeholder="health_clinic" value={slug} onChange={(e) => setSlug(e.target.value)} />
                        <RxTextarea label="Açıklama" placeholder="Modül hakkında kısa açıklama..." value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[80px]" />
                    </div>
                </div>

                <div>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">{"İkon Seçimi"}</h4>
                    <div className="grid grid-cols-6 gap-2">
                        {iconOptions.map((opt) => {
                            const OptIcon = opt.icon
                            return (
                                <button
                                    key={opt.label}
                                    type="button"
                                    onClick={() => setIcon(opt.label)}
                                    className={cn(
                                        "flex size-10 items-center justify-center rounded-lg border transition-colors",
                                        icon === opt.label
                                            ? "border-primary bg-primary-light text-primary"
                                            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary"
                                    )}
                                >
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
                                <input
                                    type="checkbox"
                                    checked={reqFields[field.key]}
                                    onChange={(e) => setReq({ ...reqFields, [field.key]: e.target.checked } as any)}
                                    className="size-4 rounded border-border text-primary accent-primary"
                                />
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
                                <input
                                    type="checkbox"
                                    checked={optFeats[feat.key]}
                                    onChange={(e) => setOpt({ ...optFeats, [feat.key]: e.target.checked } as any)}
                                    className="size-4 rounded border-border text-primary accent-primary"
                                />
                                <span className="text-sm text-foreground">{feat.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* Trigger button — rendered by parent via ref or exposed open fn */}
            <button
                id="modules-modal-trigger"
                type="button"
                className="hidden"
                onClick={() => setNewModalOpen(true)}
            />

            {/* New Module Modal */}
            <RxModal
                open={newModalOpen}
                onClose={() => setNewModalOpen(false)}
                title="Yeni Modül Ekle"
                className="max-w-[560px]"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setNewModalOpen(false)}>{"Vazgeç"}</RxButton>
                        <RxButton size="sm" onClick={handleAddModule}>{"Modülü Kaydet"}</RxButton>
                    </>
                }
            >
                <ModalForm isEdit={false} />
            </RxModal>

            {/* Edit Module Modal */}
            <RxModal
                open={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Modülü Düzenle"
                className="max-w-[560px]"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>{"Vazgeç"}</RxButton>
                        <RxButton size="sm" onClick={handleUpdateModule}>{"Modülü Güncelle"}</RxButton>
                    </>
                }
            >
                <ModalForm isEdit={true} />
            </RxModal>
        </>
    )
}

// Export openEditModal so ModulesTab can call it
export type { ModulesModalProps }
// We expose open functions via a ref pattern:
export function useModulesModal() {
    // Parent controls newModalOpen via a passed prop — simpler to keep modal fully self-contained
    // and expose a trigger via imperative handle. For simplicity we keep it self-contained below.
}
