"use client"

import { cn } from "@/lib/utils"
import { Clock, Sun, Sunset, Moon, Loader2 } from "lucide-react"

export interface TimeSlot {
    time: string
    status: "available" | "booked" | "break"
    staffId?: string
}

interface TimeSlotPickerProps {
    slots: TimeSlot[]
    selectedTime: string | null
    onTimeSelect: (time: string) => void
    loading?: boolean
}

export function TimeSlotPicker({
    slots,
    selectedTime,
    onTimeSelect,
    loading = false,
}: TimeSlotPickerProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="size-8 animate-spin mb-3" />
                <p className="text-sm">Müsait saatler kontrol ediliyor...</p>
            </div>
        )
    }

    if (slots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 border border-dashed rounded-2xl">
                <Clock className="size-8 text-muted-foreground/50 mb-3" />
                <p className="text-sm font-medium text-foreground">Uygun saat bulunamadı</p>
                <p className="text-xs text-muted-foreground mt-1 px-4">
                    Lütfen farklı bir tarih seçin veya işletme ile iletişime geçin.
                </p>
            </div>
        )
    }

    // Group slots
    const morning = slots.filter((s) => {
        const hour = Number.parseInt(s.time.split(":")[0])
        return hour < 12 && hour >= 6
    })

    const afternoon = slots.filter((s) => {
        const hour = Number.parseInt(s.time.split(":")[0])
        return hour >= 12 && hour < 18
    })

    const evening = slots.filter((s) => {
        const hour = Number.parseInt(s.time.split(":")[0])
        return hour >= 18 || hour < 6
    })

    const SlotGroup = ({
        title,
        icon: Icon,
        items,
    }: {
        title: string
        icon: any
        items: TimeSlot[]
    }) => {
        if (items.length === 0) return null

        return (
            <div className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                    <Icon className="size-4 text-primary" />
                    <h3 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                        {title}
                    </h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {items.map((slot) => {
                        const isSelected = selectedTime === slot.time
                        const isAvailable = slot.status === "available"

                        return (
                            <button
                                key={slot.time}
                                disabled={!isAvailable}
                                onClick={() => onTimeSelect(slot.time)}
                                className={cn(
                                    "py-3 px-2 rounded-xl text-sm font-semibold transition-all border",
                                    isSelected
                                        ? "bg-primary border-primary text-primary-foreground shadow-md"
                                        : isAvailable
                                            ? "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                                            : "bg-muted/50 border-transparent text-muted-foreground cursor-not-allowed opacity-60"
                                )}
                            >
                                {slot.time}
                            </button>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SlotGroup title="Sabah" icon={Sun} items={morning} />
            <SlotGroup title="Öğleden Sonra" icon={Sunset} items={afternoon} />
            <SlotGroup title="Akşam" icon={Moon} items={evening} />
        </div>
    )
}
