"use client"

import { useState, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import {
    MapPin,
    Phone,
    Clock,
    Plus,
    Check,
    Star,
    Heart,
    Share2,
    ChevronLeft,
    Navigation,
    CalendarCheck2,
    Sparkles,
    TrendingUp,
    ShieldCheck,
    Zap
} from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import { useParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { toast } from "sonner"
import { toggleFavoriteAction } from "@/src/modules/business/actions/business.actions"
import { AIChatAssistant } from "./AIChatAssistant"
import { motion, AnimatePresence } from "framer-motion"

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
        announcements: any[]
    }
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function BusinessStorefrontModern({ initialData }: BusinessStorefrontModernProps) {
    const router = useRouter()
    const { user } = useCurrentUser()
    const { business, services, staff, workingHours, reviews, announcements } = initialData

    const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
    const [isFavorite, setIsFavorite] = useState(business.isFavorite)
    const [activeCategory, setActiveCategory] = useState<string>("Tümü")
    const [activeMainTab, setActiveMainTab] = useState<"services" | "info" | "reviews">("services")
    const [isScrolled, setIsScrolled] = useState(false)

    const distance = "1.2 km"

    useEffect(() => {
        const handleScroll = () => setIsScrolled(globalThis.scrollY > 50)
        globalThis.addEventListener("scroll", handleScroll)
        return () => globalThis.removeEventListener("scroll", handleScroll)
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
    if (res.success && res.data) {
        setIsFavorite(res.data.isFavorite)
        toast.success(res.data.isFavorite ? "Favorilere eklendi." : "Favorilerden çıkarıldı.")
    } else if (!res.success) {
        toast.error(res.error?.message || "Favori işlemi başarısız oldu.")
    }
    }

    const handleBooking = () => {
        if (selectedServices.size === 0) {
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
        <div className="min-h-screen bg-[#FDFDFD] pb-32 selection:bg-primary/10">
            {/* 📢 Premium Announcement Bar */}
            <AnimatePresence>
                {announcements.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-primary text-white overflow-hidden relative z-[60]"
                    >
                        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-center gap-4 text-center">
                            <Sparkles className="size-4 animate-pulse shrink-0" />
                            <p className="text-[11px] font-black uppercase tracking-[0.2em] leading-tight">
                                {announcements[0].title}: {announcements[0].content}
                            </p>
                            <Sparkles className="size-4 animate-pulse shrink-0" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cinematic Hero */}
            <div className="relative h-[500px] md:h-[650px] w-full overflow-hidden">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#FDFDFD] z-10" />
                    <img
                        src={business.logo_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1200"}
                        alt={business.name}
                        className="h-full w-full object-cover"
                    />
                </motion.div>

                {/* Top Nav */}
                <div className={cn(
                    "fixed top-0 inset-x-0 z-50 transition-all duration-500 px-6 py-4 flex items-center justify-between",
                    isScrolled ? "bg-white/80 backdrop-blur-3xl border-b border-gray-100 shadow-sm" : "bg-transparent py-8"
                )}>
                    <button
                        onClick={() => router.back()}
                        className={cn(
                            "size-12 rounded-2xl flex items-center justify-center transition-all",
                            isScrolled ? "bg-gray-100 text-gray-900" : "bg-white/20 backdrop-blur-xl border border-white/20 text-white"
                        )}
                    >
                        <ChevronLeft className="size-6" />
                    </button>
                    <div className="flex items-center gap-3">
                        <RxButton
                            variant="ghost"
                            onClick={handleToggleFavorite}
                            className={cn(
                                "size-12 rounded-2xl p-0 flex items-center justify-center transition-all",
                                isFavorite
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : isScrolled ? "bg-gray-100 text-gray-900" : "bg-white/20 backdrop-blur-xl border border-white/20 text-white"
                            )}
                        >
                            <Heart className={cn("size-6", isFavorite && "fill-current")} />
                        </RxButton>
                        <RxButton
                            variant="ghost"
                            className={cn(
                                "size-12 rounded-2xl p-0 flex items-center justify-center transition-all",
                                isScrolled ? "bg-gray-100 text-gray-900" : "bg-white/20 backdrop-blur-xl border border-white/20 text-white"
                            )}
                        >
                            <Share2 className="size-6" />
                        </RxButton>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-24 inset-x-0 z-20 px-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <span className="bg-primary/20 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                {business.category}
                            </span>
                            <span className="flex items-center gap-2 bg-green-500/20 backdrop-blur-md text-green-300 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-green-500/20">
                                <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                                RANDEVUYA AÇIK
                            </span>
                        </div>
                        <h1 className="text-7xl md:text-9xl font-black text-white leading-none tracking-tighter drop-shadow-2xl brightness-110">
                            {business.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-10 text-white/90 font-bold">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="size-5 fill-yellow-400 text-yellow-400" />)}
                                </div>
                                <span className="text-2xl font-black">{business.averageRating}</span>
                                <span className="text-sm opacity-60 uppercase tracking-widest font-black">({business.reviewCount} Yorum)</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Navigation className="size-6" />
                                <span className="text-xl">{distance}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content Sections */}
            <div className="relative z-30 -mt-16 px-6 max-w-7xl mx-auto space-y-24">

                {/* 🎯 Quick Actions & Info Bar */}
                <div className="bg-white rounded-[40px] shadow-2xl shadow-gray-200/50 p-8 flex flex-col md:flex-row items-center justify-between gap-8 border border-gray-50">
                    <div className="flex items-center gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Çalışma Saatleri</p>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Clock className="size-4 text-primary" /> BugÜn: 09:00 - 20:00
                            </p>
                        </div>
                        <div className="w-px h-10 bg-gray-100 hidden md:block" />
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İletişim</p>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <Phone className="size-4 text-primary" /> {business.phone}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <RxButton variant="secondary" className="flex-1 md:flex-none rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs" onClick={() => globalThis.open(`tel:${business.phone}`)}>ArayIn</RxButton>
                        <RxButton className="flex-1 md:flex-none rounded-2xl h-14 px-10 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" onClick={() => router.push(`/randevu-al?business_id=${business.id}`)}>Randevu Al</RxButton>
                    </div>
                </div>

                {/* 📋 Main Tabs & Services */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-8 space-y-12">
                        {/* Tab Switcher */}
                        <div className="flex items-center gap-12 border-b border-gray-100 overflow-x-auto scrollbar-hide">
                            {[
                                { id: "services", label: "Hizmetler", icon: CalendarCheck2 },
                                { id: "info", label: "İşletme Bilgisi", icon: ShieldCheck },
                                { id: "reviews", label: "Müşteri Değerlendirmeleri", icon: TrendingUp }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveMainTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-3 pb-6 text-sm font-black transition-all relative whitespace-nowrap group",
                                        activeMainTab === tab.id ? "text-primary" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <tab.icon className={cn("size-5", activeMainTab === tab.id ? "text-primary" : "text-gray-300 group-hover:text-gray-400")} />
                                    {tab.label}
                                    {activeMainTab === tab.id && (
                                        <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-1 bg-primary rounded-t-full" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Content rendering */}
                        <div className="min-h-[600px]">
                            {activeMainTab === "services" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-12"
                                >
                                    {/* Category Pills */}
                                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide pt-4">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setActiveCategory(cat)}
                                                className={cn(
                                                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                                                    activeCategory === cat
                                                        ? "bg-gray-900 text-white shadow-xl shadow-gray-200"
                                                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>

                                    <div id="services-section" className="space-y-16">
                                        {categories.filter(c => c !== "Tümü" && (activeCategory === "Tümü" || activeCategory === c)).map(cat => (
                                            <div key={cat} className="space-y-8">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">{cat}</h3>
                                                    <div className="h-px bg-gray-100 flex-1" />
                                                </div>
                                                <div className="grid gap-6">
                                                    {services.filter(s => s.category === cat).map(service => (
                                                        <ServiceCard
                                                            key={service.id}
                                                            service={service}
                                                            isSelected={selectedServices.has(service.id)}
                                                            onToggle={() => toggleService(service.id)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeMainTab === "info" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12 py-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 mb-4">Hakkımızda</h3>
                                                <p className="text-gray-500 leading-relaxed font-medium">
                                                    {business.description || "En iyi hizmet kalitesiyle yanınızdayız."}
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-6 rounded-3xl space-y-1 border border-gray-100/50">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adres</p>
                                                    <p className="text-sm font-bold text-gray-800">{business.address}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-8 rounded-[40px] border border-gray-100">
                                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 border-b border-gray-200 pb-4">Çalışma Planı</h4>
                                            <div className="space-y-3">
                                                {workingHours.map(d => (
                                                    <div key={d.day} className="flex justify-between text-xs font-bold">
                                                        <span className="text-gray-400">{d.day}</span>
                                                        <span className={cn(d.isClosed ? "text-red-500" : "text-gray-900")}>{d.isClosed ? "KAPALI" : d.hours}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeMainTab === "reviews" && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 py-8">
                                    <div className="grid gap-8">
                                        {reviews.map(review => (
                                            <div key={review.id} className="bg-white p-10 rounded-[40px] border border-gray-100 hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <RxAvatar name={review.userName} src={review.avatarUrl} className="size-14 rounded-2xl shadow-sm" />
                                                        <div>
                                                            <h4 className="font-black text-gray-900 group-hover:text-primary transition-colors">{review.userName}</h4>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className={cn("size-4", s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-100")} />)}
                                                    </div>
                                                </div>
                                                <p className="text-gray-600 font-medium leading-relaxed italic text-lg">"{review.comment}"</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Staff & Trust */}
                    <div className="lg:col-span-4 space-y-12">
                        <div className="bg-gray-50 rounded-[48px] p-10 space-y-10 border border-gray-100/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 mb-2">Uzman Kadromuz</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profesyonel Ekibimizle TanIşIn</p>
                            </div>
                            <div className="grid gap-8">
                                {staff.map(s => (
                                    <div key={s.id} className="flex items-center gap-4 group cursor-pointer">
                                        <div className="relative">
                                            <RxAvatar name={s.name} src={s.avatar_url} className="size-16 rounded-[24px] shadow-md group-hover:scale-110 transition-transform" />
                                            {s.online && <div className="absolute -top-1 -right-1 size-4 rounded-full bg-white p-0.5"><div className="size-full rounded-full bg-green-500" /></div>}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 text-sm">{s.name}</h4>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.specialty}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-[40px] p-8 space-y-6 border border-primary/10">
                            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Zap className="size-6" />
                            </div>
                            <h4 className="text-lg font-black text-gray-900 leading-tight">Güvenli ve HIzlI Randevu Deneyimi</h4>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">Randesk güvencesiyle 7/24 randevu alabilir, bildirimlerle işlemlerinizi takip edebilirsiniz.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 💰 Modern Sticky Checkout CTA */}
            <AnimatePresence>
                {(isScrolled || selectedServices.size > 0) && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-8 inset-x-6 z-50 md:max-w-3xl md:mx-auto"
                    >
                        <div className="bg-gray-900/90 backdrop-blur-3xl rounded-[32px] p-4 flex items-center justify-between shadow-2xl border border-white/10 ring-1 ring-white/5">
                            <div className="px-6 space-y-1">
                                <p className="text-white text-2xl font-black">{totalPrice.toLocaleString()} ₺</p>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                                    {selectedServices.size > 0
                                        ? `${selectedServices.size} HİZMET · ${totalDuration} DK`
                                        : "BİR SEÇİM YAPIN"}
                                </p>
                            </div>
                            <RxButton
                                onClick={handleBooking}
                                className="bg-primary hover:bg-primary-dark text-white px-10 h-16 rounded-2xl font-black flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20 group"
                            >
                                <span>{selectedServices.size > 0 ? "RANDEVUYU TAMAMLA" : "HEMEN RANDEVU AL"}</span>
                                <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                            </RxButton>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AIChatAssistant businessId={business.id} />
        </div>
    )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

import { ArrowRight } from "lucide-react"

function ServiceCard({ service, isSelected, onToggle }: { service: Service, isSelected: boolean, onToggle: () => void }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggle}
            className={cn(
                "group p-8 rounded-[36px] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between",
                isSelected
                    ? "border-primary bg-primary/[0.03] shadow-xl shadow-primary/5"
                    : "border-gray-50 bg-white hover:border-gray-200 hover:shadow-2xl hover:shadow-gray-100"
            )}
        >
            <div className="space-y-2">
                <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors">
                    {service.name}
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                        {service.duration}
                    </span>
                    <span className="size-1 rounded-full bg-gray-200" />
                    <span className="text-gray-400 font-black text-[10px] uppercase tracking-widest">
                        UZMAN SEÇİMİ
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">BaŞlangIç</p>
                    <p className="text-2xl font-black text-gray-900">{service.priceLabel}</p>
                </div>
                <div className={cn(
                    "size-12 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                    isSelected
                        ? "bg-primary text-white scale-110 shadow-primary/30"
                        : "bg-gray-50 text-gray-300 group-hover:bg-primary group-hover:text-white"
                )}>
                    {isSelected ? <Check className="size-6" /> : <Plus className="size-6" />}
                </div>
            </div>
        </motion.div>
    )
}
