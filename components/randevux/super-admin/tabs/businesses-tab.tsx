"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Search, MoreHorizontal, Settings, ChevronLeft, ChevronRight, Plus, FileText, CreditCard, Wrench, CheckCircle2, Users, ShoppingBag, Calendar, MoreVertical, LogIn, StopCircle, PlayCircle } from "lucide-react"
import { RxAvatar } from "../../rx-avatar"
import { RxBadge } from "../../rx-badge"
import { RxButton } from "../../rx-button"
import { BusinessesDrawer } from "./businesses-drawer"
import { BusinessesAddModal } from "./businesses-add-modal"
import { toggleBusinessActiveAction } from "@/app/actions/business.actions"
import { impersonateUserAction } from "@/app/actions/user.actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
    onboarding_status: "contract_pending" | "payment_pending" | "setup" | "live"
    raw: any
}

// Oboarding Status Helper
const getStatusConfig = (status: string) => {
    switch (status) {
        case "contract_pending": return { label: "Sözleşme Bekliyor", color: "text-amber-600 bg-amber-50 border-amber-200", icon: FileText }
        case "payment_pending": return { label: "Ödeme Bekliyor", color: "text-rose-600 bg-rose-50 border-rose-200", icon: CreditCard }
        case "setup": return { label: "Kurulum Aşamasında", color: "text-blue-600 bg-blue-50 border-blue-200", icon: Wrench }
        case "live": return { label: "Canlı (Aktif)", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: CheckCircle2 }
        default: return { label: "Bilinmiyor", color: "text-gray-600 bg-gray-50 border-gray-200", icon: CheckCircle2 }
    }
}

