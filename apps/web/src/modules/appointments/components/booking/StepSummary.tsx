import { useMemo } from "react"
import { CalendarDays, Clock, MapPin, ReceiptText, ChevronRight, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { Service, Staff, MONTHS_TR, DAYS_FULL_TR } from "./types"

function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function formatTime(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function StepSummary({
  businessName,
  services,
  staffList,
  selectedServices,
  selectedStaff,
  selectedDate,
  selectedTime,
  note,
  onNoteChange,
  familyProfiles,
  selectedFamilyId,
  onFamilySelect,
}: {
  businessName: string
  services: Service[]
  staffList: Staff[]
  selectedServices: string[]
  selectedStaff: string | null
  selectedDate: Date
  selectedTime: string | null
  note: string
  onNoteChange: (v: string) => void
  familyProfiles: any[]
  selectedFamilyId: string | null
  onFamilySelect: (id: string | null) => void
}) {
  const selectedSvcs = services.filter((s) => selectedServices.includes(s.id))
  const totalPrice = selectedSvcs.reduce((acc, s) => acc + s.price, 0)
  const totalDuration = selectedSvcs.reduce((acc, s) => acc + s.duration, 0)
  const staff =
    selectedStaff === "ANY"
      ? { name: "Uygun Personel", specialty: "Sistem tarafından atanacak" }
      : staffList.find((s) => s.id === selectedStaff) || {
        name: "—",
        specialty: "",
      }

  const endTime = useMemo(() => {
    if (!selectedTime) return ""
    const startMins = parseTime(selectedTime)
    return formatTime(startMins + totalDuration)
  }, [selectedTime, totalDuration])

  const dateLabel = `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
  const dayLabel = DAYS_FULL_TR[selectedDate.getDay()]

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-1">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Randevu Özeti</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Lütfen detayları kontrol edin
        </p>
      </div>

      {/* Digital Ticket Layout */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group h-full"
      >
        {/* Shadow layer for depth */}
        <div className="absolute inset-0 bg-primary/10 rounded-[2rem] blur-2xl group-hover:bg-primary/15 transition-all duration-500" />
        
        <div className="relative bg-card rounded-[2rem] border-2 border-border shadow-2xl overflow-hidden">
          {/* Top Section - Business Info */}
          <div className="p-8 bg-gradient-to-br from-background via-card to-muted/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <RxAvatar name={businessName} size="lg" className="ring-4 ring-background shadow-lg" />
                <div>
                  <h3 className="text-lg font-black text-foreground leading-tight">{businessName}</h3>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">İşletme Bilgisi</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Durum</div>
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Hazır
                </div>
              </div>
            </div>

            {/* Ticket Perforation Simulation */}
            <div className="absolute left-0 right-0 top-[52%] flex items-center gap-2 px-1 opacity-20 pointer-events-none">
              <div className="size-6 -ml-3 rounded-full bg-border border-2 border-background" />
              <div className="flex-1 border-t-2 border-dashed border-border" />
              <div className="size-6 -mr-3 rounded-full bg-border border-2 border-background" />
            </div>

            {/* Middle Section - Date & Time Grid */}
            <div className="grid grid-cols-2 gap-8 my-8 pt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <CalendarDays className="size-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tarih</span>
                </div>
                <p className="text-base font-black text-foreground">{dateLabel}</p>
                <p className="text-[12px] font-bold text-muted-foreground uppercase">{dayLabel}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <Clock className="size-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Saat</span>
                </div>
                <p className="text-base font-black text-foreground">{selectedTime} - {endTime}</p>
                <p className="text-[12px] font-bold text-muted-foreground uppercase">{totalDuration} DK Toplam</p>
              </div>
            </div>
          </div>

          {/* Bottom Section - Services & Staff */}
          <div className="p-8 space-y-8 bg-card relative">
            {/* Staff Circle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
              <div className="flex items-center gap-3">
                <RxAvatar name={staff.name} size="md" className="shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Uzman</p>
                  <p className="text-sm font-black text-foreground">{staff.name}</p>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/30" />
            </div>

            {/* Services List */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground pb-2 border-b border-border/50">
                <ReceiptText className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hizmetler</span>
              </div>
              {selectedSvcs.map((s) => (
                <div key={s.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-foreground">{s.name}</span>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">{s.duration} dk</span>
                  </div>
                  <span className="text-sm font-black text-primary">{s.price} TL</span>
                </div>
              ))}
            </div>

            {/* Note Area */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="size-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Uzmana Not (Opsiyonel)</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value.slice(0, 300))}
                placeholder="Özel isteklerinizi buraya yazabilirsiniz..."
                className="w-full min-h-[100px] rounded-2xl border-2 border-border bg-background px-4 py-3 text-sm focus:border-primary/30 focus:ring-0 transition-all font-medium placeholder:text-muted-foreground/40"
              />
            </div>

            {/* Family Selection (If any) */}
            {familyProfiles.length > 0 && (
              <div className="pt-6 border-t border-border/50">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 text-center">
                  Randevu Sahibi
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => onFamilySelect(null)}
                    className={cn(
                      "px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all",
                      selectedFamilyId === null
                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                        : "bg-background border-border text-foreground hover:bg-muted"
                    )}
                  >
                    KENDİM
                  </button>
                  {familyProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onFamilySelect(p.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border-2 transition-all",
                        selectedFamilyId === p.id
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                          : "bg-background border-border text-foreground hover:bg-muted"
                      )}
                    >
                      {p.full_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <div className="h-24" /> {/* Spacer for the fixed button layer in parent */}
    </div>
  )
}
