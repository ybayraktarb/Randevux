"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { RxButton } from "../randevux/rx-button"
import { RxAvatar } from "../randevux/rx-avatar"
import {
    ChevronLeft,
    ChevronRight,
    Scissors,
    User,
    CalendarDays,
    CheckCircle2,
    Clock,
    ArrowRight,
    Info,
    AlertCircle,
    Star,
    Loader2,
    Sparkles,
    Ticket,
    ShieldCheck,
    Zap,
    TrendingUp,
    QrCode
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { DateCarousel } from "./DateCarousel"
import { TimeSlotPicker, type TimeSlot } from "./TimeSlotPicker"
import { BookingSummary } from "./BookingSummary"
import { getAvailableSlotsAction } from "@/app/actions/availability.actions"
import { createBookingAction } from "@/app/actions/booking.actions"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { getFamilyProfilesAction } from "@/app/actions/family.actions"
import { tr } from "date-fns/locale"
import { getActiveAnnouncementsAction, type BusinessAnnouncement } from "@/app/actions/announcement.actions"

interface Service {
    id: string
    name: string
    base_duration_minutes: number
    base_price: number
    category?: string
}

interface Staff {
    id: string
    name: string
    avatar_url?: string
    serviceIds: string[]
    expertiseLevel?: string
    calendarColor?: string
    averageRating?: number
}

interface BookingWizardProps {
    businessId: string
    businessName: string
    businessHours?: any[]
    initialServices: Service[]
    initialStaff: Staff[]
}

type Step = "profile" | "services" | "staff" | "datetime" | "confirm" | "success"

interface FamilyProfile {
    id: string
    full_name: string
    relationship: string
}

export function BookingWizard({
    businessId,
    businessName,
    businessHours = [],
    initialServices,
    initialStaff,
}: BookingWizardProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [step, setStep] = useState<Step>("profile")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedStaff, setSelectedStaff] = useState<string | "ANY" | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [customerNote, setCustomerNote] = useState("")
    const [familyProfiles, setFamilyProfiles] = useState<FamilyProfile[]>([])
    const [selectedProfileId, setSelectedProfileId] = useState<string | "ME">("ME")
    const [announcements, setAnnouncements] = useState<BusinessAnnouncement[]>([])

    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Pre-fill from URL and fetch family & announcements
    useEffect(() => {
        const servicesParam = searchParams.get("services")
        if (servicesParam) {
            setSelectedServices(servicesParam.split(","))
        }

        async function loadInitialData() {
            const [familyRes, annRes] = await Promise.all([
                getFamilyProfilesAction(),
                getActiveAnnouncementsAction(businessId)
            ])

            if (familyRes.success && familyRes.data) {
                setFamilyProfiles(familyRes.data)
            }
            if (annRes.success && annRes.data) {
                setAnnouncements(annRes.data)
            }
        }
        loadInitialData()
    }, [searchParams, businessId])

    // Memoized derived data
    const chosenServices = useMemo(() =>
        initialServices.filter(s => selectedServices.includes(s.id)),
        [selectedServices, initialServices])

    const matchedStaff = useMemo(() => {
        const filtered = initialStaff.filter(s => {
            const hasAll = selectedServices.every(id => s.serviceIds.includes(id))
            return hasAll
        })
        console.log("BookingWizard: Staff Filtering Details", {
            totalInitial: initialStaff.length,
            selectedServicesCount: selectedServices.length,
            matchedCount: filtered.length,
            allStaffIdsWithServices: initialStaff.map(s => ({ id: s.id, name: s.name, services: s.serviceIds }))
        })
        return filtered
    }, [selectedServices, initialStaff])

    const totalPrice = useMemo(() =>
        chosenServices.reduce((sum, s) => sum + Number(s.base_price), 0),
        [chosenServices])

    const availableDays = useMemo(() => {
        if (!businessHours || businessHours.length === 0) return [1, 2, 3, 4, 5, 6]
        return businessHours
            .filter(h => h.is_open)
            .map(h => h.day_of_week)
    }, [businessHours])

    const totalDuration = useMemo(() =>
        chosenServices.reduce((sum, s) => sum + s.base_duration_minutes, 0),
        [chosenServices])

    const chosenStaffName = useMemo(() => {
        if (selectedStaff === "ANY") return "Herhangi Biri"
        return initialStaff.find(s => s.id === selectedStaff)?.name
    }, [selectedStaff, initialStaff])

    // Fetch slots whenever date or staff/services change
    useEffect(() => {
        if (step === "datetime") {
            fetchSlots()
        }
    }, [selectedDate, selectedStaff, selectedServices, step])

    async function fetchSlots() {
        setLoadingSlots(true)
        setSelectedTime(null)
        try {
            const res = await getAvailableSlotsAction({
                businessId,
                date: format(selectedDate, "yyyy-MM-dd"),
                staffBusinessId: selectedStaff || "ANY",
                serviceIds: selectedServices
            })
            if (res.success && res.slots) {
                setSlots(res.slots as TimeSlot[])
            } else {
                setSlots([])
            }
        } catch (err) {
            toast.error("Müsait saatler yüklenirken bir hata oluştu.")
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleCreateBooking = async () => {
        if (!selectedTime) return
        setIsSubmitting(true)
        console.log("BookingWizard: Starting booking submission", {
            selectedStaff,
            selectedTime,
            selectedDate: format(selectedDate, "yyyy-MM-dd"),
            selectedServices
        })
        try {
            // Find the candidate staff ID if "ANY" is selected
            let finalStaffId = selectedStaff === "ANY" || !selectedStaff ? "" : selectedStaff

            if (selectedStaff === "ANY") {
                const currentSlot = slots.find(s => s.time === selectedTime)
                console.log("BookingWizard: Any Staff selected, found slot:", currentSlot)
                if (currentSlot?.staffId) {
                    finalStaffId = currentSlot.staffId
                } else {
                    console.error("BookingWizard: No staffId found for ANY slot")
                    toast.error("Bu saat dilimi için uygun personel bulunamadı.")
                    setIsSubmitting(false)
                    return
                }
            }

            console.log("BookingWizard: Final Staff ID for submission:", finalStaffId)

            if (!finalStaffId) {
                toast.error("Lütfen bir personel seçin.")
                setIsSubmitting(false)
                return
            }

            const payload = {
                businessId,
                staffBusinessId: finalStaffId,
                serviceIds: selectedServices,
                appointmentDate: format(selectedDate, "yyyy-MM-dd"),
                startTime: selectedTime,
                totalPrice,
                totalDuration,
                customerNote,
                familyProfileId: selectedProfileId === "ME" ? null : selectedProfileId
            }
            console.log("BookingWizard: Calling createBookingAction with payload:", payload)

            const res = await createBookingAction(payload)
            console.log("BookingWizard: createBookingAction response:", res)

            if (res.success) {
                toast.success("Randevunuz başarıyla oluşturuldu!")
                setStep("success")
            } else {
                console.error("BookingWizard: createBookingAction reported failure:", res.error)
                toast.error(res.error || "Randevu oluşturulamadı.")
            }
        } catch (err: any) {
            console.error("BookingWizard: Unexpected error in handleCreateBooking:", err)
            toast.error("Beklenmedik bir hata oluştu: " + (err.message || "Bilinmiyor"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const steps: { id: Step; label: string }[] = [
        { id: "profile", label: "Müşteri" },
        { id: "services", label: "Hizmet" },
        { id: "staff", label: "Uzman" },
        { id: "datetime", label: "Zaman" },
        { id: "confirm", label: "Onay" }
    ]

    const currentStepIndex = steps.findIndex(s => s.id === step)

    // --- Step Components ---


    const handleProfileComplete = () => {
        if (selectedServices.length > 0) {
            setStep("staff")
        } else {
            setStep("services")
        }
    }

    const handleStaffBack = () => {
        const servicesParam = searchParams.get("services")
        if (servicesParam) {
            // If they came from storefront with services, go back to profile (skip services selection)
            setStep("profile")
        } else {
            setStep("services")
        }
    }

    // --- Step Components ---

    const ProfileStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <User className="size-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Kimin İçin?</h2>
                    <p className="text-muted-foreground text-sm font-medium">Randevu kimin adına oluşturulacak?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={() => setSelectedProfileId("ME")}
                    className={cn(
                        "flex items-center gap-4 p-6 rounded-[32px] border transition-all duration-300 group",
                        selectedProfileId === "ME" ? "bg-primary border-primary shadow-xl shadow-primary/10 text-white" : "bg-card border-border hover:border-primary/50"
                    )}
                >
                    <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all", selectedProfileId === "ME" ? "bg-white/20" : "bg-primary/10 text-primary")}>
                        <User className="size-7" />
                    </div>
                    <div className="text-left">
                        <p className="font-black text-lg leading-none mb-1">Kendim İçin</p>
                        <p className={cn("text-xs font-bold", selectedProfileId === "ME" ? "text-white/60" : "text-muted-foreground")}>Kendi adıma randevu alıyorum</p>
                    </div>
                </button>

                {familyProfiles.map(profile => (
                    <button
                        key={profile.id}
                        onClick={() => setSelectedProfileId(profile.id)}
                        className={cn(
                            "flex items-center gap-4 p-6 rounded-[32px] border transition-all duration-300 group",
                            selectedProfileId === profile.id ? "bg-primary border-primary shadow-xl shadow-primary/10 text-white" : "bg-card border-border hover:border-primary/50"
                        )}
                    >
                        <div className={cn("size-14 rounded-2xl flex items-center justify-center transition-all", selectedProfileId === profile.id ? "bg-white/20" : "bg-blue-500/10 text-blue-500")}>
                            <RxAvatar name={profile.full_name} size="md" />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-lg leading-none mb-1">{profile.full_name}</p>
                            <p className={cn("text-xs font-bold", selectedProfileId === profile.id ? "text-white/60" : "text-muted-foreground")}>{profile.relationship}</p>
                        </div>
                    </button>
                ))}
            </div>

            <div className="pt-8 flex justify-end">
                <RxButton
                    onClick={handleProfileComplete}
                    className="rounded-full px-10 h-14 text-lg font-bold gap-2 shadow-2xl shadow-primary/30"
                >
                    Devam Et <ChevronRight className="size-5" />
                </RxButton>
            </div>
        </div>
    )

    const ServicesStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Scissors className="size-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Hizmet Seçimi</h2>
                    <p className="text-muted-foreground text-sm font-medium">Almak istediğiniz hizmetleri işaretleyin</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {initialServices.map((service) => {
                    const isSelected = selectedServices.includes(service.id)
                    return (
                        <button
                            key={service.id}
                            onClick={() => {
                                setSelectedServices(prev =>
                                    isSelected ? prev.filter(id => id !== service.id) : [...prev, service.id]
                                )
                            }}
                            className={cn(
                                "flex items-center justify-between p-5 rounded-3xl border transition-all duration-300 text-left group",
                                isSelected
                                    ? "bg-primary border-primary shadow-xl shadow-primary/10"
                                    : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            <div className="flex flex-col gap-1">
                                <span className={cn("text-lg font-bold", isSelected ? "text-primary-foreground" : "text-foreground group-hover:text-primary")}>
                                    {service.name}
                                </span>
                                <span className={cn("text-sm font-medium flex items-center gap-1.5", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    <Clock className="size-3.5" />
                                    {service.base_duration_minutes} dakika
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={cn("text-xl font-black", isSelected ? "text-primary-foreground" : "text-primary")}>
                                    {service.base_price} TL
                                </span>
                                <div className={cn(
                                    "size-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    isSelected ? "bg-primary-foreground border-primary-foreground" : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}>
                                    {isSelected && <ArrowRight className="size-4 text-primary" />}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            <div className="pt-8 flex justify-between">
                <RxButton variant="ghost" onClick={() => setStep("profile")} className="rounded-full px-8 h-14 font-bold gap-2">
                    <ChevronLeft className="size-5" /> Geri
                </RxButton>
                <RxButton
                    disabled={selectedServices.length === 0}
                    onClick={() => setStep("staff")}
                    className="rounded-full px-10 h-14 text-lg font-bold gap-2 shadow-2xl shadow-primary/30"
                >
                    Devam Et <ChevronRight className="size-5" />
                </RxButton>
            </div>
        </div>
    )

    const StaffStep = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <User className="size-6 text-blue-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Uzman Seçimi</h2>
                    <p className="text-muted-foreground text-sm font-medium">Randevunuzu kiminle planlayalım?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Any Staff Option */}
                <button
                    onClick={() => setSelectedStaff("ANY")}
                    className={cn(
                        "flex flex-col items-center justify-center p-8 rounded-3xl border transition-all duration-300 gap-4 group",
                        selectedStaff === "ANY"
                            ? "bg-primary border-primary shadow-xl shadow-primary/10"
                            : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                    )}
                >
                    <div className={cn(
                        "size-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110",
                        selectedStaff === "ANY" ? "bg-primary-foreground/20" : "bg-muted"
                    )}>
                        <User className={cn("size-10", selectedStaff === "ANY" ? "text-primary-foreground" : "text-muted-foreground")} />
                    </div>
                    <div className="text-center">
                        <p className={cn("text-lg font-bold", selectedStaff === "ANY" ? "text-primary-foreground" : "text-foreground")}>Herhangi Biri</p>
                        <p className={cn("text-sm", selectedStaff === "ANY" ? "text-primary-foreground/70" : "text-muted-foreground")}>Uygun olan personel atansın</p>
                    </div>
                </button>

                {/* Individual Staff */}
                {matchedStaff.map((staff) => {
                    const isSelected = selectedStaff === staff.id

                    return (
                        <button
                            key={staff.id}
                            onClick={() => setSelectedStaff(staff.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-8 rounded-3xl border transition-all duration-300 gap-4 group relative overflow-hidden",
                                isSelected
                                    ? "bg-primary border-primary shadow-xl shadow-primary/10"
                                    : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                            )}
                        >
                            {/* Color Strip */}
                            <div
                                className="absolute top-0 left-0 right-0 h-1.5 opacity-60"
                                style={{ backgroundColor: staff.calendarColor || '#3b82f6' }}
                            />

                            <div className="relative">
                                <RxAvatar name={staff.name} size="lg" />
                                {isSelected && (
                                    <div className="absolute -bottom-1 -right-1 bg-primary-foreground rounded-full p-1 border-2 border-primary">
                                        <ArrowRight className="size-4 text-primary" />
                                    </div>
                                )}
                            </div>
                            <div className="text-center">
                                <p className={cn("text-lg font-bold", isSelected ? "text-primary-foreground" : "text-foreground")}>{staff.name}</p>

                                <div className="flex flex-col items-center gap-1.5 mt-1">
                                    {staff.expertiseLevel && (
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                            isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            {staff.expertiseLevel}
                                        </span>
                                    )}

                                    {staff.averageRating !== undefined && staff.averageRating > 0 && (
                                        <div className={cn(
                                            "flex items-center gap-1 text-xs font-bold",
                                            isSelected ? "text-primary-foreground" : "text-amber-500"
                                        )}>
                                            <Star className={cn("size-3", isSelected ? "fill-primary-foreground" : "fill-amber-500")} />
                                            {staff.averageRating}
                                        </div>
                                    )}

                                    {!staff.expertiseLevel && (
                                        <p className={cn("text-sm", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                            Uzman Personel
                                        </p>
                                    )}
                                </div>
                            </div>
                        </button>
                    )
                })}

                {selectedServices.length > 0 && matchedStaff.length === 0 && (
                    <div className="sm:col-span-2 p-12 text-center border-2 border-dashed border-red-200 rounded-3xl bg-red-50/30">
                        <AlertCircle className="size-12 text-red-400 mx-auto mb-4 opacity-50" />
                        <p className="font-bold text-lg text-red-900">Uygun Personel Bulunamadı</p>
                        <p className="text-red-700/70 text-sm mt-2 max-w-sm mx-auto">
                            Seçtiğiniz hizmetlerin tamamını aynı anda sunabilen bir uzmanımız bulunmuyor.
                            Lütfen hizmet sayısını azaltmayı veya hizmetleri ayrı ayrı randevu alarak planlamayı deneyin.
                        </p>
                    </div>
                )}

                {initialStaff.length === 0 && (
                    <div className="sm:col-span-2 p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                        <User className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg">Bu işletmeye tanımlı uzman bulunamadı.</p>
                        <p className="text-muted-foreground text-sm mt-2">Lütfen daha sonra tekrar deneyin veya işletme ile iletişime geçin.</p>
                    </div>
                )}
            </div>

            <div className="pt-8 flex justify-between">
                <RxButton variant="ghost" onClick={handleStaffBack} className="rounded-full px-8 h-14 font-bold gap-2">
                    <ChevronLeft className="size-5" /> Geri
                </RxButton>
                <RxButton
                    disabled={!selectedStaff}
                    onClick={() => setStep("datetime")}
                    className="rounded-full px-10 h-14 text-lg font-bold gap-2 shadow-2xl shadow-primary/30"
                >
                    Devam Et <ChevronRight className="size-5" />
                </RxButton>
            </div>
        </div>
    )

    const DateTimeStep = () => (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                    <CalendarDays className="size-6 text-purple-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Tarih & Saat Seçimi</h2>
                    <p className="text-muted-foreground text-sm font-medium">Sizin için en uygun zamanı belirleyin</p>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Randevu Günü</p>
                <DateCarousel
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    availableDays={availableDays}
                    daysCount={60} // Extended from 30 to 60
                />
            </div>

            <div className="space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Müsait Saat Dilimleri</p>
                <TimeSlotPicker
                    slots={slots}
                    selectedTime={selectedTime}
                    onTimeSelect={setSelectedTime}
                    loading={loadingSlots}
                />
            </div>

            <div className="pt-8 flex justify-between">
                <RxButton variant="ghost" onClick={() => setStep("staff")} className="rounded-full px-8 h-14 font-bold gap-2">
                    <ChevronLeft className="size-5" /> Geri
                </RxButton>
                <RxButton
                    disabled={!selectedTime}
                    onClick={() => setStep("confirm")}
                    className="rounded-full px-10 h-14 text-lg font-bold gap-2 shadow-2xl shadow-primary/30"
                >
                    İncele & Onayla <ChevronRight className="size-5" />
                </RxButton>
            </div>
        </div>
    )

    const ConfirmStep = () => (
        <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-8">
                <div className="size-16 rounded-[24px] bg-primary/10 flex items-center justify-center shadow-inner">
                    <Ticket className="size-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Son Onay</h2>
                    <p className="text-gray-400 text-sm font-black uppercase tracking-widest">Randevu DetaylarInIz HazIr</p>
                </div>
            </div>

            <div className="relative group">
                {/* 🎟️ Premium Digital Ticket Design */}
                <div className="bg-[#F8FAFC] border-2 border-dashed border-gray-200 rounded-[48px] p-10 md:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                        <Sparkles className="size-48 text-primary rotate-12" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 relative z-10">
                        <div className="space-y-10">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Seçilen Hizmetler</p>
                                <div className="space-y-4">
                                    {chosenServices.map(s => (
                                        <div key={s.id} className="flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-primary" />
                                            <span className="text-lg font-bold text-gray-800">{s.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <RxAvatar name={chosenStaffName || ""} size="lg" className="size-20 rounded-[28px] shadow-2xl shadow-primary/10 border-4 border-white" />
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Uzman</p>
                                    <p className="text-xl font-black text-gray-900">{chosenStaffName}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="bg-white p-8 rounded-[36px] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center gap-6">
                                <div className="size-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <CalendarDays className="size-8" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Tarih & Saat</p>
                                    <p className="text-lg font-black text-gray-900">{format(selectedDate, "d MMMM yyyy", { locale: tr })}</p>
                                    <p className="text-2xl font-black text-primary leading-none">{selectedTime}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">İşletme Notu Ekle</p>
                                <textarea
                                    value={customerNote}
                                    onChange={(e) => setCustomerNote(e.target.value)}
                                    placeholder="Eklemek istediğiniz özel bir istek var mı?..."
                                    className="w-full min-h-[140px] bg-white rounded-[32px] border-2 border-gray-100 p-6 text-sm font-bold text-gray-800 focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-gray-300 resize-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 p-6 bg-blue-50/50 rounded-[32px] border border-blue-100/50">
                <Zap className="size-6 text-blue-500 shrink-0" />
                <p className="text-xs text-blue-700/80 font-bold leading-relaxed">
                    Randevuyu tamamladığınızda anında onay bildirimi alacaksınız. Unutmayın, randevuya zamanında gelmeniz hizmet kalitemiz için önemlidir.
                </p>
            </div>

            <div className="pt-8 flex justify-between items-center">
                <RxButton variant="ghost" onClick={() => setStep("datetime")} className="rounded-2xl px-10 h-16 font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="size-5 mr-2" /> Geri Dön
                </RxButton>
                <RxButton
                    disabled={isSubmitting}
                    onClick={handleCreateBooking}
                    className="rounded-[24px] px-14 h-20 text-sm font-black uppercase tracking-[0.2em] gap-4 shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 flex items-center"
                >
                    {isSubmitting ? (
                        <><Loader2 className="size-6 animate-spin" /> İŞLENİYOR...</>
                    ) : (
                        <>ONAYLA VE BİTİR <ArrowRight className="size-6" /></>
                    )}
                </RxButton>
            </div>
        </div>
    )

    const SuccessStep = () => (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500 text-center">
            <div className="size-32 rounded-full bg-green-500/10 flex items-center justify-center mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />
                <CheckCircle2 className="size-16 text-green-500 relative z-10" />
            </div>
            <h2 className="text-4xl font-black mb-4">Mükemmel! 🎉</h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-md">
                {businessName} işletmesindeki randevunuz başarıyla oluşturuldu. Sizi bekliyoruz!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                <RxButton
                    onClick={() => router.push("/randevularim")}
                    className="flex-1 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20"
                >
                    Randevularımı Gör
                </RxButton>
                <RxButton
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="flex-1 h-14 text-lg font-bold rounded-2xl border-2"
                >
                    Ana Sayfaya Dön
                </RxButton>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-32 selection:bg-primary/10">
            {step !== "success" && (
                <div className="max-w-7xl mx-auto px-6 py-12">
                    {/* 🎓 Premium Progress Bar */}
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-8 px-2">
                            {steps.map((s, idx) => (
                                <div key={s.id} className="flex flex-col items-center gap-3 group relative">
                                    <div className={cn(
                                        "size-12 rounded-2xl flex items-center justify-center transition-all duration-500 font-black text-sm",
                                        idx < currentStepIndex ? "bg-green-500 text-white shadow-lg shadow-green-500/20" :
                                            idx === currentStepIndex ? "bg-primary text-white shadow-xl shadow-primary/20 scale-110" :
                                                "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                                    )}>
                                        {idx < currentStepIndex ? <CheckCircle2 className="size-5" /> : idx + 1}
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                                        idx <= currentStepIndex ? "text-gray-900" : "text-gray-300"
                                    )}>{s.label}</span>

                                    {idx < steps.length - 1 && (
                                        <div className="absolute top-6 left-[calc(100%+8px)] w-[calc(100vw/5-80px)] hidden lg:block h-0.5 bg-gray-100 overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: idx < currentStepIndex ? "100%" : "0%" }}
                                                className="h-full bg-green-500"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-16 items-start">
                        {/* Main Step Area */}
                        <div className="lg:col-span-8 w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: "circOut" }}
                                    className="bg-white rounded-[48px] border border-gray-50 p-10 md:p-16 shadow-2xl shadow-gray-200/40 min-h-[500px]"
                                >
                                    {/* Announcements Section */}
                                    {announcements.length > 0 && step !== "confirm" && (
                                        <div className="mb-12">
                                            <AnnouncementBanner announcements={announcements} />
                                        </div>
                                    )}

                                    {step === "profile" && <ProfileStep />}
                                    {step === "services" && <ServicesStep />}
                                    {step === "staff" && <StaffStep />}
                                    {step === "datetime" && <DateTimeStep />}
                                    {step === "confirm" && <ConfirmStep />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Sidebar Summary Area */}
                        <div className="lg:col-span-4 w-full sticky top-32">
                            <div className="space-y-8">
                                <BookingSummary
                                    businessName={businessName}
                                    services={chosenServices.map(s => ({
                                        name: s.name,
                                        duration: s.base_duration_minutes,
                                        price: Number(s.base_price)
                                    }))}
                                    staffName={chosenStaffName}
                                    date={selectedDate}
                                    time={selectedTime || undefined}
                                    totalPrice={totalPrice}
                                    totalDuration={totalDuration}
                                />

                                <div className="p-8 bg-gray-50 rounded-[40px] border border-gray-100/50 space-y-4">
                                    <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                                        <ShieldCheck className="size-4" />
                                        Güvendesiniz
                                    </h4>
                                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                        RandevuX altyapısıyla tüm randevularınız koruma altındadır. İptal politikasını ödeme ekranında görebilirsiniz.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === "success" && <SuccessStep />}
        </div>
    )
}


/**
 * Müşteri için şık bir kampanya/duyuru banner'ı
 */
function AnnouncementBanner({ announcements }: { announcements: BusinessAnnouncement[] }) {
    // Birden fazla varsa en yüksek önelikliyi veya en yeniyi gösterelim (şimdilik listeleyelim)
    return (
        <div className="flex flex-col gap-3">
            {announcements.map((ann) => (
                <div
                    key={ann.id}
                    className="relative overflow-hidden group rounded-[32px] bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/20 p-6 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="size-20 text-primary rotate-12" />
                    </div>

                    <div className="relative z-10 flex items-start gap-4">
                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <QrCode className="size-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-black text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                                {ann.title}
                            </h4>
                            <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                {ann.content}
                            </p>
                            {ann.end_date && (
                                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/10 text-[10px] font-black uppercase tracking-widest text-primary">
                                    <Clock className="size-3" />
                                    Son Tarih: {new Date(ann.end_date).toLocaleDateString("tr-TR")}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}

