"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { RxButton } from "@/src/modules/core/components/rx-button"
import { getAvailableSlotsAction } from "@/src/modules/appointments/actions/availability.actions"
import { TimeSlot } from "@/src/modules/appointments/types"
import { createBookingAction } from "@/src/modules/appointments/actions/booking.actions"
import { getFamilyProfilesAction } from "@/src/modules/customers/actions/family.actions"
import { FamilyProfileRecord as FamilyProfile } from "@/src/modules/customers/types"

// Booking Modules
import { StepIndicator } from "./booking/StepIndicator"
import { StepServices } from "./booking/StepServices"
import { StepStaff } from "./booking/StepStaff"
import { StepDateTime } from "./booking/StepDateTime"
import { StepSummary } from "./booking/StepSummary"
import { SuccessState } from "./booking/SuccessState"
import { Service, Staff } from "./booking/types"

export function BookingFlow({
  businessId,
  businessName,
  initialServices,
  initialStaff,
  initialSelectedServices = [],
  initialSelectedStaff = null,
}: {
  businessId: string
  businessName: string
  initialServices: Service[]
  initialStaff: Staff[]
  initialSelectedServices?: string[]
  initialSelectedStaff?: string | null
}) {
  const router = useRouter()
  const [step, setStep] = useState(() => {
    if (initialSelectedServices.length > 0) {
      return initialSelectedStaff ? 2 : 1
    }
    return 0
  })
  const [selectedServices, setSelectedServices] = useState<string[]>(initialSelectedServices)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(initialSelectedStaff)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [note, setNote] = useState("")
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([])
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)

  useEffect(() => {
    getFamilyProfilesAction().then(res => {
      if (res.success) setFamilyProfiles(res.data || [])
    })
  }, [])

  useEffect(() => {
    if (step === 2 && selectedStaff) {
      fetchAvailability()
    }
  }, [step, selectedDate, selectedStaff])

  const fetchAvailability = async () => {
    setFetchStatus("loading")
    setSelectedTime(null)
    const res = await getAvailableSlotsAction({
      businessId,
      date: selectedDate.toISOString().split("T")[0],
      staffBusinessId: selectedStaff || "ANY",
      serviceIds: selectedServices,
    })
    if (res.success) {
      if (res.data) setTimeSlots(res.data)
      setFetchStatus("success")
    } else {
      toast.error(res.error.message || "Musaitlik yuklenemedi")
      setFetchStatus("error")
    }
  }

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => Math.max(0, prev - 1))

  const handleConfirm = async () => {
    if (!selectedTime) return
    setIsSubmitting(true)
    
    const selectedSvcs = initialServices.filter(s => selectedServices.includes(s.id))
    const totalPrice = selectedSvcs.reduce((acc, s) => acc + s.price, 0)
    const totalDuration = selectedSvcs.reduce((acc, s) => acc + s.duration, 0)

    const res = await createBookingAction({
      businessId,
      staffBusinessId: (selectedStaff === "ANY" || !selectedStaff) 
        ? (timeSlots.find(s => s.time === selectedTime)?.staffId || "")
        : selectedStaff,
      serviceIds: selectedServices,
      appointmentDate: selectedDate.toISOString().split("T")[0],
      startTime: selectedTime,
      totalPrice,
      totalDuration,
      customerNote: note,
      familyProfileId: selectedFamilyId,
    })

    if (res.success) {
      setIsSuccess(true)
    } else {
      toast.error(res.error?.message || "Randevu olusturulurken bir hata olustu")
    }
    setIsSubmitting(false)
  }

  if (isSuccess) return <SuccessState router={router} />

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header kaldırıldı - AppShellLayout kullanılıyor */}

      <StepIndicator current={step} />

      <div className="flex-1 px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.23, 1, 0.32, 1] // Apple-style ease out
            }}
          >
            {step === 0 && (
              <StepServices
                services={initialServices}
                selected={selectedServices}
                onToggle={toggleService}
                onNext={handleNext}
              />
            )}
            {step === 1 && (
              <StepStaff
                services={initialServices}
                staffList={initialStaff}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                onSelectStaff={(id) => {
                  setSelectedStaff(id)
                  if (id) handleNext()
                }}
              />
            )}
            {step === 2 && (
              <StepDateTime
                fetchStatus={fetchStatus}
                services={initialServices}
                staffList={initialStaff}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onSelectDate={setSelectedDate}
                onSelectTime={(t) => {
                  setSelectedTime(t)
                  handleNext()
                }}
                timeSlots={timeSlots}
              />
            )}
            {step === 3 && (
              <StepSummary
                businessName={businessName}
                services={initialServices}
                staffList={initialStaff}
                selectedServices={selectedServices}
                selectedStaff={selectedStaff}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                note={note}
                onNoteChange={setNote}
                familyProfiles={familyProfiles}
                selectedFamilyId={selectedFamilyId}
                onFamilySelect={setSelectedFamilyId}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {step === 3 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-card border-t border-border z-30">
          <RxButton
            className="w-full h-12 text-base font-bold"
            onClick={handleConfirm}
            disabled={isSubmitting || !selectedTime}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Randevu Olusturuluyor...
              </div>
            ) : (
              "Randevuyu Onayla"
            )}
          </RxButton>
        </div>
      )}
    </div>
  )
}
