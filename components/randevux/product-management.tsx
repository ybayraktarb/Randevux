"use client"

import { useState, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Loader2, Plus, Search, PackageOpen, AlertTriangle, ArrowUpRight, ArrowDownRight, Edit, History } from "lucide-react"
import { RxButton } from "./rx-button"
import { RxInput, RxTextarea } from "./rx-input"
import { RxBadge } from "./rx-badge"
import { toast } from "sonner"
import { getProductsAction, upsertProductAction, adjustStockAction, getInventoryLogsAction } from "@/app/actions/inventory.actions"

export function ProductManagement({ businessId }: { businessId: string }) {
    const [products, setProducts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Modals
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<any>(null)

    const [isStockModalOpen, setIsStockModalOpen] = useState(false)
    const [stockProduct, setStockProduct] = useState<any>(null)

    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
    const [historyProduct, setHistoryProduct] = useState<any>(null)

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        const res = await getProductsAction(businessId, searchQuery)
        if (res.success && res.data) {
            setProducts(res.data)
        } else {
            toast.error(res.error || "Ürünler yüklenemedi")
        }
        setLoading(false)
    }, [businessId, searchQuery])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    // Timer for search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery, fetchProducts])

    const openEdit = (p: any) => { setEditingProduct(p); setIsProductModalOpen(true) }
    const openStockConfig = (p: any) => { setStockProduct(p); setIsStockModalOpen(true) }
    const openHistory = (p: any) => { setHistoryProduct(p); setIsHistoryModalOpen(true) }

    return (
        <div className="flex flex-col gap-6">
            {/* İstatistikler */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <PackageOpen className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Toplam Ürün Çeşidi</p>
                        <p className="text-2xl font-bold">{products.length}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <AlertTriangle className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Kritik Stok Uyarıları</p>
                        <p className="text-2xl font-bold text-destructive">
                            {products.filter(p => p.stock_quantity <= p.min_stock_alert).length}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-card p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-border">
                    <div className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                        <ArrowUpRight className="size-6" />
                    </div>
                    <div>
                        {/* Simple calculation of total stock value (selling price * quantity) */}
                        <p className="text-sm font-medium text-muted-foreground">Depo Satış Değeri</p>
                        <p className="text-2xl font-bold text-success">
                            ₺{products.reduce((acc, curr) => acc + (Number(curr.selling_price) * curr.stock_quantity), 0).toLocaleString("tr-TR")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <RxInput
                        placeholder="Ürün adı, Stok Kodu (SKU)..."
                        className="pl-9 bg-card border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <RxButton variant="primary" onClick={() => { setEditingProduct(null); setIsProductModalOpen(true) }}>
                    <Plus className="size-4" /> Yeni Ürün Ekle
                </RxButton>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="size-8 animate-spin text-primary" /></div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-xl border border-border border-dashed">
                    <PackageOpen className="size-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">Ürün Bulunamadı</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">Depoya yeni ürün ekleyip stok takibine başlayın veya farklı bir kelime ile arama yapın.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {products.map(product => {
                        const isCritical = product.stock_quantity <= product.min_stock_alert
                        const isOut = product.stock_quantity === 0

                        return (
                            <div key={product.id} className={cn(
                                "group flex flex-col bg-card rounded-xl border shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden transition-all hover:shadow-lg",
                                !product.is_active && "opacity-60",
                                isCritical ? "border-destructive/30" : "border-border"
                            )}>
                                <div className="p-5 flex-1 flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                                            <span className="text-xs text-muted-foreground">SKU: {product.sku || '-'}</span>
                                        </div>
                                        {isOut ? (
                                            <RxBadge variant="danger" className="shrink-0 bg-destructive/10 text-destructive border border-destructive/20">Tükendi</RxBadge>
                                        ) : isCritical ? (
                                            <RxBadge variant="warning" className="shrink-0">Azaldı</RxBadge>
                                        ) : (
                                            <RxBadge variant="success" className="shrink-0">Mevcut</RxBadge>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1 mt-auto">
                                        <div className="flex justify-between items-end border-b border-border pb-2">
                                            <span className="text-xs text-muted-foreground">Satış Fiyatı</span>
                                            <span className="font-bold text-lg text-foreground">₺{product.selling_price}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground">Stok Miktarı</span>
                                                <span className={cn("font-bold text-base", isCritical ? "text-destructive" : "text-foreground")}>
                                                    {product.stock_quantity} Adet
                                                </span>
                                            </div>
                                            <button onClick={() => openStockConfig(product)} className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                                                <Edit className="size-3" /> Düzenle
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center border-t border-border bg-muted/20">
                                    <button onClick={() => openEdit(product)} className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border-r border-border">
                                        Ürün Bilgileri
                                    </button>
                                    <button onClick={() => openHistory(product)} className="flex-1 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5">
                                        <History className="size-3" /> Hareketler
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modals */}
            {isProductModalOpen && (
                <ProductFormModal
                    product={editingProduct}
                    businessId={businessId}
                    onClose={() => setIsProductModalOpen(false)}
                    onSuccess={fetchProducts}
                />
            )}

            {isStockModalOpen && stockProduct && (
                <StockAdjustModal
                    product={stockProduct}
                    businessId={businessId}
                    onClose={() => setIsStockModalOpen(false)}
                    onSuccess={fetchProducts}
                />
            )}

            {isHistoryModalOpen && historyProduct && (
                <HistoryModal
                    product={historyProduct}
                    onClose={() => setIsHistoryModalOpen(false)}
                />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: ÜRÜN EKLE / DÜZENLE
// ─────────────────────────────────────────────────────────────────────────────
function ProductFormModal({ product, businessId, onClose, onSuccess }: { product: any, businessId: string, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: product?.name || "",
        sku: product?.sku || "",
        category: product?.category || "",
        purchasePrice: product?.purchase_price || 0,
        sellingPrice: product?.selling_price || 0,
        stockQuantity: product?.stock_quantity || 0,
        minStockAlert: product?.min_stock_alert || 5,
        isActive: product ? product.is_active : true
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const res = await upsertProductAction({
            businessId,
            id: product?.id,
            ...formData
        })
        setLoading(false)
        if (res.success) {
            toast.success(product ? "Ürün güncellendi" : "Ürün eklendi")
            onSuccess()
            onClose()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
            <div className="w-full max-w-lg bg-card rounded-xl shadow-2xl relative max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">{product ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><Loader2 className="hidden" /> Kapat</button>
                </div>

                <div className="overflow-y-auto p-5">
                    <form id="productForm" onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Ürün Adı *</label>
                            <RxInput required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: Argan Yağlı Şampuan 500ml" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Stok Kodu (SKU)</label>
                                <RxInput value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} placeholder="Barkod veya Kod" />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Kategori</label>
                                <RxInput value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} placeholder="Şampuan, Bakım..." />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block text-muted-foreground">Alış Fiyatı (Maliyet ₺)</label>
                                <RxInput type="number" required min="0" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Satış Fiyatı (₺) *</label>
                                <RxInput type="number" required min="0" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block" title="Sadece yeni ürün eklerken girilebilir. Mevcut ürünler için stok düzeltme menüsünü kullanın.">Başlangıç Stoğu</label>
                                <RxInput type="number" min="0" required disabled={!!product} value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} />
                                {product && <span className="text-[10px] text-muted-foreground">Stok güncellemek için ana ekrandaki "Düzenle" butonunu kullanın.</span>}
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Kritik Stok Uyarısı</label>
                                <RxInput type="number" min="0" required value={formData.minStockAlert} onChange={e => setFormData({ ...formData, minStockAlert: Number(e.target.value) })} />
                            </div>
                        </div>

                        {product && (
                            <label className="flex items-center gap-2 mt-2">
                                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} className="rounded text-primary focus:ring-primary" />
                                <span className="text-sm font-medium">Satışa Açık (Aktif)</span>
                            </label>
                        )}
                    </form>
                </div>

                <div className="flex justify-end gap-2 border-t border-border px-5 py-4 bg-muted/10">
                    <RxButton type="button" variant="ghost" className="border border-border" onClick={onClose}>İptal</RxButton>
                    <RxButton type="submit" form="productForm" variant="primary" disabled={loading}>
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </RxButton>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: STOK DÜZELTME / EKLEME
// ─────────────────────────────────────────────────────────────────────────────
function StockAdjustModal({ product, businessId, onClose, onSuccess }: { product: any, businessId: string, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)
    const [amountToAdjust, setAmountToAdjust] = useState("")
    const [reason, setReason] = useState<"addition" | "reduction" | "adjustment">("addition")
    const [notes, setNotes] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let finalAmount = Number(amountToAdjust)
        if (isNaN(finalAmount) || finalAmount <= 0) {
            toast.warning("Geçerli bir miktar girin")
            return
        }

        if (reason === "reduction") finalAmount = -finalAmount

        setLoading(true)
        const res = await adjustStockAction({
            businessId,
            productId: product.id,
            amountToAdjust: finalAmount,
            reason,
            notes
        })

        setLoading(false)
        if (res.success) {
            toast.success("Stok başarıyla güncellendi")
            onSuccess()
            onClose()
        } else {
            toast.error(res.error)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
            <div className="w-full max-w-sm bg-card rounded-xl shadow-2xl relative">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <h2 className="text-lg font-semibold text-foreground">Stok Güncelle</h2>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">Kapat</button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
                    <div className="p-3 bg-muted/40 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium">Mevcut Stok:</span>
                        <span className="font-bold text-lg">{product.stock_quantity}</span>
                    </div>

                    <div className="flex rounded-lg overflow-hidden border border-border">
                        <button type="button" onClick={() => setReason("addition")} className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", reason === "addition" ? "bg-success/10 text-success border-b-2 border-success" : "bg-card text-muted-foreground hover:bg-muted")}>Giriş (Ekle)</button>
                        <button type="button" onClick={() => setReason("reduction")} className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", reason === "reduction" ? "bg-destructive/10 text-destructive border-b-2 border-destructive" : "bg-card text-muted-foreground hover:bg-muted")}>Çıkış (Düş)</button>
                        <button type="button" onClick={() => setReason("adjustment")} className={cn("flex-1 py-1.5 text-xs font-medium transition-colors", reason === "adjustment" ? "bg-primary/10 text-primary border-b-2 border-primary" : "bg-card text-muted-foreground hover:bg-muted")}>Düzeltme</button>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Eklenecek / Düşülecek Miktar</label>
                        <RxInput type="number" required min="1" value={amountToAdjust} onChange={e => setAmountToAdjust(e.target.value)} placeholder="0" />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Not (Opsiyonel)</label>
                        <RxInput value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tedarikçiden geldi, kırıldı iptal vs." />
                    </div>

                    <div className="flex justify-end gap-2 mt-2">
                        <RxButton type="button" variant="ghost" className="border border-border" onClick={onClose}>İptal</RxButton>
                        <RxButton type="submit" variant="primary" disabled={loading}>Kaydet</RxButton>
                    </div>
                </form>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL: STOK HAREKETLERİ (LOGS)
// ─────────────────────────────────────────────────────────────────────────────
function HistoryModal({ product, onClose }: { product: any, onClose: () => void }) {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getInventoryLogsAction(product.id).then(res => {
            if (res.success && res.data) setLogs(res.data)
            setLoading(false)
        })
    }, [product.id])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4">
            <div className="w-full max-w-2xl bg-card rounded-xl shadow-2xl relative max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">Stok Hareketleri</h2>
                        <p className="text-xs text-muted-foreground">{product.name}</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">Kapat</button>
                </div>

                <div className="overflow-y-auto p-0 flex-1 min-h-[300px]">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>
                    ) : logs.length === 0 ? (
                        <div className="flex justify-center py-20 text-muted-foreground text-sm">Hareket bulunamadı.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium">Tarih</th>
                                    <th className="px-4 py-3 text-left font-medium">Tür</th>
                                    <th className="px-4 py-3 text-right font-medium">Değişim</th>
                                    <th className="px-4 py-3 text-right font-medium">Yeni Stok</th>
                                    <th className="px-4 py-3 text-left font-medium">Not / Yapan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 capitalize">{log.change_type}</td>
                                        <td className={cn(
                                            "px-4 py-3 text-right font-semibold",
                                            log.quantity_changed > 0 ? "text-success" : "text-destructive"
                                        )}>
                                            {log.quantity_changed > 0 ? "+" : ""}{log.quantity_changed}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">{log.new_stock}</td>
                                        <td className="px-4 py-3">
                                            <p className="line-clamp-1">{log.notes || "-"}</p>
                                            <span className="text-[10px] text-muted-foreground">{log.recorded_user?.name || "Sistem"}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}
