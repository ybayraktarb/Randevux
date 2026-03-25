"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
    X, Loader2, User, Wrench, Clock, Plus, Trash2, Check, ShieldAlert,
    Phone, Mail, Calendar, Save, ArrowLeft, ChevronDown, Umbrella, CalendarOff, CheckCircle2, XCircle, Info, ListFilter
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    assignStaffServiceAction,
    removeStaffServiceAction,
    updateStaffServiceAction,
} from "@/src/modules/staff/actions/service-assignment.actions"
import {
    updateStaffWorkSchedulesAction,
    updateStaffBreaksAction,
    type WorkSchedule,
    type BreakSchedule,
} from "@/src/modules/staff/actions/schedule.actions"
import {
    addStaffLeaveAction,
    removeStaffLeaveAction,
    getStaffLeavesAction,
    reviewStaffLeaveAction,
    type LeaveRecord,
    type LeaveType,
} from "@/src/modules/staff/actions/leave.actions"
import {
    updateStaffDetailAction,
    getStaffFutureAppointmentsCount,
    getActiveStaffForTransfer,
    transferStaffAppointmentsAction,
    deleteStaffAction
} from "@/src/modules/staff/actions/staff-legacy.actions"

// ─── types ────────────────────────────────────────────────────

type StaffUser = {
    id: string
    name: string | null
    email: string | null
    avatar_url: string | null
    phone: string | null
}

type StaffRecord = {
    id: string                // staff_business.id
    business_id?: string
    role: string
    is_active: boolean
    created_at: string
    expertise_level: string | null
    calendar_color: string | null
    user: StaffUser | null
}

type Service = {
    id: string
    name: string
    base_duration_minutes: number
    base_price: number
    is_active: boolean
}

type StaffService = {
    id: string
    service_id: string
    custom_price: number | null
    custom_duration_minutes: number | null
    is_active: boolean
}

const DAYS: { key: number; label: string; short: string }[] = [
    { key: 1, label: "Pazartesi", short: "Pzt" },
    { key: 2, label: "Salı", short: "Sal" },
    { key: 3, label: "Çarşamba", short: "Çar" },
    { key: 4, label: "Perşembe", short: "Per" },
    { key: 5, label: "Cuma", short: "Cum" },
    { key: 6, label: "Cumartesi", short: "Cmt" },
    { key: 0, label: "Pazar", short: "Paz" },
]

// ─── main component ───────────────────────────────────────────

interface StaffDetailProps {
    staff: StaffRecord
    businessId: string
    onClose: () => void
}

