"use client"

import { useState } from "react"
import { Wallet, Plus, RefreshCw, Loader2, Trash2, Search } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Transaction } from "../types"

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  onAdd: () => void
  onRefresh: () => void
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
}

export function TransactionList({
  transactions,
  loading,
  onAdd,
  onRefresh,
  onDelete,
}: Readonly<TransactionListProps>) {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + Number(curr.amount), 0)
  const netBalance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Toplam Gelir" value={totalIncome} variant="success" />
        <StatCard title="Toplam Gider" value={totalExpense} variant="danger" />
        <StatCard title="Net Kasa" value={netBalance} variant="neutral" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Kasa Hareketleri</h2>
        <div className="flex gap-2">
          <RxButton variant="ghost" onClick={onRefresh} className="border border-border h-9">
            <RefreshCw className={cn("size-4 mr-1.5", loading && "animate-spin")} /> Yenile
          </RxButton>
          <RxButton size="sm" onClick={onAdd}>
            <Plus className="size-4 mr-1.5" /> Gelir/Gider Ekle
          </RxButton>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm relative min-h-[300px]">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-card/50 backdrop-blur-[1px] z-10">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tarih</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Açıklama</th>
                  <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-widest text-muted-foreground">Kategori</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">Tutar</th>
                  <th className="px-6 py-4 text-right text-[11px] font-black uppercase tracking-widest text-muted-foreground">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-muted-foreground italic">
                      Henüz işlem kaydı bulunmuyor.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground whitespace-nowrap">
                        {new Date(t.transaction_date).toLocaleDateString("tr-TR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-foreground">{t.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-muted/50 text-muted-foreground">
                          {t.category}
                        </span>
                      </td>
                      <td className={cn("px-6 py-4 text-sm font-black text-right", t.type === "income" ? "text-success" : "text-destructive")}>
                        {t.type === "income" ? "+" : "-"} ₺{Number(t.amount).toLocaleString("tr-TR")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => onDelete(t.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, variant }: Readonly<{ title: string; value: number; variant: "success" | "danger" | "neutral" }>) {
  const colors = {
    success: "text-success bg-success/5 border-success/10",
    danger: "text-destructive bg-destructive/5 border-destructive/10",
    neutral: "text-foreground bg-card border-border",
  }
  return (
    <div className={cn("flex flex-col gap-1 rounded-2xl p-5 border shadow-sm", colors[variant])}>
      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</span>
      <span className="text-2xl font-black">₺{value.toLocaleString("tr-TR")}</span>
    </div>
  )
}
