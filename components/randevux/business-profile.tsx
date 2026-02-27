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
} from "lucide-react"
import { RxButton } from "./rx-button"
import { RxAvatar } from "./rx-avatar"
import { RxBadge } from "./rx-badge"
import { RxModal } from "./rx-modal"
import { useParams, useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ─── Data Types ───────────────────────────────────────────────────────────────

type ServiceCategory = "Tumu" | string

interface Business {
  id: string
  name: string
  category: string
  address: string
  phone: string
  logo_url?: string
}

interface Service {
  id: string
  name: string
  duration: string // formatted string "45 dk"
  price: number
  priceLabel: string
  category: ServiceCategory
  rawDuration: number
}

interface StaffMember {
  id: string
  name: string
  specialty: string
  rating: string
  online: boolean
}

interface WorkingDay {
  day: string
  hours: string
  isClosed: boolean
  isToday: boolean
}

// ─── Business Header ────────────────────────────────────────────────────────────

function BusinessHeader({
  business,
  todayInfo
}: {
  business: Business
  todayInfo?: WorkingDay
}) {
  const initials = (business.name || "?").substring(0, 2).toUpperCase()

  return (
    <section>
      {/* Cover */}
      <div className="h-[200px] w-full bg-gradient-to-br from-primary to-primary-hover" />

      {/* Profile Info */}
      <div className="relative px-4 pb-5 sm:px-6">
        {/* Avatar overlapping cover */}
        <div className="-mt-10 mb-3">
          {business.logo_url ? (
            <img
              src={business.logo_url}
              alt={business.name}
              className="size-20 rounded-full border-[3px] border-card bg-primary-light object-cover shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-full border-[3px] border-card bg-primary-light text-xl font-bold text-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              {initials}
            </div>
          )}
        </div>

        {/* Name & Category */}
        <h1 className="text-xl font-semibold text-foreground">
          {business.name}
        </h1>
        <div className="mt-1.5">
          <RxBadge variant="purple">{business.category || "Genel"}</RxBadge>
        </div>

        {/* Info Row */}
        <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
          {business.address && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" />
              <span>{business.address}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <span>{business.phone}</span>
            </div>
          )}
          {todayInfo && (
            <div className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              <span>
                {`Bugün ${todayInfo.isClosed ? 'Kapalı' : todayInfo.hours} \u00B7 `}
                <span className={cn("font-medium", todayInfo.isClosed ? "text-accent" : "text-success")}>
                  {todayInfo.isClosed ? "Kapalı" : "Açık"}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex gap-3">
          <RxButton variant="secondary" size="md" className="gap-2" onClick={() => {
            if (business.phone) window.open(`tel:${business.phone}`)
          }}>
            <Phone className="size-4" />
            Ara
          </RxButton>
        </div>
      </div>
    </section>
  )
}

// ─── Connection Banner ──────────────────────────────────────────────────────────

function ConnectionBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <section className="px-4 sm:px-6">
      <div className="flex items-center gap-4 rounded-xl border-l-4 border-l-primary bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-light">
          <UserPlus className="size-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {"Bu isletmenin duzenli musterisi misiniz?"}
          </p>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {"Baglanarak randevu gecmisinizi takip edin."}
          </p>
        </div>
        <RxButton
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={onConnect}
        >
          Baglan
        </RxButton>
      </div>
    </section>
  )
}

// ─── Services Section ───────────────────────────────────────────────────────────

function ServiceCard({
  service,
  selected,
  onToggle,
}: {
  service: Service
  selected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150",
        selected
          ? "border border-primary bg-primary-light"
          : "border border-transparent"
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-foreground">
          {service.name}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {service.duration}
        </p>
      </div>
      <p className="shrink-0 text-right text-[15px] font-semibold text-primary">
        {service.priceLabel}
      </p>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-all duration-150 cursor-pointer",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary text-primary hover:bg-primary-light"
        )}
        aria-label={selected ? `${service.name} kaldir` : `${service.name} ekle`}
      >
        {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
    </div>
  )
}

