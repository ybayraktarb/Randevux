"use client"

import { useState } from "react"
import { Calendar, Save, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { updateAppointmentPoliciesAction } from "../actions/business.actions"
import type { Business } from "../types"

interface AppointmentPoliciesFormProps {
  business: Business
}

export function AppointmentPoliciesForm({ business }: AppointmentPoliciesFormProps) {
  const [loading, setLoading] = useState(false)
  const [autoApprove, setAutoApprove] = useState(business.auto_approve)
  const [cancelBuffer, setCancelBuffer] = useState(business.cancellation_buffer_minutes)

  const handleSave = async () => {
    setLoading(true)
    const res = await updateAppointmentPoliciesAction({
      businessId: business.id,
      autoApprove,
      cancellationBufferMinutes: cancelBuffer
    })
    setLoading(false)
    if (res.success) toast.success("Randevu politikaları güncellendi!")
    else toast.error(res.error || "Hata oluştu.")
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm">
        <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Calendar className="size-5 text-primary" />
          Randevu Politikaları
        </h2>

        <div className="space-y-8">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Otomatik Onay</span>
              <span className="text-[11px] font-bold text-gray-500">Gelen randevular sistem tarafından otomatik onaylansın mı?</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoApprove(!autoApprove)}
              className={cn(
                "relative h-7 w-12 rounded-full transition-all duration-300",
                autoApprove ? "bg-primary shadow-[0_0_12px_rgba(var(--primary),0.3)]" : "bg-gray-200"
              )}
            >
              <div className={cn(
                "absolute top-1 size-5 rounded-full bg-white shadow-lg transition-all duration-300",
                autoApprove ? "left-6" : "left-1"
              )} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <label htmlFor="cancel_buffer" className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">İptal Süresi (Dakika)</label>
            <div className="flex items-center gap-4">
              <input
                id="cancel_buffer"
                type="number"
                value={cancelBuffer}
                onChange={e => setCancelBuffer(Number(e.target.value))}
                min={0}
                className="h-12 w-32 rounded-2xl border border-gray-100 bg-gray-50/30 px-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
              <span className="text-xs font-bold text-gray-500">Dakika öncesine kadar iptal edilebilir.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <RxButton onClick={handleSave} disabled={loading} className="h-14 px-12 rounded-[20px] shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02]">
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5 mr-1" />} Ayarları Kaydet
        </RxButton>
      </div>
    </div>
  )
}
