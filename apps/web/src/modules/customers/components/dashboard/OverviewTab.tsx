import { useState, useEffect } from "react"
import { SearchX } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { Appointment, Business, TabView, Notification } from "./types"
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { toast } from "sonner"

// Discovery Imports
import { DiscoveryHero } from "@/src/modules/business/components/DiscoveryHero"
import { CategoryBar } from "@/src/modules/business/components/CategoryBar"
import { BusinessDiscoverCard } from "@/src/modules/business/components/BusinessDiscoverCard"
import { QuickRebookWidget } from "@/src/modules/business/components/QuickRebookWidget"
import { BusinessCardSkeleton, CategorySkeleton } from "@/src/modules/business/components/DiscoverySkeleton"
import { searchBusinessesAction, getCategoriesAction, getRecommendedBusinessesAction, type DiscoveryBusiness, type Category } from "@/src/modules/business/actions/discovery.actions"

// Modular Dashboard Widgets
import { HeroAppointmentWidget } from "./widgets/HeroAppointmentWidget"
import { FavoriteBusinessesWidget } from "./widgets/FavoriteBusinessesWidget"
import { JoinBusinessModal } from "./widgets/JoinBusinessModal"

export function OverviewTab({
  upcoming,
  businesses,
  onNavigate,
  onJoinBusiness,
  notifications,
  onMarkAsRead,
  router,
  userName
}: {
  upcoming: Appointment[]
  businesses: Business[]
  onNavigate: (tab: TabView) => void
  onJoinBusiness: (code: string) => Promise<void>
  notifications: Notification[]
  onMarkAsRead: (id: string) => Promise<void>
  router: AppRouterInstance
  userName?: string
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [discoveryBusinesses, setDiscoveryBusinesses] = useState<DiscoveryBusiness[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const [catsRes, recRes] = await Promise.all([getCategoriesAction(), getRecommendedBusinessesAction()])
      if (catsRes.success) setCategories(catsRes.data || [])
      if (recRes.success) setDiscoveryBusinesses(recRes.data || [])
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
      if (res.success) setDiscoveryBusinesses(res.data || [])
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
      if (res.success) setDiscoveryBusinesses(res.data || [])
    } catch (err) {
      toast.error("Kategori yüklenirken bir hata oluştu.")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Hero Section (Digital Ticket OR Search) */}
      <section>
        {upcoming.length > 0 && !searchQuery ? (
          <HeroAppointmentWidget appointment={upcoming[0]} />
        ) : (
          <DiscoveryHero onSearch={handleSearch} isSearching={isSearching} userName={userName} />
        )}
      </section>

      {/* Favorite Businesses Widget */}
      {!searchQuery && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">İşletmelerim</h2>
            <FavoriteBusinessesWidget 
                businesses={businesses} 
                onViewProfile={(id) => router.push(`/isletme/${id}`)} 
                onOpenJoinModal={() => setShowScanner(true)} 
            />
          </section>
      )}

      {/* Quick Rebook */}
      {!searchQuery && <QuickRebookWidget />}

      {/* Categories */}
      <section className="space-y-6">
        <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Kategoriler</h2>
            <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-widest">İstediğin uzmanlık alanını elite seçeneklerle keşfet</p>
        </div>
        {isLoading ? (
            <CategorySkeleton />
        ) : (
            <CategoryBar categories={categories} selectedId={selectedCategoryId} onSelect={handleCategorySelect} />
        )}
      </section>

      {/* Discovery Results */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                    {searchQuery ? `"${searchQuery}" için sonuçlar` : "Öne Çıkan İşletmeler"}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        {discoveryBusinesses.length} elite işletme bulundu
                    </p>
                </div>
            </div>
        </div>

        {isLoading || isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => <BusinessCardSkeleton key={i} />)}
            </div>
        ) : discoveryBusinesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 rounded-[40px] border border-dashed border-gray-200">
                <SearchX className="size-16 text-gray-300 mb-4" />
                <h3 className="text-xl font-black text-gray-900">Sonuç Bulunamadı</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 max-w-[280px] text-center">Farklı bir arama terimi veya kategori deneyin.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoveryBusinesses.map((business) => (
                    <BusinessDiscoverCard key={business.id} business={business} />
                ))}
            </div>
        )}
      </section>

      <JoinBusinessModal
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onJoin={onJoinBusiness}
      />
    </div>
  )
}
