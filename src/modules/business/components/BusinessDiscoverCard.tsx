"use client"

import Link from "next/link"
import { Star, MapPin, Clock, ArrowRight } from "lucide-react"
import { RxAvatar } from "@/src/modules/core/components/rx-avatar"
import { cn } from "@/lib/utils"
import { DiscoveryBusiness } from "@/src/modules/business/actions/discovery.actions"

interface BusinessDiscoverCardProps {
    business: DiscoveryBusiness
}

export function BusinessDiscoverCard({ business }: BusinessDiscoverCardProps) {
    return (
        <Link
            href={`/isletme/${business.id}`}
            aria-label={`${business.name} işletme detaylarını gör`}
            className="group bg-card border border-border/50 rounded-[32px] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 cursor-pointer relative overflow-hidden text-left w-full block"
        >
            {/* Category Tag */}
            <div className="absolute top-6 right-6 z-10">
                <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-widest border border-primary/10 backdrop-blur-md">
                    {business.category_name}
                </span>
            </div>

            <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    <div className="size-16 rounded-[22px] overflow-hidden bg-primary/5 p-0.5 border border-primary/10 group-hover:scale-105 transition-transform duration-500">
                        {business.logo_url ? (
                            <img src={business.logo_url} alt={business.name} className="size-full object-cover rounded-[20px]" />
                        ) : (
                            <div className="size-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-primary font-black text-2xl rounded-[20px]">
                                {business.name.substring(0, 1).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-black text-foreground group-hover:text-primary transition-colors truncate">
                            {business.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 text-yellow-500">
                            <Star className="size-4 fill-current" />
                            <span className="text-sm font-black">{business.rating || "5.0"}</span>
                            <span className="text-muted-foreground text-xs font-medium ml-0.5">({business.review_count || 0})</span>
                        </div>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium">
                    {business.description || "Hemen randevunuzu alın ve kaliteli hizmetin tadını çıkarın."}
                </p>

                <div className="pt-2 flex items-center justify-between border-t border-border/30">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="size-4" />
                            <span className="text-xs font-bold">2.4 km</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-500">
                            <div className="size-1.5 rounded-full bg-current animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-wider">Açık</span>
                        </div>
                    </div>

                    <div className="size-10 rounded-2xl bg-muted group-hover:bg-primary transition-all duration-300 flex items-center justify-center">
                        <ArrowRight className="size-5 text-muted-foreground group-hover:text-primary-foreground transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-8 -right-8 size-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
        </Link>
    )
}
