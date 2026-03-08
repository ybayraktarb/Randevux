"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Calendar,
  Clock,
  TrendingUp,
  UserX,
  CalendarPlus,
  MoreHorizontal,
  ArrowRight,
  Check,
  XIcon,
  Loader2,
  PackageOpen,
  AlertTriangle
} from "lucide-react"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxButton } from "./rx-button"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts"
import { createClient } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { getDashboardStatsAction, type DashboardStats } from "@/app/actions/dash-stats.actions"
import { AddAppointmentModal } from "./appointment-management"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface TodayApt {
  id: string
  time: string
  customer: string
  service: string
  staff: string
  status: "Tamamlandı" | "ongoing" | "Onaylandı" | "Bekliyor" | "break"
}

interface PendingItem {
  id: string
  customer: string
  service: string
  date: string
  time: string
  staff: string
}

interface NoShowRecord {
  customer: string
  service: string
  date: string
  staff: string
}

interface StaffPerf {
  name: string
  count: number
  percent: number
}

// ─── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ label, icon: Icon, value, trendText, trendValue, trendPositive, actionLabel, onAction, color = "primary" }: {
  label: string; icon: React.ElementType; value: string; trendText?: string; trendValue?: string; trendPositive?: boolean; actionLabel?: string; onAction?: () => void; color?: string
}) {
  return (
    <div className="relative overflow-hidden group rounded-[32px] bg-white/80 backdrop-blur-xl border border-white/20 p-6 shadow-xl shadow-gray-200/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-8 -top-8 size-32 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
        color === "primary" ? "bg-primary" : "bg-emerald-500"
      )} />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "flex size-12 items-center justify-center rounded-2xl shadow-inner-white",
            color === "primary" ? "bg-primary/10 text-primary" : "bg-emerald-100 text-emerald-600"
          )}>
            <Icon className="size-6" />
          </div>
          {trendValue && (
            <span className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
              trendPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600 border border-rose-100"
            )}>
              {trendPositive ? "↑" : "↓"} {trendValue}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-bold text-gray-400">{trendText || "Genel Durum"}</span>
          {actionLabel && (
            <button
              type="button"
              onClick={onAction}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-hover transition-colors"
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Status Badge Helper ────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "Tamamlandı":
      return <RxBadge variant="success">{"Tamamlandı"}</RxBadge>
    case "ongoing":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-badge-purple-bg px-2.5 py-0.5 text-xs font-medium text-badge-purple-text">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
          </span>
          {"Devam Ediyor"}
        </span>
      )
    case "Onaylandı":
      return <RxBadge variant="success">{"Onaylandı"}</RxBadge>
    case "Bekliyor":
      return <RxBadge variant="warning">{"Bekliyor"}</RxBadge>
    default:
      return null
  }
}

// ─── Today's Appointments ───────────────────────────────────────────────────────

