"use client"

import { useState } from "react"
import { Wallet, Search, Loader2, Calendar as CalendarIcon, FileText, CheckCircle } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { PayrollPreview } from "../types"

interface PayrollCalculatorProps {
  staffList: { id: string; name: string }[]
  onGeneratePreview: (staffId: string, start: string, end: string) => Promise<{ success: boolean; data?: PayrollPreview; error?: string }>
  onSavePayroll: (preview: PayrollPreview, staffId: string) => Promise<{ success: boolean; error?: string }>
}

export function PayrollCalculator({
  staffList,
  onGeneratePreview,
  onSavePayroll,
}: PayrollCalculatorProps) {
  const [selectedStaff, setSelectedStaff] = useState("")
  const [periodStart, setPeriodStart] = useState("")
  const [periodEnd, setPeriodEnd] = useState("")
  const [preview, setPreview] = useState<PayrollPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleCalculate = async () => {
    if (!selectedStaff || !periodStart || !periodEnd) {
      toast.error("Lütfen tüm alanları doldurunuz.")
      return
    }
    setLoading(true)
    const res = await onGeneratePreview(selectedStaff, periodStart, periodEnd)
    if (res.success && res.data) {
      setPreview(res.data)
      toast.success("Hesaplama tamamlandı.")
    } else {
      toast.error(res.error || "Hesaplama hatası.")
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!preview) return
    setSaving(true)
    const res = await onSavePayroll(preview, selectedStaff)
    if (res.success) {
      toast.success("Bordro onaylandı ve kasaya işlendi.")
      setPreview(null)
    } else {
      toast.error(res.error || "Kayıt hatası.")
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Settings Panel */}
      <div className="w-full lg:w-[320px] shrink-0 space-y-5 bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <CalendarIcon className="size-4 text-primary" /> Dönem Seçimi
        </h3>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="staff-select" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Personel</label>
            <select
              id="staff-select"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full h-10 px-3 bg-muted/30 border border-input rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">Seçiniz...</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="period-start" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Başlangıç</label>
              <input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full h-10 px-3 bg-muted/30 border border-input rounded-xl text-sm outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="period-end" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bitiş</label>
              <input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full h-10 px-3 bg-muted/30 border border-input rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <RxButton onClick={handleCalculate} loading={loading} className="w-full font-black uppercase tracking-widest text-[11px] h-11">
            <Search className="size-4 mr-2" /> Hesapla
          </RxButton>
        </div>
      </div>

      {/* Result Panel */}
      <div className="flex-1 min-h-[400px] bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col relative overflow-hidden">
        {!preview ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-bold max-w-xs uppercase tracking-widest leading-loose">
              Hesaplanan veriler burada görüntülenecek.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-border pb-6 mb-8">
              <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Bordro Özeti</h2>
              <div className="flex items-center gap-2">
                 <CheckCircle className="size-4 text-success" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-success">Önizleme Aktif</span>
              </div>
            </div>

            <div className="space-y-4">
              <ResultRow label="Taban Maaş" value={`₺${preview.baseSalary.toLocaleString("tr-TR")}`} />
              
              <div className="rounded-2xl bg-muted/20 border border-border/50 p-6 flex flex-col gap-4">
                 <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Hizmet Komisyonu</p>
                      <p className="text-sm font-black text-foreground">Toplam Ciro: ₺{preview.totalServiceRevenue.toLocaleString("tr-TR")}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-success">Oran: %{preview.serviceRate}</p>
                       <p className="text-lg font-black text-success">+ ₺{preview.expectedServiceCommission.toLocaleString("tr-TR")}</p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 pt-8 border-t-2 border-dashed border-border flex items-center justify-between">
                 <p className="text-lg font-black uppercase tracking-widest text-foreground">Toplam Ödeme:</p>
                 <p className="text-3xl font-black text-primary">₺{preview.totalExpected.toLocaleString("tr-TR")}</p>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                 <RxButton variant="ghost" onClick={() => setPreview(null)} className="h-11 px-8 font-black uppercase tracking-widest text-[11px]">
                    Sıfırla
                 </RxButton>
                 <RxButton onClick={handleSave} loading={saving} className="h-11 px-8 font-black uppercase tracking-widest text-[11px] bg-success hover:bg-success/90">
                    <Wallet className="size-4 mr-2" /> Ödendi İşaretle & Kasaya İşle
                 </RxButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/40 border border-border/40">
      <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-lg font-black text-foreground">{value}</span>
    </div>
  )
}
