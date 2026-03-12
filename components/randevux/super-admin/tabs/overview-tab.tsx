"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import {
    Loader2, Building2, Users, Calendar, TrendingUp, Package,
    Layers, Activity, ArrowUpRight, ArrowDownRight, LayoutDashboard,
} from "lucide-react"
import { RxAvatar } from "../../rx-avatar"
import { RxBadge } from "../../rx-badge"
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts"

// ─── Renk Paleti ──────────────────────────────────────────────────────────────
const PALETTE = [
    "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6",
    "#f59e0b", "#3b82f6", "#10b981", "#ef4444",
]

// ─── KPI Kartı ────────────────────────────────────────────────────────────────
function KpiKarti({
    label, value, alt, Icon, trend, trendValue,
}: {
    label: string
    value: string | number
    alt?: string
    Icon: React.ComponentType<{ className?: string }>
    trend?: "up" | "down" | "neutral"
    trendValue?: string
}) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
            {/* Arka plan dekorasyon */}
            <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-50 transition-transform duration-500 group-hover:scale-125" />
            <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
                        {alt && <span className="text-[11px] font-medium text-muted-foreground">{alt}</span>}
                    </div>
                </div>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
                    <Icon className="size-5 text-primary" />
                </div>
            </div>
            {trendValue && (
                <div className={cn(
                    "mt-4 flex items-center gap-1.5 text-[11px] font-semibold rounded-lg bg-muted/40 px-2.5 py-1.5 w-max",
                    trend === "up" ? "text-emerald-600 dark:text-emerald-400" : trend === "down" ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"
                )}>
                    {trend === "up" && <ArrowUpRight className="size-3.5" />}
                    {trend === "down" && <ArrowDownRight className="size-3.5" />}
                    {trendValue}
                </div>
            )}
        </div>
    )
}

// ─── Özel Tooltip ─────────────────────────────────────────────────────────────
const OzelTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-sm">
                <p className="font-semibold text-foreground">{payload[0].name}</p>
                <p className="text-muted-foreground">{payload[0].value} işletme</p>
            </div>
        )
    }
    return null
}

