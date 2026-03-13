import { useEffect, useState } from "react"
import { Building2, CreditCard, Download, ExternalLink, Filter, Package, Loader2, AlertCircle } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export function FinanceTab() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        mrr: 0,
        activeSubs: 0,
        pastDueCount: 0,
        pastDueTotal: 0
    })
    const [subscriptions, setSubscriptions] = useState<any[]>([])

    useEffect(() => {
        const fetchFinanceData = async () => {
            setLoading(true)
            try {
                // 1. Fetch Stats
                const { data: subData, error: subError } = await supabase
                    .from('subscriptions')
                    .select('status, packages(price_monthly)')

                if (subError) throw subError

                let mrr = 0
                let activeCount = 0
                let pastDueCount = 0
                let pastDueTotal = 0

                subData?.forEach((sub: any) => {
                    const price = sub.packages?.price_monthly || 0
                    if (sub.status === 'active') {
                        mrr += price
                        activeCount++
                    } else if (sub.status === 'past_due') {
                        pastDueCount++
                        pastDueTotal += price
                    }
                })

                setStats({
                    mrr,
                    activeSubs: activeCount,
                    pastDueCount,
                    pastDueTotal
                })

                // 2. Fetch Recent Subscriptions
                const { data: listData, error: listError } = await supabase
                    .from('subscriptions')
                    .select(`
                        id,
                        status,
                        next_billing_date,
                        businesses(name),
                        packages(name, price_monthly)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(10)

                if (listError) throw listError
                setSubscriptions(listData || [])

            } catch (err) {
                console.error("Finance data fetch error:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchFinanceData()
    }, [supabase])

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground font-medium italic">Finansal veriler yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-[22px] font-semibold text-foreground">Abonelikler ve Finans</h2>
                    <p className="text-sm text-muted-foreground italic">İşletmelerin aktif abonelik, fatura ve ödeme durumları (Platform Özeti).</p>
                </div>
                <div className="flex gap-2">
                    <RxButton variant="secondary" size="sm">
                        <Download className="size-4" />
                        Rapor İndir
                    </RxButton>
                    <RxButton size="sm">
                        <CreditCard className="size-4" />
                        Gelir Detayları
                    </RxButton>
                </div>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-success/10 p-2.5 text-success">
                            <CreditCard className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Aylık Tahmini Gelir (MRR)</span>
                            <span className="text-2xl font-bold text-foreground">
                                {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.mrr)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                            <Package className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Aktif Abonelikler</span>
                            <span className="text-2xl font-bold text-foreground">{stats.activeSubs}</span>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-danger/10 p-2.5 text-danger">
                            <AlertCircle className="size-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Vadesi Geçen Ödemeler</span>
                            <span className="text-2xl font-bold text-foreground">
                                {stats.pastDueCount} 
                                <span className="text-sm font-medium text-muted-foreground ml-2 italic">
                                    (Toplam {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.pastDueTotal)})
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscriptions List */}
            <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4 flex items-center justify-between bg-muted/30">
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">Son İşlemler & Abonelikler</h3>
                    <button className="text-[13px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 transition-colors">
                        <Filter className="size-4" /> Filtrele
                    </button>
                </div>
                
                {subscriptions.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/40 border-b border-border">
                                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase">İşletme</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase">Paket</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase">Durum</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase text-right">Tutar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => (
                                <tr key={sub.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3 font-medium text-[13px]">{sub.businesses?.name || 'Bilinmiyor'}</td>
                                    <td className="px-4 py-3 text-[13px]">{sub.packages?.name || 'Paket Yok'}</td>
                                    <td className="px-4 py-3">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase",
                                            sub.status === 'active' ? "bg-success/10 text-success" : 
                                            sub.status === 'past_due' ? "bg-danger/10 text-danger" : 
                                            "bg-muted text-muted-foreground"
                                        )}>
                                            {sub.status === 'active' ? 'AKTİF' : sub.status === 'past_due' ? 'VADESİ GEÇİK' : sub.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-[13px] font-bold text-right">
                                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(sub.packages?.price_monthly || 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-muted/50 p-4 mb-3">
                            <CreditCard className="size-8 text-muted-foreground" />
                        </div>
                        <h4 className="text-lg font-medium text-foreground">Abonelik Verisi Bulunamadı</h4>
                        <p className="max-w-md text-sm text-muted-foreground mt-2">
                            Platformda henüz faturalandırılmış bir abonelik bulunmuyor. İşletmeler kayıt olmaya başladığında burada görünecektir.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

