"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Plus,
    Search,
    Loader2,
    Users,
    Settings2,
    ShieldAlert,
    Calendar,
    ArrowRight,
    Info,
    ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxInput } from "@/src/modules/core/components/rx-input"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { toast } from "sonner"
import { createStaffAction, getStaffPerformanceMetrics, resendStaffInvitationAction } from "@/src/modules/staff/actions/staff-legacy.actions"
import { StaffDetail } from "@/src/modules/staff/components/staff-detail"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Star, MoreVertical, MailCheck, Clock3, ListFilter } from "lucide-react"

export function StaffManagement() {
    const supabase = createClient()
    const [staff, setStaff] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Şimdilik Business ID'yi Mock (Sahte) alıyoruz, Context'ten gelecek.
    // Varsayım: İlk bulduğu işletmeyi kullan
    const [businessId, setBusinessId] = useState<string | null>(null)

    // Detail panel
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null)

    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [addForm, setAddForm] = useState({
        name: "",
        email: "",
        phone: "",
        role: "staff",
        expertiseLevel: "Mid-Level",
        calendarColor: "#3b82f6"
    })

    const [metrics, setMetrics] = useState<Record<string, { totalAppointments: number; averageRating: number }>>({})

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
                created_at,
                expertise_level,
                calendar_color,
                user:user_id ( id, name, email, avatar_url, phone )
            `)
            .eq("business_id", bId)
            .eq("is_deleted", false)

        if (data) {
            // Arama filtresi client-side (Zaten 5-10 personel olur max)
            setStaff(data)
            // Fetch metrics for each staff
            data.forEach(s => fetchMetrics(s.id))
        }
        setLoading(false)
    }

    async function fetchMetrics(staffBusinessId: string) {
        const res = await getStaffPerformanceMetrics(staffBusinessId)
        if (res.success && res.data) {
            setMetrics(prev => ({ ...prev, [staffBusinessId]: res.data }))
        }
    }

    async function handleResendInvite(email: string) {
        const res = await resendStaffInvitationAction(email)
        if (res.success) toast.success("Davet e-postası tekrar gönderildi.")
        else toast.error("Davet gönderilemedi: " + res.error)
    }

    // Yeni Personel Ekleme Senaryosu: 
    // Önceden kayıtlı kullanıcıyı bulup staff_business'a eklemek B2B SaaS'da zordur.
    // Çözüm 1: E-posta ile davet atmak.
    // Çözüm 2: Owner'ın basit bir "Personel Profili" yaratması (Kendi başına giriş yapamayabilir veya varsayılan şifre atanır).
    // Şimdilik "Gerçek User" oluşturma API'mizi (Sprint 4'te yazdığımız) çağırıp, dönen ID'yi staff_business'a bağlayacağız.

    async function handleAddStaff() {
        if (!addForm.name || !addForm.email) {
            toast.error("İsim ve E-posta alanları zorunludur.")
            return
        }

        if (!businessId) return

        setActionLoading(true)

        const formData = new FormData()
        formData.append("name", addForm.name)
        formData.append("email", addForm.email)
        if (addForm.phone.trim()) formData.append("phone", addForm.phone)
        formData.append("businessId", businessId)
        formData.append("role", addForm.role)
        formData.append("expertiseLevel", addForm.expertiseLevel)
        formData.append("calendarColor", addForm.calendarColor)

        try {
            const result = await createStaffAction(formData)

            if (!result.success) {
                toast.error(result.error.message)
                setActionLoading(false)
                return
            }

            toast.success("Personel başarıyla işletmeye eklendi!")
            setIsAddModalOpen(false)
            setAddForm({
                name: "",
                email: "",
                phone: "",
                role: "staff",
                expertiseLevel: "Mid-Level",
                calendarColor: "#3b82f6"
            })
            fetchStaff(businessId)
        } catch (e: any) {
            toast.error("Hata: " + e.message)
        } finally {
            setActionLoading(false)
        }
    }

    const filteredStaff = staff.filter(s => {
        const u = s.user || {}
        const q = searchQuery.toLowerCase()

        // Profil henüz oluşmamışsa (join null ise) ve arama boşsa göster
        // Arama yapılıyorsa sadece bilgisi olanlarda ara
        if (!s.user && searchQuery === "") return true

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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredStaff.map((s) => {
                        const m = metrics[s.id] || { totalAppointments: 0, averageRating: 0 }
                        const u = s.user || {}
                        return (
                            <div
                                key={s.id}
                                className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                            >
                                {/* Color accent bar */}
                                <div
                                    className="h-1.5 w-full"
                                    style={{ backgroundColor: s.calendar_color || '#3b82f6' }}
                                />

                                {/* Quick Actions Dropdown */}
                                <div className="absolute right-3 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border text-muted-foreground hover:text-foreground transition-all hover:scale-105 active:scale-95 shadow-sm">
                                                <MoreVertical className="size-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                                            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hızlı İşlemler</DropdownMenuLabel>
                                            <DropdownMenuSeparator className="my-1" />
                                            <DropdownMenuItem
                                                className="rounded-lg cursor-pointer py-2 text-sm"
                                                onClick={() => handleResendInvite(u.email)}
                                            >
                                                <MailCheck className="mr-3 h-4 w-4 text-blue-500" /> Daveti Tekrar Gönder
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="rounded-lg cursor-pointer py-2 text-sm"
                                                onClick={() => setSelectedStaff(s)}
                                            >
                                                <Clock3 className="mr-3 h-4 w-4 text-emerald-500" /> Çalışma Saatleri
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="rounded-lg cursor-pointer py-2 text-sm text-destructive focus:text-destructive focus:bg-destructive/5"
                                                onClick={() => setSelectedStaff(s)}
                                            >
                                                <ShieldAlert className="mr-3 h-4 w-4" /> Personeli Kaldır
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="flex flex-col p-6">
                                    {/* Avatar & Header */}
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="relative">
                                            <RxAvatar name={u.name} src={u.avatar_url} size="lg" className="ring-2 ring-background border border-border shadow-sm" />
                                            <div className={cn(
                                                "absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-background shadow-sm",
                                                s.is_active ? "bg-emerald-500" : "bg-zinc-400"
                                            )} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-bold text-foreground leading-tight truncate px-0.5">
                                                {u.name || "Profil Bekleniyor..."}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {u.role === 'manager' ? 'Yönetici' : s.expertise_level || 'Personel'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3 mb-5">
                                        <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-2.5 border border-border/50">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Performans</span>
                                            <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm">
                                                <Star className="size-3.5 fill-amber-500" />
                                                {m.averageRating > 0 ? m.averageRating : "Yeni"}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 rounded-xl bg-muted/30 p-2.5 border border-border/50">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Randevu</span>
                                            <div className="text-sm font-bold text-foreground">
                                                {m.totalAppointments} <span className="text-[11px] font-normal text-muted-foreground">Adet</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badges */}
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {s.role === 'manager' && (
                                            <RxBadge variant="purple" className="px-2 py-0.5 text-[10px] font-bold tracking-tight">Yönetici</RxBadge>
                                        )}
                                        {s.is_active ? (
                                            <RxBadge variant="success" className="px-2 py-0.5 text-[10px] font-bold tracking-tight">Aktif</RxBadge>
                                        ) : (
                                            <RxBadge variant="danger" className="px-2 py-0.5 text-[10px] font-bold tracking-tight">Pasif</RxBadge>
                                        )}
                                        <RxBadge variant="gray" className="px-2 py-0.5 text-[10px] font-bold tracking-tight">@{u.email?.split('@')[0]}</RxBadge>
                                    </div>

                                    {/* Action Button */}
                                    <RxButton
                                        variant="secondary"
                                        className="w-full justify-between h-10 group/btn bg-primary/5 border-primary/10 hover:bg-primary hover:text-primary-foreground group-hover:border-primary/20"
                                        onClick={() => setSelectedStaff(s)}
                                    >
                                        <span className="text-xs font-semibold">Profili Yönet</span>
                                        <ArrowRight className="size-3.5 transition-transform group-hover/btn:translate-x-1" />
                                    </RxButton>
                                </div>
                            </div>
                        )
                    })}
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
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 text-sm text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900 flex gap-3">
                        <Info className="size-5 shrink-0" />
                        <p>Personelin e-posta adresine bir **davet linki** gönderilecektir. Personel bu linke tıklayarak kendi şifresini güvenli bir şekilde belirleyecektir.</p>
                    </div>

                    <RxInput
                        label="Ad Soyad"
                        placeholder="Örn: Merve Yılmaz"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        disabled={actionLoading}
                    />
                    <RxInput
                        label="E-posta Adresi *"
                        type="email"
                        placeholder="Örn: merve@kuafor.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        disabled={actionLoading}
                    />
                    <RxInput
                        label="Telefon Numarası (Opsiyonel)"
                        type="tel"
                        placeholder="Örn: +90 555 000 0000"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Uzmanlık Seviyesi</label>
                            <select
                                value={addForm.expertiseLevel}
                                onChange={(e) => setAddForm({ ...addForm, expertiseLevel: e.target.value })}
                                className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={actionLoading}
                            >
                                <option value="Junior">Junior</option>
                                <option value="Mid-Level">Mid-Level</option>
                                <option value="Senior">Senior</option>
                                <option value="Master">Master</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Takvim Rengi</label>
                            <div className="flex flex-wrap gap-2">
                                {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setAddForm({ ...addForm, calendarColor: color })}
                                        className={`size-6 rounded-full border-2 transition-all ${addForm.calendarColor === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"}`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </RxModal>

            {/* Staff Detail Side-Panel */}
            {selectedStaff && businessId && (
                <StaffDetail
                    staff={selectedStaff}
                    businessId={businessId}
                    onClose={() => setSelectedStaff(null)}
                />
            )}
        </div>
    )
}
