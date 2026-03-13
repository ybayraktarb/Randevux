"use client"

import { cn } from "@/lib/utils"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { CalendarDays, Clock, MapPin, Scissors, User } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface BookingSummaryProps {
    businessName: string
    services: { name: string; duration: number; price: number }[]
    staffName?: string
    date?: Date
    time?: string
    totalPrice: number
    totalDuration: number
    className?: string
}

export function BookingSummary({
    businessName,
    services,
    staffName,
    date,
    time,
    totalPrice,
    totalDuration,
    className,
}: BookingSummaryProps) {
    return (
        <div
            className={cn(
                "bg-card rounded-2xl border border-border shadow-xl shadow-foreground/5 overflow-hidden sticky top-6",
                className
            )}
        >
            <div className="p-5 border-b border-border bg-muted/30">
                <h3 className="font-bold text-lg">Randevu Özeti</h3>
            </div>

            <div className="p-5 space-y-6">
                {/* Business */}
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">İşletme</p>
                        <p className="font-bold truncate">{businessName}</p>
                    </div>
                </div>

                {/* Services */}
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Scissors className="size-5 text-orange-500" />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hizmetler</p>
                    </div>
                    <div className="pl-13 space-y-2">
                        {services.map((s, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-foreground/80">{s.name}</span>
                                <span className="font-semibold">{s.price} TL</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Staff */}
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <User className="size-5 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Uzman</p>
                        <p className="font-bold truncate">{staffName || "—"}</p>
                    </div>
                </div>

                {/* Date & Time */}
                {(date || time) && (
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                            <CalendarDays className="size-5 text-purple-500" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tarih & Saat</p>
                            <p className="font-bold truncate">
                                {date ? format(date, "d MMMM EEEE", { locale: tr }) : ""}
                                {time ? ` @ ${time}` : " —"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Total */}
            <div className="p-5 bg-primary/5 border-t border-border">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-muted-foreground">Tahmini Süre</span>
                    <span className="text-sm font-bold flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {totalDuration} dk
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Toplam Tutar</span>
                    <span className="font-black text-2xl text-primary">{totalPrice} TL</span>
                </div>
            </div>
        </div>
    )
}
