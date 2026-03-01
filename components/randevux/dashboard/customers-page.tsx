"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, Calendar, Phone, Mail, UserPlus, MoreHorizontal, User, History } from "lucide-react"
import { RxButton } from "@/components/randevux/rx-button"
import { RxInput } from "@/components/randevux/rx-input"
import { RxModal } from "@/components/randevux/rx-modal"
import { RxAvatar } from "@/components/randevux/rx-avatar"
import { toast } from "sonner"
import { getModuleConfig } from "@/lib/modules/config"

export function CustomersPage() {
    const supabase = createClient()
    const [customers, setCustomers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [moduleName, setModuleName] = useState<string | null>(null)
    const config = getModuleConfig(moduleName)

    // Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", notes: "", petName: "" })

    useEffect(() => {
        loadInitialData()
    }, [])

    async function loadInitialData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. İşletme ve Modül Bilgisini Beraber Çekiyoruz
        const { data: ownerData } = await supabase
            .from("business_owners")
            .select(`
                business_id,
                businesses (
                    modules (
                        name
                    )
                )
            `)
            .eq("user_id", user.id)
            .limit(1)
            .single()

        if (ownerData) {
            setBusinessId(ownerData.business_id)
            // @ts-ignore
            const modName = ownerData.businesses?.modules?.name || 'barber'
            setModuleName(modName)

            fetchCustomers(ownerData.business_id)
        } else {
            setLoading(false)
        }
    }

    async function fetchCustomers(bId: string) {
        try {
            const { data, error } = await supabase
                .from("business_customers")
                .select("*")
                .eq("business_id", bId)
                .order("created_at", { ascending: false })

            if (error) throw error

            const formattedCustomers = (data || []).map(c => ({
                id: c.id,
                name: `${c.first_name || ""} ${c.last_name || ""}`.trim() || "İsimsiz Müşteri",
                phone: c.phone || "",
                email: c.email || "",
                pet_name: c.metadata?.pet_name || "",
                notes: c.notes || "",
                total_visits: 0, // Gelecekte eklenecek (randevu count)
                last_visit: "-" // Gelecekte eklenecek (en son randevu)
            }))

            setCustomers(formattedCustomers)
        } catch (e: any) {
            console.error("Müşteri listesi çekilemedi:", e)
            toast.error("Müşteri listesi çekilirken hata oluştu: " + e.message)
            setCustomers([])
        } finally {
            setLoading(false)
        }
    }

    async function handleAddCustomer() {
        if (!addForm.name || !addForm.phone) {
            toast.error("İsim ve Telefon numarası zorunludur.")
            return
        }
        if (config.hasPetName && !addForm.petName) {
            toast.error("Lütfen evcil hayvan adını girin.")
            return
        }
        if (!businessId) return

        setActionLoading(true)

        const nameParts = addForm.name.trim().split(" ")
        const firstName = nameParts[0]
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

        const metadata = config.hasPetName ? { pet_name: addForm.petName } : {}

        const { data, error } = await supabase
            .from("business_customers")
            .insert({
                business_id: businessId,
                first_name: firstName,
                last_name: lastName,
                phone: addForm.phone,
                email: addForm.email || null,
                notes: addForm.notes || null,
                metadata: metadata
            })
            .select()
            .single()

        setActionLoading(false)

        if (error) {
            toast.error("Müşteri eklenirken hata oluştu: " + error.message)
            return
        }

        toast.success("Müşteri başarıyla eklendi!")

        const newCustomer = {
            id: data.id,
            name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            phone: data.phone || "",
            email: data.email || "",
            pet_name: data.metadata?.pet_name || "",
            notes: data.notes || "",
            total_visits: 0,
            last_visit: "-"
        }

        setCustomers([newCustomer, ...customers])
        setIsAddModalOpen(false)
        setAddForm({ name: "", phone: "", email: "", notes: "", petName: "" })
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">{config.customerLabel} Rehberi</h2>
                    <p className="text-sm text-muted-foreground">İşletmenize kayıtlı {config.customerLabel.toLowerCase()} portföyü.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="İsim veya telefon..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <RxButton size="sm" onClick={() => setIsAddModalOpen(true)}>
                        <UserPlus className="size-4 mr-2" /> Yeni {config.customerLabel}
                    </RxButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : filteredCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary-light mb-4">
                        <User className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Kayıtlı Müşteri Yok</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
                        Randevu alan müşterileriniz otomatik olarak burada listelenecektir. Dilerseniz manuel olarak rehbere müşteri ekleyebilirsiniz.
                    </p>
                    <RxButton onClick={() => setIsAddModalOpen(true)}>Müşteri Ekle</RxButton>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <table className="w-full text-left text-sm text-foreground">
                        <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3">{config.customerLabel}</th>
                                {config.hasPetName && <th className="px-4 py-3">Evcil Hayvan</th>}
                                <th className="px-4 py-3">İletişim</th>
                                <th className="px-4 py-3 text-center">Ziyaret Sayısı</th>
                                <th className="px-4 py-3">Son Randevu</th>
                                <th className="px-4 py-3 text-right">Detay İşlemleri</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredCustomers.map((cust) => (
                                <tr key={cust.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <RxAvatar name={cust.name} size="sm" />
                                            <span className="font-medium text-foreground">{cust.name}</span>
                                        </div>
                                    </td>
                                    {config.hasPetName && (
                                        <td className="px-4 py-3">
                                            <span className="font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md inline-flex items-center">
                                                🐾 {cust.pet_name || "-"}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[13px] font-mono text-muted-foreground">
                                                <Phone className="size-3" /> {cust.phone}
                                            </div>
                                            {cust.email && (
                                                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                                                    <Mail className="size-3" /> {cust.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                                            {cust.total_visits} Randevu
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {cust.last_visit !== "-" ? (
                                            <div className="flex items-center gap-1.5 text-muted-foreground text-[13px]">
                                                <Calendar className="size-3.5" />
                                                {new Date(cust.last_visit).toLocaleDateString("tr-TR")}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-xs italic">Henüz randevusu yok</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                                                <History className="size-3.5" /> Geçmiş
                                            </button>
                                            <button className="p-1.5 text-muted-foreground hover:text-primary transition-colors">
                                                <MoreHorizontal className="size-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Customer Modal */}
            <RxModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={`Manuel ${config.customerLabel} Ekle`}
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={actionLoading}>
                            İptal
                        </RxButton>
                        <RxButton size="sm" onClick={handleAddCustomer} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {config.customerLabel}'i Kaydet
                        </RxButton>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800 border border-orange-200">
                        Buradan eklenen {config.customerLabel.toLowerCase()}lere platform üzerinden şifre gitmez, sadece sizin yerel rehberinizde tutulurlar. Uygulama indirdiklerinde numaralarından eşlenirler.
                    </div>

                    <RxInput
                        label="Ad Soyad (*)"
                        placeholder="Örn: Cengiz K."
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        disabled={actionLoading}
                    />

                    {config.hasPetName && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <RxInput
                                label="Evcil Hayvan/Dost Adı (*)"
                                placeholder="Örn: Karabaş"
                                value={addForm.petName}
                                onChange={(e) => setAddForm({ ...addForm, petName: e.target.value })}
                                disabled={actionLoading}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <RxInput
                            label="Telefon Numarası (*)"
                            placeholder="053X XXX XX XX"
                            value={addForm.phone}
                            onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                            disabled={actionLoading}
                        />
                        <RxInput
                            label="E-posta Adresi"
                            placeholder="İsteğe bağlı"
                            value={addForm.email}
                            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                            disabled={actionLoading}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Özel Not (Sadece siz görürsünüz)</label>
                        <textarea
                            rows={3}
                            placeholder={config.hasPetName ? "1.karma aşısı yapıldı, aşı defteri bende vs..." : "Alerjisi var, boya sevmiyor vs..."}
                            value={addForm.notes}
                            onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                            className="w-full rounded-lg border border-input bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={actionLoading}
                        />
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
