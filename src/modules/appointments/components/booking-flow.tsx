"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { RxButton } from "@/src/modules/core/components/rx-button"
import { getAvailableSlotsAction, TimeSlot } from "@/src/modules/appointments/actions/availability.actions"
import { createManualAppointmentAction } from "@/src/modules/appointments/actions/appointment.actions"
import { getFamilyProfilesAction } from "@/src/modules/customers/actions/family.actions"

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
}: {
  businessId: string
  businessName: string
  initialServices: Service[]
  initialStaff: Staff[]
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [note, setNote] = useState("")
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [fetchStatus, setFetchStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [familyProfiles, setFamilyProfiles] = useState<any[]>([])
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
    if (res.success && res.slots) {
      setTimeSlots(res.slots)
      setFetchStatus("success")
    } else {
      toast.error(res.error || "Musaitlik yuklenemedi")
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
    const res = await createManualAppointmentAction({
      businessId,
      staffBusinessId: selectedStaff === "ANY" ? undefined : selectedStaff,
      serviceIds: selectedServices,
      date: selectedDate,
      startTime: selectedTime,
      note,
      familyProfileId: selectedFamilyId || undefined
    })
    setIsSubmitting(false)
    if (res.success) {
      setIsSuccess(true)
    } else {
      toast.error(res.error || "Randevu olusturulurken hata olustu")
    }
  }

  if (isSuccess) return <SuccessState router={router} />

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors cursor-pointer">
              <ChevronLeft className="size-5" />
            </button>
          )}
          <h1 className="text-lg font-bold text-foreground">{businessName}</h1>
        </div>
        <button onClick={() => router.back()} className="text-sm font-medium text-muted-foreground hover:text-foreground">
          Iptal
        </button>
      </div>

      <StepIndicator current={step} />

      <div className="flex-1 px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
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
