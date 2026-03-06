"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, Plus, Wallet, FileText, CheckCircle, Search, Calendar as CalendarIcon, Download, RefreshCw, Trash2, Edit2, X } from "lucide-react"
import { RxButton } from "./rx-button"
import { RxInput, RxTextarea } from "./rx-input"
import { RxBadge } from "./rx-badge"
import { RxAvatar } from "./rx-avatar"
import { toast } from "sonner"
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from "recharts"
import {
    getTransactionsAction,
    addTransactionAction,
    getStaffCommissionsAction,
    upsertStaffCommissionAction,
    generatePayrollPreviewAction,
    savePayrollRecordAction,
    deleteTransactionAction
} from "@/app/actions/finance.actions"

export function FinanceDashboard({ businessId }: { businessId: string }) {
    const [activeTab, setActiveTab] = useState<"kasa" | "prim" | "hakedis">("kasa")

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-0 border-b border-border">
                {[
                    { key: "kasa", label: "Kasa Haraketleri & Giderler", icon: Wallet },
                    { key: "prim", label: "Personel Prim Kuralları", icon: FileText },
                    { key: "hakedis", label: "Hak Ediş İşlemleri", icon: CheckCircle },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={cn(
                            "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
                            activeTab === tab.key
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                    >
                        <tab.icon className="size-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="min-h-[500px]">
                {activeTab === "kasa" && <KasaHareketleriTab businessId={businessId} />}
                {activeTab === "prim" && <PrimKurallariTab businessId={businessId} />}
                {activeTab === "hakedis" && <HakEdisRaporlariTab businessId={businessId} />}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: KASA HAREKETLERİ
// ─────────────────────────────────────────────────────────────────────────────
function KasaHareketleriTab({ businessId }: { businessId: string }) {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        const res = await getTransactionsAction(businessId)
        if (res.success && res.data) {
            setData(res.data)
        } else {
            toast.error(res.error || "Giderler yüklenemedi")
        }
        setLoading(false)
    }, [businessId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const totalIncome = data.filter(d => d.type === "income").reduce((acc, curr) => acc + Number(curr.amount), 0)
    const totalExpense = data.filter(d => d.type === "expense").reduce((acc, curr) => acc + Number(curr.amount), 0)
    const netCiro = totalIncome - totalExpense

    return (
        <div className="flex flex-col gap-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <span className="text-sm font-medium text-muted-foreground">Toplam Gelir</span>
                    <span className="text-2xl font-bold text-success">₺{totalIncome.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <span className="text-sm font-medium text-muted-foreground">Toplam Gider</span>
                    <span className="text-2xl font-bold text-destructive">₺{totalExpense.toLocaleString("tr-TR")}</span>
                </div>
                <div className="flex flex-col gap-1 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <span className="text-sm font-medium text-muted-foreground">Net Kasa</span>
                    <span className="text-2xl font-bold text-foreground">₺{netCiro.toLocaleString("tr-TR")}</span>
                </div>
            </div>

            {/* Grafikler */}
            {data.length > 0 && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                        <h3 className="text-sm font-semibold mb-4">Gelir / Gider Dağılımı</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Gelir", value: totalIncome },
                                            { name: "Gider", value: totalExpense }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        <Cell fill="#10B981" />
                                        <Cell fill="#EF4444" />
                                    </Pie>
                                    <RechartsTooltip formatter={(v: any) => `₺${Number(v).toLocaleString("tr-TR")}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                        <h3 className="text-sm font-semibold mb-4">Kasa Hareket Trendi</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={data.slice().reverse().map(d => ({
                                        date: new Date(d.transaction_date).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short' }),
                                        amount: d.type === 'income' ? d.amount : -d.amount
                                    }))}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₺${v}`} />
                                    <RechartsTooltip formatter={(v: any) => `₺${Number(v).toLocaleString("tr-TR")}`} />
                                    <Area type="monotone" dataKey="amount" stroke="#6C63FF" fillOpacity={1} fill="url(#colorAmount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Son Hareketler</h2>
                <div className="flex gap-2">
                    <RxButton variant="ghost" onClick={fetchData} className="border border-border">
                        <RefreshCw className={cn("size-4 mr-1", loading && "animate-spin")} /> Yenile
                    </RxButton>
                    <RxButton variant="primary" onClick={() => setIsModalOpen(true)}>
                        <Plus className="size-4" /> Gider/Gelir Ekle
                    </RxButton>
                </div>
            </div>

            {/* Tablo */}
            <div className="rounded-xl bg-card overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.06)] relative min-h-[300px] border border-border">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-card/50">
                        <Loader2 className="size-6 animate-spin text-primary" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-muted/40 border-b border-border">
                                <tr>
                                    <th className="px-5 py-3 text-left text-[13px] font-medium uppercase text-muted-foreground">Tarih</th>
                                    <th className="px-5 py-3 text-left text-[13px] font-medium uppercase text-muted-foreground">İşlem Gerekçesi</th>
                                    <th className="px-5 py-3 text-left text-[13px] font-medium uppercase text-muted-foreground">Kategori</th>
                                    <th className="px-5 py-3 text-left text-[13px] font-medium uppercase text-muted-foreground">Yöntem</th>
                                    <th className="px-5 py-3 text-right text-[13px] font-medium uppercase text-muted-foreground">Tutar</th>
                                    <th className="px-5 py-3 text-right text-[13px] font-medium uppercase text-muted-foreground">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Hareket bulunamadı.</td></tr>
                                ) : data.map((row) => (
                                    <tr key={row.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="px-5 py-3 text-sm text-foreground">
                                            {new Date(row.transaction_date).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3 text-sm font-medium text-foreground">{row.description || "-"}</td>
                                        <td className="px-5 py-3 text-sm text-muted-foreground capitalize">{row.category}</td>
                                        <td className="px-5 py-3 text-sm text-muted-foreground capitalize">{row.payment_method.replace('_', ' ')}</td>
                                        <td className={cn("px-5 py-3 text-sm font-semibold text-right", row.type === "income" ? "text-success" : "text-destructive")}>
                                            {row.type === "income" ? "+" : "-"}₺{Number(row.amount).toLocaleString("tr-TR")}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Bu işlemi silmek istediğinize emin misiniz?")) {
                                                        const res = await deleteTransactionAction(row.id, businessId)
                                                        if (res.success) {
                                                            toast.success("İşlem silindi.")
                                                            fetchData()
                                                        } else {
                                                            toast.error(res.error || "Silinemedi")
                                                        }
                                                    }
                                                }}
                                                className="p-1 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddTransactionModal open={isModalOpen} onClose={() => setIsModalOpen(false)} businessId={businessId} onAdded={fetchData} />
        </div>
    )
}

function AddTransactionModal({ open, onClose, businessId, onAdded }: { open: boolean, onClose: () => void, businessId: string, onAdded: () => void }) {
    const [type, setType] = useState<"expense" | "income">("expense")
    const [category, setCategory] = useState("supplies")
    const [amount, setAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit_card" | "transfer">("transfer")
    const [description, setDescription] = useState("")
    const [saving, setSaving] = useState(false)

    if (!open) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await addTransactionAction({
            businessId,
            type,
            category,
            amount: Number(amount) || 0,
            paymentMethod,
            description
        })
        setSaving(false)
        if (!res.success) {
            toast.error(res.error || "Eklenemedi")
            return
        }
        toast.success("Kasa hareketi eklendi.")
        onAdded()
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
            <div className="w-full max-w-md bg-card rounded-xl shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Yeni Kasa Hareketi</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"><X className="size-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
                    <div className="flex rounded-lg overflow-hidden border border-border">
                        <button type="button" onClick={() => setType("expense")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", type === "expense" ? "bg-destructive/10 text-destructive border-b-2 border-destructive" : "bg-card text-muted-foreground hover:bg-muted")}>Gider Çıkışı</button>
                        <button type="button" onClick={() => setType("income")} className={cn("flex-1 py-2 text-sm font-medium transition-colors", type === "income" ? "bg-success/10 text-success border-b-2 border-success" : "bg-card text-muted-foreground hover:bg-muted")}>Gelir Girişi</button>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Kategori</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none focus:border-primary">
                            <optgroup label="Giderler">
                                <option value="rent">Kira</option>
                                <option value="supplies">Malzeme / Sarf</option>
                                <option value="salary">Maaş / Prim</option>
                                <option value="electric_bill">Elektrik, Su, İnternet</option>
                                <option value="other_expense">Diğer Gider</option>
                            </optgroup>
                            <optgroup label="Gelirler">
                                <option value="service">Hizmet (Adisyon Dışı)</option>
                                <option value="product">Ürün Satışı</option>
                                <option value="other_income">Diğer Gelir</option>
                            </optgroup>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Tutar (₺)</label>
                            <input type="number" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Ödeme Yöntemi</label>
                            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none focus:border-primary">
                                <option value="cash">Nakit</option>
                                <option value="credit_card">Kredi Kartı</option>
                                <option value="transfer">Havale / EFT</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Açıklama</label>
                        <RxTextarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Elektrik faturası veya dükkan alışverişi..." />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <RxButton type="button" variant="ghost" onClick={onClose}>İptal</RxButton>
                        <RxButton type="submit" variant="primary" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin size-4" /> : <CheckCircle className="size-4" />}
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </RxButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: PERSONEL PRİM KURALLARI
// ─────────────────────────────────────────────────────────────────────────────
function PrimKurallariTab({ businessId }: { businessId: string }) {
    const [staffList, setStaffList] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedStaffRule, setSelectedStaffRule] = useState<any>(null)

    const fetchCommissions = useCallback(async () => {
        setLoading(true)
        const res = await getStaffCommissionsAction(businessId)
        if (res.success && res.data) {
            setStaffList(res.data)
        }
        setLoading(false)
    }, [businessId])

    useEffect(() => {
        fetchCommissions()
    }, [fetchCommissions])

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Personel Bazlı Prim Yüzdeleri</h2>
                <p className="text-sm text-muted-foreground hidden sm:block">Adisyonlardan personelin alacağı pay.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin size-6 text-primary" /></div>
                ) : staffList.map(staff => (
                    <div key={staff.id} className="bg-card border border-border rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <RxAvatar name={staff.user.name} />
                            <div>
                                <h3 className="text-base font-semibold">{staff.user.name}</h3>
                                <span className="text-xs text-muted-foreground">{staff.role}</span>
                            </div>
                        </div>

                        <div className="bg-muted rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Hizmet Primi</span>
                                <span className="font-semibold text-primary">%{staff.commission_rule.service_commission_rate}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-muted-foreground text-xs">Taban Maaş</span>
                                <span className="font-semibold">₺{staff.commission_rule.base_salary}</span>
                            </div>
                        </div>

                        <RxButton variant="ghost" className="w-full border border-border" onClick={() => setSelectedStaffRule(staff)}>
                            Düzenle
                        </RxButton>
                    </div>
                ))}
            </div>

            <UpdateCommissionModal
                open={!!selectedStaffRule}
                onClose={() => setSelectedStaffRule(null)}
                staffData={selectedStaffRule}
                onUpdated={fetchCommissions}
            />
        </div>
    )
}

function UpdateCommissionModal({ open, onClose, staffData, onUpdated }: { open: boolean, onClose: () => void, staffData: any, onUpdated: () => void }) {
    const [serviceRate, setServiceRate] = useState("")
    const [baseSalary, setBaseSalary] = useState("")
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (staffData) {
            setServiceRate(staffData.commission_rule.service_commission_rate.toString())
            setBaseSalary(staffData.commission_rule.base_salary.toString())
        }
    }, [staffData])

    if (!open || !staffData) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await upsertStaffCommissionAction({
            staffBusinessId: staffData.id,
            serviceRate: Number(serviceRate) || 0,
            productRate: 0,
            baseSalary: Number(baseSalary) || 0
        })
        setSaving(false)
        if (res.success) {
            toast.success("Prim kuralı güncellendi")
            onUpdated()
            onClose()
        } else {
            toast.error(res.error || "Güncellenemedi")
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
            <div className="w-full max-w-sm bg-card rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Prim & Maaş Ayarı</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"><X className="size-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-3 mb-2">
                        <RxAvatar name={staffData.user.name} />
                        <div>
                            <h3 className="text-sm font-semibold">{staffData.user.name}</h3>
                            <p className="text-xs text-muted-foreground">{staffData.role}</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Hizmet Primi (%)</label>
                        <input type="number" required value={serviceRate} onChange={e => setServiceRate(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none focus:border-primary" />
                        <p className="text-[11px] text-muted-foreground mt-1">Personelin yaptığı her hizmetten alacağı yüzde.</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Taban Maaş (₺)</label>
                        <input type="number" required value={baseSalary} onChange={e => setBaseSalary(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <RxButton type="button" variant="ghost" onClick={onClose}>Vazgeç</RxButton>
                        <RxButton type="submit" variant="primary" disabled={saving}>
                            {saving ? <Loader2 className="animate-spin size-4" /> : <CheckCircle className="size-4" />}
                            Kaydet
                        </RxButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: HAK EDİŞ VE BORDRO RAPORLARI
// ─────────────────────────────────────────────────────────────────────────────
function HakEdisRaporlariTab({ businessId }: { businessId: string }) {
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [selectedStaff, setSelectedStaff] = useState("")
    const [periodStart, setPeriodStart] = useState("")
    const [periodEnd, setPeriodEnd] = useState("")
    const [previewData, setPreviewData] = useState<any>(null)
    const [staffList, setStaffList] = useState<any[]>([])

    useEffect(() => {
        // Staff listesi dropdown icin
        getStaffCommissionsAction(businessId).then(res => {
            if (res.success && res.data) setStaffList(res.data)
        })
    }, [businessId])

    const handleCalculate = async () => {
        if (!selectedStaff || !periodStart || !periodEnd) {
            toast.warning("Tüm alanları doldurun.")
            return
        }
        setLoadingPreview(true)
        const res = await generatePayrollPreviewAction(businessId, selectedStaff, periodStart, periodEnd)
        if (res.success && res.data) {
            setPreviewData(res.data)
            toast.success("Önizleme oluşturuldu")
        } else {
            toast.error(res.error || "Hesaplanamadı")
        }
        setLoadingPreview(false)
    }

    const handleSavePayroll = async () => {
        if (!previewData) return
        const res = await savePayrollRecordAction({
            businessId,
            staffBusinessId: selectedStaff,
            periodStart: previewData.periodStart,
            periodEnd: previewData.periodEnd,
            baseSalaryAmount: previewData.baseSalary,
            serviceCommissionAmount: previewData.expectedServiceCommission,
            productCommissionAmount: previewData.expectedProductCommission,
            totalAmount: previewData.totalExpected,
            notes: "Sistem üzerinden otomatik hesaplanıp ödendi."
        })

        if (res.success) {
            toast.success("Bordro başarıyla kesildi ve Kasa Gideri olarak işlendi!")
            setPreviewData(null) // form reset
        } else {
            toast.error(res.error || "Ödeme yapılamadı")
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Sol - Hesaplama Fonu */}
            <div className="flex flex-col gap-4 w-full lg:w-[350px] shrink-0 bg-card border border-border rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] h-fit">
                <h2 className="text-base font-semibold border-b border-border pb-3">Dönem & Personel Seçimi</h2>

                <div>
                    <label className="text-sm font-medium mb-1.5 block">Personel</label>
                    <select value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20">
                        <option value="">Seçiniz...</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.user.name}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Başlangıç</label>
                        <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Bitiş</label>
                        <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="w-full h-10 px-3 bg-card border border-input rounded-lg text-sm focus:ring-2 focus:ring-primary/20" />
                    </div>
                </div>

                <RxButton variant="primary" onClick={handleCalculate} disabled={loadingPreview} className="mt-2 text-sm justify-center">
                    {loadingPreview ? <Loader2 className="animate-spin size-4" /> : <Search className="size-4" />}
                    Hak Ediş Hesapla
                </RxButton>
            </div>

            {/* Sağ - Önizleme Sonucu */}
            <div className="flex-1 bg-card border border-border rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] min-h-[350px] relative">
                {!previewData ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-muted-foreground opacity-70">
                        <CalendarIcon className="size-10 mb-3" />
                        <p className="text-sm max-w-xs">Sol taraftan personel seçimi yapıp tarih girdikten sonra bordro hesaplayabilirsiniz.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Bordro Önizleme Özeti</h2>
                        </div>

                        <div className="flex flex-col gap-3 flex-1">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                <span className="text-sm text-foreground">Taban Maaş</span>
                                <span className="font-medium">₺{previewData.baseSalary.toLocaleString("tr-TR")}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                <div className="flex flex-col">
                                    <span className="text-sm text-foreground">Hizmetlerden Gelen Ciro</span>
                                    <span className="text-xs text-muted-foreground">Komisyon Oranı: %{previewData.serviceRate}</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="text-xs text-muted-foreground">Toplam Ciro: ₺{previewData.totalServiceRevenue.toLocaleString("tr-TR")}</span>
                                    <span className="font-semibold text-success">+ ₺{previewData.expectedServiceCommission.toLocaleString("tr-TR")}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                                <span className="text-sm text-foreground">Ürün Gelen Ciro</span>
                                <span className="text-xs text-muted-foreground">Sprint 7'de aktif olacak</span>
                            </div>

                            <div className="mt-auto border-t border-border pt-4">
                                <div className="flex items-center justify-between font-bold text-xl text-primary">
                                    <span>Toplam Ödenecek:</span>
                                    <span>₺{previewData.totalExpected.toLocaleString("tr-TR")}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                            <RxButton variant="danger" className="bg-success text-success-foreground hover:bg-success/90" onClick={handleSavePayroll}>
                                <Wallet className="size-4" /> "Ödendi" İşaretle ve Kasa Giderine Ekle
                            </RxButton>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
