"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Save, Clock, CalendarDays, AlertCircle } from "lucide-react"
import { RxButton } from "@/components/randevux/rx-button"
import { toast } from "sonner"

// Varsayılan saat yapısı
const DAYS = [
    { id: 1, label: "Pazartesi" },
    { id: 2, label: "Salı" },
    { id: 3, label: "Çarşamba" },
    { id: 4, label: "Perşembe" },
    { id: 5, label: "Cuma" },
    { id: 6, label: "Cumartesi" },
    { id: 0, label: "Pazar" },
]

export function SettingsPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [businessId, setBusinessId] = useState<string | null>(null)

    // Çalışma Saatleri State: { day_of_week: { open_time, close_time, is_closed } }
    const [hours, setHours] = useState<Record<number, any>>({})

    // İşletme Temel Ayarları (İleride genişletilebilir)
    const [configs, setConfigs] = useState({
        auto_approve: false,
        cancellation_buffer_minutes: 60
    })

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
            await fetchBusinessData(ownerData.business_id)
        } else {
            setLoading(false)
        }
    }

    async function fetchBusinessData(bId: string) {
        // 1. Temel İşletme Ayarları
        const { data: bData } = await supabase
            .from("businesses")
            .select("auto_approve, cancellation_buffer_minutes")
            .eq("id", bId)
            .single()

        if (bData) {
            setConfigs({
                auto_approve: bData.auto_approve || false,
                cancellation_buffer_minutes: bData.cancellation_buffer_minutes || 60
            })
        }

        // 2. Çalışma Saatleri (İşletme eklenirken Sprint 3'te default oluşmuştu)
        const { data: hData } = await supabase
            .from("business_hours")
            .select("*")
            .eq("business_id", bId)

        if (hData && hData.length > 0) {
            const hoursMap: Record<number, any> = {}
            hData.forEach(h => {
                hoursMap[h.day_of_week] = {
                    id: h.id,
                    open_time: h.open_time ? h.open_time.substring(0, 5) : "09:00",
                    close_time: h.close_time ? h.close_time.substring(0, 5) : "18:00",
                    is_closed: h.is_closed
                }
            })
            setHours(hoursMap)
        } else {
            // Hiç set edilmemişse Default UI State
            const defaultHMap: Record<number, any> = {}
            DAYS.forEach(d => {
                defaultHMap[d.id] = { open_time: "09:00", close_time: "18:00", is_closed: d.id === 0 } // Pazar default kapalı
            })
            setHours(defaultHMap)
        }

        setLoading(false)
    }

    const handleHourChange = (dayId: number, field: string, value: any) => {
        setHours(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }))
    }

    const handleSaveAll = async () => {
        if (!businessId) return
        setSaving(true)

        try {
            // 1. Update Configs
            const { error: confError } = await supabase
                .from("businesses")
                .update({
                    auto_approve: configs.auto_approve,
                    cancellation_buffer_minutes: configs.cancellation_buffer_minutes
                })
                .eq("id", businessId)

            if (confError) throw confError

            // 2. Update Hours Array
            // Eğer veritabanında daha önce id si varsa update, yoksa insert/upsert yapmamız gerekir.
            // Supabase upsert (Insert with onConflict) kullanarak çözelim:
            const upsertPayload = Object.keys(hours).map(dayStr => {
                const dayId = parseInt(dayStr)
                const hourData = hours[dayId]

                // Eğer saatler kapalıysa boş değil yine veritabanında tutulur ama is_closed = true olur.
                return {
                    id: hourData.id || undefined, // undefined Supabase'de yeni kayıt (insert) demektir (eğer uuid ise). Bizde uuid.
                    business_id: businessId,
                    day_of_week: dayId,
                    open_time: hourData.open_time + ":00", // "09:00:00" postgres time formatına uyarlama
                    close_time: hourData.close_time + ":00",
                    is_closed: hourData.is_closed
                }
            })

            // Uyarı: id undefined verince upsert sıkıntı yaratabilir id'si olanları update, olmayanları insert etmek temizidir.
            const toUpdate = upsertPayload.filter(p => p.id)
            const toInsert = upsertPayload.filter(p => !p.id)

            if (toUpdate.length > 0) {
                // Supabase v2'de Toplu Update için genellikle (upsert) veya foreach kullanılır.
                for (const item of toUpdate) {
                    await supabase.from("business_hours").update({
                        open_time: item.open_time,
                        close_time: item.close_time,
                        is_closed: item.is_closed
                    }).eq("id", item.id)
                }
            }

            if (toInsert.length > 0) {
                await supabase.from("business_hours").insert(toInsert)
            }

            toast.success("Tüm ayarlar ve çalışma saatleri başarıyla kaydedildi!")

            // Eğer yeni insert yapıldıysa id'leri geri almak için listeyi tazelemek iyidir
            await fetchBusinessData(businessId)

        } catch (e: any) {
            toast.error("Kaydedilirken hata oluştu: " + e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-5xl">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">İşletme Ayarları</h2>
                    <p className="text-sm text-muted-foreground">Mağaza çalışma saatlerini ve rezervasyon kurallarını yonetin.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <RxButton onClick={handleSaveAll} disabled={loading || saving} className="w-full sm:w-auto">
                        {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                        Ayarları Kaydet
                    </RxButton>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="size-6 animate-spin text-primary" /></div>
            ) : (
                <div className="grid gap-6 md:grid-cols-12">

                    {/* 1. Sütun: Çalışma Saatleri */}
                    <div className="md:col-span-7 flex flex-col gap-4">
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                                <Clock className="size-5 text-primary" />
                                <h3 className="text-lg font-medium text-foreground">Haftalık Çalışma Saatleri</h3>
                            </div>

                            <div className="flex flex-col gap-4">
                                {DAYS.map((day) => {
                                    const dayData = hours[day.id] || { open_time: "09:00", close_time: "18:00", is_closed: false }

                                    return (
                                        <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                            {/* Gün Adı & Açık/Kapalı Toggle */}
                                            <div className="flex items-center gap-3 min-w-[140px]">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={!dayData.is_closed}
                                                        onChange={() => handleHourChange(day.id, 'is_closed', !dayData.is_closed)}
                                                    />
                                                    <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                                                </label>
                                                <span className={`text-sm font-medium ${dayData.is_closed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                    {day.label}
                                                </span>
                                            </div>

                                            {/* Saat Seçiciler */}
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={dayData.open_time}
                                                    onChange={(e) => handleHourChange(day.id, 'open_time', e.target.value)}
                                                    disabled={dayData.is_closed}
                                                    className="h-9 w-[110px] rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring disabled:opacity-50"
                                                />
                                                <span className="text-muted-foreground">-</span>
                                                <input
                                                    type="time"
                                                    value={dayData.close_time}
                                                    onChange={(e) => handleHourChange(day.id, 'close_time', e.target.value)}
                                                    disabled={dayData.is_closed}
                                                    className="h-9 w-[110px] rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-5 rounded-lg bg-orange-50 dark:bg-orange-950/30 p-3 text-xs text-orange-800 dark:text-orange-400 flex items-start gap-2 border border-orange-200 dark:border-orange-900/50">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <p>Çalışma saatleri dışında müşterileriniz o gün için randevu ekranında boş saat göremezler. Öğle arası veya özel molalar için Mola saati ekleme özelliği yakında eklenecektir.</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Sütun: Rezervasyon & Uygulama Ayarları */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                                <CalendarDays className="size-5 text-primary" />
                                <h3 className="text-lg font-medium text-foreground">Rezervasyon Kuralları</h3>
                            </div>

                            <div className="flex flex-col gap-5">
                                {/* Otomatik Onay */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-foreground">Otomatik Randevu Onayı</label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={configs.auto_approve}
                                                onChange={(e) => setConfigs({ ...configs, auto_approve: e.target.checked })}
                                            />
                                            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Aktif ise müşteri randevu oluşturduğunda doğrudan takvime yansır ve onaylanır. Kapalı ise Yönetici onayı bekler.</p>
                                </div>

                                {/* Minimum İptal Süresi */}
                                <div className="flex flex-col gap-2 border-t border-border pt-4">
                                    <label className="text-sm font-medium text-foreground">Zorunlu İptal Süresi (Dakika)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="30"
                                        value={configs.cancellation_buffer_minutes}
                                        onChange={(e) => setConfigs({ ...configs, cancellation_buffer_minutes: parseInt(e.target.value) || 0 })}
                                        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:ring-2 focus:ring-ring"
                                    />
                                    <p className="text-xs text-muted-foreground">Randevusuna bu süreden daha az kalan müşteri sistem üzerinden iptal yapamaz (%100 kesinti veya uyarı uygulanabilir).</p>
                                </div>

                            </div>
                        </div>

                        {/* Modül Config Özeti (Buraya ileride "Sadece Klinik" özellikler tabı eklenebilir) */}
                        <div className="rounded-xl border border-dashed border-border bg-card p-5 text-center flex flex-col items-center opacity-70">
                            <h3 className="text-sm font-medium text-foreground mb-1">Müşteri Arayüzü Önizlemesi</h3>
                            <p className="text-xs text-muted-foreground mb-3">Mağazanızın Modülüne göre (Berber, Klinik vb.) müşterilere giden anket veya dosya yükleme zorunlulukları aktif durumdadır.</p>
                            <RxButton variant="secondary" size="sm" disabled>Önizleme Linki (Yakında)</RxButton>
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}