function ServicesSection({
  services,
  selectedIds,
  onToggle,
}: {
  services: Service[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<ServiceCategory>("Tumu")

  const categories = useMemo(() => {
    const cats = new Set<string>()
    services.forEach(s => cats.add(s.category))
    return ["Tumu", ...Array.from(cats).sort()]
  }, [services])

  const filtered = useMemo(() => {
    if (activeTab === "Tumu") return services
    return services.filter((s) => s.category === activeTab)
  }, [activeTab, services])

  if (services.length === 0) {
    return (
      <section className="px-4 sm:px-6 text-sm text-muted-foreground">
        Hizmet bulunmamaktadır.
      </section>
    )
  }

  return (
    <section className="px-4 sm:px-6">
      <h2 className="text-lg font-semibold text-foreground">Hizmetler</h2>

      {/* Category Tabs */}
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {categories.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors cursor-pointer",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground border border-border hover:bg-primary-light hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Service Cards */}
      <div className="mt-4 flex flex-col gap-3">
        {filtered.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            selected={selectedIds.has(service.id)}
            onToggle={() => onToggle(service.id)}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Staff Section ──────────────────────────────────────────────────────────────

function StaffSection({ staff }: { staff: StaffMember[] }) {
  if (staff.length === 0) return null

  return (
    <section className="px-4 sm:px-6">
      <h2 className="text-lg font-semibold text-foreground">Ekibimiz</h2>

      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex w-40 shrink-0 flex-col items-center rounded-xl bg-card p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            <RxAvatar
              name={member.name}
              size="lg"
              online={member.online}
            />
            <p className="mt-3 text-sm font-semibold text-foreground text-center line-clamp-1">
              {member.name}
            </p>
            <p className="mt-0.5 text-center text-xs text-muted-foreground line-clamp-1">
              {member.specialty}
            </p>
            <div className="mt-2 flex items-center gap-1 opacity-50">
              <Star className="size-3.5 fill-badge-yellow-text text-badge-yellow-text" />
              <span className="text-xs font-medium text-muted-foreground">
                {member.rating}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Working Hours Section ──────────────────────────────────────────────────────

function WorkingHoursSection({ hours }: { hours: WorkingDay[] }) {
  if (hours.length === 0) return null

  return (
    <section className="px-4 sm:px-6">
      <h2 className="text-lg font-semibold text-foreground">
        {"Calisma Saatleri"}
      </h2>

      <div className="mt-3 rounded-xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        {hours.map((day, i) => (
          <div
            key={day.day}
            className={cn(
              "flex items-center justify-between px-4 py-3",
              i < hours.length - 1 && "border-b border-border"
            )}
          >
            <span
              className={cn(
                "text-sm",
                day.isToday
                  ? "font-semibold text-primary"
                  : "font-medium text-foreground"
              )}
            >
              {day.day}
              {day.isToday && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (Bugun)
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-sm",
                day.isClosed
                  ? "font-medium text-accent"
                  : day.isToday
                    ? "font-semibold text-primary"
                    : "text-muted-foreground"
              )}
            >
              {day.hours}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Sticky Bottom Bar ──────────────────────────────────────────────────────────

function StickyBottomBar({
  count,
  total,
  duration,
  onContinue
}: {
  count: number
  total: number
  duration: number
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] animate-in slide-in-from-bottom-4 duration-200">
      <div className="mx-auto flex max-w-[720px] items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {count} hizmet secildi
          </p>
          <p className="text-xs text-muted-foreground">
            Toplam: {total.toLocaleString("tr-TR")} {"\u20BA"} {"  \u00B7  ~"}
            {duration} dk
          </p>
        </div>
        <RxButton variant="primary" size="md" className="shrink-0 gap-2" onClick={onContinue}>
          {"Devam Et"}
          <ArrowRight className="size-4" />
        </RxButton>
      </div>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export interface BusinessProfileProps {
  businessId?: string
}

export function BusinessProfile({ businessId: propBusinessId }: BusinessProfileProps) {
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

  const { user } = useCurrentUser()
  const supabase = createClient()

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
            logo_url: bData.logo_url
          })
        }

        // 2. Are we connected?
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
            hours: h.is_closed ? "Kapali" : `${String(h.open_time).slice(0, 5)} - ${String(h.close_time).slice(0, 5)}`,
            isClosed: h.is_closed,
            isToday: h.day_of_week === isoDay
          })))
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

  const handleConnectBusiness = async () => {
    if (!user || !businessId) return
    const { error } = await supabase.from("business_customers").insert({
      user_id: user.id,
      business_id: businessId
    })

    setConnectModalOpen(false)
    if (!error || error.code === "23505") { // Success or already exists
      setShowBanner(false)
      toast?.success ? toast.success("Isletmeye baglanildi.") : alert("Isletmeye bağlandı.")
    } else {
      toast?.error ? toast.error("Bir sorun olustu.") : alert("Hata oluştu.")
    }
  }

  const handleContinueToBooking = () => {
    if (selectedServices.size === 0) return
    // Pass selected service IDs to the booking flow
    // Using URL parameters for simplicity in this case 
    // (or could use global state/context)
    const svcArray = Array.from(selectedServices).join(",")
    router.push(`/randevu-al?business_id=${businessId}&services=${svcArray}`)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">İşletme bulunamadı.</p>
      </div>
    )
  }

  const selectedList = services.filter((s) => selectedServices.has(s.id))
  const totalPrice = selectedList.reduce((sum, s) => sum + s.price, 0)
  const totalDuration = selectedList.reduce((sum, s) => sum + s.rawDuration, 0)
  const todayInfo = workingHours.find(h => h.isToday)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[720px]">
        <div className={cn("flex flex-col gap-6 pb-8", selectedServices.size > 0 && "pb-28")}>
          {/* Section 1 - Header */}
          <BusinessHeader business={business} todayInfo={todayInfo} />

          {/* Section 2 - Connection Banner */}
          {showBanner && (
            <ConnectionBanner onConnect={() => setConnectModalOpen(true)} />
          )}

          {/* Section 3 - Services */}
          <ServicesSection
            services={services}
            selectedIds={selectedServices}
            onToggle={toggleService}
          />

          {/* Section 4 - Staff */}
          <StaffSection staff={staff} />

          {/* Section 5 - Working Hours */}
          <WorkingHoursSection hours={workingHours} />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      {selectedServices.size > 0 && (
        <StickyBottomBar
          count={selectedServices.size}
          total={totalPrice}
          duration={totalDuration}
          onContinue={handleContinueToBooking}
        />
      )}

      {/* Connection Modal */}
      <RxModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title={"Isletmeye Baglan"}
        footer={
          <>
            <RxButton
              variant="ghost"
              size="md"
              onClick={() => setConnectModalOpen(false)}
            >
              Vazgec
            </RxButton>
            <RxButton
              variant="primary"
              size="md"
              onClick={handleConnectBusiness}
            >
              Baglan
            </RxButton>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {business.name} musteri listesine ekleneceksiniz. Onayliyor musunuz?
        </p>
      </RxModal>
    </div>
  )
}
