import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { toggleFavoriteAction } from "@/src/modules/business/actions/business.actions"
import type { Business, Service, StaffMember, WorkingDay, Review } from "./types"

export function useBusinessProfileData(propBusinessId?: string) {
  const params = useParams()
  const router = useRouter()
  const businessId = propBusinessId || (params?.id as string)

  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set())
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [showBanner, setShowBanner] = useState(false)

  const [loading, setLoading] = useState(true)
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [workingHours, setWorkingHours] = useState<WorkingDay[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  const { user } = useCurrentUser()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchData() {
      if (!businessId) return
      setLoading(true)
      try {
        // 1. Business details
        const { data: bData } = await supabase.from("businesses").select("*").eq("id", businessId).single()
        if (bData) {
          setBusiness({
            id: bData.id,
            name: bData.name,
            category: bData.category || "Genel",
            address: bData.address || "",
            phone: bData.phone || "",
            logo_url: bData.logo_url,
            description: bData.description || "",
            isFavorite: false
          })
        }

        // 2. Favorite status
        if (user) {
          const { data: fav } = await supabase.from("user_favorites").select("id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle()
          setBusiness(prev => prev ? { ...prev, isFavorite: !!fav } : null)
        }

        // 3. Are we connected?
        if (user) {
          const { data: conn } = await supabase.from("business_customers").select("id").eq("business_id", businessId).eq("user_id", user.id).maybeSingle()
          if (!conn) {
            setShowBanner(true)
          }
        }

        // 3. Services
        const { data: sData } = await supabase.from("services").select("*").eq("business_id", businessId).eq("is_active", true)
        if (sData) {
          setServices(sData.map(s => ({
            id: s.id,
            name: s.name,
            duration: `${s.base_duration_minutes} dk`,
            price: Number(s.base_price) || 0,
            priceLabel: `${s.base_price} ₺`,
            category: s.category || "Genel",
            rawDuration: s.base_duration_minutes || 0
          })))
        }

        // 4. Staff
        const { data: staffData } = await supabase.from("staff_business").select("*, user:users(name, avatar_url, title)").eq("business_id", businessId).eq("is_active", true)
        if (staffData) {
          setStaff(staffData.map(s => {
            const u = Array.isArray(s.user) ? s.user[0] : s.user
            return {
              id: s.id,
              name: u?.name || "Personel",
              specialty: u?.title || "Uzman",
              rating: "5.0", // Hardcoded for now until ratings are implemented
              online: true   // Mock availability for UI
            }
          }))
        }

        // 5. Working Hours
        const { data: hData } = await supabase.from("business_hours").select("*").eq("business_id", businessId).order("day_of_week")
        const dayNames: Record<number, string> = {
          1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe", 5: "Cuma", 6: "Cumartesi", 7: "Pazar"
        }

        const currentJsDay = new Date().getDay() // 0 = Sunday, 1 = Monday
        const isoDay = currentJsDay === 0 ? 7 : currentJsDay

        if (hData) {
          setWorkingHours(hData.map(h => ({
            day: dayNames[h.day_of_week] || "Gun",
            hours: h.is_closed ? "Kapalı" : `${String(h.open_time).slice(0, 5)} - ${String(h.close_time).slice(0, 5)}`,
            isClosed: h.is_closed,
            isToday: h.day_of_week === isoDay
          })))
        }

        // 6. Reviews
        const { data: rData } = await supabase
          .from("business_reviews")
          .select("*, user:users(name, avatar_url)")
          .eq("business_id", businessId)
          .order("created_at", { ascending: false })

        if (rData && rData.length > 0) {
          const formattedReviews = rData.map(r => ({
            id: r.id,
            userName: r.user?.name || "Müşteri",
            avatarUrl: r.user?.avatar_url,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.created_at
          }))
          setReviews(formattedReviews)

          const avg = formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length
          setBusiness(prev => prev ? {
            ...prev,
            averageRating: Number(avg.toFixed(1)),
            reviewCount: formattedReviews.length
          } : null)
        }

      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [businessId, user, supabase])

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
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
    const res = await toggleFavoriteAction(businessId)
    if (res.success) {
      if (res.data) setBusiness(prev => prev ? { ...prev, isFavorite: res.data!.isFavorite } : null)
      toast.success(res.data?.isFavorite ? "Favorilere eklendi." : "Favorilerden çıkarıldı.")
    } else {
      toast.error(res.error?.message || "Bir hata oluştu.")
    }
  }

  const handleConnectBusiness = async () => {
    if (!user || !businessId) return
    const { error } = await supabase.from("business_customers").insert({
      user_id: user.id,
      business_id: businessId
    })

    setConnectModalOpen(false)
    if (!error || error.code === "23505") { // Success or already exists
      setShowBanner(false)
      toast?.success ? toast.success("İşletmeye bağlanıldı.") : alert("İşletmeye bağlandı.")
    } else {
      toast?.error ? toast.error("Bir sorun oluştu.") : alert("Hata oluştu.")
    }
  }

  const handleContinueToBooking = () => {
    if (selectedServices.size === 0) return
    const svcArray = Array.from(selectedServices).join(",")
    router.push(`/randevu-al?business_id=${businessId}&services=${svcArray}`)
  }

  // Calculate totals
  let totalCost = 0
  let totalDuration = 0
  selectedServices.forEach(id => {
    const s = services.find(x => x.id === id)
    if (s) {
      totalCost += s.price
      totalDuration += s.rawDuration
    }
  })

  // Get current day working hours
  const currentJsDay = new Date().getDay()
  const isoDay = currentJsDay === 0 ? 7 : currentJsDay
  const dayNames: Record<number, string> = {
    1: "Pazartesi", 2: "Salı", 3: "Çarşamba", 4: "Perşembe", 5: "Cuma", 6: "Cumartesi", 7: "Pazar"
  }
  const todayName = dayNames[isoDay]
  const todayInfo = workingHours.find(h => h.day === todayName)

  return {
    loading,
    business,
    todayInfo,
    showBanner,
    services,
    selectedServices,
    staff,
    workingHours,
    reviews,
    totalCost,
    totalDuration,
    connectModalOpen,
    setConnectModalOpen,
    toggleService,
    handleToggleFavorite,
    handleConnectBusiness,
    handleContinueToBooking
  }
}
