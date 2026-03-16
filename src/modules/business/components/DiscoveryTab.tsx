"use client"

import { useState, useEffect } from "react"
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
import { Loader2, SearchX } from "lucide-react"
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
            />

            {!searchQuery && upcomingAppointment && (
                <Link
                    href={`/randevularim/${upcomingAppointment.id}`}
                    className="group relative overflow-hidden rounded-[32px] bg-white border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer block"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <CalendarDays className="size-7" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 leading-none mb-2">
                                    {upcomingAppointment.businessName}
                                </h3>
                                <p className="text-muted-foreground font-medium text-sm">
                                    {upcomingAppointment.services}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <div className="flex items-center gap-2 text-primary font-black text-sm uppercase tracking-tighter">
                                    <Calendar className="size-4" />
                                    {upcomingAppointment.date}
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 font-bold text-sm">
                                    <Clock className="size-4" />
                                    {upcomingAppointment.time}
                                </div>
                            </div>
                            <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                                <ChevronRight className="size-5" />
                            </div>
                        </div>
                    </div>
                </Link>
            )}

            {!searchQuery && <QuickRebookWidget />}

            <div className="space-y-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl font-black">Kategoriler</h2>
                        <p className="text-muted-foreground font-medium text-sm">İstediğin uzmanlık alanını seç</p>
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
                        <h2 className="text-2xl font-black">
                            {searchQuery ? `"${searchQuery}" için sonuçlar` : "Öne Çıkan İşletmeler"}
                        </h2>
                        <p className="text-muted-foreground font-medium text-sm">
                            {businesses.length} işletme bulundu
                        </p>
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
