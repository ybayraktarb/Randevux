"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    BarChart, Bar, Tooltip as RechartsTooltip,
} from "recharts"
import { Loader2, X } from "lucide-react"
import { RxAvatar } from "../../rx-avatar"
import { RxBadge } from "../../rx-badge"
import { RxButton } from "../../rx-button"

interface Business {
    id: string
    name: string
    city: string
    module: string
    patron: string
    patronEmail: string
    patronPhone: string
    staff: number
    customers: number
    appts: number
    date: string
    active: boolean
    raw: any
}

interface DrawerProps {
    business: Business
    isOpen: boolean
    onClose: () => void
    onStatusChange: () => void
}

export function BusinessesDrawer({ business, isOpen, onClose, onStatusChange }: DrawerProps) {
    const supabase = createClient()
    const [drawerTab, setDrawerTab] = useState<"general" | "staff" | "stats">("general")
    const [drawerStaff, setDrawerStaff] = useState<any[]>([])
    const [weeklyBarData, setWeeklyBarData] = useState<any[]>([])
    const [revenueStats, setRevenueStats] = useState({ revenue: 0, appts: 0, noShows: 0 })

    useEffect(() => {
        if (!isOpen || !business) return
        setDrawerTab("general")
        setDrawerStaff([])
        setWeeklyBarData([])
        setRevenueStats({ revenue: 0, appts: business.appts, noShows: 0 })

        supabase.from("staff_business").select("id, is_active, users(name)").eq("business_id", business.id)
            .then(({ data: staffData }) => {
                if (staffData) {
                    setDrawerStaff(staffData.map((s: any) => ({
                        name: s.users?.name || "İsimsiz", role: "Personel", appts: 0,
                    })))
                }
            })

        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        supabase.from("appointments")
            .select("id, appointment_date, total_price, status")
            .eq("business_id", business.id)
            .gte("appointment_date", thirtyDaysAgo.toISOString().split('T')[0])
            .then(({ data: apptData }) => {
                if (apptData) {
                    const weekly = [
                        { week: "1. Hafta", randevu: 0 }, { week: "2. Hafta", randevu: 0 },
                        { week: "3. Hafta", randevu: 0 }, { week: "4. Hafta", randevu: 0 },
                    ]
                    let revenue = 0; let noShowCount = 0
                    apptData.forEach((a: any) => {
                        revenue += Number(a.total_price || 0)
                        if (a.status === "no_show") noShowCount++
                        const day = new Date(a.appointment_date).getDate()
                        if (day <= 7) weekly[0].randevu++
                        else if (day <= 14) weekly[1].randevu++
                        else if (day <= 21) weekly[2].randevu++
                        else weekly[3].randevu++
                    })
                    setWeeklyBarData(weekly)
                    setRevenueStats({ revenue, appts: apptData.length, noShows: noShowCount })
                }
            })
    }, [isOpen, business?.id])

    async function toggleStatus() {
        const { error } = await supabase.from("businesses").update({ is_active: !business.active }).eq("id", business.id)
        if (!error) onStatusChange()
    }

    if (!isOpen || !business) return null

    return (
        <>
            <div className="fixed inset-0 z-40 bg-foreground/30" onClick={onClose} aria-hidden="true" />
            <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col border-l border-border bg-card shadow-xl transition-transform duration-300">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                        <RxAvatar name={business.name} size="lg" />
                        <div className="flex flex-col">
                            <span className="text-lg font-semibold text-foreground">{business.name}</span>
                            {business.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="gray">Pasif</RxBadge>}
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Kapat">
                        <X className="size-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {(["general", "staff", "stats"] as const).map((tab) => {
                        const labels = { general: "Genel", staff: "Personel", stats: "İstatistik" }
                        return (
                            <button key={tab} type="button" onClick={() => setDrawerTab(tab)}
                                className={cn("flex-1 py-3 text-sm font-medium transition-colors",
                                    drawerTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground")}>
                                {labels[tab]}
                            </button>
                        )
                    })}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {drawerTab === "general" && (
                        <div className="flex flex-col gap-6">
                            <div className="rounded-lg border border-border bg-card p-4">
                                <h4 className="mb-3 text-sm font-semibold text-foreground">{"İşletme Bilgileri"}</h4>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        { label: "Modül", value: <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2.5 py-0.5 text-xs font-medium text-badge-green-text">{business.module}</span> },
                                        { label: "Adres", value: <span className="text-[13px] text-foreground">{business.city}</span> },
                                        { label: "Telefon", value: <span className="text-[13px] text-foreground">{business.raw.phone || "+90 --- --- -- --"}</span> },
                                        { label: "Kayıt Tarihi", value: <span className="text-[13px] text-foreground">{business.date}</span> },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between">
                                            <span className="text-[13px] text-muted-foreground">{label}</span>
                                            {value}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-border bg-card p-4">
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Patron</h4>
                                <div className="flex items-center gap-3">
                                    <RxAvatar name={business.patron} size="md" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-foreground">{business.patron}</span>
                                        <span className="text-xs text-muted-foreground">{business.patronEmail}</span>
                                        <span className="text-xs text-muted-foreground">{business.patronPhone}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border border-border bg-card p-4">
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Ayarlar</h4>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] text-foreground">Otomatik Onay</span>
                                        <div className={cn("relative inline-flex h-5 w-9 rounded-full transition-colors", business.raw.auto_approve ? "bg-success" : "bg-muted")}>
                                            <span className={cn("inline-block size-4 transform rounded-full bg-card shadow-sm transition-transform", business.raw.auto_approve ? "translate-x-[18px]" : "translate-x-0.5")} style={{ marginTop: "2px" }} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[13px] text-foreground">{"İptal Süresi"}</span>
                                        <span className="text-[13px] text-muted-foreground">{business.raw.cancellation_buffer_minutes} dakika</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-lg border-t-[3px] border-t-accent border border-border bg-card p-4">
                                <div className="flex flex-col gap-3">
                                    <RxButton variant="ghost" size="sm" className="w-full justify-center text-accent hover:bg-badge-red-bg" onClick={toggleStatus}>
                                        {business.active ? "İşletmeyi Pasife Al" : "İşletmeyi Aktif Et"}
                                    </RxButton>
                                </div>
                            </div>
                        </div>
                    )}

                    {drawerTab === "staff" && (
                        <div className="flex flex-col gap-3">
                            {drawerStaff.map((s, i) => (
                                <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-primary-light/50">
                                    <RxAvatar name={s.name} size="sm" />
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                                        <span className="text-xs text-muted-foreground">{s.role}</span>
                                    </div>
                                </div>
                            ))}
                            {drawerStaff.length === 0 && <div className="text-center text-sm text-muted-foreground py-4">Personel bulunamadı</div>}
                        </div>
                    )}

                    {drawerTab === "stats" && (
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="flex flex-col items-center rounded-lg border border-border p-3">
                                    <span className="text-lg font-bold text-foreground">₺{revenueStats.revenue.toLocaleString('tr-TR')}</span>
                                    <span className="text-xs text-muted-foreground">{"Son 30 Gün Gelir"}</span>
                                </div>
                                <div className="flex flex-col items-center rounded-lg border border-border p-3">
                                    <span className="text-lg font-bold text-foreground">{revenueStats.appts}</span>
                                    <span className="text-xs text-muted-foreground">Randevu</span>
                                </div>
                                <div className="flex flex-col items-center rounded-lg border border-border p-3">
                                    <span className="text-lg font-bold text-accent">{revenueStats.noShows}</span>
                                    <span className="text-xs text-muted-foreground">No-Show</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="mb-3 text-sm font-semibold text-foreground">Son 30 Gün Aktivite</h4>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={weeklyBarData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                            <XAxis dataKey="week" tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }} />
                                            <Bar dataKey="randevu" name="Randevu" fill="#6C63FF" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}
