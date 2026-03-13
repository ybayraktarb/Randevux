"use client"

import { useState } from "react"
import {
  User,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  ListFilter,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface StaffProfileCardProps {
  staff: {
    id: string
    name: string
    email: string
    phone?: string
    avatar_url?: string
    joined_at: string
    is_active: boolean
    role: string
    calendar_color: string
    expertise_level: string
  }
  activeStaffForTransfer: { id: string; name: string }[]
  onUpdateDetail: (data: any) => Promise<{ success: boolean; error?: { message: string } }>
  onTransferAppointments: (targetId: string) => Promise<{ success: boolean; data?: { count: number }; error?: { message: string } }>
  onDelete: () => Promise<{ success: boolean; error?: { message: string } }>
}

export function StaffProfileCard({
  staff,
  activeStaffForTransfer,
  onUpdateDetail,
  onTransferAppointments,
  onDelete,
}: StaffProfileCardProps) {
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [targetStaffId, setTargetStaffId] = useState<string>("")
  const [isTransferring, setIsTransferring] = useState(false)

  const handleUpdate = async (field: string, value: any) => {
    const res = await onUpdateDetail({ [field]: value })
    if (res.success) toast.success("Bilgi güncellendi.")
    else toast.error(res.error?.message || "Hata oluştu.")
  }

  const handleTransfer = async () => {
    if (!targetStaffId) return
    setIsTransferring(true)
    const res = await onTransferAppointments(targetStaffId)
    if (res.success) {
      toast.success(`${res.data?.count} randevu başarıyla aktarıldı.`)
      setIsTransferModalOpen(false)
    } else {
      toast.error(res.error?.message || "Aktarım başarısız oldu.")
    }
    setIsTransferring(false)
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col items-center gap-3 py-4">
        <RxAvatar name={staff.name} src={staff.avatar_url} size="lg" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-foreground">{staff.name}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            {staff.role === "manager" ? "Yönetici" : "Personel"}
          </p>
        </div>
      </div>

      {/* Basic Metrics */}
      <div className="grid gap-3">
        {staff.email && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <Mail className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">E-posta</p>
              <p className="text-sm font-bold text-foreground truncate">{staff.email}</p>
            </div>
          </div>
        )}
        {staff.phone && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <Phone className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Telefon</p>
              <p className="text-sm font-bold text-foreground">{staff.phone}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Kayıt Tarihi</p>
            <p className="text-sm font-bold text-foreground">
              {new Date(staff.joined_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Expertise & Color */}
      <div className="space-y-4 border-t border-border pt-6">
        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Kimlik Ayarları</h4>
        
        <div className="grid gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Uzmanlık Seviyesi</label>
            <select
              value={staff.expertise_level}
              onChange={(e) => handleUpdate("expertise_level", e.target.value)}
              className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Junior">Junior</option>
              <option value="Mid-Level">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Master">Master</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase">Takvim Rengi</label>
            <div className="flex flex-wrap gap-2.5">
              {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map(color => (
                <button
                  key={color}
                  onClick={() => handleUpdate("calendar_color", color)}
                  className={cn(
                    "size-8 rounded-full border-2 transition-all hover:scale-110",
                    staff.calendar_color === color ? "border-foreground ring-2 ring-primary/20 scale-110 shadow-sm" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status & Actions */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest text-foreground">Durum Yönetimi</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {staff.is_active ? "Personel aktif ve randevu alabilir." : "Personel pasif durumda."}
            </p>
          </div>
          <button
            onClick={() => handleUpdate("is_active", !staff.is_active)}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
              staff.is_active ? "bg-success" : "bg-muted"
            )}
          >
            <span className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              staff.is_active ? "translate-x-5" : "translate-x-0"
            )} />
          </button>
        </div>

        {staff.is_active && (
          <RxButton
            variant="secondary"
            size="sm"
            className="w-full justify-start h-10 text-[11px] font-black uppercase tracking-widest"
            onClick={() => setIsTransferModalOpen(true)}
          >
            <ListFilter className="mr-2 h-4 w-4" /> Randevuları Aktar
          </RxButton>
        )}
      </div>

      {/* Danger Zone */}
      <div className="pt-4">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="size-4 text-destructive" />
            <span className="text-[11px] font-black uppercase tracking-widest text-destructive">Kritik İşlem</span>
          </div>
          <p className="text-[11px] text-destructive/80 mb-4 leading-relaxed font-medium">
            Personeli işletmeden kaldırmak kalıcı bir işlemdir.
          </p>
          <RxButton
            variant="ghost"
            size="sm"
            className="w-full h-9 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 border border-destructive/10"
            onClick={() => {
              if (confirm("Bu personeli işletmeden kalıcı olarak kaldırmak istediğinize emin misiniz?")) {
                onDelete()
              }
            }}
          >
            <Trash2 className="mr-2 size-3.5" /> Personeli Kaldır
          </RxButton>
        </div>
      </div>

      {/* Transfer Modal */}
      <RxModal
        open={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Randevuları Aktar"
        footer={
          <div className="flex gap-2">
            <RxButton variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Vazgeç</RxButton>
            <RxButton onClick={handleTransfer} disabled={!targetStaffId || isTransferring}>
              {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Aktarımı Onayla
            </RxButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-700 leading-relaxed font-medium">
            Bugünden sonraki tüm bekleyen ve onaylanan randevular hedef personelin takvimine taşınacaktır.
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-muted-foreground uppercase">Hedef Personel</label>
            {activeStaffForTransfer.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">Aktarım yapılabilecek başka aktif personel yok.</p>
            ) : (
              <div className="grid gap-2">
                {activeStaffForTransfer.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setTargetStaffId(s.id)}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border text-sm transition-all",
                      targetStaffId === s.id ? "bg-primary/5 border-primary ring-1 ring-primary" : "bg-card border-border hover:border-primary/40"
                    )}
                  >
                    <span className="font-bold">{s.name}</span>
                    {targetStaffId === s.id && <CheckCircle2 className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </RxModal>
    </div>
  )
}
