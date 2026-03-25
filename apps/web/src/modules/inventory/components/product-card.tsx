"use client"

import { PackageOpen, AlertTriangle, Edit, History, MoreVertical } from "lucide-react"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { cn } from "@/lib/utils"
import type { Product } from "../types"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onAdjust: (product: Product) => void
  onHistory: (product: Product) => void
}

export function ProductCard({
  product,
  onEdit,
  onAdjust,
  onHistory,
}: Readonly<ProductCardProps>) {
  const isCritical = product.stock_quantity <= product.min_stock_alert
  const isOut = product.stock_quantity === 0
  const isInactive = !product.is_active

  return (
    <div className={cn(
      "group flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:border-primary/20",
      isInactive && "opacity-60 grayscale-[0.5]",
      isCritical ? "border-destructive/20 bg-destructive/[0.02]" : "border-border"
    )}>
      {/* Header */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-start gap-3">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-foreground line-clamp-2 uppercase tracking-tight">{product.name}</h3>
            <p className="text-[10px] font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
              <span className="opacity-50">SKU:</span> {product.sku || 'BELİRTİLMEDİ'}
            </p>
          </div>
          
          <div className="shrink-0">
            {isOut ? (
              <RxBadge variant="danger" className="font-black text-[9px] uppercase tracking-tighter py-0.5">Tükendi</RxBadge>
            ) : isCritical ? (
              <RxBadge variant="warning" className="font-black text-[9px] uppercase tracking-tighter py-0.5">Kritik</RxBadge>
            ) : (
              <RxBadge variant="success" className="font-black text-[9px] uppercase tracking-tighter py-0.5">Stokta</RxBadge>
            )}
          </div>
        </div>

        {/* Price & Stock Section */}
        <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Satış Fiyatı</p>
              <p className="text-xl font-black text-foreground">₺{Number(product.selling_price).toLocaleString("tr-TR")}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Mevcut Stok</p>
              <p className={cn(
                "text-lg font-black",
                isCritical ? "text-destructive" : "text-primary"
              )}>
                {product.stock_quantity} <span className="text-[10px] opacity-70">ADET</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center border-t border-border bg-muted/10 divide-x divide-border">
        <button 
          onClick={() => onAdjust(product)}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="size-3" /> Stok Yönet
        </button>
        <button 
          onClick={() => onHistory(product)}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-2"
        >
          <History className="size-3" /> Geçmiş
        </button>
        <button 
          onClick={() => onEdit(product)}
          className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          title="Ürün Detayları ve Düzenle"
        >
          <MoreVertical className="size-4" />
        </button>
      </div>
    </div>
  )
}
