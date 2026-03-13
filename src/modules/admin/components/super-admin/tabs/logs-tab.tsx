"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Download, Search, ChevronLeft, ChevronRight, Info } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"

export function LogsTab() {
    const supabase = createClient()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [searchQuery, setSearchQuery] = useState("")
    const [actionFilter, setActionFilter] = useState("all")
    const [tableFilter, setTableFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20
    const [totalCount, setTotalCount] = useState(0)

    useEffect(() => {
        fetchLogs()
    }, [currentPage, actionFilter, tableFilter, dateFilter])

    async function fetchLogs() {
        setLoading(true)
        let query = supabase
            .from("audit_logs")
            .select(`
        *,
        users (name, auth_provider)
      `, { count: 'exact' })
            .order("created_at", { ascending: false })

        if (actionFilter !== "all") {
            query = query.eq("action", actionFilter)
        }
        if (tableFilter !== "all") {
            query = query.eq("target_table", tableFilter)
        }
        if (dateFilter) {
            const startDate = new Date(dateFilter)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(startDate)
            endDate.setHours(23, 59, 59, 999)
            query = query.gte("created_at", startDate.toISOString())
            query = query.lte("created_at", endDate.toISOString())
        }

        const from = (currentPage - 1) * itemsPerPage
        const to = from + itemsPerPage - 1
        query = query.range(from, to)

        const { data, count } = await query

        if (data) {
            const mapped = data.map((log: any) => ({
                time: new Date(log.created_at).toLocaleString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                user: log.users?.name || "Bilinmeyen Kullanıcı",
                role: log.users?.auth_provider === "google" ? "Google Login" : "Email",
                action: log.action,
                table: log.target_table,
                record: log.target_id ? `#${log.target_id.substring(0, 8)}` : "-",
                ip: log.ip_address || "Bilinmiyor",
                rawUser: log.user
            }))
            setLogs(mapped)
        }
        if (count !== null) setTotalCount(count)
        setLoading(false)
    }

    async function handleExportCSV() {
        let query = supabase
            .from("audit_logs")
            .select(`
        *,
        users (name, auth_provider)
      `)
            .order("created_at", { ascending: false })
            .limit(2000)

        if (actionFilter !== "all") query = query.eq("action", actionFilter)
        if (tableFilter !== "all") query = query.eq("target_table", tableFilter)
        if (dateFilter) {
            const startDate = new Date(dateFilter)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(startDate)
            endDate.setHours(23, 59, 59, 999)
            query = query.gte("created_at", startDate.toISOString())
            query = query.lte("created_at", endDate.toISOString())
        }

        const { data } = await query
        if (!data || data.length === 0) {
            alert("Dışa aktarılacak kayıt bulunamadı.")
            return
        }

        const headers = ["Zaman", "Kullanıcı", "Giris Tipi", "Islem", "Tablo", "Kayit ID", "IP Adresi"]
        const rows = data.map((log: any) => {
            const time = new Date(log.created_at).toLocaleString("tr-TR")
            const user = log.users?.name || "Bilinmeyen Kullanıcı"
            const role = log.users?.auth_provider === "google" ? "Google" : "Email"
            const action = log.action
            const table = log.target_table
            const record = log.target_id || "-"
            const ip = log.ip_address || "Bilinmiyor"
            return [time, user, role, action, table, record, ip].map(v => `"${v}"`).join(",")
        })

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(",") + "\n" + rows.join("\n")
        const encodedUri = encodeURI(csvContent)
        const link = document.createElement("a")
        link.setAttribute("href", encodedUri)
        link.setAttribute("download", `sistem_loglari_${new Date().toISOString().split("T")[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const actionBadge = (action: string) => {
        switch (action) {
            case "viewed":
                return <span className="inline-flex items-center rounded-md bg-badge-purple-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-purple-text">viewed</span>
            case "created":
                return <span className="inline-flex items-center rounded-md bg-badge-green-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-green-text">created</span>
            case "updated":
                return <span className="inline-flex items-center rounded-md bg-badge-yellow-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-yellow-text">updated</span>
            case "deleted":
                return <span className="inline-flex items-center rounded-md bg-badge-red-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-red-text">deleted</span>
            default:
                return <span className="inline-flex items-center rounded-md bg-badge-gray-bg px-2 py-0.5 font-mono text-[11px] font-medium text-badge-gray-text">{action}</span>
        }
    }

    const filtered = logs.filter((log) => {
        if (searchQuery && !log.user.toLowerCase().includes(searchQuery.toLowerCase()) && !log.action.toLowerCase().includes(searchQuery.toLowerCase())) return false
        return true
    })

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">{"Sistem Logları"}</h2>
                    <p className="text-[13px] text-muted-foreground">{"KVKK uyarınca tüm veri işlemleri kayıt altındadır."}</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
                        className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    />
                    <RxButton variant="ghost" size="sm" onClick={handleExportCSV}>
                        <Download className="size-4" />
                        {"Dışa Aktar"}
                    </RxButton>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Mevcut sayfada ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    />
                </div>
                <select
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                    className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                    <option value="all">{"Tüm İşlemler"}</option>
                    <option value="viewed">viewed</option>
                    <option value="created">created</option>
                    <option value="updated">updated</option>
                    <option value="deleted">deleted</option>
                </select>
                <select
                    value={tableFilter}
                    onChange={(e) => { setTableFilter(e.target.value); setCurrentPage(1); }}
                    className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                    <option value="all">{"Tüm Tablolar"}</option>
                    <option value="appointments">appointments</option>
                    <option value="businesses">businesses</option>
                    <option value="users">users</option>
                    <option value="customers">customers</option>
                    <option value="staff">staff</option>
                    <option value="modules">modules</option>
                </select>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
                ) : (
                    <table className="w-full min-w-[800px]">
                        <thead>
                            <tr className="border-b border-border">
                                {["Zaman", "Kullanıcı", "İşlem", "Tablo", "Kayıt ID", "IP Adresi"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((log, idx) => (
                                <tr key={idx} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
                                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{log.time}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-[13px] text-foreground">{log.user}</span>
                                        {log.role && (
                                            <span className="ml-1 text-[11px] text-muted-foreground">({log.role})</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{actionBadge(log.action)}</td>
                                    <td className="px-4 py-3 font-mono text-[13px] text-foreground">{log.table}</td>
                                    <td className="px-4 py-3 font-mono text-[13px] text-primary">{log.record}</td>
                                    <td className="px-4 py-3 font-mono text-[13px] text-muted-foreground">{log.ip}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">Kayıt bulunamadı</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                    Toplam {totalCount} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} arası gösteriliyor
                </span>
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground disabled:opacity-50"
                    >
                        <ChevronLeft className="size-4" />
                    </button>

                    <span className="text-sm font-medium px-2">Sayfa {currentPage} / {totalPages}</span>

                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-primary-light hover:text-foreground disabled:opacity-50"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 rounded-lg border border-border border-l-[3px] border-l-primary bg-primary-light px-4 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                <p className="text-[13px] text-foreground leading-relaxed">
                    {"Log kayıtları 5651 sayılı kanun ve KVKK uyarınca 2 yıl süreyle saklanmaktadır."}
                </p>
            </div>
        </div>
    )
}
