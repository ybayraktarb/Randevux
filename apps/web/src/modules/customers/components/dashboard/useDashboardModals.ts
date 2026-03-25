import { useState } from "react"
import { toast } from "sonner"
import { getAppointmentDetailsAction } from "@/src/modules/appointments/actions/appointment.actions"
import { addReviewAction } from "@/src/modules/business/actions/business.actions"
import { Appointment } from "./types"

export function useDashboardModals() {
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
      toast.error(res.error?.message || "Randevu detayları yüklenemedi.")
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
      toast.error("İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin.")
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

  return {
    details: {
      open: showDetails,
      setOpen: setShowDetails,
      appointment: selectedAppointment,
      loading: detailLoading,
      handleViewDetails,
      generateCalendarUrl,
    },
    review: {
      open: reviewModalOpen,
      setOpen: setReviewModalOpen,
      appointment: reviewAppointment,
      rating,
      setRating,
      comment,
      setComment,
      isSubmitting: isSubmittingReview,
      handleOpenReviewModal,
      handleAddReview,
    }
  }
}
