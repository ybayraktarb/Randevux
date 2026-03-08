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
    Info
} from "lucide-react"
import { DateCarousel } from "./DateCarousel"
import { TimeSlotPicker, type TimeSlot } from "./TimeSlotPicker"
import { BookingSummary } from "./BookingSummary"
import { getAvailableSlotsAction } from "@/app/actions/availability.actions"
import { createBookingAction } from "@/app/actions/booking.actions"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import { getFamilyProfilesAction } from "@/app/actions/family.actions"

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
}

interface BookingWizardProps {
    businessId: string
    businessName: string
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

    const [slots, setSlots] = useState<TimeSlot[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Pre-fill from URL and fetch family
    useEffect(() => {
        const servicesParam = searchParams.get("services")
        if (servicesParam) {
            setSelectedServices(servicesParam.split(","))
        }

        async function loadFamily() {
            const res = await getFamilyProfilesAction()
            if (res.success && res.data) {
                setFamilyProfiles(res.data)
            }
        }
        loadFamily()
    }, [searchParams])

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
        try {
            const res = await createBookingAction({
                businessId,
                staffBusinessId: selectedStaff === "ANY" || !selectedStaff ? "" : selectedStaff,
                serviceIds: selectedServices,
                appointmentDate: format(selectedDate, "yyyy-MM-dd"),
                startTime: selectedTime,
                totalPrice,
                totalDuration,
                customerNote,
                familyProfileId: selectedProfileId === "ME" ? null : selectedProfileId
            })

            if (res.success) {
                setStep("success")
            } else {
                toast.error(res.error || "Randevu oluşturulamadı.")
            }
        } catch (err) {
            toast.error("Beklenmedik bir hata oluştu.")
        } finally {
            setIsSubmitting(false)
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
                    onClick={() => setStep("services")}
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

            <div className="pt-8 flex justify-end">
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
                {initialStaff.map((staff) => {
                    const isSelected = selectedStaff === staff.id
                    const canProvideServices = selectedServices.every(id => staff.serviceIds.includes(id))

                    return (
                        <button
                            key={staff.id}
                            disabled={!canProvideServices}
                            onClick={() => setSelectedStaff(staff.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-8 rounded-3xl border transition-all duration-300 gap-4 group relative",
                                isSelected
                                    ? "bg-primary border-primary shadow-xl shadow-primary/10"
                                    : canProvideServices
                                        ? "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                                        : "bg-muted/50 border-border/50 opacity-60 grayscale cursor-not-allowed"
                            )}
                        >
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
                                <p className={cn("text-sm", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                                    {canProvideServices ? "Uzman Personel" : "Seçili hizmetleri vermiyor"}
                                </p>
                            </div>

                            {!canProvideServices && (
                                <div className="absolute top-4 right-4 group-hover:block hidden">
                                    <div className="bg-foreground/90 text-white text-[10px] py-1 px-2 rounded-lg backdrop-blur-sm">
                                        Hizmet Eksik
                                    </div>
                                </div>
                            )}
                        </button>
                    )
                })}

                {initialStaff.length === 0 && (
                    <div className="sm:col-span-2 p-12 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                        <User className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="font-bold text-lg">Bu işletmeye tanımlı uzman bulunamadı.</p>
                        <p className="text-muted-foreground text-sm mt-2">Lütfen daha sonra tekrar deneyin veya işletme ile iletişime geçin.</p>
                    </div>
                )}
            </div>

            <div className="pt-8 flex justify-between">
                <RxButton variant="ghost" onClick={() => setStep("services")} className="rounded-full px-8 h-14 font-bold gap-2">
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
                <DateCarousel selectedDate={selectedDate} onDateSelect={setSelectedDate} />
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
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <Info className="size-6 text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-black">Son Kontrol</h2>
                    <p className="text-muted-foreground text-sm font-medium">Lütfen bilgileri onaylayın</p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-muted/30 rounded-3xl p-6 border border-border">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary" />
                        Personel Notunuz
                    </h3>
                    <textarea
                        value={customerNote}
                        onChange={(e) => setCustomerNote(e.target.value)}
                        placeholder="Eklemek istediğiniz bir not var mı? (Örn: Alerjim var, saçım çok uzun vb.)"
                        className="w-full min-h-[120px] bg-background rounded-2xl border border-border p-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Info className="size-5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Randevunuzun süresi seçtiğiniz hizmetlere göre otomatik hesaplanmıştır.
                        Lütfen zamanında gelmeye özen gösteriniz.
                    </p>
                </div>
            </div>

            <div className="pt-8 flex justify-between">
                <RxButton variant="ghost" onClick={() => setStep("datetime")} className="rounded-full px-8 h-14 font-bold gap-2">
                    <ChevronLeft className="size-5" /> Geri
                </RxButton>
                <RxButton
                    disabled={isSubmitting}
                    onClick={handleCreateBooking}
                    className="rounded-full px-12 h-14 text-lg font-bold gap-2 shadow-2xl shadow-primary/40 bg-primary hover:bg-primary-dark"
                >
                    {isSubmitting ? (
                        <><Loader2 className="size-5 animate-spin" /> İşleniyor...</>
                    ) : (
                        <>Randevuyu Tamamla <CheckCircle2 className="size-5" /></>
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
        <div className="container max-w-6xl mx-auto py-10 px-4 md:px-0">
            {step !== "success" && (
                <div className="flex flex-col lg:flex-row gap-10 items-start">
                    {/* Main Wizard Area */}
                    <div className="flex-1 w-full bg-card rounded-[40px] border border-border/50 p-8 md:p-12 shadow-2xl shadow-foreground/5 min-h-[600px]">
                        {/* Header / Info */}
                        <div className="mb-12 flex justify-between items-center bg-muted/30 p-4 rounded-3xl md:hidden">
                            <span className="font-bold text-primary">{businessName}</span>
                            <span className="text-xs text-muted-foreground uppercase font-black tracking-widest">{step}</span>
                        </div>

                        {step === "profile" && <ProfileStep />}
                        {step === "services" && <ServicesStep />}
                        {step === "staff" && <StaffStep />}
                        {step === "datetime" && <DateTimeStep />}
                        {step === "confirm" && <ConfirmStep />}
                    </div>

                    {/* Sticky Summary Area */}
                    <div className="w-full lg:w-[380px] shrink-0">
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

                        <div className="mt-8 p-6 bg-muted/40 rounded-3xl border border-border/50">
                            <h4 className="font-bold flex items-center gap-2 mb-3">
                                <Info className="size-4 text-muted-foreground" />
                                İptal Politikası
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                İşletmemiz randevuya son 24 saat kalana kadar ücretsiz iptale izin vermektedir.
                                Bu süreden sonraki iptallerde işletme politikası uygulanabilir.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {step === "success" && <SuccessStep />}
        </div>
    )
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("animate-spin", className)}
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
