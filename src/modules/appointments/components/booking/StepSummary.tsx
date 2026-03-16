import { useMemo } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"
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
      ? { name: "Uygun personel atanacaktir", specialty: "" }
      : staffList.find((s) => s.id === selectedStaff) || {
        name: "—",
        specialty: "",
      }

  const endTime = useMemo(() => {
    if (!selectedTime) return ""
    const startMins = parseTime(selectedTime)
    return formatTime(startMins + totalDuration)
  }, [selectedTime, totalDuration])

  const dateLabel = `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}, ${DAYS_FULL_TR[selectedDate.getDay()]}`

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-foreground">Randevu Ozeti</h2>

      <div className="bg-card rounded-xl border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] divide-y divide-border">
        {/* Business */}
        <div className="flex items-center gap-3 p-4">
          <RxAvatar name={businessName} size="md" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {businessName}
            </p>
          </div>
        </div>

        {/* Kimin İçin? (Family Selection) */}
        {familyProfiles.length > 0 && (
          <div className="p-4 bg-primary/5 border-l-4 border-primary">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Kimin İçin Randevu Alıyorsunuz?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onFamilySelect(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                  selectedFamilyId === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border text-foreground hover:bg-muted"
                )}
              >
                Kendim İçin
              </button>
              {familyProfiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onFamilySelect(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                    selectedFamilyId === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  )}
                >
                  {p.full_name} ({p.relationship})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Hizmetler
          </p>
          {selectedSvcs.map((s) => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {s.name} · {s.duration} dk
              </span>
              <span className="text-sm text-foreground">{s.price} TL</span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
            <span className="text-sm font-bold text-foreground">Toplam</span>
            <span className="text-sm font-bold text-primary">
              {totalPrice} TL
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Tahmini Sure: ~{totalDuration} dk
          </p>
        </div>

        {/* Staff */}
        <div className="flex items-center gap-3 p-4">
          <RxAvatar name={staff.name} size="sm" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {staff.name}
            </p>
            {staff.specialty && <p className="text-xs text-muted-foreground">{staff.specialty}</p>}
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-3 p-4">
          <div className="size-8 rounded-lg bg-primary-light flex items-center justify-center">
            <CalendarDays className="size-4 text-primary" />
          </div>
          <p className="text-sm text-foreground">
            {dateLabel} · {selectedTime} - {endTime}
          </p>
        </div>

        {/* Note */}
        <div className="p-4">
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value.slice(0, 300))}
            placeholder="Uzmana notunuz (istege bagli)"
            className="w-full min-h-[80px] rounded-lg border px-3 py-2 text-sm resize-y"
          />
        </div>
      </div>
    </div>
  )
}
