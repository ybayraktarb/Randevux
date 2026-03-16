import { Calendar, Clock, User, Building2, ArrowRight, CalendarPlus, Loader2 } from "lucide-react"
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxButton } from "@/src/modules/core/components/rx-button"

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
      title="Randevu Detayları"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Randevu detayları yükleniyor...</p>
        </div>
      ) : appointment ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4 border border-border">
            <div className="flex items-center justify-between font-bold">
              <span className="text-lg">{appointment.businesses?.name}</span>
              <span className="text-primary">{appointment.total_price} TL</span>
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="size-4" />
                <span>{new Date(appointment.appointment_date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4" />
                <span>{String(appointment.start_time).slice(0, 5)} - {appointment.total_duration_minutes} dk</span>
              </div>
              {appointment.staff_business?.users?.name && (
                <div className="flex items-center gap-2">
                  <User className="size-4" />
                  <span>Uzman: {appointment.staff_business.users.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-3">
            <h4 className="text-sm font-bold uppercase text-muted-foreground">Alınan Hizmetler</h4>
            <div className="grid gap-2">
              {appointment.appointment_services?.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                  <span>{s.services?.name}</span>
                  <span className="font-medium">{s.price_snapshot} TL</span>
                </div>
              ))}
            </div>
          </div>

          {appointment.businesses?.address && (
            <div className="grid gap-2">
              <h4 className="text-sm font-bold uppercase text-muted-foreground">Konum</h4>
              <div className="flex items-start gap-2 text-sm">
                <Building2 className="mt-1 size-4 shrink-0" />
                <p>{appointment.businesses.address}</p>
              </div>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.businesses.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                Haritada Gör <ArrowRight className="size-3" />
              </a>
            </div>
          )}

          <div className="grid gap-3 pt-4 border-t border-border">
            <div className="flex flex-col gap-2">
              <a
                href={generateCalendarUrl(appointment)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-semibold transition-colors hover:bg-muted cursor-pointer"
              >
                <CalendarPlus className="size-4" /> Takvime Ekle
              </a>

              {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                <RxButton
                  variant="ghost"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onCancel(appointment.id, appointment.business_id, new Date(`${appointment.appointment_date}T${appointment.start_time}`))}
                >
                  Randevuyu İptal Et
                </RxButton>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">Randevu detayları bulunamadı.</div>
      )}
    </RxModal>
  )
}
