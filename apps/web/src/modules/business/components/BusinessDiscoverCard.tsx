"use client"

import Link from "next/link"
import { Star, MapPin, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryBusiness } from "@/src/modules/business/actions/discovery.actions"
import { motion } from "framer-motion"

interface BusinessDiscoverCardProps {
    business: DiscoveryBusiness
}

export function BusinessDiscoverCard({ business }: BusinessDiscoverCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group block"
        >
            <Link
                href={`/isletme/${business.id}`}
                aria-label={`${business.name} işletme detaylarını gör`}
                className="bg-white/40 backdrop-blur-xl border border-white/40 rounded-[40px] p-8 transition-all duration-500 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] hover:shadow-primary/5 hover:border-primary/30 cursor-pointer relative overflow-hidden text-left w-full block"
            >
                <div className="flex flex-col gap-8 relative z-10">
                    <div className="flex items-start gap-5">
                        <div className="size-20 rounded-[28px] overflow-hidden bg-white p-1 shadow-lg ring-1 ring-black/5 group-hover:ring-primary/20 transition-all duration-500 relative">
                            {business.logo_url ? (
                                <img src={business.logo_url} alt={business.name} className="size-full object-cover rounded-[24px]" />
                            ) : (
                                <div className="size-full bg-gradient-to-br from-primary/10 to-indigo-500/10 flex items-center justify-center text-primary font-black text-3xl rounded-[24px]">
                                    {business.name.substring(0, 1).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0 pt-2">
                            <h3 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors truncate tracking-tight">
                                {business.name}
                            </h3>
                            <div className="flex items-center flex-wrap gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/10">
                                    <Star className="size-3.5 fill-yellow-500 text-yellow-500" />
                                    <span className="text-xs font-black text-yellow-600">{business.rating || "5.0"}</span>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.1em] border border-primary/10">
                                    {business.category_name}
                                </span>
                                <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest ml-1">{business.review_count || 0} Yorum</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-[15px] text-gray-500 line-clamp-2 leading-relaxed font-bold opacity-80 group-hover:opacity-100 transition-opacity">
                        {business.description || "Hemen randevunuzu alın ve kaliteli hizmetin tadını çıkarın."}
                    </p>

                    <div className="pt-6 flex items-center justify-between border-t border-dashed border-gray-100">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest">
                                <MapPin className="size-4 text-primary/40" />
                                <span>2.4 km Uzakta</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 text-emerald-500">
                                <div className="size-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Açık</span>
                            </div>
                        </div>

                        <div className="size-12 rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center text-gray-300">
                            <ArrowRight className="size-6 transform group-hover:translate-x-0.5 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Glassy Background Decor */}
                <div className="absolute -bottom-12 -right-12 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
                <div className="absolute -top-12 -left-12 size-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-700" />
            </Link>
        </motion.div>
    )
}
