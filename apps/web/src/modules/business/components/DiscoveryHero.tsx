"use client"

import { useState } from "react"
import { Search, MapPin, Loader2, CalendarDays, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface DiscoveryHeroProps {
    onSearch: (query: string) => void
    isSearching?: boolean
    userName?: string
    upcomingAppointment?: {
        id: string
        businessName: string
        services: string
        date: string
        time: string
    }
}

export function DiscoveryHero({ onSearch, isSearching, userName, upcomingAppointment }: DiscoveryHeroProps) {
    const [query, setQuery] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearch(query)
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour >= 5 && hour < 12) return "Günaydın"
        if (hour >= 12 && hour < 18) return "İyi Günler"
        if (hour >= 18 && hour < 22) return "İyi Akşamlar"
        return "İyi Geceler"
    }

    const greeting = userName 
        ? `${getGreeting()}, ${userName.split(' ')[0]} 👋` 
        : `${getGreeting()} 👋`

    return (
        <div className="relative overflow-hidden rounded-[40px] bg-[#0A0A1B] p-8 md:p-14 text-white shadow-2xl border border-white/5">
            {/* Mesh Gradient Background */}
            <div className="absolute inset-0 z-0 overflow-hidden opacity-50">
                <motion.div 
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 45, 0],
                        x: [0, 50, 0]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -right-[10%] size-[600px] bg-primary/20 rounded-full blur-[120px]" 
                />
                <motion.div 
                    animate={{ 
                        scale: [1, 1.5, 1],
                        rotate: [0, -90, 0],
                        x: [0, -100, 0]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-[40%] -left-[10%] size-[500px] bg-blue-500/10 rounded-full blur-[100px]" 
                />
            </div>

            <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className="inline-block px-5 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] opacity-90 text-primary-foreground">
                        {greeting}
                    </span>
                    
                    {upcomingAppointment && (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400"
                        >
                            <CalendarDays className="size-3.5" />
                            Sıradaki Randevun: {upcomingAppointment.time}
                        </motion.div>
                    )}
                </div>

                <h1 className="text-4xl md:text-6xl font-black mb-10 leading-[1.1] tracking-tighter">
                    Aradığın Hizmeti <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-indigo-400">
                        Saniyeler İçinde Bul
                    </span>
                </h1>

                <form onSubmit={handleSubmit} className="relative max-w-2xl">
                    <div className="relative flex flex-col md:flex-row items-stretch md:items-center bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-2.5 transition-all duration-500 focus-within:bg-white/10 focus-within:ring-8 focus-within:ring-primary/10 group">
                        <div className="flex items-center flex-1 px-5 gap-3">
                            <Search className="size-6 text-white/30 group-focus-within:text-primary transition-colors duration-300" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="İşletme veya hizmet ara..."
                                className="w-full bg-transparent border-none outline-none py-5 text-xl font-bold placeholder:text-white/20 text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-primary hover:bg-primary-dark text-white px-10 py-5 rounded-[2rem] font-black tracking-widest text-sm transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 group/btn"
                        >
                            {isSearching ? <Loader2 className="size-5 animate-spin" /> : (
                                <>
                                    <span>ARA</span>
                                    <Sparkles className="size-4 group-hover/btn:animate-sparkle" />
                                </>
                            )}
                        </button>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/30">
                        <button
                            type="button"
                            className="flex items-center gap-2 hover:text-primary cursor-pointer transition-all hover:translate-x-1"
                        >
                            <MapPin className="size-3.5" />
                            <span>Yakınımdakileri Bul</span>
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>150+ Aktif İşletme</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
