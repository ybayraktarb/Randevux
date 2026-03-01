"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Plus, MoreHorizontal, Edit2, Trash2, Search, Calendar, ShieldAlert, Users } from "lucide-react"
import { RxButton } from "@/components/randevux/rx-button"
import { RxInput } from "@/components/randevux/rx-input"
import { RxModal } from "@/components/randevux/rx-modal"
import { RxAvatar } from "@/components/randevux/rx-avatar"
import { RxBadge } from "@/components/randevux/rx-badge"
import { toast } from "sonner" // Eklenecek

export function StaffPage() {
    const supabase = createClient()
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Şimdilik Business ID'yi Mock (Sahte) alıyoruz, Context'ten gelecek.
    // Varsayım: İlk bulduğu işletmeyi kullan
    const [businessId, setBusinessId] = useState<string | null>(null)

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [addForm, setAddForm] = useState({ name: "", email: "", role: "staff" }) // staff | manager

    useEffect(() => {
        loadInitialData()
    }, [])

    async function loadInitialData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 1. Owner olduğu işletmeyi bul
        const { data: ownerData } = await supabase
            .from("business_owners")
            .select("business_id")
            .eq("user_id", user.id)
            .limit(1)
            .single()

        if (ownerData) {
            setBusinessId(ownerData.business_id)
            fetchStaff(ownerData.business_id)
        } else {
            setLoading(false) // İşletmesi yoksa?
        }
    }

    async function fetchStaff(bId: string) {
        // staff_business tablosundan personelleri ve user detaylarını çek
        // ÇOKA-ÇOK ilişki: staff_business -> users
        const { data, error } = await supabase
            .from("staff_business")
            .select(`
                id,
                role,
                is_active,
                joined_at,
                user:user_id ( id, name, email, avatar_url, phone )
            `)
            .eq("business_id", bId)

        if (data) {
            // Arama filtresi client-side (Zaten 5-10 personel olur max)
            setStaff(data)
        }
        setLoading(false)
    }

    // Yeni Personel Ekleme Senaryosu: 
    // Önceden kayıtlı kullanıcıyı bulup staff_business'a eklemek B2B SaaS'da zordur.
    // Çözüm 1: E-posta ile davet atmak.
    // Çözüm 2: Owner'ın basit bir "Personel Profili" yaratması (Kendi başına giriş yapamayabilir veya varsayılan şifre atanır).
    // Şimdilik "Gerçek User" oluşturma API'mizi (Sprint 4'te yazdığımız) çağırıp, dönen ID'yi staff_business'a bağlayacağız.

    async function handleAddStaff() {
        if (!addForm.name || !addForm.email) {
            toast.error("İsim ve E-posta zorunludur.")
            return
        }

        if (!businessId) return

        setActionLoading(true)

        // 1. User Oluştur (Sprint 4 - user.actions.ts kullanılıyor varsayalım, burada fetch/api ile de yapılabilir)
        // Hızlıca varsayılan şifre ile ekleyip Supabase public.users'a düşmesini bekleyeceğiz.
        const formData = new FormData()
        formData.append("name", addForm.name)
        formData.append("email", addForm.email)
        formData.append("password", "RandevuX2026!") // Geçici şifre

        try {
            // NOT: Server action'ı Client Component'te import edip kullanabilmek için dosyanın en üstüne "use client" yazdık
            const { createUserAction } = await import('@/app/actions/user.actions');
            const result = await createUserAction(formData);

            if (result.error && !result.error.includes("already registered")) {
                toast.error(result.error)
                setActionLoading(false)
                return
            }

            // User ID'sini al (Yeni eklendiyse result.user.id, zaten varsa e-postadan public.users'dan arat)
            let newUserId = result.user?.id

            if (!newUserId) {
                const { data: existingUser } = await supabase.from('users').select('id').eq('email', addForm.email).single()
                if (existingUser) newUserId = existingUser.id
            }

            if (newUserId) {
                // 2. staff_business tablosuna bağla
                const { error: staffError } = await supabase.from('staff_business').insert({
                    business_id: businessId,
                    user_id: newUserId,
                    role: addForm.role,
                    is_active: true
                })

                if (staffError) {
                    toast.error("Personel işletmeye eklenemedi: " + staffError.message)
                } else {
                    toast.success("Personel başarıyla işletmeye eklendi!")
                    setIsAddModalOpen(false)
                    setAddForm({ name: "", email: "", role: "staff" })
                    fetchStaff(businessId)
                }
            }
        } catch (e: any) {
            toast.error("Hata: " + e.message)
        } finally {
            setActionLoading(false)
        }
    }

    const filteredStaff = staff.filter(s => {
        const u = s.user || {}
        const q = searchQuery.toLowerCase()
        return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q)
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Personel Yönetimi</h2>
                    <p className="text-sm text-muted-foreground">İşletmenizde çalışan personelleri yönetin ve yetkilendirin.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Personel ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <RxButton size="sm" onClick={() => setIsAddModalOpen(true)}>
                        <Plus className="size-4 mr-2" /> Yeni Personel Ekle
                    </RxButton>
                </div>
            </div>

            {/* Personel Listesi / Grid */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : filteredStaff.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary-light mb-4">
                        <Users className="size-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Henüz Personel Eklenmemiş</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
                        İşletmenizden randevu alınabilmesi için müşterilere hizmet verecek en az bir personel eklemelisiniz.
                    </p>
                    <RxButton onClick={() => setIsAddModalOpen(true)}>Personel Ekle</RxButton>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredStaff.map((s) => (
                        <div key={s.id} className="group relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                                <button className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors">
                                    <MoreHorizontal className="size-4" />
                                </button>
                            </div>

                            <div className="flex flex-col items-center text-center mt-2">
                                <RxAvatar name={s.user?.name} src={s.user?.avatar_url} size="lg" className="mb-3" />
                                <h3 className="text-base font-semibold text-foreground line-clamp-1">{s.user?.name || "İsimsiz"}</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{s.user?.email}</p>

                                <div className="mt-4 mb-2 flex flex-wrap justify-center gap-2">
                                    {s.role === 'manager' ? (
                                        <RxBadge variant="purple"><ShieldAlert className="mr-1 size-3" /> Yönetici</RxBadge>
                                    ) : (
                                        <RxBadge variant="gray">Standart Personel</RxBadge>
                                    )}
                                    {s.is_active ? (
                                        <RxBadge variant="success">Aktif</RxBadge>
                                    ) : (
                                        <RxBadge variant="danger">Pasif</RxBadge>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 border-t border-border pt-4 flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="size-3.5" />
                                    Katılım: {new Date(s.joined_at).toLocaleDateString("tr-TR")}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            <RxModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Yeni Personel Ekle"
                footer={
                    <>
                        <RxButton variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} disabled={actionLoading}>
                            İptal
                        </RxButton>
                        <RxButton size="sm" onClick={handleAddStaff} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Personeli Ekle
                        </RxButton>
                    </>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300">
                        Eklediğiniz e-posta adresi sistemde varsa doğrudan işletmenize atanır. Yoksa yepyeni bir personel hesabı açılır.
                    </div>

                    <RxInput
                        label="Ad Soyad"
                        placeholder="Örn: Merve Yılmaz"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        disabled={actionLoading}
                    />
                    <RxInput
                        label="E-posta Adresi"
                        type="email"
                        placeholder="Örn: merve@kuafor.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        disabled={actionLoading}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Yetki Seviyesi</label>
                        <select
                            value={addForm.role}
                            onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            disabled={actionLoading}
                        >
                            <option value="staff">Sadece Kendi Takvimini Görsün (Personel)</option>
                            <option value="manager">Tüm Takvimi ve Ayarları Yönetsin (Yönetici)</option>
                        </select>
                    </div>
                </div>
            </RxModal>
        </div>
    )
}
// users lucide icon import eksikti onuda ekliyorum.
