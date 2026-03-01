"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, MoreHorizontal, Edit2, Trash2, Search, Clock, BadgeDollarSign, GripVertical, Briefcase } from "lucide-react"
import { RxButton } from "@/components/randevux/rx-button"
import { RxInput } from "@/components/randevux/rx-input"
import { RxModal } from "@/components/randevux/rx-modal"
import { RxBadge } from "@/components/randevux/rx-badge"
import { toast } from "sonner"

export function ServicesPage() {
    const supabase = createClient()
    const [services, setServices] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [businessId, setBusinessId] = useState<string | null>(null)

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [editMode, setEditMode] = useState(false)

    // Form State (Fiyat ve Süre rakamsal)
    const [form, setForm] = useState({ id: "", name: "", duration: 30, price: 0, is_active: true })

    useEffect(() => {
        loadInitialData()
    }, [])

    async function loadInitialData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: ownerData } = await supabase
            .from("business_owners")
            .select("business_id")
            .eq("user_id", user.id)
            .limit(1)
            .single()

        if (ownerData) {
            setBusinessId(ownerData.business_id)
            fetchServices(ownerData.business_id)
        } else {
            setLoading(false)
        }
    }

    async function fetchServices(bId: string) {
        const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("business_id", bId)
            .order("name", { ascending: true }) // İleride Sürükle-Bırak eklenebilir

        if (data) {
            setServices(data)
        }
        setLoading(false)
    }

    function openAddModal() {
        setForm({ id: "", name: "", duration: 30, price: 0, is_active: true })
        setEditMode(false)
        setIsModalOpen(true)
    }

    function openEditModal(srv: any) {
        setForm({
            id: srv.id,
            name: srv.name,
            duration: srv.duration_minutes,
            price: srv.price,
            is_active: srv.is_active
        })
        setEditMode(true)
        setIsModalOpen(true)
    }

    async function handleSubmit() {
        if (!form.name || form.duration <= 0 || form.price < 0) {
            toast.error("Lütfen tüm alanları geçerli değerlerle doldurun.")
            return
        }
        if (!businessId) return

        setActionLoading(true)

        const payload = {
            business_id: businessId,
            name: form.name,
            duration_minutes: form.duration,
            price: form.price,
            is_active: form.is_active
        }

        if (editMode && form.id) {
            // Güncelleme
            const { error } = await supabase.from("services").update(payload).eq("id", form.id)
            if (error) toast.error("Hata: " + error.message)
            else {
                toast.success("Hizmet güncellendi.")
                setIsModalOpen(false)
                fetchServices(businessId)
            }
        } else {
            // Yeni Ekleme
            const { error } = await supabase.from("services").insert(payload)
            if (error) toast.error("Hata: " + error.message)
            else {
                toast.success("Yeni hizmet eklendi.")
                setIsModalOpen(false)
                fetchServices(businessId)
            }
        }
        setActionLoading(false)
    }

    async function toggleActiveStatus(srv: any) {
        const { error } = await supabase.from("services").update({ is_active: !srv.is_active }).eq("id", srv.id)
        if (!error && businessId) {
            toast.success(`${srv.name} durumu ${!srv.is_active ? 'Aktif' : 'Pasif'} yapıldı`)
            fetchServices(businessId)
        }
    }

    const filteredServices = services.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Hizmet ve Fiyatlar</h2>
                    <p className="text-sm text-muted-foreground">Müşterilerinize sunduğunuz işlemleri ve sürelerini belirleyin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Hizmet ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <RxButton size="sm" onClick={openAddModal}>
                        <Plus className="size-4 mr-2" /> Yeni Hizmet Ekle
                    </RxButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : filteredServices.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary-light mb-4">
                        <Briefcase className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Hizmet Bulunamadı</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
                        Takviminizden randevu oluşturulabilmesi için sunduğunuz hizmetleri fiyatları ve süreleriyle birlikte ekleyin.
                    </p>
                    <RxButton onClick={openAddModal}>Hizmet Eklemeye Başla</RxButton>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="w-12 px-4 py-3 text-center"></th>
                                <th className="px-4 py-3">Hizmet Adı</th>
                                <th className="px-4 py-3">Süre</th>
                                <th className="px-4 py-3">Fiyat</th>
                                <th className="px-4 py-3">Durum</th>
                                <th className="px-4 py-3 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredServices.map((srv) => (
                                <tr key={srv.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-center">
                                        <GripVertical className="size-4 text-muted-foreground/50 cursor-grab mx-auto hover:text-foreground" />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-foreground">{srv.name}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <Clock className="size-3.5" />
                                            {srv.duration_minutes} Dk.
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <BadgeDollarSign className="size-3.5 text-muted-foreground" />
                                            {srv.price === 0 ? "Ücretsiz" : `₺${srv.price}`}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => toggleActiveStatus(srv)}
                                            className="focus:outline-none"
                                        >
                                            {srv.is_active ? (
                                                <RxBadge variant="success">Aktif (Satışta)</RxBadge>
                                            ) : (
                                                <RxBadge variant="danger">Pasif</RxBadge>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(srv)}
                                                className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Edit2 className="size-4" />
                                            </button>
                                            <button className="p-1.5 text-muted-foreground hover:text-danger transition-colors">
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Service Modal */}
            <RxModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editMode ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
                            İptal
                        </RxButton>
                        <RxButton size="sm" onClick={handleSubmit} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {editMode ? "Değişiklikleri Kaydet" : "Hizmeti Ekle"}
                        </RxButton>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <RxInput
                        label="Hizmet Adı"
                        placeholder="Örn: Klasik Saç Kesimi"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={actionLoading}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Süre (Dakika)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="5"
                                    step="5"
                                    value={form.duration}
                                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                                    className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    disabled={actionLoading}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Fiyat (TL)</label>
                            <div className="relative">
                                <BadgeDollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="number"
                                    min="0"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                                    className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    disabled={actionLoading}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
// lucide icon Briefcase import eklentisi.
