"use client"

import { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
    MapPin,
    Phone,
    Clock,
    UserPlus,
    Plus,
    Check,
    ArrowRight,
    Star,
    Loader2,
    Heart,
    Share2,
    ChevronLeft,
    Navigation,
    CalendarCheck2
} from "lucide-react"
import { RxButton } from "../randevux/rx-button"
import { RxAvatar } from "../randevux/rx-avatar"
import { RxBadge } from "../randevux/rx-badge"
import { RxModal } from "../randevux/rx-modal"
import { useParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { toggleFavoriteAction } from "@/app/actions/business.actions"
import { AIChatAssistant } from "./AIChatAssistant"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface Business {
    id: string
    name: string
    category: string
    address: string
    phone: string
    logo_url?: string
    description?: string
    isFavorite: boolean
    isConnected: boolean
    averageRating: number
    reviewCount: number
    features?: string[]
}

interface Service {
    id: string
    name: string
    duration: string
    price: number
    priceLabel: string
    category: string
    rawDuration: number
}

interface StaffMember {
    id: string
    name: string
    specialty: string
    avatar_url?: string
    rating: string
    online: boolean
}

interface WorkingDay {
    day: string
    hours: string
    isClosed: boolean
    dayOfWeek: number
}

interface Review {
    id: string
    userName: string
    avatarUrl?: string
    rating: number
    comment: string
    createdAt: string
}

interface BusinessStorefrontModernProps {
    initialData: {
        business: Business
        services: Service[]
        staff: StaffMember[]
        workingHours: WorkingDay[]
        reviews: Review[]
    }
}

export function BusinessStorefrontModern({ initialData }: BusinessStorefrontModernProps) {
    const router = useRouter()
    const { user } = useCurrentUser()
    const { business, services, staff, workingHours, reviews } = initialData

    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
    const [isFavorite, setIsFavorite] = useState(business.isFavorite)
    const [activeCategory, setActiveCategory] = useState<string>("Tümü")
    const [activeMainTab, setActiveMainTab] = useState<"services" | "info" | "reviews">("services")
    const [isScrolled, setIsScrolled] = useState(false)

    // Geolocation mock or logic could go here
    const distance = "1.2 km"

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 200)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const categories = useMemo(() => {
        const cats = new Set<string>()
        services.forEach(s => cats.add(s.category))
        return ["Tümü", ...Array.from(cats)].sort()
    }, [services])

    const filteredServices = useMemo(() => {
        if (activeCategory === "Tümü") return services
        return services.filter(s => s.category === activeCategory)
    }, [activeCategory, services])

    const toggleService = (id: string) => {
        setSelectedServices(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleToggleFavorite = async () => {
        if (!user) {
            toast.error("Favorilere eklemek için giriş yapmalısınız.")
            return
        }
        const res = await toggleFavoriteAction(business.id)
        if (res.success) {
            setIsFavorite(res.isFavorite || false)
            toast.success(res.isFavorite ? "Favorilere eklendi." : "Favorilerden çıkarıldı.")
        }
    }

    const handleBooking = () => {
        if (selectedServices.size === 0) {
            // Scroll to services if none selected
            const el = document.getElementById("services-section")
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            toast.info("Lütfen bir hizmet seçin.")
            return
        }
        const svcArray = Array.from(selectedServices).join(",")
        router.push(`/randevu-al?business_id=${business.id}&services=${svcArray}`)
    }

    const selectedList = services.filter((s) => selectedServices.has(s.id))
    const totalPrice = selectedList.reduce((sum, s) => sum + s.price, 0)
    const totalDuration = selectedList.reduce((sum, s) => sum + s.rawDuration, 0)

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header Image Section */}
            <div className="relative h-[300px] md:h-[400px] w-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8FAFC]" />
                <img
                    src={business.logo_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200"}
                    alt={business.name}
                    className="h-full w-full object-cover"
                />

                {/* Top Actions */}
                <div className="absolute top-6 inset-x-6 flex items-center justify-between z-20">
                    <button
                        onClick={() => router.back()}
                        className="size-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all"
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleFavorite}
                            className={cn(
                                "size-12 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all",
                                isFavorite
                                    ? "bg-red-500 border-red-500 text-white"
                                    : "bg-white/20 border-white/20 text-white hover:bg-white/30"
                            )}
                        >
                            <Heart className={cn("size-6", isFavorite && "fill-current")} />
                        </button>
                        <button className="size-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                            <Share2 className="size-6" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Card */}
            <div className="relative z-10 -mt-24 px-4 md:px-0 mx-auto max-w-4xl">
                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 p-8 md:p-12">
                    {/* Business Basic Info */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <RxBadge variant="purple" className="px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-tighter">
                                    {business.category}
                                </RxBadge>
                                <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                    <div className="size-1.5 rounded-full bg-current animate-pulse" />
                                    Açık
                                </div>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 leading-none">
                                {business.name}
                            </h1>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5">
                                    <Star className="size-5 fill-yellow-400 text-yellow-400" />
                                    <span className="text-lg font-black">{business.averageRating}</span>
                                    <span className="text-sm text-gray-400 font-bold">({business.reviewCount} yorum)</span>
                                </div>
                                <div className="size-1 rounded-full bg-gray-200" />
                                <div className="flex items-center gap-1.5 text-gray-500 font-bold text-sm">
                                    <Navigation className="size-4" />
                                    {distance}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <RxButton
                                variant="secondary"
                                size="lg"
                                className="rounded-3xl gap-3 px-8 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-900 font-black"
                                onClick={() => window.open(`tel:${business.phone}`)}
                            >
                                <Phone className="size-5" />
                                ARAYIN
                            </RxButton>
                        </div>
                    </div>

                    {/* Main Tabs */}
                    <div className="flex items-center gap-8 border-b border-gray-100 overflow-x-auto scrollbar-hide pt-6">
                        {[
                            { id: "services", label: "Hizmetler", icon: CalendarCheck2 },
                            { id: "info", label: "Hakkımızda", icon: Clock },
                            { id: "reviews", label: "Yorumlar", icon: Star }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveMainTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 pb-4 text-sm font-black transition-all relative whitespace-nowrap",
                                    activeMainTab === tab.id
                                        ? "text-primary"
                                        : "text-gray-400 hover:text-gray-600"
                                )}
                            >
                                <tab.icon className="size-4" />
                                {tab.label}
                                {activeMainTab === tab.id && (
                                    <div className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-t-full layout-id-active-tab animate-in fade-in zoom-in duration-300" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Content Based on Tabs */}
                    <div className="min-h-[400px]">
                        {activeMainTab === "services" && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {/* Trust Signals / Feature Icons */}
                                <div className="flex flex-wrap gap-2 py-6 border-b border-gray-50 mb-6">
                                    {(business.features || ["Klima", "Otopark", "Wi-Fi", "Kahve İkramı"]).map(feature => (
                                        <div key={feature} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-500 border border-transparent hover:border-primary/20 hover:text-primary transition-all">
                                            <Check className="size-3" />
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                <div id="services-section" className="py-12">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">Hizmet Seçin</h2>
                                            <p className="text-gray-400 font-bold text-sm">Size uygun işlemi seçin</p>
                                        </div>
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setActiveCategory(cat)}
                                                    className={cn(
                                                        "px-5 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap",
                                                        activeCategory === cat
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid gap-8">
                                        {activeCategory === "Tümü" ? (
                                            /* Grouped View */
                                            categories.filter(c => c !== "Tümü").map(cat => (
                                                <div key={cat} className="space-y-4">
                                                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest px-2">{cat}</h3>
                                                    <div className="grid gap-3">
                                                        {services.filter(s => s.category === cat).map(service => {
                                                            const isSelected = selectedServices.has(service.id)
                                                            return (
                                                                <ServiceCard
                                                                    key={service.id}
                                                                    service={service}
                                                                    isSelected={isSelected}
                                                                    onToggle={() => toggleService(service.id)}
                                                                />
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            /* Filtered View */
                                            <div className="grid gap-3">
                                                {filteredServices.map(service => {
                                                    const isSelected = selectedServices.has(service.id)
                                                    return (
                                                        <ServiceCard
                                                            key={service.id}
                                                            service={service}
                                                            isSelected={isSelected}
                                                            onToggle={() => toggleService(service.id)}
                                                        />
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Staff Section Integrated Here */}
                                <div className="py-12 border-t border-gray-50">
                                    <h2 className="text-2xl font-black text-gray-900 mb-8">Uzman Kadromuz</h2>
                                    <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                        {staff.map(member => (
                                            <div key={member.id} className="w-40 shrink-0 space-y-4 text-center group">
                                                <div className="relative inline-block">
                                                    <RxAvatar name={member.name} size="lg" className="size-24 rounded-[32px] shadow-lg group-hover:scale-110 transition-transform duration-500" />
                                                    {member.online && (
                                                        <div className="absolute top-1 right-1 size-5 rounded-2xl bg-white p-1">
                                                            <div className="size-full rounded-xl bg-green-500 shadow-sm" />
                                                        </div>
                                                    )}
                                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all">
                                                        UZMAN
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-gray-900 text-sm">{member.name}</h4>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{member.specialty}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMainTab === "info" && (
                            <div className="py-12 animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 mb-4">Hakkımızda</h3>
                                            <p className="text-gray-500 leading-relaxed font-medium">
                                                {business.description || "İşletmemiz kaliteli hizmet ve müşteri memnuniyeti anlayışıyla sizlere en iyisini sunmak için çalışmaktadır."}
                                            </p>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="flex items-start gap-4 p-5 rounded-3xl bg-gray-50">
                                                <MapPin className="size-6 text-primary shrink-0" />
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Adres</p>
                                                    <p className="text-sm font-bold text-gray-700">{business.address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4 p-5 rounded-3xl bg-gray-50">
                                                <Phone className="size-6 text-blue-500 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Telefon</p>
                                                    <p className="text-sm font-bold text-gray-700">{business.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-xl font-black text-gray-900 mb-4">Konum & Saatler</h3>
                                        <div className="rounded-[32px] overflow-hidden h-48 bg-gray-100 relative group cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`)}>
                                            <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors" />
                                            <div className="absolute inset-x-4 bottom-4 z-10">
                                                <RxButton className="w-full rounded-2xl shadow-xl">YOL TARİFİ AL</RxButton>
                                            </div>
                                            <img src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=600" className="h-full w-full object-cover" alt="Map" />
                                        </div>

                                        <div className="p-6 rounded-[32px] bg-gray-50">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Clock className="size-5 text-orange-500" />
                                                <span className="font-black text-sm uppercase">Çalışma Saatleri</span>
                                            </div>
                                            <div className="grid gap-2">
                                                {workingHours.map((day) => (
                                                    <div key={day.day} className="flex items-center justify-between text-xs font-bold">
                                                        <span className="text-gray-400">{day.day}</span>
                                                        <span className={cn(day.isClosed ? "text-red-500" : "text-gray-700")}>
                                                            {day.isClosed ? "KAPALI" : day.hours}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeMainTab === "reviews" && (
                            <div className="py-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-900">Müşteri Yorumları</h2>
                                        <p className="text-gray-400 font-bold text-sm">{reviews.length} değerlendirme</p>
                                    </div>
                                </div>
                                <div className="grid gap-6">
                                    {reviews.map(review => (
                                        <div key={review.id} className="p-8 rounded-[40px] bg-gray-50 border border-transparent hover:border-gray-200 transition-all">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <RxAvatar name={review.userName} src={review.avatarUrl} size="sm" className="size-12 rounded-2xl" />
                                                    <div>
                                                        <h4 className="font-black text-gray-900 text-sm leading-none mb-1">{review.userName}</h4>
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString('tr-TR')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(s => (
                                                        <Star key={s} className={cn("size-4", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200")} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 font-medium leading-relaxed italic">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modern Sticky Bottom CTA */}
            <div className={cn(
                "fixed bottom-8 inset-x-4 md:left-1/2 md:-translate-x-1/2 md:max-w-2xl z-50 transition-all duration-500",
                isScrolled || selectedServices.size > 0 ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0 pointer-events-none"
            )}>
                <div className="bg-gray-900/90 backdrop-blur-3xl rounded-[32px] p-4 flex items-center justify-between shadow-2xl border border-white/10">
                    <div className="px-4">
                        {selectedServices.size > 0 ? (
                            <div className="space-y-0.5">
                                <p className="text-white text-lg font-black">{totalPrice.toLocaleString('tr-TR')} ₺</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{selectedServices.size} HİZMET · {totalDuration} DK</p>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                <p className="text-white text-lg font-black">Randevu Alın</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">EN UYGUN SAATİ SEÇİN</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleBooking}
                        className="bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                    >
                        <CalendarCheck2 className="size-5" />
                        {selectedServices.size > 0 ? "DEVAM ET" : "HEMEN AL"}
                    </button>
                </div>
            </div>
            {/* Magic AI Assistant */}
            <AIChatAssistant businessId={business.id} />
        </div>
    )
}

function ServiceCard({ service, isSelected, onToggle }: { service: Service, isSelected: boolean, onToggle: () => void }) {
    return (
        <div
            onClick={onToggle}
            className={cn(
                "group p-5 rounded-[28px] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between active:scale-[0.98]",
                isSelected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-gray-50 bg-white hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100"
            )}
        >
            <div className="space-y-1">
                <h3 className="text-base font-black text-gray-900 group-hover:text-primary transition-colors">
                    {service.name}
                </h3>
                <p className="text-gray-400 font-bold text-xs">
                    {service.duration}
                </p>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-lg font-black text-gray-900">{service.priceLabel}</span>
                <div className={cn(
                    "size-9 rounded-xl flex items-center justify-center transition-all",
                    isSelected
                        ? "bg-primary text-white scale-110"
                        : "bg-gray-50 text-gray-300 group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    {isSelected ? <Check className="size-5" /> : <Plus className="size-5" />}
                </div>
            </div>
        </div>
    )
}