export function BusinessesTab() {
    const supabase = createClient()
    const router = useRouter()

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
        packages(name),
        owners:business_owners( user_id, users(name, email, phone) ),
        staff:staff_business(id),
        customers:business_customers(id),
        appts:appointments(id),
        subscriptions(contract_url, ends_at, starts_at)
      `, { count: 'exact' })
            .order("created_at", { ascending: false })

        if (searchQuery) query = query.ilike("name", `%${searchQuery}%`)
        if (moduleFilter !== "all") query = query.eq("module_id", moduleFilter)
        
        if (statusFilter !== "all") {
            if (statusFilter === "active") query = query.eq("is_active", true)
            else if (statusFilter === "passive") query = query.eq("is_active", false)
            else query = query.eq("onboarding_status", statusFilter)
        }

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
                    active: b.is_active, 
                    onboarding_status: b.onboarding_status || "live",
                    raw: b,
                }
            })
            setBusinesses(mapped)
        }
        if (count !== null) setTotalCount(count)
        setLoading(false)
    }

    async function toggleStatus(id: string, current: boolean) {
        setLoading(true)
        const res = await toggleBusinessActiveAction(id, !current)
        if (res.success) {
            toast.success(current ? "İşletme pasifleştirildi ve arşivlendi." : "İşletme tekrar aktif edildi.")
            fetchBusinesses()
        } else {
            toast.error(res.error?.message || "İşlem başarısız oldu.")
            setLoading(false)
        }
    }

    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage))

    return (
        <div className="flex flex-col gap-6 ">
            {/* Header & Toolbar */}
            <div className="flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-[22px] font-semibold text-foreground tracking-tight">İşletmeler Listesi</h2>
                        <p className="text-sm text-muted-foreground">{totalCount} kayıtlı işletme ve pipeline süreci listeleniyor.</p>
                    </div>
                    <div className="shrink-0">
                        <BusinessesAddModal modulesList={modulesList} onSuccess={fetchBusinesses} />
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-2 shadow-sm">
                    <div className="relative flex-1 min-w-[200px] max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" placeholder="İşletme ara..." value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                            className="h-9 w-full rounded-md bg-transparent pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    
                    <div className="h-5 w-px bg-border hidden sm:block" />

                    <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setCurrentPage(1) }}
                        className="h-9 min-w-[160px] cursor-pointer rounded-md bg-transparent px-3 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-accent transition-colors border-none appearance-none">
                        <option value="all">Tüm Modüller / Sektörler</option>
                        {modulesList.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                    </select>

                    <div className="h-5 w-px bg-border hidden sm:block" />

                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                        className="h-9 min-w-[180px] cursor-pointer rounded-md bg-transparent px-3 text-[13px] font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 hover:bg-accent transition-colors border-none appearance-none">
                        <option value="all">Tüm Aşamalar</option>
                        <optgroup label="Sistem Durumu">
                            <option value="active">🟢 Sistem: Aktif</option>
                            <option value="passive">🔴 Sistem: Pasif</option>
                        </optgroup>
                        <optgroup label="Kurulum Süreci (Pipeline)">
                            <option value="contract_pending">📝 Sözleşme Bekliyor</option>
                            <option value="payment_pending">💳 Ödeme Bekliyor</option>
                            <option value="setup">⚙️ Kurulum Aşamasında</option>
                            <option value="live">✅ Canlıda</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm relative">
                {loading && (
                    <div className="absolute inset-0 z-10 flex min-h-[300px] items-center justify-center bg-background/50 backdrop-blur-sm">
                        <Loader2 className="size-8 animate-spin text-primary" />
                    </div>
                )}
                <table className="w-full min-w-[1000px] text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 transition-colors hover:bg-muted/50">
                            {["İşletme Kimliği", "Aşama", "Abonelik Paketi", "Sistem Sahibi (Patron)", "Metrikler"].map((h) => (
                                <th key={h} className="px-4 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">{h}</th>
                            ))}
                            <th className="px-4 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">
                                <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Kayıt Tarihi</span>
                            </th>
                            {["Durum", "İşlemler"].map((h) => (
                                <th key={h} className="px-4 py-3.5 text-left text-[13px] font-semibold text-muted-foreground/80 whitespace-nowrap">{h}</th>
                            ))}
                        </tr>
                    </thead>
                        <tbody>
                            {businesses.map((biz, idx) => {
                                const statusInfo = getStatusConfig(biz.onboarding_status)
                                const StatusIcon = statusInfo.icon

                                return (
                                    <tr 
                                        key={biz.id} 
                                        className={cn(
                                            "border-b border-border last:border-0 transition-all hover:bg-primary-light/40 cursor-pointer group", 
                                            !biz.active && "opacity-60"
                                        )}
                                        onClick={() => { setSelectedBiz(biz); setDrawerOpen(true); setMenuOpenIdx(null); }}
                                    >
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
                                            <div className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold", statusInfo.color)}>
                                                <StatusIcon className="size-3" />
                                                {statusInfo.label}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="inline-flex items-center rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                                                {biz.raw.packages?.name || "Özel Plan"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[13px] font-medium text-foreground">{biz.patron}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[11px] font-medium text-blue-700" title="Personel">
                                                    <Users className="size-3" /> {biz.staff}
                                                </div>
                                                <div className="flex items-center gap-1 rounded-md bg-purple-50 px-1.5 py-0.5 text-[11px] font-medium text-purple-700" title="Müşteri">
                                                    <ShoppingBag className="size-3" /> {biz.customers}
                                                </div>
                                                <div className="flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700" title="Randevu">
                                                    <Calendar className="size-3" /> {biz.appts}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-[12px] text-muted-foreground whitespace-nowrap">{biz.date}</td>
                                        <td className="px-4 py-3">
                                            <button type="button" onClick={(e) => { e.stopPropagation(); toggleStatus(biz.id, biz.active); }}
                                                className={cn("relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 border border-transparent hover:border-border", biz.active ? "bg-success/90 hover:bg-success" : "bg-muted-foreground/30 hover:bg-muted-foreground/50")}
                                                role="switch" aria-checked={biz.active}>
                                                <span className={cn("pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200", biz.active ? "translate-x-[18px]" : "translate-x-0.5")} style={{ marginTop: "1px" }} />
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="relative inline-block text-left">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setMenuOpenIdx(menuOpenIdx === idx ? null : idx); }}
                                                    className="flex items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted group-hover:bg-white/50"
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>

                                                {menuOpenIdx === idx && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenIdx(null)} />
                                                        <div className="absolute right-0 top-full z-20 mt-1 w-48 origin-top-right rounded-lg border border-border bg-card p-1 shadow-md animate-in fade-in zoom-in-95">
                                                            <button
                                                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                                                                onClick={() => { setSelectedBiz(biz); setDrawerOpen(true); setMenuOpenIdx(null); }}
                                                            >
                                                                <Settings className="size-4" /> İşletmeyi Yönet
                                                            </button>
                                                            <button
                                                                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                                                                onClick={async () => { 
                                                                    setMenuOpenIdx(null);
                                                                    const res = await impersonateUserAction(biz.raw.owners?.[0]?.user_id);
                                                                    if (res.success) {
                                                                        toast.success(`${biz.name} olarak görüntüleniyor...`);
                                                                        router.push("/patron/dashboard");
                                                                        router.refresh();
                                                                    } else {
                                                                        toast.error(res.error?.message || "Hata oluştu.");
                                                                    }
                                                                }}
                                                            >
                                                                <LogIn className="size-4" /> Patron Görünümü
                                                            </button>
                                                            <div className="my-1 h-px bg-border" />
                                                            <button
                                                                className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors", biz.active ? "text-danger hover:bg-danger/10" : "text-success hover:bg-success/10")}
                                                                onClick={() => { toggleStatus(biz.id, biz.active); setMenuOpenIdx(null); }}
                                                            >
                                                                {biz.active ? (
                                                                    <><StopCircle className="size-4" /> Sistemi Durdur</>
                                                                ) : (
                                                                    <><PlayCircle className="size-4" /> Sistemi Başlat</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            {businesses.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground/50">
                                                <Search className="size-6" />
                                            </div>
                                            <p className="text-[14px] font-medium text-foreground">İşletme bulunamadı</p>
                                            <p className="text-xs text-muted-foreground">Farklı filtreler ile tekrar arama yapmayı deneyin.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
