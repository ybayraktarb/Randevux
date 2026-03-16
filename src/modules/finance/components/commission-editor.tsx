"use client"

import { useState } from "react"
import { FileText, Save, Loader2, CheckCircle, Info } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface StaffCommission {
  id: string
  name: string
  role: string
  avatar_url?: string
  commission_rule: {
    service_commission_rate: number
    base_salary: number
  }
}

interface CommissionEditorProps {
  staffList: StaffCommission[]
  loading: boolean
  onUpdate: (staffId: string, rate: number, salary: number) => Promise<{ success: boolean; error?: string }>
}

export function CommissionEditor({
  staffList,
  loading,
  onUpdate,
}: CommissionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ rate: 0, salary: 0 })

  const handleEdit = (staff: StaffCommission) => {
    setEditingId(staff.id)
    setForm({
      rate: staff.commission_rule.service_commission_rate,
      salary: staff.commission_rule.base_salary
    })
  }

  const handleSave = async (staffId: string) => {
    setSaving(true)
    const res = await onUpdate(staffId, form.rate, form.salary)
    if (res.success) {
      toast.success("Kural güncellendi.")
      setEditingId(null)
    } else {
      toast.error(res.error || "Güncelleme hatası.")
    }
    setSaving(false)
  }

  if (loading) return (
     <div className="py-20 flex justify-center"><Loader2 className="animate-spin size-10 text-primary" /></div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-black text-foreground uppercase tracking-widest">Prim ve Maaş Yapılandırması</h2>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Personel bazlı komisyon ve hakediş kurallarını buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff: StaffCommission) => {
          const isEditing = editingId === staff.id
          return (
            <div key={staff.id} className={cn(
              "relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-300",
              isEditing ? "border-primary ring-2 ring-primary/10 shadow-xl" : "border-border shadow-sm hover:border-primary/30"
            )}>
              {/* Card Header */}
              <div className="p-6 border-b border-border/50 flex items-center gap-4">
                <RxAvatar name={staff.name} src={staff.avatar_url} size="md" />
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-foreground truncate uppercase tracking-widest">{staff.name}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{staff.role}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-5 bg-muted/5 flex-1">
                {isEditing ? (
                  <>
                    <div className="space-y-1.5">
                      <label htmlFor={`rate-${staff.id}`} className="text-[10px] font-black uppercase tracking-widest text-primary">Hizmet Primi (%)</label>
                      <input 
                        id={`rate-${staff.id}`}
                        type="number" 
                        value={form.rate} 
                        onChange={e => setForm({...form, rate: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-background border border-primary/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`salary-${staff.id}`} className="text-[10px] font-black uppercase tracking-widest text-primary">Taban Maaş (₺)</label>
                      <input 
                        id={`salary-${staff.id}`}
                        type="number" 
                        value={form.salary} 
                        onChange={e => setForm({...form, salary: Number(e.target.value)})}
                        className="w-full h-10 px-3 bg-background border border-primary/20 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Prim</p>
                      <p className="text-base font-black text-foreground">%{staff.commission_rule.service_commission_rate}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/50">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Maaş</p>
                      <p className="text-base font-black text-foreground">₺{staff.commission_rule.base_salary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-muted/10 border-t border-border/50">
                {isEditing ? (
                  <div className="flex gap-2">
                    <RxButton variant="ghost" className="flex-1 h-9" onClick={() => setEditingId(null)}>İptal</RxButton>
                    <RxButton className="flex-1 h-9" onClick={() => handleSave(staff.id)} loading={saving}>
                      <Save className="size-3.5 mr-2" /> Kaydet
                    </RxButton>
                  </div>
                ) : (
                  <RxButton variant="secondary" className="w-full h-9 font-black uppercase tracking-widest text-[10px]" onClick={() => handleEdit(staff)}>
                    Kuralları Düzenle
                  </RxButton>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
