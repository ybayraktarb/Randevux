"use client"

import { useState, useEffect } from "react"
import { Megaphone, Plus, BellRing, Settings2, Users, Trash2, Edit3, Calendar, Target, Loader2, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { AnnouncementsAddModal } from "./announcements-add-modal"
import { getPlatformAnnouncementsAction, deletePlatformAnnouncementAction, type PlatformAnnouncement } from "@/src/modules/business/actions/announcement.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function AnnouncementsTab() {
    const [announcements, setAnnouncements] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<PlatformAnnouncement | null>(null)

    useEffect(() => {
        fetchAnnouncements()
    }, [])

    async function fetchAnnouncements() {
        setLoading(true)
        const res = await getPlatformAnnouncementsAction()
        if (res.success) {
            setAnnouncements(res.data || [])
        } else {
            toast.error(res.error || "Duyurular yüklenemedi")
        }
        setLoading(false)
    }

    async function handleDelete(id: string) {
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return
        const res = await deletePlatformAnnouncementAction(id)
        if (res.success) {
            toast.success("Duyuru silindi")
            fetchAnnouncements()
        } else {
            toast.error(res.error || "Silme başarısız")
        }
    }

    const getStatus = (item: any) => {
        if (!item.is_active) return { label: "Pasif", variant: "gray" as const }
        const now = new Date()
        const start = item.starts_at ? new Date(item.starts_at) : null
        const end = item.ends_at ? new Date(item.ends_at) : null

        if (start && start > now) return { label: "Planlandı", variant: "purple" as const }
        if (end && end < now) return { label: "Süresi Doldu", variant: "warning" as const }
        return { label: "Yayında", variant: "success" as const }
    }

    const typeConfig = {
        info: { icon: Info, cls: 'text-blue-500' },
        warning: { icon: AlertTriangle, cls: 'text-amber-500' },
        danger: { icon: ShieldCheck, cls: 'text-red-500' },
        success: { icon: CheckCircle2, cls: 'text-emerald-500' }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Sistem Duyuruları</h2>
                    <p className="text-sm text-muted-foreground">İşletme panellerine ve kullanıcılara bildirim/duyuru gönderimi.</p>
                </div>
                <div className="flex gap-2">
                    <RxButton variant="ghost" size="sm" onClick={fetchAnnouncements} disabled={loading}>
                        {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                        Yenile
                    </RxButton>
                    <RxButton size="sm" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                        <Plus className="size-4" />
                        Yeni Duyuru Oluştur
                    </RxButton>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                    {loading ? (
                        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
                            <Loader2 className="size-8 animate-spin text-primary/30" />
                        </div>
                    ) : announcements.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
                            <div className="flex justify-center mb-4">
                                <div className="rounded-full bg-primary/10 p-4">
                                    <Megaphone className="size-8 text-primary" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Henüz duyuru yok</h3>
                            <p className="mx-auto mt-2 max-w-[400px] text-sm text-muted-foreground">
                                Sistem genelinde yayınlanacak ilk duyurunuzu sağ üstteki butonla oluşturabilirsiniz.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {announcements.map((item) => {
                                const status = getStatus(item)
                                const Icon = typeConfig[item.type as keyof typeof typeConfig]?.icon || Info
                                return (
                                    <div key={item.id} className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={cn("mt-1 rounded-lg p-2 bg-muted/50", typeConfig[item.type as keyof typeof typeConfig]?.cls)}>
                                                    <Icon className="size-5" />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                                                        <RxBadge variant={status.variant}>{status.label}</RxBadge>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 line-clamp-2">{item.content}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}
                                                    className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                                    <Edit3 className="size-4" />
                                                </button>
                                                <button type="button" onClick={() => handleDelete(item.id)}
                                                    className="rounded-lg p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger transition-colors">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/50 pt-4">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Target className="size-3.5" />
                                                <span className="font-medium text-foreground">
                                                    Hedef: {item.target_role === 'all' ? 'Herkes' : item.target_role === 'patron' ? 'Patronlar' : 'Personel'}
                                                    {item.module?.display_name && ` (${item.module.display_name})`}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="size-3.5" />
                                                <span>{item.starts_at ? new Date(item.starts_at).toLocaleDateString('tr-TR') : 'Hemen'}</span>
                                                {item.ends_at && <span> - {new Date(item.ends_at).toLocaleDateString('tr-TR')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar Stats */}
                <div className="flex flex-col gap-4">
                    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                        <h4 className="flex items-center gap-2 font-semibold text-foreground mb-4">
                            <BellRing className="size-4 text-primary" />
                            İstatistikler
                        </h4>
                        <ul className="flex flex-col gap-3 text-sm">
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Toplam Duyuru</span>
                                <span className="font-bold text-foreground font-mono">{announcements.length}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Şu an Yayında</span>
                                <span className="font-bold text-success font-mono">
                                    {announcements.filter(a => getStatus(a).label === 'Yayında').length}
                                </span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Bekleyen</span>
                                <span className="font-bold text-purple-600 font-mono">
                                    {announcements.filter(a => getStatus(a).label === 'Planlandı').length}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <AnnouncementsAddModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={fetchAnnouncements} 
                editingAnnouncement={editingItem}
            />
        </div>
    )
}
