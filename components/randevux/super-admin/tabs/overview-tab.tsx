"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Building2, Users, Calendar, TrendingUp } from "lucide-react"
import { RxAvatar } from "../../rx-avatar"
import { RxBadge } from "../../rx-badge"

export function OverviewTab() {
    const supabase = createClient()
    const [stats, setStats] = useState({ totalBiz: 0, totalUsers: 0, totalAppts: 0, todayAppts: 0 })
    const [recentBiz, setRecentBiz] = useState<{ id: string; name: string; moduleName: string; date: string; staffCount: number; apptCount: number; active: boolean }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            const todayStr = new Date().toISOString().slice(0, 10)
            const [{ count: bc }, { count: uc }, { count: ac }, { count: tc }] = await Promise.all([
                supabase.from("businesses").select("id", { count: "exact", head: true }),
                supabase.from("users").select("id", { count: "exact", head: true }),
                supabase.from("appointments").select("id", { count: "exact", head: true }),
                supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", todayStr),
            ])
            setStats({ totalBiz: bc || 0, totalUsers: uc || 0, totalAppts: ac || 0, todayAppts: tc || 0 })

            const { data: bizData } = await supabase.from("businesses").select("id, name, is_active, created_at, module:modules(display_name)").order("created_at", { ascending: false }).limit(5)
            const mapped = (bizData || []).map((b: any) => {
                const mod = Array.isArray(b.module) ? b.module[0] : b.module
                return { id: b.id, name: b.name, moduleName: mod?.display_name || "?", date: new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }), staffCount: 0, apptCount: 0, active: b.is_active }
            })
            setRecentBiz(mapped)
            setLoading(false)
        }
        load()
    }, [supabase])

    const statCards = [
        { label: "Toplam Isletme", icon: Building2, value: String(stats.totalBiz), trendColor: "text-muted-foreground" },
        { label: "Toplam Kullanici", icon: Users, value: String(stats.totalUsers), trendColor: "text-muted-foreground" },
        { label: "Toplam Randevu", icon: Calendar, value: String(stats.totalAppts), trendColor: "text-muted-foreground" },
        { label: "Bugunun Randevulari", icon: TrendingUp, value: String(stats.todayAppts), trendColor: "text-success" },
    ]

    if (loading) return <div className="flex items-center justify-center p-16"><Loader2 className="size-8 animate-spin text-primary" /></div>

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <h2 className="text-[22px] font-semibold text-foreground">Platform Ozeti</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((card) => {
                    const Icon = card.icon
                    return (
                        <div key={card.label} className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
                                <Icon className="size-5 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[13px] text-muted-foreground">{card.label}</span>
                                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-col gap-4">
                <h3 className="text-base font-semibold text-foreground">Son Isletmeler</h3>
                <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <table className="w-full min-w-[600px]">
                        <thead><tr className="border-b border-border">
                            {["Isletme", "Modul", "Kayit Tarihi", "Durum"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {recentBiz.map(biz => (
                                <tr key={biz.id} className="border-b border-border last:border-0 hover:bg-primary-light/50">
                                    <td className="px-5 py-3"><div className="flex items-center gap-2.5"><RxAvatar name={biz.name} size="sm" /><span className="text-sm font-medium text-foreground">{biz.name}</span></div></td>
                                    <td className="px-5 py-3"><span className="inline-flex items-center rounded-md bg-badge-purple-bg px-2.5 py-0.5 text-xs font-medium text-badge-purple-text">{biz.moduleName}</span></td>
                                    <td className="px-5 py-3 text-sm text-muted-foreground">{biz.date}</td>
                                    <td className="px-5 py-3">{biz.active ? <RxBadge variant="success">Aktif</RxBadge> : <RxBadge variant="gray">Pasif</RxBadge>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
