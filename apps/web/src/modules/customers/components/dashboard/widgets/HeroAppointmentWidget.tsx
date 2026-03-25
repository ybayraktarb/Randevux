"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Calendar, Clock, MapPin, ChevronRight, CalendarDays, Sparkles } from "lucide-react"

export interface HeroAppointmentWidgetProps {
    appointment: {
        id: string
        businessName: string
        services: string
        date: string
        time: string
    }
}

export function HeroAppointmentWidget({ appointment }: HeroAppointmentWidgetProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-primary/5 to-indigo-500/5 backdrop-blur-xl border border-white/40 p-1"
        >
            <Link
                href={`/randevularim/${appointment.id}`}
                className="flex flex-col md:flex-row md:items-center justify-between gap-8 p-8 rounded-[38px] bg-white/40 hover:bg-white/60 transition-all duration-500 group"
            >
                <div className="flex items-center gap-6">
                    <div className="size-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center text-primary relative">
                        <CalendarDays className="size-10 group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute -top-1 -right-1 size-4 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">Sıradaki Randevun</span>
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-1">
                            {appointment.businessName}
                        </h3>
                        <p className="text-gray-500 font-bold text-base flex items-center gap-2">
                            <Sparkles className="size-4 text-primary/40" />
                            {appointment.services}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="flex flex-wrap md:flex-nowrap items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="size-12 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500"
                        >
                            <MapPin className="size-5" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="size-12 rounded-2xl bg-white/80 border border-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-500"
                        >
                            <Calendar className="size-5" />
                        </motion.button>
                    </div>

                    <div className="flex items-center gap-6 border-l border-dashed border-gray-200/50 pl-6">
                        <div className="flex flex-col items-end gap-2 text-right">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Randevu Vakti</div>
                            <div className="flex items-center gap-3 text-gray-900 font-black text-base tracking-tight leading-none">
                                <Clock className="size-4 text-primary" />
                                {appointment.date} @ {appointment.time}
                            </div>
                        </div>
                        <div className="size-14 rounded-[22px] bg-white border border-white shadow-sm flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-500">
                            <ChevronRight className="size-7 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    )
}
