"use client"

import { useState } from "react"
import { Package, ArrowUp, ArrowDown, RefreshCcw, Loader2, CheckCircle } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxInput } from "@/src/modules/core/components/rx-input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Product } from "../types"

interface StockAdjustDialogProps {
  product: Product
  onClose: () => void
  onAdjust: (productId: string, amount: number, reason: string, notes: string) => Promise<{ success: boolean; error?: string }>
}

export function StockAdjustDialog({
  product,
  onClose,
  onAdjust,
}: Readonly<StockAdjustDialogProps>) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState<"addition" | "reduction" | "adjustment">("addition")
  const [notes, setNotes] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let finalAmount = Number(amount)
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("Lütfen geçerli bir miktar giriniz.")
      return
    }

    if (reason === "reduction") finalAmount = -finalAmount

    setLoading(true)
    const res = await onAdjust(product.id, finalAmount, reason, notes)
    setLoading(false)

    if (res.success) {
      toast.success("Stok başarıyla güncellendi.")
      onClose()
    } else {
      toast.error(res.error || "Güncelleme sırasında hata oluştu.")
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-muted/30 p-8 text-center border-b border-border">
          <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="size-8 text-primary" />
          </div>
          <h2 className="text-lg font-black text-foreground uppercase tracking-tight line-clamp-1">{product.name}</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Stok Güncelleme</p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50 border border-border/50">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mevcut Stok</span>
            <span className="text-xl font-black text-foreground">{product.stock_quantity} ADET</span>
          </div>

          {/* Action Tabs */}
          <div className="flex p-1 bg-muted/50 rounded-2xl border border-border/50">
            {[
              { id: "addition", label: "EKLE", icon: ArrowUp, color: "text-success bg-success/10" },
              { id: "reduction", label: "ÇIKAR", icon: ArrowDown, color: "text-destructive bg-destructive/10" },
              { id: "adjustment", label: "DÜZELT", icon: RefreshCcw, color: "text-primary bg-primary/10" },
            ].map((tab) => {
              const isActive = reason === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReason(tab.id as any)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-300",
                    isActive ? cn("shadow-sm ring-1 ring-border/50", tab.color) : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <tab.icon className="size-4" />
                  <span className="text-[9px] font-black tracking-widest">{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Miktar</label>
              <RxInput 
                type="number" 
                required 
                min="1" 
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="h-12 text-center text-lg font-black rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Açıklama (Opsiyonel)</label>
              <RxInput 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Neden bu işlemi yapıyorsunuz?"
                className="rounded-2xl"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <RxButton type="button" variant="ghost" className="flex-1 h-12 rounded-2xl" onClick={onClose}>Vazgeç</RxButton>
            <RxButton type="submit" loading={loading} className="flex-1 h-12 rounded-2xl shadow-lg shadow-primary/20">
              <CheckCircle className="size-4 mr-2" /> Tamamla
            </RxButton>
          </div>
        </form>
      </div>
    </div>
  )
}
