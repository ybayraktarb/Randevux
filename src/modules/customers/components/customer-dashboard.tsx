"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { DiscoveryTab } from "@/src/modules/business/components/DiscoveryTab"
import { toast } from "sonner"
import { addReviewAction } from "@/src/modules/business/actions/business.actions"
import { getAppointmentDetailsAction } from "@/src/modules/appointments/actions/appointment.actions"

// Dashboard Modules
import { useDashboardData } from "./dashboard/useDashboardData"
import { OverviewTab } from "./dashboard/OverviewTab"
import { AppointmentsTab } from "./dashboard/AppointmentsTab"
import { BusinessesTab } from "./dashboard/BusinessesTab"
import { ProfilTab } from "./dashboard/ProfilTab"
import { DetailsModal } from "./dashboard/DetailsModal"
import { ReviewModal } from "./dashboard/ReviewModal"
import { TabView, Appointment } from "./dashboard/types"

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

  const [activeTab, setActiveTab] = useState<TabView>(defaultTab)
  
  // Modal State
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const handleViewDetails = async (id: string) => {
    setSelectedAppointment(null)
    setShowDetails(true)
    setDetailLoading(true)
    const res = await getAppointmentDetailsAction(id)
    if (res.success) {
      setSelectedAppointment(res.data)
    } else {
      toast.error(res.error || "Randevu detayları yüklenemedi.")
      setShowDetails(false)
    }
    setDetailLoading(false)
  }

  const handleOpenReviewModal = (apt: Appointment) => {
    setReviewAppointment(apt)
    setRating(5)
    setComment("")
    setReviewModalOpen(true)
  }

  const handleAddReview = async () => {
    if (!reviewAppointment) return
    setIsSubmittingReview(true)
    const res = await addReviewAction({
      businessId: reviewAppointment.businessId,
      rating,
      comment,
      appointmentId: reviewAppointment.id
    })
    setIsSubmittingReview(false)
    if (res.success) {
      toast.success("Değerlendirmeniz için teşekkürler!")
      setReviewModalOpen(false)
    } else {
      toast.error(res.error || "Hata oluştu.")
    }
  }

  const generateCalendarUrl = (apt: any) => {
    if (!apt) return ""
    const start = new Date(`${apt.appointment_date}T${apt.start_time}`).toISOString().replace(/-|:|\.\d+/g, "")
    const duration = apt.total_duration_minutes || 30
    const end = new Date(new Date(`${apt.appointment_date}T${apt.start_time}`).getTime() + duration * 60000).toISOString().replace(/-|:|\.\d+/g, "")
    const title = `${apt.businesses?.name} Randevusu`
    const details = `Hizmetler: ${apt.appointment_services?.map((s: any) => s.services?.name).join(", ")}`
    const location = apt.businesses?.address || ""
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`
  }

  const handleRebook = (businessId: string, services: string) => {
    router.push(`/isletme/${businessId}`)
    toast.info("İşletme sayfasına yönlendirildiniz, buradan aynı hizmetleri seçebilirsiniz.")
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8 pb-10 p-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-8 w-24 bg-muted rounded-md" />
        </div>
        <div className="h-32 w-full bg-muted rounded-2xl" />
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 bg-muted rounded-md" />
            <div className="h-4 w-16 bg-muted rounded-md" />
          </div>
          <div className="h-24 w-full bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  const now = new Date().getTime()
  const upcoming = appointments.filter(a => (a.status === "Onaylandı" || a.status === "Bekliyor") && a.fullDate.getTime() > now).reverse()
  const past = appointments.filter(a => !upcoming.find(u => u.id === a.id))
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || ""

  return (
    <>
      {activeTab === "kesfet" && (
        <DiscoveryTab
          userName={userName}
          upcomingAppointment={upcoming[0]}
          onViewDetails={handleViewDetails}
        />
      )}
      {activeTab === "genel" && (
        <OverviewTab
          upcoming={upcoming}
          past={past}
          businesses={businesses}
          onNavigate={setActiveTab}
          onCancel={handleCancelAppointment}
          onJoinBusiness={handleJoinBusiness}
          onRebook={handleRebook}
          onLeave={handleLeaveBusiness}
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onViewDetails={handleViewDetails}
          onReview={handleOpenReviewModal}
          router={router}
        />
      )}
      {activeTab === "randevularim" && (
        <AppointmentsTab
          allAppointments={appointments}
          onCancel={handleCancelAppointment}
          onRebook={handleRebook}
          onViewDetails={handleViewDetails}
          onReview={handleOpenReviewModal}
        />
      )}
      {activeTab === "isletmelerim" && (
        <BusinessesTab
          businesses={businesses}
          onJoinBusiness={handleJoinBusiness}
          onLeave={handleLeaveBusiness}
          router={router}
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
        open={showDetails}
        onClose={() => setShowDetails(false)}
        loading={detailLoading}
        appointment={selectedAppointment}
        onCancel={handleCancelAppointment}
        generateCalendarUrl={generateCalendarUrl}
      />

      <ReviewModal
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        appointment={reviewAppointment}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        onAddReview={handleAddReview}
        isSubmitting={isSubmittingReview}
      />
    </>
  )
}