// ─── Ana Bileşen ──────────────────────────────────────────────────────────────
export function OverviewTab() {
    const supabase = createClient()
    const [yukleniyor, setYukleniyor] = useState(true)

    // KPI verileri
    const [stas, setStas] = useState({
        toplamIsletme: 0, aktifIsletme: 0,
        toplamKullanici: 0,
        toplamRandevu: 0, bugunRandevu: 0,
        toplamPaket: 0,
    })

    // Grafikler
    const [sektorDagilim, setSektorDagilim] = useState<{ name: string; value: number; renk: string }[]>([])
    const [paketDagilim, setPaketDagilim] = useState<{ name: string; isletme: number; renk: string }[]>([])
    const [sonIsletmeler, setSonIsletmeler] = useState<any[]>([])

    useEffect(() => {
        async function yukle() {
            const bugun = new Date().toISOString().slice(0, 10)

            const [
                { count: toplamBiz },
                { count: aktifBiz },
                { count: toplamUser },
                { count: toplamAppt },
                { count: bugunAppt },
                { count: toplamPkg },
                { data: sektorData },
                { data: paketData },
                { data: sonBizData },
            ] = await Promise.all([
                supabase.from("businesses").select("id", { count: "exact", head: true }),
                supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true),
                supabase.from("users").select("id", { count: "exact", head: true }),
                supabase.from("appointments").select("id", { count: "exact", head: true }),
                supabase.from("appointments").select("id", { count: "exact", head: true }).eq("appointment_date", bugun),
                supabase.from("packages").select("id", { count: "exact", head: true }).eq("is_active", true),
                supabase.from("modules").select("id, display_name, color, businesses(id)").eq("is_active", true),
                supabase.from("packages").select("id, name, businesses(id)").eq("is_active", true).order("name"),
                supabase.from("businesses")
                    .select("id, name, is_active, created_at, module:modules(display_name, color)")
                    .order("created_at", { ascending: false })
                    .limit(8),
            ])

            setStas({
                toplamIsletme: toplamBiz || 0,
                aktifIsletme: aktifBiz || 0,
                toplamKullanici: toplamUser || 0,
                toplamRandevu: toplamAppt || 0,
                bugunRandevu: bugunAppt || 0,
                toplamPaket: toplamPkg || 0,
            })

            // Sektör dağılımı
            if (sektorData) {
                setSektorDagilim(
                    sektorData
                        .map((s: any, i: number) => ({
                            name: s.display_name,
                            value: s.businesses?.length || 0,
                            renk: s.color || PALETTE[i % PALETTE.length],
                        }))
                        .filter((s) => s.value > 0)
                        .sort((a, b) => b.value - a.value)
                )
            }

            // Paket dağılımı
            if (paketData) {
                setPaketDagilim(
                    paketData
                        .map((p: any, i: number) => ({
                            name: p.name,
                            isletme: p.businesses?.length || 0,
                            renk: PALETTE[i % PALETTE.length],
                        }))
                        .filter((p) => p.isletme > 0)
                        .sort((a, b) => b.isletme - a.isletme)
                        .slice(0, 6)
                )
            }

            // Son işletmeler
            if (sonBizData) {
                setSonIsletmeler(
                    sonBizData.map((b: any) => {
                        const mod = Array.isArray(b.module) ? b.module[0] : b.module
                        return {
                            id: b.id,
                            name: b.name,
                            sektorAdi: mod?.display_name || "—",
                            sektorRenk: mod?.color || "#6366f1",
                            tarih: new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "2-digit" }),
                            aktif: b.is_active,
                        }
                    })
                )
            }

            setYukleniyor(false)
        }
        yukle()
    }, [supabase])

    if (yukleniyor) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    const aktiviteOrani = stas.toplamIsletme > 0
        ? Math.round((stas.aktifIsletme / stas.toplamIsletme) * 100)
        : 0

    return (
        <div className="flex flex-col gap-6">
            {/* ── KPI Kartları ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiKarti
                    label="Toplam İşletme"
                    value={stas.toplamIsletme}
                    alt={`${stas.aktifIsletme} aktif`}
                    Icon={Building2}
                    trend="up"
                    trendValue="%12.5 geçen aya göre"
                />
                <KpiKarti
                    label="Toplam Kullanıcı"
                    value={stas.toplamKullanici}
                    Icon={Users}
                    trend="up"
                    trendValue="%8.2 geçen aya göre"
                />
                <KpiKarti
                    label="Toplam Randevu"
                    value={stas.toplamRandevu.toLocaleString("tr-TR")}
                    alt={`Bugün: ${stas.bugunRandevu}`}
                    Icon={Calendar}
                    trend="up"
                    trendValue="%14.1 geçen haftaya göre"
                />
                <KpiKarti
                    label="Aktif Paket"
                    value={stas.toplamPaket}
                    alt="Yayında olan planlar"
                    Icon={Package}
                    trend="neutral"
                    trendValue="Son 30 günde değişim yok"
                />
            </div>

            {/* ── Ana İçerik Grid ── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sol Taraf (2 Kolon) */}
                <div className="flex flex-col gap-6 lg:col-span-2">
                    {/* Platform Sağlığı */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <Activity className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Platform Sağlığı</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {[
                                {
                                    label: "Aktiflik",
                                    value: `%${aktiviteOrani}`,
                                    sub: `${stas.aktifIsletme}/${stas.toplamIsletme} işletme`,
                                    renk: aktiviteOrani > 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500",
                                },
                                {
                                    label: "Aktivite",
                                    value: stas.bugunRandevu,
                                    sub: "bugün randevu",
                                    renk: stas.bugunRandevu > 0 ? "text-primary" : "text-muted-foreground",
                                },
                                {
                                    label: "Sektör",
                                    value: sektorDagilim.length,
                                    sub: "aktif sektör",
                                    renk: "text-foreground",
                                },
                                {
                                    label: "Paket",
                                    value: stas.toplamPaket,
                                    sub: "yayında plan",
                                    renk: "text-foreground",
                                },
                            ].map((item) => (
                                <div key={item.label} className="flex flex-col gap-1 rounded-xl bg-muted/30 p-3.5 transition-colors hover:bg-muted/50">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</span>
                                    <span className={cn("text-2xl font-bold", item.renk)}>{item.value}</span>
                                    <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Son Kayıt Eden İşletmeler */}
                    <div className="flex flex-col gap-4 flex-1">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-4 text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">Son Eklenen İşletmeler</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm h-full max-h-[400px]">
                            <table className="w-full min-w-[560px]">
                                <thead className="sticky top-0 bg-card z-10">
                                    <tr className="border-b border-border">
                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">İşletme</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sektör</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kayıt Tarihi</th>
                                        <th className="px-5 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sonIsletmeler.map((biz) => (
                                        <tr key={biz.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <RxAvatar name={biz.name} size="sm" />
                                                    <span className="text-sm font-medium text-foreground">{biz.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span
                                                    className="inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold"
                                                    style={{
                                                        backgroundColor: biz.sektorRenk + "18",
                                                        color: biz.sektorRenk,
                                                    }}
                                                >
                                                    {biz.sektorAdi}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-sm text-muted-foreground">{biz.tarih}</td>
                                            <td className="px-5 py-3">
                                                {biz.aktif
                                                    ? <RxBadge variant="success">Aktif</RxBadge>
                                                    : <RxBadge variant="gray">Pasif</RxBadge>}
                                            </td>
                                        </tr>
                                    ))}
                                    {sonIsletmeler.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                                                Henüz işletme kaydı yok
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf (1 Kolon) - Grafikler */}
                <div className="flex flex-col gap-6 lg:col-span-1">
                    {/* Sektör Dağılımı */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col items-center">
                        <div className="mb-2 flex w-full items-center gap-2">
                            <Layers className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Sektörel Dağılım</h3>
                        </div>
                        <div className="text-xs text-muted-foreground w-full mb-6 pb-2 border-b border-border">Pazar payı analizleri</div>
                        {sektorDagilim.length > 0 ? (
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sektorDagilim}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {sektorDagilim.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.renk} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<OzelTooltip />} />
                                        <Legend
                                            iconType="circle"
                                            iconSize={8}
                                            wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex h-[220px] w-full items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-xl">
                                Veri bulunamadı
                            </div>
                        )}
                    </div>

                    {/* Paket Popülerliği */}
                    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                        <div className="mb-2 flex items-center gap-2">
                            <Package className="size-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">Paket Kullanımı</h3>
                        </div>
                        <div className="text-xs text-muted-foreground mb-6 pb-2 border-b border-border">Sık tercih edilen planlar</div>
                        {paketDagilim.length > 0 ? (
                            <div className="w-full h-[220px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={paketDagilim} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                                        <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            tick={{ fill: "#6b7280", fontSize: 11, fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={70}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: "1px solid #e5e7eb", fontSize: "12px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                            formatter={(v: any) => [`${v} işletme`, "Kullanım"]}
                                        />
                                        <Bar dataKey="isletme" radius={[0, 4, 4, 0]} maxBarSize={14}>
                                            {paketDagilim.map((entry, index) => (
                                                <Cell key={`bar-${index}`} fill={entry.renk} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex h-[220px] w-full items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-xl">
                                Veri bulunamadı
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
