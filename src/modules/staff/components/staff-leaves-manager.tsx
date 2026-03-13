"use client"

import { useState, useEffect } from "react"
import { Calendar, Plus, Trash2, Clock, CheckCircle2, XCircle, Loader2, Info } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { LeaveRecord, AddLeaveInput } from "../types"

interface StaffLeavesManagerProps {
  staffBusinessId: string
  initialLeaves: LeaveRecord[]
  onAddLeave: (input: AddLeaveInput) => Promise<{ success: boolean; error?: { message: string } }>
  onRemoveLeave: (id: string) => Promise<{ success: boolean; error?: { message: string } }>
  onReviewLeave?: (id: string, status: "approved" | "rejected") => Promise<{ success: boolean; error?: { message: string } }>
  isOwner?: boolean
}

export function StaffLeavesManager({
  staffBusinessId,
  initialLeaves,
  onAddLeave,
  onRemoveLeave,
  onReviewLeave,
  isOwner = true,
}: StaffLeavesManagerProps) {
  const [leaves, setLeaves] = useState<LeaveRecord[]>(initialLeaves)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<AddLeaveInput>({
    staffBusinessId,
    requestType: "full_day",
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    reason: "",
  })

  useEffect(() => {
    setLeaves(initialLeaves)
  }, [initialLeaves])

  const handleAdd = async () => {
    setLoading(true)
    const res = await onAddLeave(form)
    if (res.success) {
      toast.success("İzin başarıyla eklendi.")
      setShowForm(false)
      setForm({
        ...form,
        reason: "",
      })
    } else {
      toast.error(res.error?.message || "İzin eklenemedi.")
    }
    setLoading(false)
  }

  const handleRemove = async (id: string) => {
    if (!confirm("Bu izni silmek istediğinize emin misiniz?")) return
    const res = await onRemoveLeave(id)
    if (res.success) toast.success("İzin silindi.")
    else toast.error(res.error?.message || "Silinemedi.")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          <h3 className="font-semibold text-foreground">İzin ve Kapalı Günler</h3>
        </div>
        <RxButton size="sm" variant="secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Kapat" : "İzin Ekle"}
        </RxButton>
      </div>

      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tür</label>
                <select
                  value={form.requestType}
                  onChange={(e) => setForm({ ...form, requestType: e.target.value as any })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="full_day">Tam Gün</option>
                  <option value="partial">Saatlik (Kısmi)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tarih</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {form.requestType === "partial" && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Başlangıç</label>
                  <input
                    type="time"
                    value={form.startTime || ""}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bitiş</label>
                  <input
                    type="time"
                    value={form.endTime || ""}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Neden (Opsiyonel)</label>
              <input
                type="text"
                placeholder="Örn: Doktor randevusu, Şehir dışı..."
                value={form.reason || ""}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <RxButton onClick={handleAdd} loading={loading} className="w-full">
              İzni Kaydet
            </RxButton>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-border bg-muted/20">
            <Info className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground italic">Henüz izin kaydı bulunmuyor.</p>
          </div>
        ) : (
          leaves.map((leave) => (
            <div key={leave.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "size-10 rounded-full flex items-center justify-center",
                  leave.request_type === "full_day" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                )}>
                  {leave.request_type === "full_day" ? <Calendar className="size-5" /> : <Clock className="size-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {new Date(leave.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                    </span>
                    <RxBadge variant={leave.status === "approved" ? "success" : leave.status === "rejected" ? "danger" : "warning"}>
                      {leave.status === "approved" ? "Onaylı" : leave.status === "rejected" ? "Reddedildi" : "Bekliyor"}
                    </RxBadge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {leave.request_type === "full_day" ? "Tam Gün Kapalı" : `${leave.start_time?.substring(0, 5)} - ${leave.end_time?.substring(0, 5)}`}
                    {leave.reason && ` • ${leave.reason}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isOwner && leave.status === "pending" && onReviewLeave && (
                   <>
                     <button onClick={() => onReviewLeave(leave.id, "approved")} className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors">
                       <CheckCircle2 className="size-4" />
                     </button>
                     <button onClick={() => onReviewLeave(leave.id, "rejected")} className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors">
                       <XCircle className="size-4" />
                     </button>
                   </>
                )}
                <button
                  onClick={() => handleRemove(leave.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
