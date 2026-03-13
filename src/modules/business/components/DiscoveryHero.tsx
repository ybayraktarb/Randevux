"use client"

import { useState } from "react"
import { Search, MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DiscoveryHeroProps {
    onSearch: (query: string) => void
    isSearching?: boolean
    userName?: string
}

export function DiscoveryHero({ onSearch, isSearching, userName }: DiscoveryHeroProps) {
    const [query, setQuery] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearch(query)
    }

    const greeting = userName ? `Selam ${userName.split(' ')[0]} 👋` : "Hoş Geldin 👋"

    return (
        <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 md:p-12 text-white shadow-2xl">
            {/* Decorative Gradients */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 size-[400px] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 size-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-xs font-black uppercase tracking-widest mb-6 opacity-80">
                    {greeting}
                </span>
                <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                    Aradığın Hizmeti <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                        Saniyeler İçinde Bul
                    </span>
                </h1>

                <form onSubmit={handleSubmit} className="relative group">
                    <div className="relative flex items-center bg-white/10 backdrop-blur-2xl border border-white/10 rounded-3xl p-2 transition-all duration-300 focus-within:bg-white/20 focus-within:ring-4 focus-within:ring-primary/20">
                        <div className="flex items-center flex-1 px-4 gap-3">
                            <Search className="size-6 text-white/40 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="İşletme veya hizmet ara..."
                                className="w-full bg-transparent border-none outline-none py-4 text-lg font-bold placeholder:text-white/30 text-white"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSearching}
                            className="bg-primary hover:bg-primary-dark text-primary-foreground px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 className="size-5 animate-spin" /> : "ARA"}
                        </button>
                    </div>

                    <div className="mt-6 flex items-center gap-6 text-sm font-bold text-white/40">
                        <div className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                            <MapPin className="size-4" />
                            <span>Yakınımdakileri Bul</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span>150+ Aktif İşletme</span>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
