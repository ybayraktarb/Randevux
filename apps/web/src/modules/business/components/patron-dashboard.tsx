"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Calendar,
  CalendarPlus,
  TrendingUp,
  Clock,
  Check,
  Loader2,
  PackageOpen
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { AddAppointmentModal } from "@/src/modules/appointments/components/add-appointment-modal"
import { FeatureGate } from "@/src/modules/admin/components/feature-gate"

// Extracted Hook & Widgets
import { usePatronDashboardData } from "./dashboard-widgets/usePatronDashboardData"
import { StatCard } from "./dashboard-widgets/StatCard"
import { TodayAppointmentsWidget } from "./dashboard-widgets/TodayAppointmentsWidget"
import { PendingApprovalsWidget } from "./dashboard-widgets/PendingApprovalsWidget"
import { RevenueChartWidget } from "./dashboard-widgets/RevenueChartWidget"
import { StaffEfficiencyWidget } from "./dashboard-widgets/StaffEfficiencyWidget"
import { ServiceUtilizationWidget } from "./dashboard-widgets/ServiceUtilizationWidget"
import { NoShowRecordsWidget } from "./dashboard-widgets/NoShowRecordsWidget"

export function PatronDashboard() {
  const { user, subscriptionStatus } = useCurrentUser()
  const [showAddModal, setShowAddModal] = useState(false)

  const {
    loading,
    businessId,
    todayApts,
    pendingItems,
    noShowRecords,
    totalRevenue,
    totalAppointments,
    noShowCount,
    totalCustomers,
    vipCount,
    revenueData,
    staffPerf,
    serviceUtilization,
    staffEfficiency,
    lowStockItems,
    fetchDashboard,
    handleApprove,
    handleReject
  } = usePatronDashboardData(user)

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
          <RxButton
            variant="primary"
            onClick={() => {
              if (subscriptionStatus === "past_due") {
                toast.error("Aboneliğiniz sona ermiş. Lütfen devam etmek için aboneliğinizi yenileyin.")
                return
              }
              setShowAddModal(true)
            }}
            className={cn(
              "rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 font-black uppercase tracking-widest text-[11px] px-8",
              subscriptionStatus === "past_due" && "opacity-50 grayscale cursor-not-allowed"
            )}
          >
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
        <FeatureGate featureKey="finance_module" businessId={businessId || ""} minimal>
          <StatCard
            label="Toplam Gelir"
            icon={TrendingUp}
            value={`₺${totalRevenue.toLocaleString("tr-TR")}`}
            trendValue="12%"
            trendPositive={true}
            trendText="Geçen aya göre"
            color="emerald"
          />
        </FeatureGate>
        <StatCard label="Randevu" icon={Calendar} value={String(totalAppointments)} trendValue="8" trendPositive trendText="Bugün beklenen" />
        <StatCard label="Müşteri" icon={RxAvatar} value={String(totalCustomers)} color="success" />
        <StatCard label="VIP" icon={Check} value={String(vipCount)} color="success" />
        <StatCard label="Onay Bekleyen" icon={Clock} value={String(pendingItems.length)} actionLabel="Yönet" color="primary" />
      </div>

      {/* Today's Appointments + Pending Approvals */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <TodayAppointmentsWidget appointments={todayApts} />
        </div>
        <div className="xl:col-span-2 flex flex-col gap-6">
          <PendingApprovalsWidget items={pendingItems} onApprove={handleApprove} onReject={handleReject} />

          {/* Low Stock Alerts */}
          {lowStockItems.length > 0 && (
            <FeatureGate featureKey="inventory_module" businessId={businessId || ""} minimal>
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
            </FeatureGate>
          )}
        </div>
      </div>

      {/* Revenue Chart + Service Utilization */}
      <FeatureGate featureKey="finance_module" businessId={businessId || ""} minimal>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChartWidget revenueData={revenueData} totalRevenue={totalRevenue} />
          </div>
          <div className="lg:col-span-1">
            <ServiceUtilizationWidget services={serviceUtilization} />
          </div>
        </div>
      </FeatureGate>

      {/* Staff Efficiency + No Show Records */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-9">
        <div className="xl:col-span-4">
          <StaffEfficiencyWidget efficiency={staffEfficiency} />
        </div>
        <div className="xl:col-span-5">
          <NoShowRecordsWidget records={noShowRecords} />
        </div>
      </div>

    </div>
  )
}
