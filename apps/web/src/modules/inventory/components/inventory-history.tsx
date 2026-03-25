"use client"

import { useEffect, useState } from "react"
import { History, Loader2, X, ArrowUpRight, ArrowDownRight, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { InventoryLog, Product } from "../types"

interface InventoryHistoryProps {
  product: Product
  onClose: () => void
  onFetchLogs: (productId: string) => Promise<{ success: boolean; data: InventoryLog[]; error?: string }>
}

export function InventoryHistory({
  product,
  onClose,
  onFetchLogs,
}: Readonly<InventoryHistoryProps>) {
  const [logs, setLogs] = useState<InventoryLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    onFetchLogs(product.id).then((res) => {
      if (res.success) setLogs(res.data)
      setLoading(false)
    })
  }, [product.id, onFetchLogs])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-card rounded-[2.5rem] shadow-2xl relative max-h-[85vh] flex flex-col border border-border overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-border bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <History className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{product.name}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Stok Hareket Geçmişi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-muted rounded-full hover:bg-muted/80 transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-10 animate-spin text-primary opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Veriler Yükleniyor...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-40">
              <History className="size-12 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">Henüz hareket bulunamadı.</p>
            </div>
          ) : (
            <div className="space-y-3 px-4">
              {logs.map((log) => {
                const isPositive = log.quantity_changed > 0
                const isSale = log.change_type === "sale"
                
                return (
                  <div key={log.id} className="flex items-center gap-5 p-5 rounded-3xl border border-border/50 bg-card hover:border-primary/20 transition-all group">
                    <div className={cn(
                      "size-12 rounded-2xl flex items-center justify-center shrink-0",
                      isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    )}>
                      {isPositive ? <ArrowUpRight className="size-6" /> : <ArrowDownRight className="size-6" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(log.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={cn(
                          "text-sm font-black",
                          isPositive ? "text-success" : "text-destructive"
                        )}>
                          {isPositive ? "+" : ""}{log.quantity_changed} ADET
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-bold text-foreground truncate">
                          {log.notes || (isSale ? "Hizmet Satış Tahsilatı" : "Stok Düzeltme İşlemi")}
                        </p>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                             {log.change_type}
                           </span>
                           <span className="text-[9px] font-bold text-muted-foreground/60">
                             İşlem: {log.recorded_user?.name || "Sistem"}
                           </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 border-l border-border/50 pl-5 hidden sm:block">
                       <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Yeni Stok</p>
                       <p className="text-lg font-black text-foreground">{log.new_stock}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-10 py-6 bg-muted/10 border-t border-border flex justify-center">
           <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Envanter Takip Modülü • RandevuX v2</p>
        </div>
      </div>
    </div>
  )
}