function TodayAppointments({ appointments }: { appointments: TodayApt[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Calendar className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Bugünkü Akış</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operasyonel Takvim</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100">
          <Clock className="size-3.5 text-gray-400" />
          <span className="text-xs font-black text-gray-900">{new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-col p-8 gap-0 relative">
        {/* Central Line */}
        <div className="absolute left-[59px] top-8 bottom-8 w-px bg-gray-100" />

        {appointments.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-20 rounded-[32px] bg-gray-50 flex items-center justify-center">
              <PackageOpen className="size-10 text-gray-200" />
            </div>
            <p className="text-sm font-bold text-gray-400">Henüz bir randevu bulunmuyor</p>
          </div>
        )}

        {appointments.map((apt, index) => {
          const isBreak = apt.status === "break"
          const isOngoing = apt.status === "ongoing"
          const isDone = apt.status === "Tamamlandı"

          return (
            <div key={`${apt.id}-${index}`} className="flex gap-8 group relative pb-8 last:pb-0">
              {/* Time Label */}
              <div className="w-12 pt-1 text-right">
                <span className={cn(
                  "text-[13px] font-black tracking-tighter",
                  isOngoing ? "text-primary" : "text-gray-400"
                )}>
                  {apt.time}
                </span>
              </div>

              {/* Node */}
              <div className="relative z-10">
                <div className={cn(
                  "size-3 rounded-full border-2 transition-all duration-500 mt-[6px]",
                  isOngoing
                    ? "bg-primary border-primary ring-4 ring-primary/20 scale-125"
                    : isDone
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-200 group-hover:border-primary"
                )} />
              </div>

              {/* Card Container */}
              <div className="flex-1">
                {isBreak ? (
                  <div className="p-4 rounded-2xl bg-gray-50/50 border border-dashed border-gray-200">
                    <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Öğle Molası</span>
                  </div>
                ) : (
                  <div className={cn(
                    "p-5 rounded-3xl border-2 transition-all duration-500",
                    isOngoing
                      ? "bg-white border-primary shadow-xl shadow-primary/5 -translate-y-1"
                      : "bg-white border-gray-50 hover:border-gray-200 hover:shadow-lg"
                  )}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <RxAvatar name={apt.customer} size="sm" className="size-10 rounded-xl" />
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-black text-gray-900">{apt.customer}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400">{apt.service}</span>
                            <span className="size-1 rounded-full bg-gray-200" />
                            <span className="text-[11px] font-black text-primary uppercase tracking-widest">{apt.staff}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <StatusBadge status={apt.status} />
                        <button type="button" className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary transition-all">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pending Approvals ──────────────────────────────────────────────────────────

function PendingApprovals({ items, onApprove, onReject }: {
  items: PendingItem[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-900 tracking-tight">Bekleyen Onaylar</h2>
          <span className="flex size-6 items-center justify-center rounded-xl bg-accent/20 text-[11px] font-black text-accent-foreground border border-accent/20">{items.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 p-8">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="size-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <Check className="size-8 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-400">{"Sıranız tertemiz!"}</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl border-2 border-gray-50 bg-white p-5 hover:border-gray-200 transition-all hover:shadow-lg">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-gray-900">{item.customer}</span>
                  <div className="px-3 py-1 rounded-lg bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100">
                    {item.time}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-gray-400">{item.service}</span>
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">{item.staff}</span>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <RxButton size="sm" variant="primary" onClick={() => onApprove(item.id)} className="rounded-xl flex-1 font-black text-[10px] uppercase tracking-widest">
                    ONAYLA
                  </RxButton>
                  <RxButton size="sm" variant="danger" onClick={() => onReject(item.id)} className="rounded-xl flex-1 font-black text-[10px] uppercase tracking-widest">
                    REDDET
                  </RxButton>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Info Banner */}
        <div className="rounded-2xl bg-indigo-50/50 border border-indigo-100 p-4">
          <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
            {"Manuel onay modu aktif. Otomatik onaya geçmek için "}
            <button type="button" className="font-black underline decoration-2 underline-offset-4">Ayarlar</button>
            {"'a gidin."}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Revenue Chart ──────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white/80 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-gray-200/50">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-gray-900">
          {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(payload[0].value)}
        </p>
      </div>
    )
  }
  return null
}

function RevenueChart({ revenueData, totalRevenue }: { revenueData: { week: string; revenue: number }[]; totalRevenue: number }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Gelir Analizi</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Aylık Performans Trendi</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xl font-black text-emerald-500 tracking-tighter">₺{totalRevenue.toLocaleString("tr-TR")}</span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOPLAM</span>
          </div>
        </div>
      </div>
      <div className="px-4 pt-8 pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 700 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 10, fill: "#9CA3AF", fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={3} fill="url(#colorRevenue)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Staff Performance ──────────────────────────────────────────────────────────

interface EfficiencyMetric {
  name: string
  completionRate: number
  totalHours: number
}

function StaffEfficiencyScorecards({ efficiency }: { efficiency: EfficiencyMetric[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden h-full">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Personel Verimliliği</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Performans Karnesi</p>
        </div>
      </div>
      <div className="p-8 space-y-8">
        {efficiency.length === 0 && (
          <p className="text-sm font-bold text-gray-400 text-center py-10">Veri yok</p>
        )}
        {efficiency.map((staff) => (
          <div key={staff.name} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RxAvatar name={staff.name} size="sm" className="size-10 rounded-xl" />
                <span className="text-sm font-black text-gray-900 tracking-tight">{staff.name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-primary">%{staff.completionRate}</span>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TAMAMLAMA</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">TOPLAM MESAİ</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900">{staff.totalHours}</span>
                  <span className="text-[11px] font-bold text-gray-400">Saat</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">DURUM</p>
                <span className="text-[11px] font-black text-emerald-600 uppercase">Yüksek Verim</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Service Utilization ────────────────────────────────────────────────────────

interface ServiceMetric {
  name: string
  count: number
  revenue: number
}

function ServiceUtilization({ services }: { services: ServiceMetric[] }) {
  const maxCount = Math.max(...services.map(s => s.count), 1)

  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden h-full">
      <div className="px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Hizmet Analitiği</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Popüler Hizmetler ve Gelir</p>
        </div>
      </div>
      <div className="p-8 space-y-6">
        {services.length === 0 && (
          <p className="text-sm font-bold text-gray-400 text-center py-10">Veri yok</p>
        )}
        {services.map((svc) => (
          <div key={svc.name} className="space-y-2">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/5 flex items-center justify-center">
                  <PackageOpen className="size-4 text-primary" />
                </div>
                <span className="text-sm font-black text-gray-900 tracking-tight group-hover:text-primary transition-colors">{svc.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-sm font-black text-gray-900">₺{svc.revenue.toLocaleString("tr-TR")}</span>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">GELİR</p>
                </div>
                <div className="size-10 rounded-xl bg-gray-50 flex flex-col items-center justify-center">
                  <span className="text-sm font-black text-gray-900">{svc.count}</span>
                  <p className="text-[8px] font-black text-gray-400 uppercase">ADET</p>
                </div>
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${(svc.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {services.length > 0 && (
        <div className="px-8 py-6 bg-gray-50/30 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
            <TrendingUp className="size-5 text-indigo-500 shrink-0" />
            <p className="text-[11px] font-bold text-indigo-600 leading-relaxed">
              <strong>{services[0].name}</strong> bu ay en çok tercih edilen hizmetiniz oldu. Bu alana özel kampanyalar değerlendirilebilir.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── No-Show Records ────────────────────────────────────────────────────────────

function NoShowRecords({ records }: { records: NoShowRecord[] }) {
  return (
    <div className="flex flex-col rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 bg-gray-50/50 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">No-Show Kayıtları</h2>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">İşletme Kara Listesi</p>
        </div>
        <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4">Tümünü Gör</button>
      </div>

      {/* List */}
      <div className="flex flex-col divide-y divide-gray-50">
        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="size-20 rounded-[32px] bg-emerald-50 flex items-center justify-center">
              <Check className="size-10 text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-gray-400">Harika! Son zamanlarda no-show yok.</p>
          </div>
        ) : (
          records.map((record, index) => (
            <div key={index} className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <RxAvatar name={record.customer} size="sm" className="size-12 rounded-2xl group-hover:scale-105 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 size-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center">
                    <UserX className="size-3 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 leading-none">{record.customer}</h4>
                  <p className="text-[11px] font-bold text-gray-400 mt-1">{record.service} • {record.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PERSONEL</span>
                  <span className="text-[11px] font-black text-gray-900">{record.staff}</span>
                </div>
                <button type="button" className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/10 transition-all">
                  <MoreHorizontal className="size-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="p-8 bg-gray-50/30 border-t border-gray-50">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-50/50 border border-rose-100">
          <AlertTriangle className="size-5 text-rose-500 shrink-0" />
          <p className="text-[11px] font-bold text-rose-600 leading-relaxed">
            {"Bu müşteriler randevusuna gelmedi. Bir sonraki randevularında ön ödeme talep edebilirsiniz."}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────────

export function PatronDashboard() {
  const { user } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [todayApts, setTodayApts] = useState<TodayApt[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [noShowRecords, setNoShowRecords] = useState<NoShowRecord[]>([])
  const [staffPerf, setStaffPerf] = useState<StaffPerf[]>([])
  const [revenueData, setRevenueData] = useState<{ week: string; revenue: number }[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalAppointments, setTotalAppointments] = useState(0)
  const [noShowCount, setNoShowCount] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [vipCount, setVipCount] = useState(0)
  const [showAddModal, setShowAddModal] = useState(false)

  // Stats - Step 12
  const [serviceUtilization, setServiceUtilization] = useState<DashboardStats["serviceUtilization"]>([])
  const [staffEfficiency, setStaffEfficiency] = useState<DashboardStats["staffEfficiency"]>([])

  // Eksik Stok
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    let cancelled = false

    async function init() {
      // businessId'yi çek (RLS oturumu hazır olduktan sonra)
      const { data } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", user!.id)
        .maybeSingle()

      if (cancelled) return

      if (!data?.business_id) {
        toast.error("İşletme bulunamadı. Lütfen sistem yöneticisiyle iletişime geçin.")
        setLoading(false)
        return
      }

      setBusinessId(data.business_id)
    }

    init()
    return () => { cancelled = true }
  }, [user, supabase])

  const fetchDashboard = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`

      // Today's appointments
      const { data: todayData } = await supabase
        .from("appointments")
        .select("id, start_time, status, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("appointment_date", todayStr)
        .order("start_time")

      const mappedToday: TodayApt[] = (todayData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const timeParts = String(a.start_time).split(":")
        return {
          id: a.id,
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")}`,
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          staff: staffUser?.name || "?",
          status: (a.status === "Tamamlandı" ? "Tamamlandı" : a.status === "Onaylandı" ? "Onaylandı" : "Bekliyor") as TodayApt["status"],
        }
      })
      setTodayApts(mappedToday)

      // Pending approvals
      const { data: pendingData } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "Bekliyor")
        .order("appointment_date")
        .limit(10)

      const mappedPending: PendingItem[] = (pendingData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        const dateObj = new Date(a.appointment_date + "T00:00:00")
        const timeParts = String(a.start_time).split(":")
        return {
          id: a.id,
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          date: dateObj.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
          time: `${timeParts[0]?.padStart(2, "0")}:${timeParts[1]?.padStart(2, "0")}`,
          staff: staffUser?.name || "?",
        }
      })
      setPendingItems(mappedPending)

      // No-show records (last 5)
      const { data: noShowData } = await supabase
        .from("appointments")
        .select("appointment_date, start_time, customer:users!appointments_customer_user_id_fkey(name), services:appointment_services(service:services(name)), staff:staff_business!appointments_staff_business_id_fkey(user:users(name))")
        .eq("business_id", businessId)
        .eq("status", "Gelmedi")
        .order("appointment_date", { ascending: false })
        .limit(5)

      const mappedNoShow: NoShowRecord[] = (noShowData || []).map((a) => {
        const cust = Array.isArray(a.customer) ? a.customer[0] : a.customer
        const aptSvcs = Array.isArray(a.services) ? a.services : []
        const firstSvc = aptSvcs[0]?.service
        const svcObj = Array.isArray(firstSvc) ? firstSvc[0] : firstSvc
        const staffRow = Array.isArray(a.staff) ? a.staff[0] : a.staff
        const staffUser = staffRow?.user ? (Array.isArray(staffRow.user) ? staffRow.user[0] : staffRow.user) : null
        return {
          customer: cust?.name || "?",
          service: svcObj?.name || "?",
          date: new Date(a.appointment_date + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long" }),
          staff: staffUser?.name || "?",
        }
      })
      setNoShowRecords(mappedNoShow)

      // Kritik Stoktaki Ürünleri Çek
      const { data: stockData } = await supabase
        .from("products")
        .select("id, name, stock_quantity, min_stock_alert")
        .eq("business_id", businessId)
        .eq("is_active", true)

      if (stockData) {
        const lowStock = stockData.filter(p => p.stock_quantity <= p.min_stock_alert)
        setLowStockItems(lowStock)
      }

      // Fetch aggregated stats from server action
      const statsRes = await getDashboardStatsAction(businessId)
      if (statsRes.success && statsRes.data) {
        const s = statsRes.data as DashboardStats
        setTotalRevenue(s.totalRevenue)
        setTotalAppointments(s.totalAppointments)
        setNoShowCount(s.noShowCount)
        setTotalCustomers(s.totalCustomers)
        setVipCount(s.vipCount)
        setRevenueData(s.weeklyRevenue)
        setStaffPerf(s.staffPerformance)
        setServiceUtilization(s.serviceUtilization)
        setStaffEfficiency(s.staffEfficiency)
      }
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const handleApprove = async (id: string) => {
    await supabase.from("appointments").update({ status: "Onaylandı" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleReject = async (id: string) => {
    await supabase.from("appointments").update({ status: "İptal" }).eq("id", id)
    setPendingItems((prev) => prev.filter((item) => item.id !== id))
  }

  const now = new Date()
  const greeting = now.getHours() < 12 ? "Gunaydin" : now.getHours() < 18 ? "Iyi gunler" : "Iyi aksamlar"
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Patron"
  const dateStr = now.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 py-6">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Sistem Aktif</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
            {greeting}, <span className="text-primary">{userName}</span>
          </h2>
          <p className="text-base font-bold text-gray-400 capitalize">{dateStr}</p>
        </div>
        <div className="flex gap-3">
          <RxButton variant="secondary" className="rounded-2xl border-2 font-black uppercase tracking-widest text-[11px]">
            <Calendar className="size-4 mr-2" />
            Rapor Al
          </RxButton>
          <RxButton variant="primary" onClick={() => setShowAddModal(true)} className="rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 font-black uppercase tracking-widest text-[11px] px-8">
            <CalendarPlus className="size-4 mr-2" />
            Yeni Randevu
          </RxButton>
        </div>
      </div>

      {showAddModal && businessId && (
        <AddAppointmentModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          businessId={businessId}
          onAdded={fetchDashboard}
        />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Aylık Gelir" icon={TrendingUp} value={`₺${totalRevenue.toLocaleString("tr-TR")}`} trendValue="%12" trendPositive trendText="Geçen aya göre" />
        <StatCard label="Randevu" icon={Calendar} value={String(totalAppointments)} trendValue="8" trendPositive trendText="Bugün beklenen" />
        <StatCard label="Müşteri" icon={RxAvatar} value={String(totalCustomers)} color="success" />
        <StatCard label="VIP" icon={Check} value={String(vipCount)} color="success" />
        <StatCard label="Onay Bekleyen" icon={Clock} value={String(pendingItems.length)} actionLabel="Yönet" color="primary" />
      </div>

      {/* Today's Appointments + Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TodayAppointments appointments={todayApts} />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <PendingApprovals items={pendingItems} onApprove={handleApprove} onReject={handleReject} />

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <div className="flex flex-col rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-destructive/20">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 bg-destructive/5 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-destructive">Kritik Stok Uyarıları</h2>
                  <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground">{lowStockItems.length}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 p-5 max-h-[300px] overflow-y-auto">
                {lowStockItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-card">
                    <div className="flex items-center gap-3">
                      <PackageOpen className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground mr-2">Min: {item.min_stock_alert}</span>
                      <span className={cn("font-bold text-sm", item.stock_quantity === 0 ? "text-destructive" : "text-warning")}>
                        {item.stock_quantity} Adet
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Revenue Chart + Service Utilization */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <div className="xl:col-span-5">
          <RevenueChart revenueData={revenueData} totalRevenue={totalRevenue} />
        </div>
        <div className="xl:col-span-4">
          <ServiceUtilization services={serviceUtilization} />
        </div>
      </div>

      {/* Staff Efficiency + No Show Records */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <div className="xl:col-span-4">
          <StaffEfficiencyScorecards efficiency={staffEfficiency} />
        </div>
        <div className="xl:col-span-5">
          <NoShowRecords records={noShowRecords} />
        </div>
      </div>

    </div>
  )
}
