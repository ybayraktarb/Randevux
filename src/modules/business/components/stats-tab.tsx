"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, TrendingUp, Users, Calendar, Building2, CalendarDays } from "lucide-react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend
} from "recharts"
import { cn } from "@/lib/utils"

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"]

export function StatsTab() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState("30") // days

    // Stats State
    const [summaryStats, setSummaryStats] = useState({
        revenue: 0,
        revenueGrowth: "+0%",
        users: 0,
        usersGrowth: "+0%",
        businesses: 0,
        bizGrowth: "+0%",
        appointments: 0,
        apptsGrowth: "+0%"
    })

    const [revenueData, setRevenueData] = useState<any[]>([])
    const [statusData, setStatusData] = useState<any[]>([])

    useEffect(() => {
        fetchStats()
    }, [dateRange])

    async function fetchStats() {
        setLoading(true)

        // Yalnızca mock veri gösterimi, ileride gerçek API / Supabase RPC'lerine bağlanacak
        // Simulate API call
        await new Promise(r => setTimeout(r, 600))

        const days = parseInt(dateRange)

        // --- Mock Data Generation --- //

        // 1. Summary Cards
        setSummaryStats({
            revenue: Math.floor(Math.random() * 50000) + 10000,
            revenueGrowth: "+12.5%",
            users: Math.floor(Math.random() * 1000) + 100,
            usersGrowth: "+5.2%",
            businesses: Math.floor(Math.random() * 50) + 10,
            bizGrowth: "+2.1%",
            appointments: Math.floor(Math.random() * 3000) + 500,
            apptsGrowth: "+18.4%"
        })

        // 2. Revenue Chart Data
        const revData = []
        let currentRev = 1000
        for (let i = days; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            currentRev = currentRev + (Math.random() * 500 - 200)
            if (currentRev < 0) currentRev = 100
            revData.push({
                date: d.toLocaleDateString("tr-TR", { month: "short", day: "numeric" }),
                gelir: Math.floor(currentRev)
            })
        }
        setRevenueData(revData)

        // 3. Appointment Status Data
        setStatusData([
            { name: "Tamamlandı", value: Math.floor(Math.random() * 500) + 200 },
            { name: "Beklemede", value: Math.floor(Math.random() * 200) + 50 },
            { name: "İptal Edildi", value: Math.floor(Math.random() * 100) + 20 },
            { name: "No-Show", value: Math.floor(Math.random() * 50) + 5 },
        ])

        setLoading(false)
    }

    const statCards = [
        { title: "Toplam Gelir (Tahmini)", value: `₺${summaryStats.revenue.toLocaleString('tr-TR')}`, icon: TrendingUp, trend: summaryStats.revenueGrowth, trendUp: true },
        { title: "Yeni Kullanıcılar", value: summaryStats.users, icon: Users, trend: summaryStats.usersGrowth, trendUp: true },
        { title: "Aktif İşletmeler", value: summaryStats.businesses, icon: Building2, trend: summaryStats.bizGrowth, trendUp: true },
        { title: "Randevu Hacmi", value: summaryStats.appointments, icon: CalendarDays, trend: summaryStats.apptsGrowth, trendUp: true },
    ]

    if (loading && revenueData.length === 0) {
        return (
            <div className="flex items-center justify-center p-24">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header & Date Picker */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Platform İstatistikleri</h2>
                    <p className="text-sm text-muted-foreground">Genel platform verileri ve performans analizi</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
                    {[
                        { label: "Son 7 Gün", val: "7" },
                        { label: "Son 30 Gün", val: "30" },
                        { label: "Bu Yıl", val: "365" }
                    ].map(opt => (
                        <button
                            key={opt.val}
                            type="button"
                            onClick={() => setDateRange(opt.val)}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                dateRange === opt.val
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-primary-light hover:text-foreground"
                            )}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card, i) => {
                    const Icon = card.icon
                    return (
                        <div key={i} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-muted-foreground">{card.title}</span>
                                <div className="flex size-8 items-center justify-center rounded-lg bg-primary-light">
                                    <Icon className="size-4 text-primary" />
                                </div>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-2xl font-bold text-foreground">{card.value}</span>
                                <span className={cn("mb-1 text-xs font-medium", card.trendUp ? "text-success" : "text-danger")}>
                                    {card.trend}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Line Chart */}
                <div className="relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] lg:col-span-2">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    )}
                    <div className="mb-4">
                        <h3 className="text-base font-semibold text-foreground">Gelir / İşlem Hacmi Trendi</h3>
                        <p className="text-xs text-muted-foreground">Seçili tarih aralığındaki günlük gelir ve hacim</p>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} dy={10} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    itemStyle={{ color: "#111827", fontWeight: 500 }}
                                    labelStyle={{ color: "#6B7280", marginBottom: "4px" }}
                                />
                                <Area type="monotone" dataKey="gelir" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorGelir)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart */}
                <div className="relative flex flex-col rounded-xl border border-border bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    {loading && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-sm">
                            <Loader2 className="size-6 animate-spin text-primary" />
                        </div>
                    )}
                    <div className="mb-4 text-center">
                        <h3 className="text-base font-semibold text-foreground">Randevu Durum Dağılımı</h3>
                        <p className="text-xs text-muted-foreground">Tüm platform randevularının analizi</p>
                    </div>
                    <div className="h-[260px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", padding: "8px 12px" }}
                                    itemStyle={{ color: "#111827", fontWeight: 500 }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value) => <span className="text-sm font-medium text-foreground ml-1">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    )
}
