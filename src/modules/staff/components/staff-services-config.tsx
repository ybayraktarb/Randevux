"use client"

import { useState } from "react"
import { Wrench, Check, Save, Loader2, Info } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Service {
  id: string
  name: string
  base_duration_minutes: number
  base_price: number
}

interface AssignedService {
  id: string
  service_id: string
  custom_price: number | null
  custom_duration_minutes: number | null
  is_active: boolean
}

interface StaffServicesConfigProps {
  staffBusinessId: string
  allServices: Service[]
  assignedServices: AssignedService[]
  loading: boolean
  onToggle: (serviceId: string, assigned: boolean) => Promise<{ success: boolean; error?: { message: string } }>
  onUpdateCustom: (serviceId: string, price: number | null, duration: number | null) => Promise<{ success: boolean; error?: { message: string } }>
}

export function StaffServicesConfig({
  staffBusinessId,
  allServices,
  assignedServices,
  loading,
  onToggle,
  onUpdateCustom,
}: Readonly<StaffServicesConfigProps>) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editingCustom, setEditingCustom] = useState<Record<string, { price: string; duration: string }>>({})

  const isAssigned = (serviceId: string) => assignedServices.some((s) => s.service_id === serviceId)
  const getAssigned = (serviceId: string) => assignedServices.find((s) => s.service_id === serviceId)

  const handleToggle = async (serviceId: string) => {
    const assigned = isAssigned(serviceId)
    setSavingId(serviceId)
    const res = await onToggle(serviceId, assigned)
    if (!res.success) toast.error(res.error?.message || "Hata oluştu.")
    setSavingId(null)
  }

  const handleSaveCustom = async (serviceId: string) => {
    const edit = editingCustom[serviceId]
    if (!edit) return
    const price = edit.price !== "" ? Number(edit.price) : null
    const duration = edit.duration !== "" ? Number(edit.duration) : null
    
    setSavingId(serviceId)
    const res = await onUpdateCustom(serviceId, price, duration)
    if (res.success) {
      toast.success("Özelleştirme kaydedildi.")
      setEditingCustom((prev) => {
        const next = { ...prev }
        delete next[serviceId]
        return next
      })
    } else {
      toast.error(res.error?.message || "Hata oluştu.")
    }
    setSavingId(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm text-blue-700 dark:text-blue-300 flex gap-2">
        <Info className="size-4 shrink-0 mt-0.5" />
        <p>
          İşaretlediğiniz hizmetleri bu personel verebilir. Özel fiyat veya süre girmezseniz, hizmetin varsayılan değerleri kullanılır.
        </p>
      </div>

      {allServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm italic">
          Henüz işletmede tanımlanmış hizmet yok.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {allServices.map((svc) => {
            const assigned = isAssigned(svc.id)
            const staffSvc = getAssigned(svc.id)
            const isEditing = !!editingCustom[svc.id]

            return (
              <div
                key={svc.id}
                className={cn(
                  "rounded-xl border transition-all",
                  assigned
                    ? "border-primary/40 bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => handleToggle(svc.id)}
                    disabled={savingId === svc.id}
                    className={cn(
                      "size-5 shrink-0 rounded flex items-center justify-center border-2 transition-colors",
                      assigned
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary"
                    )}
                  >
                    {savingId === svc.id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : assigned ? (
                      <Check className="size-3" />
                    ) : null}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{svc.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {svc.base_duration_minutes} dk · ₺{Number(svc.base_price).toFixed(2)}
                    </p>
                  </div>

                  {assigned && staffSvc && (
                    <div className="flex items-center gap-2 shrink-0">
                      {staffSvc.custom_duration_minutes && (
                        <RxBadge variant="warning">{staffSvc.custom_duration_minutes} dk</RxBadge>
                      )}
                      {staffSvc.custom_price != null && (
                        <RxBadge variant="success">₺{Number(staffSvc.custom_price).toFixed(0)}</RxBadge>
                      )}
                      <button
                        onClick={() =>
                          setEditingCustom((prev) => ({
                            ...prev,
                            [svc.id]: {
                              price: staffSvc.custom_price?.toString() ?? "",
                              duration: staffSvc.custom_duration_minutes?.toString() ?? "",
                            },
                          }))
                        }
                        className="text-xs text-primary font-bold hover:underline underline-offset-4 ml-2"
                      >
                        {isEditing ? "Kapat" : "Düzenle"}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="border-t border-border px-4 py-3 flex items-center gap-4 flex-wrap bg-muted/20 rounded-b-xl animate-in fade-in duration-200">
                    <div className="flex items-center gap-2">
                      <label htmlFor={`duration-${svc.id}`} className="text-xs font-bold text-muted-foreground">Süre (dk):</label>
                      <input
                        id={`duration-${svc.id}`}
                        type="number"
                        min={5}
                        placeholder={svc.base_duration_minutes.toString()}
                        value={editingCustom[svc.id].duration}
                        onChange={(e) =>
                          setEditingCustom((prev) => ({
                            ...prev,
                            [svc.id]: { ...prev[svc.id], duration: e.target.value },
                          }))
                        }
                        className="h-8 w-20 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`price-${svc.id}`} className="text-xs font-bold text-muted-foreground">Fiyat (₺):</label>
                      <input
                        id={`price-${svc.id}`}
                        type="number"
                        min={0}
                        placeholder={svc.base_price.toString()}
                        value={editingCustom[svc.id].price}
                        onChange={(e) =>
                          setEditingCustom((prev) => ({
                            ...prev,
                            [svc.id]: { ...prev[svc.id], price: e.target.value },
                          }))
                        }
                        className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2 ml-auto">
                      <RxButton
                        size="sm"
                        onClick={() => handleSaveCustom(svc.id)}
                        loading={savingId === svc.id}
                        className="h-8"
                      >
                        <Save className="mr-2 size-3" /> Kaydet
                      </RxButton>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