export function StaffDetail({ staff, businessId, onClose }: Readonly<StaffDetailProps>) {
    const supabase = createClient()
    const [activeTab, setActiveTab] = useState<"profile" | "services" | "schedule" | "leaves">("profile")

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-foreground/40 animate-in fade-in duration-200"
                onClick={onClose}
            />
            {/* Panel */}
            <div className="relative ml-auto flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border px-6 py-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="flex items-center gap-3 min-w-0">
                        <RxAvatar name={staff.user?.name ?? undefined} src={staff.user?.avatar_url ?? undefined} size="md" />
                        <div className="min-w-0">
                            <h2 className="text-base font-semibold text-foreground truncate">
                                {staff.user?.name || "Profil Bekleniyor..."}
                            </h2>
                            <p className="text-xs text-muted-foreground truncate">{staff.user?.email || ""}</p>
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-2 shrink-0">
                        <RxBadge variant={staff.role === "manager" ? "purple" : "gray"}>
                            {staff.role === "manager" ? "Yönetici" : "Personel"}
                        </RxBadge>
                        <RxBadge variant={staff.is_active ? "success" : "danger"}>
                            {staff.is_active ? "Aktif" : "Pasif"}
                        </RxBadge>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border px-6 pt-3 shrink-0 overflow-x-auto">
                    {([
                        { key: "profile", label: "Profil", icon: User },
                        { key: "services", label: "Hizmetler", icon: Wrench },
                        { key: "schedule", label: "Çalışma Saatleri", icon: Clock },
                        { key: "leaves", label: "İzinler", icon: Umbrella },
                    ] as const).map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {activeTab === "profile" && (
                        <ProfileTab staff={staff} onClose={onClose} />
                    )}
                    {activeTab === "services" && (
                        <ServicesTab
                            staffBusinessId={staff.id}
                            businessId={businessId}
                            supabase={supabase}
                        />
                    )}
                    {activeTab === "schedule" && (
                        <ScheduleTab
                            staffBusinessId={staff.id}
                            supabase={supabase}
                        />
                    )}
                    {activeTab === "leaves" && (
                        <LeaveTab staffBusinessId={staff.id} />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Profile Tab ──────────────────────────────────────────────

function ProfileTab({ staff, onClose }: Readonly<{ staff: StaffRecord; onClose: () => void }>) {
    const u = staff.user
    const [activeStaff, setActiveStaff] = useState<{ id: string; user: { name: string } }[]>([])
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
    const [targetStaffId, setTargetStaffId] = useState<string>("")
    const [isTransferring, setIsTransferring] = useState(false)

    // Randevu aktarımı için personelleri yükle
    const loadActiveStaff = async () => {
        if (!staff.business_id) return
        const res = await getActiveStaffForTransfer(staff.business_id, staff.id)
        if (res.success && res.data) {
            setActiveStaff(res.data as any)
        }
    }

    const handleTransfer = async () => {
        if (!targetStaffId) {
            toast.error("Lütfen randevuların aktarılacağı personeli seçin.")
            return
        }
        setIsTransferring(true)
        const res = await transferStaffAppointmentsAction(staff.id, targetStaffId, staff.business_id!)
        if (res.success) {
            toast.success(`${res.data?.count} randevu başarıyla aktarıldı.`)
            setIsTransferModalOpen(false)
        } else {
            toast.error(res.error?.message || "Aktarım başarısız oldu.")
        }
        setIsTransferring(false)
    }
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-3 py-4">
                <RxAvatar name={u?.name ?? undefined} src={u?.avatar_url ?? undefined} size="lg" />
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-foreground">{u?.name || "İsim yok"}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {staff.role === "manager" ? "Yönetici" : "Standart Personel"}
                    </p>
                </div>
            </div>

            <div className="grid gap-3">
                {u?.email && (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                        <Mail className="size-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">E-posta</p>
                            <p className="text-sm font-medium text-foreground">{u.email}</p>
                        </div>
                    </div>
                )}
                {u?.phone && (
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                        <Phone className="size-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">Telefon</p>
                            <p className="text-sm font-medium text-foreground">{u.phone}</p>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
                    <Calendar className="size-4 text-muted-foreground shrink-0" />
                    <div>
                        <p className="text-xs text-muted-foreground">Eklenme Tarihi</p>
                        <p className="text-sm font-medium text-foreground">
                            {new Date(staff.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6">
                <h4 className="text-sm font-semibold text-foreground">Görsel Kimlik ve Uzmanlık</h4>
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Uzmanlık Seviyesi</label>
                        <select
                            defaultValue={staff.expertise_level || "Mid-Level"}
                            onChange={async (e) => {
                                const res = await updateStaffDetailAction(staff.id, { expertise_level: e.target.value })
                                if (res.success) toast.success("Uzmanlık güncellendi.")
                                else toast.error(res.error?.message || "Hata")
                            }}
                            className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
                                    onClick={async () => {
                                        const res = await updateStaffDetailAction(staff.id, { calendar_color: color })
                                        if (res.success) toast.success("Renk güncellendi.")
                                        else toast.error(res.error?.message || "Hata")
                                    }}
                                    className={`size-8 rounded-full border-2 transition-all ${(staff.calendar_color || "#3b82f6") === color ? "border-foreground scale-110 shadow-sm" : "border-transparent"}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4 border-t border-border pt-6 mb-8">
                <h4 className="text-sm font-semibold text-foreground">Durum Yönetimi</h4>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium text-foreground">Personel Durumu</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {staff.is_active ? "Personel şu an aktif ve randevu alabilir." : "Personel pasif durumda, randevu alınamaz."}
                            </p>
                        </div>
                        <button
                            onClick={async () => {
                                if (staff.is_active) {
                                    // Deactivating: check future appointments
                                    const resCount = await getStaffFutureAppointmentsCount(staff.id)
                                    if (resCount.success && (resCount.count ?? 0) > 0) {
                                        if (!confirm(`Bu personelin gelecekte ${resCount.count} adet randevusu bulunmaktadır. Pasife alırsanız bu randevular için takvimde boşluk görünebilir ancak personel yeni randevu alamaz. Devam etmek istiyor musunuz?`)) {
                                            return
                                        }
                                    }
                                }

                                const res = await updateStaffDetailAction(staff.id, { is_active: !staff.is_active })
                                if (res.success) toast.success(staff.is_active ? "Personel pasife alındı." : "Personel aktifleştirildi.")
                                else toast.error(res.error?.message || "Durum güncellenemedi.")
                            }}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${staff.is_active ? "bg-success" : "bg-muted"}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${staff.is_active ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {!staff.is_active && (
                        <Alert variant="destructive" className="mt-4 bg-danger/5 border-danger/20">
                            <Info className="size-4" />
                            <AlertTitle>Personel Pasif</AlertTitle>
                            <AlertDescription>
                                Personel pasif durumdayken müşteriler bu personelden randevu alamazlar.
                                Takvimde bu personel için ayrılmış saatler gizlenecektir.
                            </AlertDescription>
                        </Alert>
                    )}

                    {staff.is_active && (
                        <div className="mt-4">
                            <RxButton
                                variant="secondary"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                    loadActiveStaff()
                                    setIsTransferModalOpen(true)
                                }}
                            >
                                <ListFilter className="mr-2 h-4 w-4" /> Randevuları Başka Personele Aktar
                            </RxButton>
                        </div>
                    )}

                    {/* Transfer Modal */}
                    <RxModal
                        open={isTransferModalOpen}
                        onClose={() => setIsTransferModalOpen(false)}
                        title="Randevuları Aktar"
                        footer={
                            <div className="flex gap-2">
                                <RxButton variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Vazgeç</RxButton>
                                <RxButton
                                    onClick={handleTransfer}
                                    disabled={!targetStaffId || isTransferring}
                                >
                                    {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Aktarımı Onayla
                                </RxButton>
                            </div>
                        }
                    >
                        <div className="space-y-4">
                            <Alert className="bg-blue-50/50 border-blue-100">
                                <Info className="size-4 text-blue-500" />
                                <AlertTitle>Bilgi</AlertTitle>
                                <AlertDescription>
                                    Bu işlem, personelin bugünden sonraki tüm "Bekliyor" ve "Onaylandı" durumundaki randevularını seçeceğiniz kişiye aktarır.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Hedef Personel Seçin</label>
                                {activeStaff.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-2 italic">Aktarım yapılabilecek başka aktif personel bulunamadı.</p>
                                ) : (
                                    <div className="grid gap-2">
                                        {activeStaff.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setTargetStaffId(s.id)}
                                                className={cn(
                                                    "flex items-center justify-between p-3 rounded-xl border text-sm transition-all text-left",
                                                    targetStaffId === s.id
                                                        ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary"
                                                        : "bg-card border-border hover:border-primary/40"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <RxAvatar name={s.user.name} size="sm" />
                                                    <span className="font-semibold">{s.user.name}</span>
                                                </div>
                                                {targetStaffId === s.id && <CheckCircle2 className="size-4 text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </RxModal>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="flex flex-col gap-4 border-t border-border pt-6 mt-2">
                <div className="flex items-center gap-2 px-1">
                    <ShieldAlert className="size-4 text-destructive" />
                    <h4 className="text-sm font-semibold text-destructive">Tehlikeli Alan</h4>
                </div>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                    <p className="text-xs text-destructive/80 mb-4 leading-relaxed">
                        Personeli kaldırmak, onun işletme ile olan tüm bağını koparır. Geçmiş randevular raporlarda görünmeye devam eder ancak personel paneline erişemez ve yeni randevu alamaz.
                    </p>
                    <RxButton
                        variant="ghost"
                        size="sm"
                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border border-destructive/20"
                        onClick={async () => {
                            const resCount = await getStaffFutureAppointmentsCount(staff.id)
                            if (resCount.success && (resCount.count ?? 0) > 0) {
                                toast.error(`Bu personelin gelecekte ${resCount.count} randevusu var. Lütfen önce bu randevuları aktarın.`)
                                return
                            }

                            if (confirm(`${staff.user?.name} isimli personeli kalıcı olarak kaldırmak istediğinize emin misiniz?`)) {
                                const res = await deleteStaffAction(staff.id)
                                if (res.success) {
                                    toast.success("Personel başarıyla kaldırıldı.")
                                    onClose()
                                } else {
                                    toast.error(res.error?.message || "Kaldırma işlemi sırasında bir hata oluştu.")
                                }
                            }
                        }}
                    >
                        <Trash2 className="mr-2 size-4" /> Personeli İşletmeden Kaldır
                    </RxButton>
                </div>
            </div>
        </div>
    )
}

// ─── Services Tab ─────────────────────────────────────────────

function ServicesTab({
    staffBusinessId,
    businessId,
    supabase,
}: Readonly<{
    staffBusinessId: string
    businessId: string
    supabase: ReturnType<typeof createClient>
}>) {
    const [allServices, setAllServices] = useState<Service[]>([])
    const [assignedServices, setAssignedServices] = useState<StaffService[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    // custom price/duration edit state: { [serviceId]: { price, duration } }
    const [editingCustom, setEditingCustom] = useState<Record<string, { price: string; duration: string }>>({})

    const load = useCallback(async () => {
        setLoading(true)
        const [{ data: services }, { data: staffSvc }] = await Promise.all([
            supabase
                .from("services")
                .select("id, name, base_duration_minutes, base_price, is_active")
                .eq("business_id", businessId)
                .eq("is_active", true)
                .order("name"),
            supabase
                .from("staff_services")
                .select("id, service_id, custom_price, custom_duration_minutes, is_active")
                .eq("staff_business_id", staffBusinessId),
        ])
        setAllServices(services || [])
        setAssignedServices(staffSvc || [])
        setLoading(false)
    }, [staffBusinessId, businessId, supabase])

    useEffect(() => { load() }, [load])

    const isAssigned = (serviceId: string) =>
        assignedServices.some((s) => s.service_id === serviceId)

    async function toggleService(serviceId: string) {
        const already = isAssigned(serviceId)
        setSaving(serviceId)
        if (already) {
            const res = await removeStaffServiceAction(staffBusinessId, serviceId)
            if (res.success) {
                toast.success("Hizmet kaldırıldı.")
                setAssignedServices((prev) => prev.filter((s) => s.service_id !== serviceId))
            } else {
                toast.error(res.error?.message || "Hata")
            }
        } else {
            const res = await assignStaffServiceAction(staffBusinessId, serviceId)
            if (res.success) {
                toast.success("Hizmet atandı.")
                load()
            } else {
                toast.error(res.error?.message || "Hata")
            }
        }
        setSaving(null)
    }

    async function saveCustom(serviceId: string) {
        const val = editingCustom[serviceId]
        if (!val) return
        const price = val.price !== "" ? Number(val.price) : null
        const duration = val.duration !== "" ? Number(val.duration) : null
        setSaving(serviceId)
        const res = await updateStaffServiceAction(staffBusinessId, serviceId, price, duration)
        if (res.success) {
            toast.success("Özel fiyat/süre kaydedildi.")
            load()
            setEditingCustom((prev) => {
                const n = { ...prev }
                delete n[serviceId]
                return n
            })
        } else {
            toast.error(res.error?.message || "Hata")
        }
        setSaving(null)
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
    }

    const serviceMap = Object.fromEntries(assignedServices.map((s) => [s.service_id, s]))

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300">
                İşaretlediğiniz hizmetleri bu personel verebilir. Özel fiyat veya süre girmezseniz, hizmetin varsayılan değerleri kullanılır.
            </div>

            {allServices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                    Henüz işletmede tanımlanmış hizmet yok. Önce hizmet oluşturun.
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {allServices.map((svc) => {
                        const assigned = isAssigned(svc.id)
                        const staffSvc = serviceMap[svc.id]
                        const isEditing = !!editingCustom[svc.id]
                        return (
                            <div
                                key={svc.id}
                                className={`rounded-xl border transition-all ${assigned
                                    ? "border-primary/40 bg-primary-light/30 dark:bg-primary/10"
                                    : "border-border bg-card"
                                    }`}
                            >
                                <div className="flex items-center gap-3 p-4">
                                    {/* Checkbox */}
                                    <button
                                        onClick={() => toggleService(svc.id)}
                                        disabled={saving === svc.id}
                                        className={`size-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors ${assigned
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : "border-border bg-card hover:border-primary"
                                            }`}
                                    >
                                        {saving === svc.id
                                            ? <Loader2 className="size-3 animate-spin" />
                                            : assigned ? <Check className="size-3" /> : null}
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground">{svc.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Varsayılan: {svc.base_duration_minutes} dk · ₺{Number(svc.base_price).toFixed(2)}
                                        </p>
                                    </div>

                                    {/* Custom values badge */}
                                    {assigned && staffSvc && (
                                        <div className="flex items-center gap-2 shrink-0">
                                            {staffSvc.custom_duration_minutes && (
                                                <RxBadge variant="warning">{staffSvc.custom_duration_minutes} dk</RxBadge>
                                            )}
                                            {staffSvc.custom_price != null && (
                                                <RxBadge variant="success">₺{Number(staffSvc.custom_price).toFixed(0)}</RxBadge>
                                            )}
                                            <button
                                                onClick={() =>
                                                    setEditingCustom((prev) => ({
                                                        ...prev,
                                                        [svc.id]: {
                                                            price: staffSvc.custom_price?.toString() ?? "",
                                                            duration: staffSvc.custom_duration_minutes?.toString() ?? "",
                                                        },
                                                    }))
                                                }
                                                className="text-xs text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                                            >
                                                Özelleştir
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Custom edit row */}
                                {assigned && isEditing && (
                                    <div className="border-t border-border px-4 py-3 flex items-center gap-3 flex-wrap bg-muted/40 rounded-b-xl">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs text-muted-foreground w-14 shrink-0">Süre (dk)</label>
                                            <input
                                                type="number"
                                                min={5}
                                                placeholder={svc.base_duration_minutes.toString()}
                                                value={editingCustom[svc.id].duration}
                                                onChange={(e) =>
                                                    setEditingCustom((prev) => ({
                                                        ...prev,
                                                        [svc.id]: { ...prev[svc.id], duration: e.target.value },
                                                    }))
                                                }
                                                className="h-8 w-20 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs text-muted-foreground w-14 shrink-0">Fiyat (₺)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                placeholder={svc.base_price.toString()}
                                                value={editingCustom[svc.id].price}
                                                onChange={(e) =>
                                                    setEditingCustom((prev) => ({
                                                        ...prev,
                                                        [svc.id]: { ...prev[svc.id], price: e.target.value },
                                                    }))
                                                }
                                                className="h-8 w-24 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="flex gap-2 ml-auto">
                                            <button
                                                onClick={() =>
                                                    setEditingCustom((prev) => {
                                                        const n = { ...prev }; delete n[svc.id]; return n
                                                    })
                                                }
                                                className="text-xs text-muted-foreground hover:text-foreground"
                                            >
                                                İptal
                                            </button>
                                            <RxButton size="sm" onClick={() => saveCustom(svc.id)} loading={saving === svc.id}>
                                                <Save className="size-3" /> Kaydet
                                            </RxButton>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Schedule Tab ─────────────────────────────────────────────

type DaySchedule = {
    day_of_week: number
    is_working: boolean
    start_time: string
    end_time: string
}

type BreakBlock = BreakSchedule & { _id?: string }

function ScheduleTab({
    staffBusinessId,
    supabase,
}: Readonly<{
    staffBusinessId: string
    supabase: ReturnType<typeof createClient>
}>) {
    const defaultSchedule: DaySchedule[] = DAYS.map((d) => ({
        day_of_week: d.key,
        is_working: d.key !== 0, // Pazar kapalı varsayılan
        start_time: "09:00",
        end_time: "18:00",
    }))

    const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule)
    const [breaks, setBreaks] = useState<BreakBlock[]>([])
    const [loading, setLoading] = useState(true)
    const [savingSchedule, setSavingSchedule] = useState(false)
    const [savingBreaks, setSavingBreaks] = useState(false)
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const [{ data: wst }, { data: bks }] = await Promise.all([
                supabase
                    .from("work_schedule_templates")
                    .select("day_of_week, is_working, start_time, end_time")
                    .eq("staff_business_id", staffBusinessId),
                supabase
                    .from("break_schedules")
                    .select("day_of_week, start_time, end_time, label")
                    .eq("staff_business_id", staffBusinessId),
            ])

            if (wst && wst.length > 0) {
                // Merge with defaults: fill any missing days
                const merged = defaultSchedule.map((def) => {
                    const found = wst.find((w) => w.day_of_week === def.day_of_week)
                    return found
                        ? { ...def, is_working: found.is_working, start_time: found.start_time, end_time: found.end_time }
                        : def
                })
                setSchedule(merged)
            }

            if (bks) {
                setBreaks(bks.map((b, i) => ({ ...b, _id: `${i}` })))
            }
            setLoading(false)
        }
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staffBusinessId])

    function updateDay(dayKey: number, field: keyof DaySchedule, value: any) {
        setSchedule((prev) =>
            prev.map((d) => (d.day_of_week === dayKey ? { ...d, [field]: value } : d))
        )
    }

    function addBreak() {
        setBreaks((prev) => [
            ...prev,
            { day_of_week: 1, start_time: "12:00", end_time: "13:00", label: "Öğle Molası", _id: Date.now().toString() },
        ])
    }

    function removeBreak(id: string) {
        setBreaks((prev) => prev.filter((b) => b._id !== id))
    }

    function updateBreak(id: string, field: keyof BreakBlock, value: any) {
        setBreaks((prev) => prev.map((b) => (b._id === id ? { ...b, [field]: value } : b)))
    }

    function handleBulkSync(sourceDayKey: number, targetKeys: number[], opts: { hours: boolean; breaks: boolean }) {
        const sourceSchedule = schedule.find(d => d.day_of_week === sourceDayKey)
        if (!sourceSchedule) return

        setSchedule(prev => prev.map(d => {
            if (targetKeys.includes(d.day_of_week) && opts.hours) {
                return { ...d, start_time: sourceSchedule.start_time, end_time: sourceSchedule.end_time, is_working: sourceSchedule.is_working }
            }
            return d
        }))

        if (opts.breaks) {
            const sourceBreaks = breaks.filter(b => b.day_of_week === sourceDayKey)
            setBreaks(prev => {
                // Remove existing breaks from target days
                const filtered = prev.filter(b => !targetKeys.includes(b.day_of_week))
                // Add new breaks for each target day
                const newBreaks: BreakBlock[] = []
                targetKeys.forEach(tKey => {
                    sourceBreaks.forEach(sb => {
                        newBreaks.push({
                            ...sb,
                            day_of_week: tKey,
                            _id: Math.random().toString(36).substr(2, 9)
                        })
                    })
                })
                return [...filtered, ...newBreaks]
            })
        }
        toast.success("Seçilen günlere bilgiler kopyalandı.")
    }

    async function saveSchedule() {
        setSavingSchedule(true)
        const res = await updateStaffWorkSchedulesAction(staffBusinessId, schedule)
        if (res.success) toast.success("Çalışma saatleri kaydedildi.")
        else toast.error(res.error?.message || "Hata")
        setSavingSchedule(false)
    }

    async function saveBreaks() {
        setSavingBreaks(true)
        const res = await updateStaffBreaksAction(staffBusinessId, breaks)
        if (res.success) toast.success("Mola saatleri kaydedildi.")
        else toast.error(res.error?.message || "Hata")
        setSavingBreaks(false)
    }

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-col gap-8">
            {/* ── Weekly schedule ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Haftalık Çalışma Programı</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Personelin çalışmadığı günleri kapatın.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsSyncModalOpen(true)}
                            className="text-xs text-primary hover:underline"
                        >
                            Çalışma Saatlerini Eşitle
                        </button>
                        <RxButton size="sm" onClick={saveSchedule} loading={savingSchedule}>
                            <Save className="size-3.5" /> Kaydet
                        </RxButton>
                    </div>
                </div>

                <SyncModal
                    isOpen={isSyncModalOpen}
                    onClose={() => setIsSyncModalOpen(false)}
                    currentSchedule={schedule}
                    currentBreaks={breaks}
                    onSync={(sourceDayKey, targetKeys, opts) => handleBulkSync(sourceDayKey, targetKeys, opts)}
                />

                {/* Quick Sync Actions */}
                <div className="flex items-center gap-2 mb-3">
                    <button
                        onClick={() => handleBulkSync(1, [2, 3, 4, 5], { hours: true, breaks: true })}
                        className="text-[11px] font-medium bg-primary/5 text-primary border border-primary/10 px-2.5 py-1 rounded-full hover:bg-primary hover:text-white transition-all"
                    >
                        Pazartesi'yi Hafta İçi Tüm Günlere Uygula
                    </button>
                    <button
                        onClick={() => handleBulkSync(1, [0, 2, 3, 4, 5, 6], { hours: true, breaks: true })}
                        className="text-[11px] font-medium bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-full hover:bg-muted-foreground hover:text-white transition-all"
                    >
                        Pazartesi'yi Tüm Haftaya Uygula
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {DAYS.map((day) => {
                        const s = schedule.find((d) => d.day_of_week === day.key)!
                        return (
                            <div
                                key={day.key}
                                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-all ${s.is_working ? "border-border bg-card" : "border-dashed border-border/60 bg-muted/30 opacity-60"
                                    }`}
                            >
                                {/* Toggle */}
                                <button
                                    onClick={() => updateDay(day.key, "is_working", !s.is_working)}
                                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${s.is_working ? "bg-primary" : "bg-muted-foreground/40"
                                        }`}
                                >
                                    <span
                                        className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${s.is_working ? "translate-x-4" : "translate-x-0.5"
                                            }`}
                                    />
                                </button>
                                <span className="w-24 text-sm font-medium text-foreground">{day.label}</span>
                                {s.is_working ? (
                                    <div className="ml-auto flex items-center gap-2">
                                        <input
                                            type="time"
                                            value={s.start_time}
                                            onChange={(e) => updateDay(day.key, "start_time", e.target.value)}
                                            className="h-8 rounded-md border border-input bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                        <span className="text-muted-foreground text-xs">—</span>
                                        <input
                                            type="time"
                                            value={s.end_time}
                                            onChange={(e) => updateDay(day.key, "end_time", e.target.value)}
                                            className="h-8 rounded-md border border-input bg-card px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                ) : (
                                    <span className="ml-auto text-xs text-muted-foreground">İzinli / Kapalı</span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* ── Break blocks ── */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Mola Blokları</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Tanımlanan saatlere randevu alınmasını sistem otomatik engeller.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <RxButton variant="secondary" size="sm" onClick={addBreak}>
                            <Plus className="size-3.5" /> Mola Ekle
                        </RxButton>
                        <RxButton size="sm" onClick={saveBreaks} loading={savingBreaks}>
                            <Save className="size-3.5" /> Kaydet
                        </RxButton>
                    </div>
                </div>

                {breaks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
                        Henüz mola tanımlanmadı. Mola eklemek için butonu kullanın.
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {breaks.map((b) => (
                            <div
                                key={b._id}
                                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 flex-wrap"
                            >
                                {/* Day select */}
                                <div className="relative">
                                    <select
                                        value={b.day_of_week}
                                        onChange={(e) => updateBreak(b._id!, "day_of_week", Number(e.target.value))}
                                        className="h-8 rounded-md border border-input bg-card pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                                    >
                                        {DAYS.map((d) => (
                                            <option key={d.key} value={d.key}>{d.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                                </div>
                                <input
                                    type="time"
                                    value={b.start_time}
                                    onChange={(e) => updateBreak(b._id!, "start_time", e.target.value)}
                                    className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <span className="text-muted-foreground text-xs">—</span>
                                <input
                                    type="time"
                                    value={b.end_time}
                                    onChange={(e) => updateBreak(b._id!, "end_time", e.target.value)}
                                    className="h-8 rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <input
                                    type="text"
                                    value={b.label}
                                    onChange={(e) => updateBreak(b._id!, "label", e.target.value)}
                                    placeholder="Etiket (Öğle molası vb.)"
                                    className="h-8 flex-1 min-w-[100px] rounded-md border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    onClick={() => removeBreak(b._id!)}
                                    className="ml-auto p-1.5 text-muted-foreground hover:text-destructive hover:bg-badge-red-bg rounded-md transition-colors"
                                >
                                    <Trash2 className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

// ─── Leave Tab ─────────────────────────────────────

function LeaveTab({ staffBusinessId }: { staffBusinessId: string }) {
    const [leaves, setLeaves] = useState<LeaveRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Form
    const today = new Date().toISOString().split("T")[0]
    const [form, setForm] = useState<{
        date: string
        requestType: LeaveType
        startTime: string
        endTime: string
        reason: string
    }>({
        date: today,
        requestType: "full_day",
        startTime: "09:00",
        endTime: "10:00",
        reason: "",
    })

    const load = useCallback(async () => {
        setLoading(true)
        const res = await getStaffLeavesAction(staffBusinessId)
        if (res.success) setLeaves(res.data || [])
        setLoading(false)
    }, [staffBusinessId])

    useEffect(() => { load() }, [load])

    async function handleAdd() {
        if (!form.date) { toast.error("Lütfen bir tarih seçin."); return }
        if (form.requestType === "partial" && (!form.startTime || !form.endTime)) {
            toast.error("Kısmi izin için başlangıç ve bitiş saati gereklidir."); return
        }
        setSaving(true)
        const res = await addStaffLeaveAction({
            staffBusinessId,
            requestType: form.requestType,
            date: form.date,
            startTime: form.requestType === "partial" ? form.startTime : null,
            endTime: form.requestType === "partial" ? form.endTime : null,
            reason: form.reason || undefined,
        })
        if (res.success) {
            toast.success("İzin günü kaydedildi.")
            setForm({ date: today, requestType: "full_day", startTime: "09:00", endTime: "10:00", reason: "" })
            load()
        } else {
            toast.error(res.error?.message || "Hata")
        }
        setSaving(false)
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const res = await removeStaffLeaveAction(id)
        if (res.success) {
            toast.success("İzin silindi.")
            setLeaves(prev => prev.filter(l => l.id !== id))
        } else {
            toast.error(res.error?.message || "Hata")
        }
        setDeletingId(null)
    }

    async function handleReview(id: string, status: "approved" | "rejected") {
        setSaving(true)
        const res = await reviewStaffLeaveAction(id, status)
        if (res.success) {
            toast.success(status === "approved" ? "İzin onaylandı." : "İzin reddedildi.")
            load()
        } else {
            toast.error(res.error?.message || "Hata")
        }
        setSaving(false)
    }

    const pendingLeaves = leaves.filter(l => l.status === "pending")
    const historyLeaves = leaves.filter(l => l.status !== "pending")

    const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
        approved: { label: "Onaylı", variant: "success" },
        pending: { label: "Beklemede", variant: "warning" },
        rejected: { label: "Reddedildi", variant: "danger" },
    }

    return (
        <div className="flex flex-col gap-8">
            {/* ── Add form ── */}
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Yeni İzin / Tatil Kaydı</h3>
                <p className="text-xs text-muted-foreground -mt-3">Patron tarafından eklenen izinler doğrudan onaylı sayılır.</p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Tarih</label>
                        <input
                            type="date"
                            value={form.date}
                            min={today}
                            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Tip</label>
                        <div className="relative">
                            <select
                                value={form.requestType}
                                onChange={e => setForm(f => ({ ...f, requestType: e.target.value as LeaveType }))}
                                className="h-9 w-full rounded-md border border-input bg-background pl-3 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
                            >
                                <option value="full_day">Tüm Gün İzin</option>
                                <option value="partial">Kısmi Blok</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>
                </div>

                {form.requestType === "partial" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Başlangıç</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-muted-foreground">Bitiş</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Açıklama (Opsiyonel)</label>
                    <input
                        type="text"
                        placeholder="Örn: Yıllık izin, hastalık, mazeret..."
                        value={form.reason}
                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <RxButton size="sm" onClick={handleAdd} loading={saving}>
                    <Plus className="size-3.5" /> İzin Ekle
                </RxButton>
            </div>

            {/* ── Pending Requests ── */}
            {pendingLeaves.length > 0 && (
                <section className="flex flex-col gap-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Onay Bekleyen Talepler</h3>
                    <div className="grid gap-3">
                        {pendingLeaves.map(l => (
                            <div key={l.id} className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-9 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                                            <Clock className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold">{new Date(l.date).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                            <p className="text-xs text-muted-foreground">{l.request_type === 'full_day' ? 'Tüm Gün' : `${l.start_time} - ${l.end_time}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            disabled={saving}
                                            onClick={() => handleReview(l.id, "rejected")}
                                            className="px-3 py-1.5 rounded-lg border border-danger/50 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                                        >
                                            Reddet
                                        </button>
                                        <button
                                            disabled={saving}
                                            onClick={async () => {
                                                // Check for appointments before approving
                                                const supabase = createClient()
                                                const { count, error: aptError } = await supabase
                                                    .from("appointments")
                                                    .select("id", { count: "exact", head: true })
                                                    .eq("staff_business_id", staffBusinessId)
                                                    .eq("appointment_date", l.date)
                                                    .not("status", "in", '("İptal", "Gelmedi")')

                                                if (!aptError && count && count > 0) {
                                                    if (!confirm(`Bu gün için ${count} adet aktif randevu bulunmaktadır. İzni onaylarsanız bu randevuların iptal edilmesi veya aktarılması gerekecektir. Devam etmek istiyor musunuz?`)) {
                                                        return
                                                    }
                                                }
                                                handleReview(l.id, "approved")
                                            }}
                                            className="px-3 py-1.5 rounded-lg bg-success text-xs font-medium text-white hover:bg-success/90 transition-colors"
                                        >
                                            Onayla
                                        </button>
                                    </div>
                                </div>
                                {l.reason && (
                                    <p className="text-xs italic text-muted-foreground px-1 border-l-2 border-warning/30">{l.reason}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── History ── */}
            <section className="flex flex-col gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">İzin Geçmişi</h3>
                {historyLeaves.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-border bg-muted/30">
                        <Umbrella className="size-8 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">Herhangi bir izin geçmişi bulunamadı.</p>
                    </div>
                ) : (
                    <div className="grid gap-2">
                        {historyLeaves.map((l) => {
                            const st = statusMap[l.status] || statusMap.pending
                            return (
                                <div
                                    key={l.id}
                                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`size-8 rounded-full flex items-center justify-center ${l.status === 'approved' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                            {l.status === 'approved' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-foreground">
                                                    {new Date(l.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                                                </p>
                                                <RxBadge variant={st.variant}>
                                                    {st.label}
                                                </RxBadge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {l.request_type === "full_day" ? "Tüm Gün" : `${l.start_time} - ${l.end_time}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={deletingId === l.id}
                                            onClick={() => handleDelete(l.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            {deletingId === l.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

// ─── Sync Modal Component ─────────────────────────────────────
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

type SyncModalProps = {
    isOpen: boolean
    onClose: () => void
    currentSchedule: DaySchedule[]
    currentBreaks: BreakBlock[]
    onSync: (sourceDayKey: number, targetKeys: number[], opts: { hours: boolean; breaks: boolean }) => void
}

function SyncModal({ isOpen, onClose, currentSchedule, currentBreaks, onSync }: SyncModalProps) {
    const [sourceDayKey, setSourceDayKey] = useState<number>(1) // Default to Monday
    const [targetDays, setTargetDays] = useState<number[]>([])
    const [syncHours, setSyncHours] = useState(true)
    const [syncBreaks, setSyncBreaks] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setSourceDayKey(1); // Reset to Monday on open
            setTargetDays([]);
            setSyncHours(true);
            setSyncBreaks(true);
        }
    }, [isOpen]);

    const handleTargetDayChange = (dayKey: number, checked: boolean) => {
        if (checked) {
            setTargetDays(prev => [...prev, dayKey]);
        } else {
            setTargetDays(prev => prev.filter(key => key !== dayKey));
        }
    };

    const handleSync = () => {
        if (targetDays.length === 0) {
            toast.error("Lütfen en az bir hedef gün seçin.");
            return;
        }
        if (!syncHours && !syncBreaks) {
            toast.error("Lütfen eşitlemek için saatleri veya molaları seçin.");
            return;
        }
        onSync(sourceDayKey, targetDays, { hours: syncHours, breaks: syncBreaks });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Çalışma Saatlerini Eşitle</DialogTitle>
                    <DialogDescription>
                        Bir günün çalışma saatlerini ve/veya molalarını diğer günlere kopyalayın.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="source-day" className="text-right">
                            Kaynak Gün
                        </Label>
                        <select
                            id="source-day"
                            value={sourceDayKey}
                            onChange={(e) => setSourceDayKey(Number(e.target.value))}
                            className="col-span-3 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {DAYS.map(day => (
                                <option key={day.key} value={day.key}>{day.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">
                            Hedef Günler
                        </Label>
                        <div className="col-span-3 flex flex-col gap-2">
                            {DAYS.map(day => (
                                <div key={day.key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`target-day-${day.key}`}
                                        checked={targetDays.includes(day.key)}
                                        onCheckedChange={(checked) => handleTargetDayChange(day.key, checked as boolean)}
                                        disabled={day.key === sourceDayKey}
                                    />
                                    <label
                                        htmlFor={`target-day-${day.key}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">
                            Eşitle
                        </Label>
                        <div className="col-span-3 flex flex-col gap-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sync-hours"
                                    checked={syncHours}
                                    onCheckedChange={(checked) => setSyncHours(checked as boolean)}
                                />
                                <label
                                    htmlFor="sync-hours"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Çalışma Saatleri
                                </label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sync-breaks"
                                    checked={syncBreaks}
                                    onCheckedChange={(checked) => setSyncBreaks(checked as boolean)}
                                />
                                <label
                                    htmlFor="sync-breaks"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Molalar
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <RxButton variant="secondary" onClick={onClose}>İptal</RxButton>
                    <RxButton onClick={handleSync}>Eşitle</RxButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
