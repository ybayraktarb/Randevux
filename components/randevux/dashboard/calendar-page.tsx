"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
    Plus, Clock, User, Scissors, CheckCircle2, XCircle, AlertCircle, GripVertical, FileText, PawPrint, Stethoscope
} from "lucide-react"
import { RxButton } from "@/components/randevux/rx-button"
import { RxModal } from "@/components/randevux/rx-modal"
import { RxInput } from "@/components/randevux/rx-input"
import { RxAvatar } from "@/components/randevux/rx-avatar"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { getModuleConfig } from "@/lib/modules/config"

// --- Yardımcı Zaman Fonksiyonları ---
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 09:00 - 21:00 arası
const STATUS_COLORS = {
    'Bekliyor': "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    'Onaylandı': "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    'Tamamlandı': "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    'İptal': "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
    'Gelmedi': "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
}
const STATUS_LABELS = {
    'Bekliyor': "Onay Bekliyor",
    'Onaylandı': "Onaylandı",
    'Tamamlandı': "Tamamlandı",
    'İptal': "İptal Edildi",
    'Gelmedi': "Gelmedi"
}

export function CalendarPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [businessId, setBusinessId] = useState<string | null>(null)
    const [moduleName, setModuleName] = useState<string | null>(null)

    // Dynamic Config Binding
    const config = getModuleConfig(moduleName)

    // Icon Renderer Helper
    const ModuleIcon = () => {
        if (config.calendarIcon === 'paw') return <PawPrint className="size-3.5 mr-1" />
        if (config.calendarIcon === 'stethoscope') return <Stethoscope className="size-3.5 mr-1" />
        if (config.calendarIcon === 'scissors') return <Scissors className="size-3.5 mr-1" />
        return <CalendarIcon className="size-3.5 mr-1" />
    }

    // Data States
    const [staffList, setStaffList] = useState<any[]>([])
    const [servicesList, setServicesList] = useState<any[]>([])
    const [appointments, setAppointments] = useState<any[]>([])

    // UI States
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<"day" | "week">("day") // Şimdilik sadece Günlük Aktif (Personel Sütunları İçin)

    // Modal States (Add / Edit)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedApt, setSelectedApt] = useState<any | null>(null) // Edit modundaysa dolu
    const [actionLoading, setActionLoading] = useState(false)

    // Form State (Manuel Randevu Ekleme)
    const [form, setForm] = useState({
        customerName: "",
        customerPhone: "",
        staffId: "",
        serviceId: "",
        time: "09:00",
        status: "Onaylandı"
    })

    useEffect(() => {
        loadInitialData()
    }, [currentDate])

    async function loadInitialData() {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: ownerData } = await supabase
            .from("business_owners")
            .select(`
                business_id,
                businesses(
                    modules(
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

            await Promise.all([
                fetchStaff(ownerData.business_id),
                fetchServices(ownerData.business_id),
                fetchAppointments(ownerData.business_id, currentDate)
            ])
        }
        setLoading(false)
    }

    async function fetchStaff(bId: string) {
        const { data } = await supabase
            .from("staff_business")
            .select("id, role, user:user_id(name)")
            .eq("business_id", bId)
            .eq("is_active", true)
        if (data) setStaffList(data)
    }

    async function fetchServices(bId: string) {
        const { data } = await supabase
            .from("services")
            .select("id, name, duration_minutes, price")
            .eq("business_id", bId)
            .eq("is_active", true)
        if (data) setServicesList(data)
    }

    async function fetchAppointments(bId: string, date: Date) {
        const start = new Date(date)
        start.setHours(0, 0, 0, 0)

        const localDateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' } as const;
        // Adjust timezone offset manually for YYYY-MM-DD
        const offset = start.getTimezoneOffset()
        const adjustedDate = new Date(start.getTime() - (offset * 60 * 1000))
        const dateStr = adjustedDate.toISOString().split('T')[0] // 'YYYY-MM-DD'

        try {
            const { data, error } = await supabase
                .from("appointments")
                .select(`
                    id, 
                    start_time, 
                    duration_minutes, 
                    status, 
                    total_price,
                    staff_id:staff_business_id,
                    service_id,
                    metadata,
                    business_customers(id, first_name, last_name, phone),
                    services(name, price)
                `)
                .eq("business_id", bId)
                .eq("appointment_date", dateStr)

            if (error) throw error

            const formattedData = (data || []).map((apt: any) => ({
                id: apt.id,
                customer_id: apt.business_customers?.id,
                customer_name: `${apt.business_customers?.first_name || ""} ${apt.business_customers?.last_name || ""}`.trim() || apt.metadata?.customer_name || "İsimsiz Müşteri",
                customer_phone: apt.business_customers?.phone || apt.metadata?.customer_phone || "",
                staff_id: apt.staff_id,
                service_id: apt.service_id,
                service_name: apt.services?.name || "Özel İşlem",
                start_time: apt.start_time.substring(0, 5),
                duration_minutes: apt.duration_minutes,
                status: apt.status,
                price: apt.total_price || apt.services?.price || 0
            }))

            setAppointments(formattedData)
        } catch (e: any) {
            console.error(e)
            toast.error("Randevular çekilemedi: " + e.message)
            setAppointments([])
        }
    }

    // --- Gezinme Fonksiyonları ---
    const nextDay = () => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() + 1)
        setCurrentDate(d)
    }
    const prevDay = () => {
        const d = new Date(currentDate)
        d.setDate(d.getDate() - 1)
        setCurrentDate(d)
    }
    const today = () => setCurrentDate(new Date())

    const formattedDate = currentDate.toLocaleDateString('tr-TR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    // --- Randevu İşlemleri ---
    function openAddModal(hourStr?: string, prefillStaffId?: string) {
        setSelectedApt(null)
        setForm({
            customerName: "",
            customerPhone: "",
            staffId: prefillStaffId || (staffList.length > 0 ? staffList[0].id : ""),
            serviceId: servicesList.length > 0 ? servicesList[0].id : "",
            time: hourStr || "09:00",
            status: "Onaylandı"
        })
        setIsModalOpen(true)
    }

    function openEditModal(apt: any) {
        setSelectedApt(apt)
        setForm({
            customerName: apt.customer_name,
            customerPhone: apt.customer_phone,
            staffId: apt.staff_id,
            serviceId: apt.service_id || "",
            time: apt.start_time,
            status: apt.status
        })
        setIsModalOpen(true)
    }

    async function handleSaveApt() {
        if (!form.customerName || !form.staffId || !form.serviceId || !form.time) {
            toast.error("Lütfen müşteri, personel, hizmet ve saat bilgisini doldurun.")
            return
        }
        if (!businessId) return

        setActionLoading(true)

        const serviceData = servicesList.find(s => s.id === form.serviceId) || { name: "Özel İşlem", duration_minutes: 30, price: 0 }

        const start = new Date(currentDate)
        start.setHours(0, 0, 0, 0)
        const offset = start.getTimezoneOffset()
        const adjustedDate = new Date(start.getTime() - (offset * 60 * 1000))
        const dateStr = adjustedDate.toISOString().split('T')[0]

        // Split time and calc end time
        const [h, m] = form.time.split(':').map(Number)
        const endTimeDate = new Date(start)
        endTimeDate.setHours(h, m + serviceData.duration_minutes, 0, 0)
        const endTimeStr = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}:00`

        try {
            // Müşteri bul veya yarat
            let custId = selectedApt?.customer_id;
            if (!custId) {
                const nameParts = form.customerName.trim().split(" ")
                const { data: newCust, error: custErr } = await supabase
                    .from("business_customers")
                    .insert({
                        business_id: businessId,
                        first_name: nameParts[0],
                        last_name: nameParts.length > 1 ? nameParts.slice(1).join(" ") : "",
                        phone: form.customerPhone
                    })
                    .select("id")
                    .single()

                if (!custErr && newCust) {
                    custId = newCust.id;
                }
            }

            const aptPayload = {
                business_id: businessId,
                customer_id: custId || null,
                staff_business_id: form.staffId,
                service_id: form.serviceId,
                status: form.status,
                appointment_date: dateStr,
                start_time: `${form.time}:00`,
                end_time: endTimeStr,
                total_duration_minutes: serviceData.duration_minutes,
                total_price: serviceData.price || 0,
                // Fallback as metadata if cust creation fails
                metadata: custId ? {} : { customer_name: form.customerName, customer_phone: form.customerPhone }
            }

            if (selectedApt) {
                const { error } = await supabase
                    .from("appointments")
                    .update(aptPayload)
                    .eq("id", selectedApt.id)

                if (error) throw error
                toast.success("Randevu güncellendi.")
            } else {
                const { error } = await supabase
                    .from("appointments")
                    .insert(aptPayload)

                if (error) throw error
                toast.success("Yeni randevu oluşturuldu.")
            }

            await fetchAppointments(businessId, currentDate)
            setIsModalOpen(false)
        } catch (e: any) {
            console.error(e)
            toast.error("Randevu kaydedilirken hata oluştu: " + e.message)
        } finally {
            setActionLoading(false)
        }
    }

    async function changeStatus(statusStr: string) {
        if (!selectedApt) return
        try {
            const { error } = await supabase
                .from("appointments")
                .update({ status: statusStr })
                .eq("id", selectedApt.id)

            if (error) throw error

            setAppointments(appointments.map(a => a.id === selectedApt.id ? { ...a, status: statusStr } : a))
            toast.success(`Durum: ${STATUS_LABELS[statusStr as keyof typeof STATUS_LABELS]}`)
            setIsModalOpen(false)
        } catch (e: any) {
            toast.error("Durum güncellenemedi: " + e.message)
        }
    }

    // --- UI Helpers ---
    function getAptStyle(startTime: string, durationMin: number) {
        const [h, m] = startTime.split(':').map(Number)
        const startOffsetHours = (h - 9) + (m / 60)
        const top = startOffsetHours * 64
        const height = (durationMin / 60) * 64
        return { top: `${top}px`, height: `${height}px` }
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
            {/* Header / Navigasyon */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-[20px] font-semibold text-foreground flex items-center gap-2">
                        <CalendarIcon className="size-5 text-primary" />
                        Randevu Kokpiti
                    </h2>

                    <div className="h-6 w-px bg-border hidden sm:block"></div>

                    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                        <button onClick={prevDay} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                            <ChevronLeft className="size-4" />
                        </button>
                        <button onClick={today} className="px-3 py-1.5 text-sm font-medium hover:bg-muted rounded-md transition-colors">
                            Bugün
                        </button>
                        <button onClick={nextDay} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-foreground min-w-[150px] text-right">
                        {formattedDate}
                    </span>
                    <RxButton size="sm" onClick={() => openAddModal()}>
                        <Plus className="size-4 mr-2" /> Randevu Ekle
                    </RxButton>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-1 items-center justify-center rounded-xl bg-card border border-border">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </div>
            ) : staffList.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-xl bg-card border border-dashed border-border p-12 text-center">
                    <AlertCircle className="size-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-foreground">Personel Bulunamadı</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm">Takvimi kullanabilmek için İşletmenize en az 1 Personel eklemelisiniz.</p>
                </div>
            ) : (
                /* --- TAKVIM GÖVDESİ --- */
                <div className="flex flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">

                    {/* Saatler Kolonu (Sabit Sol) */}
                    <div className="w-16 shrink-0 border-r border-border bg-muted/20 flex flex-col">
                        <div className="h-14 border-b border-border shrink-0"></div> {/* Header boslugu */}
                        <div className="flex-1 overflow-hidden">
                            <div className="relative">
                                {HOURS.map(h => (
                                    <div key={h} className="h-16 border-b border-border/50 relative">
                                        <span className="absolute -top-3 right-2 text-[11px] font-medium text-muted-foreground">
                                            {h.toString().padStart(2, '0')}:00
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Personel Kolonları (Scrollable) */}
                    <div className="flex-1 overflow-x-auto flex flex-col bg-card">

                        {/* Personeller Header */}
                        <div className="flex h-14 shrink-0 border-b border-border min-w-max">
                            {staffList.map((staff, i) => (
                                <div key={staff.id} className="w-[280px] shrink-0 border-r border-border/50 flex items-center justify-center gap-2 p-2 bg-muted/10">
                                    <RxAvatar name={staff.user?.name} size="sm" />
                                    <span className="font-semibold text-sm text-foreground truncate">{staff.user?.name || `Personel ${i + 1}`}</span>
                                </div>
                            ))}
                        </div>

                        {/* Takvim Grid & Event'ler */}
                        <div className="flex-1 overflow-y-auto relative min-w-max">
                            <div className="flex relative">
                                {/* Arkadaki Saat Çizgileri */}
                                <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none flex flex-col">
                                    {HOURS.map(h => (
                                        <div key={h} className="h-16 border-b border-border/30 w-full"></div>
                                    ))}
                                </div>

                                {/* Her Personelin Sütunu */}
                                {staffList.map(staff => {
                                    // Bu personelin o günkü randevuları
                                    const staffApts = appointments.filter(a => a.staff_id === staff.id)

                                    return (
                                        <div key={staff.id} className="relative w-[280px] shrink-0 border-r border-border/30 h-[832px]"> {/* 13 saat * 64px = 832px */}

                                            {/* Boş Slotlara Tıklayıp Ekleme Özelliği (Görünmez Gridler) */}
                                            {HOURS.map(h => (
                                                <div
                                                    key={h}
                                                    onClick={() => openAddModal(`${h.toString().padStart(2, '0')}:00`, staff.id)}
                                                    className="h-16 w-full hover:bg-primary/5 cursor-crosshair transition-colors absolute"
                                                    style={{ top: `${(h - 9) * 64}px` }}
                                                />
                                            ))}

                                            {/* Randevu Kartları (Absolute Position) */}
                                            {staffApts.map(apt => {
                                                const stylePos = getAptStyle(apt.start_time, apt.duration_minutes)
                                                // @ts-ignore
                                                const colorClass = STATUS_COLORS[apt.status as keyof typeof STATUS_COLORS] || STATUS_COLORS['Onaylandı']

                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onClick={() => openEditModal(apt)}
                                                        style={{ ...stylePos, left: '4px', right: '4px' }}
                                                        className={cn(
                                                            "absolute rounded-md border p-2 text-xs overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm group",
                                                            colorClass
                                                        )}
                                                    >
                                                        <div className="font-semibold truncate pr-4">{apt.customer_name}</div>
                                                        <div className="truncate opacity-80 mt-0.5">{apt.service_name}</div>
                                                        <div className="text-[10px] font-mono mt-1 opacity-70 flex items-center gap-1">
                                                            <Clock className="size-3" /> {apt.start_time} ({apt.duration_minutes} dk)
                                                        </div>
                                                        <div className="absolute top-1 right-1 opacity-60">
                                                            <ModuleIcon />
                                                        </div>

                                                        {/* Hover Actions */}
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-sm p-0.5">
                                                            <GripVertical className="size-3.5" />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Manuel Randevu Ekleme / Düzenleme Modalı */}
            <RxModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={selectedApt ? "Randevu Detayı" : "Yeni Randevu Ekle"}
                footer={
                    <div className="flex w-full items-center justify-between">
                        {/* Statü Değiştirme Butonları (Sadece Edit Modundaysa Tıklantıysa Cikar) */}
                        {selectedApt ? (
                            <div className="flex items-center gap-2">
                                <button onClick={() => changeStatus('Tamamlandı')} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md transition-colors" title="Tamamlandı İşaretle">
                                    <CheckCircle2 className="size-5" />
                                </button>
                                <button onClick={() => changeStatus('İptal')} className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-md transition-colors" title="İptal Et">
                                    <XCircle className="size-5" />
                                </button>
                                <button onClick={() => changeStatus('Gelmedi')} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded-md transition-colors" title="Müşteri Gelmedi">
                                    <User className="size-5 line-through" />
                                </button>
                            </div>
                        ) : <div></div>}

                        <div className="flex items-center gap-2">
                            <RxButton variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} disabled={actionLoading}>
                                Kapat
                            </RxButton>
                            <RxButton size="sm" onClick={handleSaveApt} disabled={actionLoading}>
                                {actionLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                                {selectedApt ? "Güncelle" : "Randevuyu Oluştur"}
                            </RxButton>
                        </div>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                        <RxInput
                            label={`${config.customerLabel} Adı (*)`}
                            placeholder="Zorunlu"
                            value={form.customerName}
                            onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                        />
                        <RxInput
                            label="Telefon (Opsiyonel)"
                            placeholder="53X XXX XX XX"
                            value={form.customerPhone}
                            onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                        />
                    </div>

                    {/* Veteriner vs Sektör Spesifik Alanlar */}
                    {config.hasVaccinationCard && (
                        <div className="animate-in fade-in slide-in-from-top-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/20 p-2 rounded-full text-primary">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-foreground">Aşı Kartı Doğrulaması</h4>
                                    <p className="text-xs text-muted-foreground mt-0.5">Muayene öncesi sisteme yüklenen belgeler.</p>
                                </div>
                            </div>
                            <RxButton variant="secondary" size="sm" className="bg-background">
                                Belge Yükle
                            </RxButton>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Hizmet</label>
                            <select
                                value={form.serviceId}
                                onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                                className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="" disabled>Seçiniz</option>
                                {servicesList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}dk)</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Personel ("Kim Yapacak?")</label>
                            <select
                                value={form.staffId}
                                onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                                className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="" disabled>Seçiniz</option>
                                {staffList.map(s => <option key={s.id} value={s.id}>{s.user?.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Başlangıç Saati</label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={(e) => setForm({ ...form, time: e.target.value })}
                                className="h-10 rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-foreground">Durumu</label>
                            <select
                                value={form.status}
                                onChange={(e) => setForm({ ...form, status: e.target.value })}
                                className={cn("h-10 rounded-lg border border-input px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring",
                                    // @ts-ignore
                                    STATUS_COLORS[form.status]
                                )}
                            >
                                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                    <option key={key} value={key} className="bg-card text-foreground">{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                </div>
            </RxModal>
        </div>
    )
}
