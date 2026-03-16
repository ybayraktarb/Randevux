"use client"

import { useState, useEffect } from "react"
import { X, Sparkles, Clock, Zap, User, CheckCircle2, Loader2, Save, Plus } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { toast } from "sonner"
import type { Service, ServiceInput } from "../types"
import { upsertServiceAction } from "../actions/business.actions"

interface ServiceFormProps {
  businessId: string
  service?: Service | null
  staffMembers: any[]
  onClose: () => void
  onSuccess: () => void
}

export function ServiceForm({ businessId, service, staffMembers, onClose, onSuccess }: ServiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ServiceInput>({
    id: service?.id,
    businessId: businessId,
    name: service?.name || "",
    description: service?.description || "",
    baseDurationMinutes: service?.base_duration_minutes || 30,
    basePrice: service?.base_price || 0,
    bufferTimeMinutes: service?.buffer_time_minutes || 0,
    isActive: service?.is_active ?? true,
    staffIds: service?.staffIds || [],
  })

  const [bufferEnabled, setBufferEnabled] = useState((service?.buffer_time_minutes || 0) > 0)

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Hizmet adı gereklidir.")
      return
    }
    setLoading(true)
    const res = await upsertServiceAction({
      ...formData,
      bufferTimeMinutes: bufferEnabled ? formData.bufferTimeMinutes : 0
    })
    setLoading(false)
    if (res.success) {
      toast.success(service ? "Hizmet güncellendi." : "Hizmet oluşturuldu.")
      onSuccess()
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  const toggleStaff = (id: string) => {
    setFormData(prev => ({
      ...prev,
      staffIds: prev.staffIds?.includes(id) 
        ? prev.staffIds.filter(sid => sid !== id) 
        : [...(prev.staffIds || []), id]
    }))
  }

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left Column: Basic Info */}
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-primary/5 flex items-center justify-center">
                <Sparkles className="size-4 text-primary" />
              </div>
              <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Temel Bilgiler</h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="service_name" className="text-[12px] font-black text-gray-600 ml-1">HİZMET ADI</label>
                <input
                  id="service_name"
                  type="text"
                  placeholder="Örn: Saç Kesimi & Yıkama"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="h-14 w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 text-[15px] font-bold transition-all focus:bg-white focus:border-primary/10 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="service_desc" className="text-[12px] font-black text-gray-600 ml-1">AÇIKLAMA / KATEGORİ</label>
                <textarea
                  id="service_desc"
                  placeholder="Hizmet kategorisini ilk kelime yapın (Örn: SAÇ Kesimi...)"
                  value={formData.description || ""}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 py-4 text-[15px] font-bold transition-all focus:bg-white focus:border-primary/10 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-amber-500/5 flex items-center justify-center">
                <Clock className="size-4 text-amber-500" />
              </div>
              <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Süre & Fiyat</h4>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="base_duration" className="text-[12px] font-black text-gray-600 ml-1">SÜRE (DK)</label>
                <input
                  id="base_duration"
                  type="number"
                  value={formData.baseDurationMinutes}
                  onChange={(e) => setFormData(p => ({ ...p, baseDurationMinutes: Number(e.target.value) }))}
                  className="h-14 w-full rounded-2xl bg-gray-50 border-2 border-transparent px-5 text-[15px] font-black focus:bg-white focus:border-primary/10 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="base_price" className="text-[12px] font-black text-gray-600 ml-1">BAZ FİYAT (₺)</label>
                <div className="relative">
                  <input
                    id="base_price"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(p => ({ ...p, basePrice: Number(e.target.value) }))}
                    className="h-14 w-full rounded-2xl bg-primary/5 border-2 border-transparent px-9 text-[15px] font-black text-primary focus:bg-white focus:border-primary/10 outline-none"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black">₺</span>
                </div>
              </div>
            </div>

            <div className={cn(
              "p-5 rounded-3xl border-2 transition-all",
              bufferEnabled ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-transparent opacity-60"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Zap className={cn("size-4", bufferEnabled ? "text-amber-500" : "text-gray-400")} />
                  <span className="text-[13px] font-black text-gray-900">Mola Süresi (Buffer)</span>
                </div>
                <button 
                  onClick={() => setBufferEnabled(!bufferEnabled)}
                  className={cn("h-5 w-9 rounded-full relative transition-colors", bufferEnabled ? "bg-success" : "bg-gray-300")}
                >
                  <div className={cn("size-3.5 bg-white rounded-full absolute top-0.5 transition-all", bufferEnabled ? "left-5" : "left-0.5")} />
                </button>
              </div>
              {bufferEnabled && (
                <input
                  type="number"
                  value={formData.bufferTimeMinutes}
                  onChange={(e) => setFormData(p => ({ ...p, bufferTimeMinutes: Number(e.target.value) }))}
                  className="h-12 w-full rounded-xl bg-white shadow-sm border-none px-4 text-[14px] font-bold focus:ring-2 focus:ring-amber-200"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Staff */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-indigo-500/5 flex items-center justify-center">
                <User className="size-4 text-indigo-500" />
              </div>
              <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Görevli Personel</h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-2 no-scrollbar">
            {staffMembers.map((staff) => {
              const isSelected = formData.staffIds?.includes(staff.id)
              return (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => toggleStaff(staff.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left",
                    isSelected
                      ? "bg-white border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20 scale-[1.02]"
                      : "bg-gray-50 border-transparent hover:border-gray-100"
                  )}
                >
                  <RxAvatar name={staff.user?.name || "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-black text-gray-900 truncate tracking-tight">{staff.user?.name}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{isSelected ? "SEÇİLDİ" : "PASİF"}</div>
                  </div>
                  {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 mr-1" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-8 border-t border-gray-100">
        <RxButton variant="ghost" onClick={onClose} className="h-14 px-8 rounded-2xl font-black text-gray-400">VAZGEÇ</RxButton>
        <RxButton
          variant="primary"
          onClick={handleSave}
          disabled={loading}
          className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-3"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : (service ? <Save className="size-5" /> : <Plus className="size-5" />)}
          <span>{loading ? "KAYDEDİLİYOR" : (service ? "GÜNCELLE" : "OLUŞTUR")}</span>
        </RxButton>
      </div>
    </div>
  )
}
