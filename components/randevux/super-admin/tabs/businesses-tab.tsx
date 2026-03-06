"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, MoreHorizontal, Settings, ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { RxAvatar } from "../../rx-avatar"
import { RxBadge } from "../../rx-badge"
import { RxButton } from "../../rx-button"
import { BusinessesDrawer } from "./businesses-drawer"
import { BusinessesAddModal } from "./businesses-add-modal"

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

export function BusinessesTab() {
    const supabase = createClient()

    // GRUP 1 — Ana liste state
    const [businesses, setBusinesses] = useState<Business[]>([])
    const [modulesList, setModulesList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [moduleFilter, setModuleFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    const [totalCount, setTotalCount] = useState(0)

    // GRUP 2 — Drawer (selectedBiz ve drawerOpen burada, içerik Drawer'a prop)
    const [selectedBiz, setSelectedBiz] = useState<Business | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuOpenIdx, setMenuOpenIdx] = useState<number | null>(null)

    useEffect(() => {
        supabase.from("modules").select("id, display_name").then(({ data }) => {
            if (data) setModulesList(data)
        })
    }, [])

    useEffect(() => {
        const t = setTimeout(() => fetchBusinesses(), 400)
        return () => clearTimeout(t)
    }, [currentPage, moduleFilter, statusFilter, searchQuery])

    async function fetchBusinesses() {
        setLoading(true)
        let query = supabase
            .from("businesses")
            .select(`
        *,
        module:modules(display_name),
        owners:business_owners( users(name, email, phone) ),
        staff:staff_business(id),
        customers:business_customers(id),
        appts:appointments(id)
      `, { count: 'exact' })
            .order("created_at", { ascending: false })

        if (searchQuery) query = query.ilike("name", `%${searchQuery}%`)
        if (moduleFilter !== "all") query = query.eq("module_id", moduleFilter)
        if (statusFilter === "active") query = query.eq("is_active", true)
        if (statusFilter === "passive") query = query.eq("is_active", false)

        const from = (currentPage - 1) * itemsPerPage
        query = query.range(from, from + itemsPerPage - 1)

        const { data: bizData, count } = await query

        if (bizData) {
            const mapped = bizData.map((b: any) => {
                const mod = Array.isArray(b.module) ? b.module[0] : b.module
                const owner = b.owners?.[0]?.users
                return {
                    id: b.id, name: b.name, city: b.address || "Belirtilmemiş",
                    module: mod?.display_name || "?",
                    patron: owner?.name || "Bilinmiyor",
                    patronEmail: owner?.email || "-", patronPhone: owner?.phone || "-",
                    staff: b.staff?.length || 0, customers: b.customers?.length || 0,
                    appts: b.appts?.length || 0,
                    date: new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }),
                    active: b.is_active, raw: b,
                }
            })
            setBusinesses(mapped)
        }
        if (count !== null) setTotalCount(count)
        setLoading(false)
    }

    async function toggleStatus(id: string, current: boolean) {
        const { error } = await supabase.from("businesses").update({ is_active: !current }).eq("id", id)
        if (!error) fetchBusinesses()
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">{"İşletmeler"}</h2>
                    <p className="text-sm text-muted-foreground">{totalCount} kayıtlı işletme</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <BusinessesAddModal modulesList={modulesList} onSuccess={fetchBusinesses} />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" placeholder="İşletme ara..." value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="h-9 w-56 rounded-lg border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1" />
                    </div>
                    <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1) }}
                        className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                        <option value="all">{"Tüm Modüller"}</option>
                        {modulesList.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                        className="h-9 rounded-lg border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                        <option value="all">Durum</option>
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="size-6 animate-spin text-primary" /></div>
                ) : (
                    <table className="w-full min-w-[900px]">
                        <thead>
                            <tr className="border-b border-border">
                                {["İşletme", "Modül", "Patron", "Personel", "Müşteri", "Randevu", "Kayıt Tarihi", "Durum", "İşlemler"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {businesses.map((biz, idx) => (
                                <tr key={biz.id} className="border-b border-border last:border-0 transition-colors hover:bg-primary-light/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <RxAvatar name={biz.name} size="sm" />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-foreground">{biz.name}</span>
                                                <span className="text-xs text-muted-foreground">{biz.city}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={cn("inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
                                            biz.module === "Berber" ? "bg-badge-purple-bg text-badge-purple-text" : "bg-badge-green-bg text-badge-green-text")}>
                                            {biz.module}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] text-foreground">{biz.patron}</td>
                                    <td className="px-4 py-3 text-[13px] text-foreground">{biz.staff}</td>
                                    <td className="px-4 py-3 text-[13px] text-foreground">{biz.customers}</td>
                                    <td className="px-4 py-3 text-[13px] font-semibold text-foreground">{biz.appts}</td>
                                    <td className="px-4 py-3 text-[13px] text-muted-foreground">{biz.date}</td>
                                    <td className="px-4 py-3">
                                        <button type="button" onClick={() => toggleStatus(biz.id, biz.active)}
                                            className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200", biz.active ? "bg-success" : "bg-muted")}
                                            role="switch" aria-checked={biz.active}>
                                            <span className={cn("pointer-events-none inline-block size-4 transform rounded-full bg-card shadow-sm ring-0 transition-transform duration-200", biz.active ? "translate-x-[18px]" : "translate-x-0.5")} style={{ marginTop: "2px" }} />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => { setSelectedBiz(biz); setDrawerOpen(true) }}
                                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-light">
                                                Detay
                                            </button>
                                            <div className="relative">
                                                <button type="button" onClick={() => setMenuOpenIdx(menuOpenIdx === idx ? null : idx)}
                                                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                                                    <MoreHorizontal className="size-4" />
                                                </button>
                                                {menuOpenIdx === idx && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setMenuOpenIdx(null)} aria-hidden="true" />
                                                        <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-lg border border-border bg-card py-1 shadow-lg">
                                                            <button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground transition-colors hover:bg-primary-light"
                                                                onClick={() => { setMenuOpenIdx(null); toggleStatus(biz.id, biz.active) }}>
                                                                <Settings className="size-3.5" /> {biz.active ? "Pasife Al" : "Aktif Et"}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {businesses.length === 0 && (
                                <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">İşletme bulunamadı</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">
                        Toplam {totalCount} kayıttan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} arası gösteriliyor
                    </span>
                    <div className="flex items-center shadow-sm rounded-lg border border-border bg-card">
                        <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded-l-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
                            <ChevronLeft className="size-4" /> Önceki
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <span className="px-4 text-sm font-medium text-muted-foreground">Sayfa {currentPage} / {totalPages}</span>
                        <div className="h-4 w-px bg-border" />
                        <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                            className="flex items-center gap-1 rounded-r-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50">
                            Sonraki <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Drawer */}
            {selectedBiz && (
                <BusinessesDrawer
                    business={selectedBiz}
                    isOpen={drawerOpen}
                    onClose={() => setDrawerOpen(false)}
                    onStatusChange={() => { fetchBusinesses(); setDrawerOpen(false) }}
                />
            )}
        </div>
    )
}
