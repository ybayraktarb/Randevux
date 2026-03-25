import { cn } from "@/lib/utils"
import { MapPin, Phone, Clock, Star, Heart } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxBadge } from "@/src/modules/core/components/rx-badge"
import type { Business, WorkingDay } from "./types"

export function BusinessHeaderWidget({
  business,
  todayInfo,
  onToggleFavorite
}: {
  business: Business
  todayInfo?: WorkingDay
  onToggleFavorite: () => void
}) {
  const initials = (business.name || "?").substring(0, 2).toUpperCase()

  return (
    <section className="bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-sm relative z-10">
      {/* Cover */}
      <div className="h-[240px] w-full bg-gradient-to-br from-primary via-indigo-500 to-primary-hover relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Profile Info */}
      <div className="relative px-4 pb-5 sm:px-8 max-w-5xl mx-auto -mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
            {/* Avatar */}
            <div>
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="size-28 rounded-[32px] border-4 border-white bg-white/50 backdrop-blur-md object-cover shadow-2xl shadow-indigo-500/20"
                />
              ) : (
                <div className="flex size-28 items-center justify-center rounded-[32px] border-4 border-white bg-white/80 backdrop-blur-md text-3xl font-black text-primary shadow-2xl shadow-indigo-500/20">
                  {initials}
                </div>
              )}
            </div>

            {/* Name & Category */}
            <div className="pb-2">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {business.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <RxBadge variant="purple" className="px-3 py-1 font-bold text-[11px] uppercase tracking-widest">{business.category || "Genel"}</RxBadge>
                {business.averageRating && (
                  <button
                    type="button"
                    aria-label="Değerlendirmeleri gör"
                    className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 px-3 py-1 rounded-full transition-colors border border-gray-100"
                    onClick={() => {
                      const el = document.getElementById("reviews-section")
                      if (el) el.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-gray-900">{business.averageRating}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">({business.reviewCount} Yorum)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pb-2 w-full sm:w-auto">
            <RxButton variant="secondary" size="md" className="gap-2 flex-1 sm:flex-none rounded-2xl shadow-sm border border-gray-100 bg-white" onClick={() => {
              if (business.phone) globalThis.open(`tel:${business.phone}`)
            }}>
              <Phone className="size-4" />
              <span className="text-[11px] font-black uppercase tracking-widest">Ara</span>
            </RxButton>
            <RxButton
              variant="secondary"
              size="md"
              className={cn(
                "gap-2 flex-1 sm:flex-none rounded-2xl shadow-sm transition-all",
                business.isFavorite 
                  ? "text-rose-600 border-rose-200 bg-rose-50 hover:bg-rose-100" 
                  : "border-gray-100 bg-white hover:bg-gray-50"
              )}
              onClick={onToggleFavorite}
            >
              <Heart className={cn("size-4", business.isFavorite && "fill-current")} />
              <span className="text-[11px] font-black uppercase tracking-widest">
                {business.isFavorite ? "Favorilerde" : "Favoriye Ekle"}
              </span>
            </RxButton>
          </div>
        </div>

        {/* Info Row */}
        <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 p-5 rounded-[24px] bg-white/60 backdrop-blur-xl border border-gray-100">
          {business.address && (
            <div className="flex items-start gap-3 flex-1 min-w-[200px]">
              <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <MapPin className="size-4 text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">{business.address}</p>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <Phone className="size-4 text-gray-500" />
              </div>
              <p className="text-sm font-bold text-gray-900">{business.phone}</p>
            </div>
          )}
          {todayInfo && (
            <div className="flex items-center gap-3">
              <div className={cn(
                "size-8 rounded-xl flex items-center justify-center shrink-0",
                todayInfo.isClosed ? "bg-rose-50" : "bg-emerald-50"
              )}>
                <Clock className={cn("size-4", todayInfo.isClosed ? "text-rose-500" : "text-emerald-500")} />
              </div>
              <p className="text-sm font-bold text-gray-900">
                {`Bugün ${todayInfo.isClosed ? 'Kapalı' : todayInfo.hours} \u00B7 `}
                <span className={cn("font-black uppercase tracking-widest ml-1 text-[11px]", todayInfo.isClosed ? "text-rose-600" : "text-emerald-600")}>
                  {todayInfo.isClosed ? "KAPALI" : "AÇIK"}
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
