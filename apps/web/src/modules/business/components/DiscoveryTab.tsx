"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { DiscoveryHero } from "@/src/modules/business/components/DiscoveryHero"
import { CategoryBar } from "@/src/modules/business/components/CategoryBar"
import { BusinessDiscoverCard } from "@/src/modules/business/components/BusinessDiscoverCard"
import { QuickRebookWidget } from "@/src/modules/business/components/QuickRebookWidget"
import {
    searchBusinessesAction,
    getCategoriesAction,
    getRecommendedBusinessesAction,
} from "@/src/modules/business/actions/discovery.actions"
import type { DiscoveryBusiness, Category } from "@/src/modules/business/actions/discovery.actions"
import { BusinessCardSkeleton, CategorySkeleton } from "@/src/modules/business/components/DiscoverySkeleton"
import { Loader2, SearchX, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, ChevronRight, CalendarDays } from "lucide-react"

export interface DiscoveryTabProps {
    userName?: string
    upcomingAppointment?: {
        id: string
        businessName: string
        services: string
        date: string
        time: string
    }
    onViewDetails?: (id: string) => void
}

export function DiscoveryTab({ userName, upcomingAppointment, onViewDetails }: DiscoveryTabProps) {
    const router = useRouter()
    const [categories, setCategories] = useState<Category[]>([])
    const [businesses, setBusinesses] = useState<DiscoveryBusiness[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        loadInitialData()
    }, [])

    async function loadInitialData() {
        setIsLoading(true)
        try {
            const [catsRes, recRes] = await Promise.all([
                getCategoriesAction(),
                getRecommendedBusinessesAction()
            ])

            if (catsRes.success) setCategories(catsRes.data || [])
            if (recRes.success) setBusinesses(recRes.data || [])
        } catch (err) {
            toast.error("Veriler yüklenirken bir hata oluştu.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        setIsSearching(true)
        try {
            const res = await searchBusinessesAction(query, selectedCategoryId || undefined)
            if (res.success) {
                setBusinesses(res.data || [])
            }
        } catch (err) {
            toast.error("Arama yapılırken bir hata oluştu.")
        } finally {
            setIsSearching(false)
        }
    }

    const handleCategorySelect = async (id: string | null) => {
        setSelectedCategoryId(id)
        setIsSearching(true)
        try {
            const res = await searchBusinessesAction(searchQuery, id || undefined)
            if (res.success) {
                setBusinesses(res.data || [])
            }
        } catch (err) {
            toast.error("Kategori yüklenirken bir hata oluştu.")
        } finally {
            setIsSearching(false)
        }
    }

    const handleBusinessClick = (id: string) => {
        router.push(`/isletme/${id}`)
    }

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            <DiscoveryHero
                onSearch={handleSearch}
                isSearching={isSearching}
                userName={userName}
                upcomingAppointment={upcomingAppointment}
            />

            {!searchQuery && upcomingAppointment && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-primary/5 to-indigo-500/5 backdrop-blur-xl border border-white/40 p-1"
                >
                    <Link
                        href={`/randevularim/${upcomingAppointment.id}`}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 rounded-[38px] bg-white/40 hover:bg-white/60 transition-all duration-500 group"
                    >
                        <div className="flex items-center gap-6">
                            <div className="size-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center text-primary relative">
                                <CalendarDays className="size-10 group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">Sıradaki Randevun</span>
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                                    {upcomingAppointment.businessName}
                                </h3>
                                <p className="text-gray-500 font-bold text-base flex items-center gap-2">
                                    <Sparkles className="size-4 text-primary/40" />
                                    {upcomingAppointment.services}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="size-12 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500"
                                >
                                    <MapPin className="size-5" />
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                    className="size-12 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500"
                                >
                                    <Calendar className="size-5" />
                                </motion.button>
                            </div>

                            <div className="flex items-center gap-6 border-l border-dashed border-gray-200/50 pl-6">
                                <div className="flex flex-col items-end gap-2 text-right">
                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Randevu Vakti</div>
                                    <div className="flex items-center gap-3 text-gray-900 font-black text-base tracking-tight leading-none">
                                        <Clock className="size-4 text-primary" />
                                        {upcomingAppointment.date} @ {upcomingAppointment.time}
                                    </div>
                                </div>
                                <div className="size-14 rounded-[22px] bg-white border border-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                                    <ChevronRight className="size-7 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )}

            {!searchQuery && <QuickRebookWidget />}

            <div className="space-y-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kategoriler</h2>
                        <p className="text-muted-foreground font-medium text-sm mt-1">İstediğin uzmanlık alanını elite seçeneklerle keşfet</p>
                    </div>
                </div>

                {isLoading ? (
                    <CategorySkeleton />
                ) : (
                    <CategoryBar
                        categories={categories}
                        selectedId={selectedCategoryId}
                        onSelect={handleCategorySelect}
                    />
                )}
            </div>

            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                            {searchQuery ? `"${searchQuery}" için sonuçlar` : "Öne Çıkan İşletmeler"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-muted-foreground font-black text-[10px] uppercase tracking-widest">
                                {businesses.length} elite işletme bulundu
                            </p>
                        </div>
                    </div>
                </div>

                {isLoading || isSearching ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <BusinessCardSkeleton key={i} />
                        ))}
                    </div>
                ) : businesses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-[40px] border border-dashed border-border">
                        <SearchX className="size-16 text-muted-foreground/30 mb-4" />
                        <h3 className="text-xl font-bold">Sonuç Bulunamadı</h3>
                        <p className="text-muted-foreground">Farklı bir arama terimi veya kategori deneyin.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {businesses.map((business) => (
                            <BusinessDiscoverCard
                                key={business.id}
                                business={business}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
