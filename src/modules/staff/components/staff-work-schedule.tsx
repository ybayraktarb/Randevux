"use client"

import { useState, useEffect } from "react"
import { Clock, Plus, Trash2, Save, Loader2, Info } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { WorkSchedule, BreakSchedule } from "../types"

const DAYS = [
  { key: 1, label: "Pazartesi", short: "Pzt" },
  { key: 2, label: "Salı", short: "Sal" },
  { key: 3, label: "Çarşamba", short: "Çar" },
  { key: 4, label: "Perşembe", short: "Per" },
  { key: 5, label: "Cuma", short: "Cum" },
  { key: 6, label: "Cumartesi", short: "Cmt" },
  { key: 0, label: "Pazar", short: "Paz" },
]

interface StaffWorkScheduleProps {
  staffBusinessId: string
  initialSchedule: WorkSchedule[]
  initialBreaks: BreakSchedule[]
  onSaveSchedule: (schedules: WorkSchedule[]) => Promise<{ success: boolean; error?: { message: string } }>
  onSaveBreaks: (breaks: BreakSchedule[]) => Promise<{ success: boolean; error?: { message: string } }>
}

export function StaffWorkSchedule({
  staffBusinessId,
  initialSchedule,
  initialBreaks,
  onSaveSchedule,
  onSaveBreaks,
}: Readonly<StaffWorkScheduleProps>) {
  const [schedule, setSchedule] = useState<WorkSchedule[]>(initialSchedule)
  const [breaks, setBreaks] = useState<(BreakSchedule & { _id: string })[]>(
    initialBreaks.map((b, i) => ({ ...b, _id: `${i}-${Date.now()}` }))
  )
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [savingBreaks, setSavingBreaks] = useState(false)

  const updateDay = (dayKey: number, field: keyof WorkSchedule, value: any) => {
    setSchedule((prev) =>
      prev.map((d) => (d.day_of_week === dayKey ? { ...d, [field]: value } : d))
    )
  }

  const addBreak = () => {
    setBreaks((prev) => [
      ...prev,
      {
        day_of_week: 1,
        start_time: "12:00",
        end_time: "13:00",
        label: "Öğle Molası",
        _id: Math.random().toString(36).substr(2, 9),
      },
    ])
  }

  const removeBreak = (id: string) => {
    setBreaks((prev) => prev.filter((b) => b._id !== id))
  }

  const updateBreak = (id: string, field: keyof BreakSchedule, value: any) => {
    setBreaks((prev) => prev.map((b) => (b._id === id ? { ...b, [field]: value } : b)))
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true)
    const res = await onSaveSchedule(schedule)
    if (res.success) toast.success("Çalışma saatleri kaydedildi.")
    else toast.error(res.error?.message || "Hata oluştu.")
    setSavingSchedule(false)
  }

  const handleSaveBreaks = async () => {
    setSavingBreaks(true)
    // Remove temporary _id before saving
    const cleanBreaks = breaks.map(({ _id, ...rest }) => rest)
    const res = await onSaveBreaks(cleanBreaks)
    if (res.success) toast.success("Mola saatleri kaydedildi.")
    else toast.error(res.error?.message || "Hata oluştu.")
    setSavingBreaks(false)
  }

  return (
    <div className="space-y-8">
      {/* Work Hours Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Haftalık Çalışma Saatleri</h3>
          </div>
          <RxButton size="sm" onClick={handleSaveSchedule} loading={savingSchedule}>
            <Save className="mr-2 size-3.5" /> Kaydet
          </RxButton>
        </div>
        <div className="divide-y divide-border">
          {DAYS.map((day) => {
            const d = schedule.find((s) => s.day_of_week === day.key) || {
              day_of_week: day.key,
              is_working: false,
              start_time: "09:00",
              end_time: "18:00",
            }
            return (
              <div key={day.key} className="flex items-center gap-4 px-4 py-3">
                <div className="w-24 shrink-0">
                  <span className="text-sm font-medium">{day.label}</span>
                </div>
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => updateDay(day.key, "is_working", !d.is_working)}
                    className={cn(
                      "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors",
                      d.is_working ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow-lg ring-0 transition-transform",
                        d.is_working ? "translate-x-4.5" : "translate-x-1"
                      )}
                    />
                  </button>
                  {d.is_working ? (
                    <div className="flex items-center gap-2 animate-in fade-in duration-200">
                      <input
                        type="time"
                        value={d.start_time.substring(0, 5)}
                        onChange={(e) => updateDay(day.key, "start_time", e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <span className="text-muted-foreground">-</span>
                      <input
                        type="time"
                        value={d.end_time.substring(0, 5)}
                        onChange={(e) => updateDay(day.key, "end_time", e.target.value)}
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Kapalı</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Breaks Section */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <Info className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">Mola ve Blok Saatler</h3>
          </div>
          <div className="flex gap-2">
            <RxButton variant="secondary" size="sm" onClick={addBreak}>
              <Plus className="mr-2 size-3.5" /> Mola Ekle
            </RxButton>
            <RxButton size="sm" onClick={handleSaveBreaks} loading={savingBreaks}>
              <Save className="mr-2 size-3.5" /> Kaydet
            </RxButton>
          </div>
        </div>
        <div className="p-4">
          {breaks.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground italic">
              Henüz tanımlanmış mola yok.
            </div>
          ) : (
            <div className="grid gap-3">
              {breaks.map((b) => (
                <div key={b._id} className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/10">
                  <select
                    value={b.day_of_week}
                    onChange={(e) => updateBreak(b._id, "day_of_week", Number(e.target.value))}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {DAYS.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.short}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={b.label}
                    onChange={(e) => updateBreak(b._id, "label", e.target.value)}
                    placeholder="Etiket (örn: Yemek)"
                    className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={b.start_time.substring(0, 5)}
                      onChange={(e) => updateBreak(b._id, "start_time", e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-muted-foreground">-</span>
                    <input
                      type="time"
                      value={b.end_time.substring(0, 5)}
                      onChange={(e) => updateBreak(b._id, "end_time", e.target.value)}
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    onClick={() => removeBreak(b._id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
