"use client"

import { useState, useEffect } from "react"
import { X, Loader2, Megaphone, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { createPlatformAnnouncementAction, updatePlatformAnnouncementAction, type PlatformAnnouncement } from "@/src/modules/business/actions/announcement.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ModalProps {
    readonly isOpen: boolean
    readonly onClose: () => void
    readonly onSuccess: () => void
    readonly editingAnnouncement?: PlatformAnnouncement | null
}

export function AnnouncementsAddModal({ isOpen, onClose, onSuccess, editingAnnouncement }: Readonly<ModalProps>) {
    const supabase = createClient()
    const [loading, setLoading] = useState(false)
    const [modules, setModules] = useState<{ id: string, name: string }[]>([])
    
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "info" as any,
        target_role: "all" as any,
        target_sector_id: null as string | null,
        is_active: true,
        starts_at: "",
        ends_at: ""
    })

    useEffect(() => {
        if (editingAnnouncement) {
            setFormData({
                title: editingAnnouncement.title,
                content: editingAnnouncement.content,
                type: editingAnnouncement.type,
                target_role: editingAnnouncement.target_role,
                target_sector_id: editingAnnouncement.target_sector_id || null,
                is_active: editingAnnouncement.is_active,
                starts_at: editingAnnouncement.starts_at ? editingAnnouncement.starts_at.slice(0, 16) : "",
                ends_at: editingAnnouncement.ends_at ? editingAnnouncement.ends_at.slice(0, 16) : ""
            })
        } else {
            setFormData({
                title: "",
                content: "",
                type: "info",
                target_role: "all",
                target_sector_id: null,
                is_active: true,
                starts_at: new Date().toISOString().slice(0, 16),
                ends_at: ""
            })
        }
    }, [editingAnnouncement, isOpen])

    useEffect(() => {
        if (isOpen) {
            supabase.from("modules").select("id, display_name").eq("is_active", true).then(({ data }) => {
                if (data) setModules(data.map(m => ({ id: m.id, name: m.display_name })))
            })
        }
    }, [isOpen, supabase])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const payload = {
            ...formData,
            starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
            ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null
        }

        const res = editingAnnouncement 
            ? await updatePlatformAnnouncementAction(editingAnnouncement.id, payload)
            : await createPlatformAnnouncementAction(payload)

        if (res.success) {
            toast.success(editingAnnouncement ? "Duyuru güncellendi" : "Duyuru oluşturuldu")
            onSuccess()
            onClose()
        } else {
            toast.error(res.error || "Hata oluştu")
        }
        setLoading(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/30 backdrop-blur-sm p-4">
            <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-200">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <Megaphone className="size-5" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground">
                                {editingAnnouncement ? "Duyuruyu Düzenle" : "Yeni Duyuru Oluştur"}
                            </h2>
                        </div>
                        <button type="button" onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="max-h-[70vh] overflow-y-auto p-6 flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="announcement-title" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Başlık</label>
                            <input
                                id="announcement-title"
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Örn: Sistem Bakımı Bildirimi"
                                className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="announcement-content" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">İçerik</label>
                            <textarea
                                id="announcement-content"
                                required
                                rows={4}
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Duyuru metnini buraya yazın..."
                                className="w-full rounded-xl border border-input bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[120px]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Duyuru Tipi</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { id: 'info', label: 'Bilgi', icon: Info, cls: 'text-blue-600 bg-blue-50 border-blue-200' },
                                        { id: 'warning', label: 'Uyarı', icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-200' },
                                        { id: 'danger', label: 'Kritik', icon: ShieldCheck, cls: 'text-red-600 bg-red-50 border-red-200' },
                                        { id: 'success', label: 'Başarı', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
                                    ] as const).map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, type: t.id })}
                                            className={cn(
                                                "flex items-center gap-2 rounded-lg border p-2 text-xs font-semibold transition-all",
                                                formData.type === (t.id as any) ? t.cls : "bg-card text-muted-foreground border-border hover:bg-muted"
                                            )}
                                        >
                                            <t.icon className="size-3.5" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="announcement-target-role" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Hedef Kitle</label>
                                <select
                                    id="announcement-target-role"
                                    value={formData.target_role}
                                    onChange={(e) => setFormData({ ...formData, target_role: e.target.value as any })}
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="all">Herkes</option>
                                    <option value="patron">Sadece Patronlar</option>
                                    <option value="staff">Sadece Personel</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="announcement-sector" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sektör Filtresi (Opsiyonel)</label>
                                <select
                                    id="announcement-sector"
                                    value={formData.target_sector_id || ""}
                                    onChange={(e) => setFormData({ ...formData, target_sector_id: e.target.value || null })}
                                    className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Tüm Sektörler</option>
                                    {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Durum</label>
                                <div className="flex h-10 items-center justify-between rounded-xl border border-border bg-muted/20 px-4">
                                    <span className="text-xs font-medium text-foreground">Yayında mı?</span>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200",
                                            formData.is_active ? "bg-primary" : "bg-muted-foreground/30"
                                        )}
                                    >
                                        <span className={cn(
                                            "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 mt-0.5",
                                            formData.is_active ? "translate-x-[18px]" : "translate-x-0.5"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="announcement-starts-at" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Başlangıç Zamanı</label>
                                <input
                                    id="announcement-starts-at"
                                    type="datetime-local"
                                    value={formData.starts_at}
                                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                                    className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="announcement-ends-at" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Bitiş Zamanı (Opsiyonel)</label>
                                <input
                                    id="announcement-ends-at"
                                    type="datetime-local"
                                    value={formData.ends_at}
                                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                                    className="h-10 w-full rounded-xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4">
                        <RxButton type="button" variant="ghost" onClick={onClose} disabled={loading}>Vazgeç</RxButton>
                        <RxButton type="submit" disabled={loading} className="px-8">
                            {loading ? <Loader2 className="size-4 animate-spin" /> : (editingAnnouncement ? "Güncelle" : "Oluştur")}
                        </RxButton>
                    </div>
                </form>
            </div>
        </div>
    )
}
