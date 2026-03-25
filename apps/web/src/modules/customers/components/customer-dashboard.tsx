"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"

import { toast } from "sonner"

// Dashboard Modules
import { useDashboardData } from "./dashboard/useDashboardData"
import { useDashboardModals } from "./dashboard/useDashboardModals"
import { OverviewTab } from "./dashboard/OverviewTab"
import { AppointmentsTab } from "./dashboard/AppointmentsTab"
import { ProfilTab } from "./dashboard/ProfilTab"
import { DetailsModal } from "./dashboard/DetailsModal"
import { ReviewModal } from "./dashboard/ReviewModal"
import { TabView } from "./dashboard/types"
import { RxSkeleton } from "@/src/modules/core/components/rx-skeleton"

export function CustomerDashboard({ defaultTab = "kesfet" }: { defaultTab?: TabView }) {
  const router = useRouter()
  const { user } = useCurrentUser()
  
  const {
    appointments,
    businesses,
    loading,
    notifications,
    profile,
    familyProfiles,
    stats,
    loadingFamily,
    loadingStats,
    handleCancelAppointment,
    handleJoinBusiness,
    handleLeaveBusiness,
    handleUpdateProfile,
    handleAddFamilyProfile,
    handleDeleteFamilyProfile,
    handleMarkAsRead
  } = useDashboardData(user)

  const modals = useDashboardModals()

  const [activeTab, setActiveTab] = useState<TabView>(defaultTab)

  const handleRebook = (businessId: string, services: string) => {
    router.push(`/isletme/${businessId}`)
    toast.info("İşletme sayfasına yönlendirildiniz, buradan aynı hizmetleri seçebilirsiniz.")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-10 p-6">
        <div className="flex justify-between items-center">
          <RxSkeleton className="h-8 w-48 rounded-md" />
          <RxSkeleton className="h-8 w-24 rounded-md" />
        </div>
        <RxSkeleton className="h-32 w-full rounded-premium" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <RxSkeleton className="h-6 w-32 rounded-md" />
            <RxSkeleton className="h-4 w-16 rounded-md" />
          </div>
          <div className="flex gap-4 overflow-hidden pt-2">
            <RxSkeleton className="h-[200px] w-[200px] shrink-0 rounded-card" />
            <RxSkeleton className="h-[200px] w-[200px] shrink-0 rounded-card" />
            <RxSkeleton className="h-[200px] w-[200px] shrink-0 rounded-card" />
          </div>
        </div>
      </div>
    )
  }

  const now = new Date().getTime()
  const upcoming = appointments.filter((a) => {
    const fullDate = a.fullDate instanceof Date ? a.fullDate : new Date(a.fullDate)
    return (a.status === "Onaylandı" || a.status === "Bekliyor") && fullDate.getTime() > now
  }).reverse()
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || ""

  return (
    <>
      {activeTab === "kesfet" && (
        <OverviewTab
          upcoming={upcoming}
          businesses={businesses}
          onNavigate={setActiveTab}
          onJoinBusiness={handleJoinBusiness}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          router={router}
          userName={userName}
        />
      )}
      {activeTab === "randevularim" && (
        <AppointmentsTab
          allAppointments={appointments}
          onCancel={handleCancelAppointment}
          onRebook={handleRebook}
          onViewDetails={modals.details.handleViewDetails}
          onReview={modals.review.handleOpenReviewModal}
        />
      )}

      {activeTab === "profil" && (
        <ProfilTab
          profile={profile}
          onUpdate={handleUpdateProfile}
          familyProfiles={familyProfiles}
          onAddFamily={handleAddFamilyProfile}
          onDeleteFamily={handleDeleteFamilyProfile}
          loadingFamily={loadingFamily}
          stats={stats}
          loadingStats={loadingStats}
        />
      )}

      <DetailsModal
        open={modals.details.open}
        onClose={() => modals.details.setOpen(false)}
        loading={modals.details.loading}
        appointment={modals.details.appointment}
        onCancel={handleCancelAppointment}
        generateCalendarUrl={modals.details.generateCalendarUrl}
      />

      <ReviewModal
        open={modals.review.open}
        onClose={() => modals.review.setOpen(false)}
        appointment={modals.review.appointment}
        rating={modals.review.rating}
        setRating={modals.review.setRating}
        comment={modals.review.comment}
        setComment={modals.review.setComment}
        onAddReview={modals.review.handleAddReview}
        isSubmitting={modals.review.isSubmitting}
      />
    </>
  )
}
