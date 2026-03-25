import { Calendar, Clock, User, Building2, ArrowRight, CalendarPlus, Ticket, MapPin, CheckCircle2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { RxSkeleton } from "@/src/modules/core/components/rx-skeleton"

export function DetailsModal({
  open,
  onClose,
  loading,
  appointment,
  onCancel,
  generateCalendarUrl
}: {
  open: boolean
  onClose: () => void
  loading: boolean
  appointment: any
  onCancel: (id: string, bizId: string, date: Date) => void
  generateCalendarUrl: (apt: any) => string
}) {
  return (
    <RxModal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
            <Ticket className="size-5 text-primary" />
            <span className="font-black uppercase tracking-widest text-sm">Rezervasyon Özeti</span>
        </div>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-8 py-4">
          <div className="relative overflow-hidden rounded-[32px] bg-gray-50/50 p-6 border border-dashed border-gray-200">
             <RxSkeleton className="h-24 w-full rounded-2xl" />
          </div>
          <div className="grid gap-4">
            <RxSkeleton className="h-10 w-full rounded-2xl" />
            <RxSkeleton className="h-10 w-full rounded-2xl" />
          </div>
          <div className="pt-6 border-t border-dashed border-gray-200">
             <RxSkeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      ) : appointment ? (
        <div className="flex flex-col gap-8 py-2">
          {/* Main Ticket Header */}
          <div className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white border border-gray-100 shadow-xl shadow-gray-100/50 p-6 sm:p-8">
             <div className="absolute top-0 right-0 p-3 sm:p-4">
                 <div className="size-2.5 sm:size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
             </div>
             
             <div className="space-y-5 sm:space-y-6">
                 <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-2">{appointment.businesses?.name}</h3>
                    <div className="flex items-center gap-2">
                         <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/10">
                            Elite Rezervasyon
                         </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tarih</p>
                        <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                            <Calendar className="size-4 text-primary" />
                            {new Date(appointment.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saat</p>
                        <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                            <Clock className="size-4 text-primary" />
                            {String(appointment.start_time).slice(0, 5)}
                        </div>
                    </div>
                 </div>
             </div>
          </div>

          {/* Services Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Hizmet Detayları</h4>
                <div className="hidden sm:block h-[1px] flex-1 bg-gradient-to-r from-gray-100 to-transparent ml-4" />
            </div>
            
            <div className="space-y-3">
              {appointment.appointment_services?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <CheckCircle2 className="size-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">{s.services?.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">{s.price_snapshot} TL</span>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-gray-400 tracking-widest uppercase">Toplam Tutar</span>
                <span className="text-xl sm:text-2xl font-black text-primary tracking-tighter">{appointment.total_price} TL</span>
            </div>
          </div>

          {/* Location & Expert */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {appointment.staff_business?.users?.name && (
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Uzman</p>
                   <div className="flex items-center gap-2">
                       <User className="size-4 text-primary" />
                       <span className="text-xs font-bold text-gray-700">{appointment.staff_business.users.name}</span>
                   </div>
                </div>
               )}
               {appointment.businesses?.address && (
                <div className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Konum</p>
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.businesses.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                        <MapPin className="size-4 text-primary" />
                        <span className="text-xs font-bold text-gray-700 truncate">{appointment.businesses.city || "Haritada Gör"}</span>
                    </a>
                </div>
               )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-dashed border-gray-100 space-y-3">
              <RxButton
                onClick={() => window.open(generateCalendarUrl(appointment), '_blank')}
                className="w-full h-14 rounded-2xl bg-white border border-gray-200 shadow-sm text-[11px] font-black tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500 text-gray-600"
              >
                <CalendarPlus className="size-5" /> TAKVİME EKLE
              </RxButton>

              {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                <button
                  className="w-full py-4 text-[11px] font-black text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-[0.2em]"
                  onClick={() => onCancel(appointment.id, appointment.business_id, new Date(`${appointment.appointment_date}T${appointment.start_time}`))}
                >
                  Rezervasyonu İptal Et
                </button>
              )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">Randevu detayları bulunamadı.</div>
      )}
    </RxModal>
  )
}
