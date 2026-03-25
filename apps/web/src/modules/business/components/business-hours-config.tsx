"use client"

import { useState, useEffect } from "react"
import { Save, Loader2, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { getBusinessHoursAction, upsertBusinessHoursAction, type BusinessHourInput } from "../actions/settings.actions"

const DAYS_TR = [
  { key: 1, label: "Pazartesi" }, { key: 2, label: "Salı" }, { key: 3, label: "Çarşamba" },
  { key: 4, label: "Perşembe" }, { key: 5, label: "Cuma" }, { key: 6, label: "Cumartesi" }, { key: 0, label: "Pazar" },
]

export function BusinessHoursConfig({ businessId }: { businessId: string }) {
  const defaultHours: BusinessHourInput[] = DAYS_TR.map(d => ({
    day_of_week: d.key,
    open_time: "09:00",
    close_time: "18:00",
    is_open: d.key !== 0,
  }))
  
  const [hours, setHours] = useState<BusinessHourInput[]>(defaultHours)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await getBusinessHoursAction(businessId)
      if (res.success && res.data.length > 0) {
        const merged = defaultHours.map(def => {
          const found = res.data.find(h => h.day_of_week === def.day_of_week)
          return found ? { ...def, ...found } : def
        })
        setHours(merged)
      }
      setLoading(false)
    }
    load()
  }, [businessId])

  function updateHour(dayKey: number, field: keyof BusinessHourInput, value: any) {
    setHours(prev => prev.map(h => h.day_of_week === dayKey ? { ...h, [field]: value } : h))
  }

  async function handleSave() {
    setSaving(true)
    const res = await upsertBusinessHoursAction(businessId, hours)
    setSaving(false)
    if (res.success) toast.success("Çalışma saatleri kaydedildi.")
    else toast.error(res.error || "Hata oluştu.")
  }

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="size-8 animate-spin text-primary/30" /></div>

  return (
    <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            İşletme Çalışma Saatleri
          </h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Haftalık çalışma planınızı belirleyin</p>
        </div>
        <RxButton onClick={handleSave} disabled={saving} className="h-11 px-6 rounded-2xl shadow-md font-black uppercase tracking-widest text-[11px]">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 mr-2" />} Kaydet
        </RxButton>
      </div>

      <div className="flex flex-col gap-3">
        {DAYS_TR.map(day => {
          const h = hours.find(x => x.day_of_week === day.key)!
          return (
            <div key={day.key} className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border transition-all",
              h.is_open ? "border-gray-100 bg-white" : "border-dashed border-gray-100 bg-gray-50/50 opacity-60"
            )}>
              <button
                onClick={() => updateHour(day.key, "is_open", !h.is_open)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-all duration-300 shrink-0",
                  h.is_open ? "bg-primary" : "bg-gray-200"
                )}
              >
                <div className={cn(
                  "absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all duration-300",
                  h.is_open ? "left-6" : "left-1"
                )} />
              </button>
              <span className="w-24 text-sm font-black text-gray-900">{day.label}</span>
              
              {h.is_open ? (
                <div className="ml-auto flex items-center gap-2">
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={e => updateHour(day.key, "open_time", e.target.value)}
                    className="h-10 rounded-xl border border-gray-100 bg-gray-50/50 px-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                  <span className="text-gray-300">—</span>
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={e => updateHour(day.key, "close_time", e.target.value)}
                    className="h-10 rounded-xl border border-gray-100 bg-gray-50/50 px-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              ) : (
                <span className="ml-auto text-xs font-black text-gray-400 uppercase tracking-widest">Kapalı</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
