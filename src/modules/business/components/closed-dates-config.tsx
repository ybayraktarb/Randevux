"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarOff, Plus, Trash2, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { getClosedDatesAction, addClosedDateAction, removeClosedDateAction } from "../actions/settings.actions"

interface ClosedDate { id: string; date: string; reason: string | null }

export function ClosedDatesConfig({ businessId }: { businessId: string }) {
  const [dates, setDates] = useState<ClosedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState({ date: today, reason: "" })

  const load = useCallback(async () => {
    setLoading(true)
    const res = await getClosedDatesAction(businessId)
    if (res.success) setDates(res.data)
    setLoading(false)
  }, [businessId])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!form.date) { toast.error("Tarih seçin."); return }
    setSaving(true)
    const res = await addClosedDateAction(businessId, form.date, form.reason)
    setSaving(false)
    if (res.success) {
      toast.success("Kapalı gün eklendi.")
      setForm({ date: today, reason: "" })
      load()
    } else {
      toast.error(res.error || "Bu tarih zaten listede.")
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const res = await removeClosedDateAction(id)
    if (res.success) {
      toast.success("Kapalı gün silindi.")
      setDates(prev => prev.filter(d => d.id !== id))
    }
    setDeletingId(null)
  }

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm max-w-4xl">
      <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-2">
        <CalendarOff className="size-5 text-primary" />
        İşletme Kapalı Günleri
      </h2>

      <div className="bg-gray-50/50 rounded-[24px] p-6 border border-gray-100 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tarih Seçimi</label>
            <input
              type="date"
              value={form.date}
              min={today}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="h-12 rounded-2xl border border-gray-100 bg-white px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Açıklama (Opsiyonel)</label>
            <input
              type="text"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Örn: Tatil, Tadilat..."
              className="h-12 rounded-2xl border border-gray-100 bg-white px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        <RxButton onClick={handleAdd} disabled={saving} className="w-full mt-4 h-12 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px]">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4 mr-2" />} Listeye Ekle
        </RxButton>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-8 animate-spin text-primary/30" /></div>
        ) : dates.length === 0 ? (
          <div className="bg-white rounded-[24px] border border-dashed border-gray-200 py-12 text-center">
            <Calendar className="size-10 mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-bold text-gray-400">Henüz kapalı bir gün tanımlanmadı.</p>
          </div>
        ) : (
          dates.map(d => (
            <div key={d.id} className="group flex items-center justify-between p-4 rounded-[20px] border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <CalendarOff className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">
                    {new Date(d.date + "T00:00:00").toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  {d.reason && <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{d.reason}</p>}
                </div>
              </div>
              <button
                onClick={() => handleDelete(d.id)}
                disabled={deletingId === d.id}
                className="size-10 flex items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                {deletingId === d.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
