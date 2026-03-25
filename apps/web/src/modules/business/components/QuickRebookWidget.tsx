"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RefreshCcw, ArrowRight, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { getQuickRebookDataAction } from "@/src/modules/auth/actions/auth.actions"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export function QuickRebookWidget() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function load() {
            const res = await getQuickRebookDataAction()
            if (res.success) {
                setData(res.data || [])
            }
            setLoading(false)
        }
        load()
    }, [])

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="w-[320px] shrink-0 h-48 bg-gray-100 animate-pulse rounded-[32px]" />
                ))}
            </div>
        )
    }

    if (data.length === 0) return null

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tekrar Randevu Al</h2>
                    <p className="text-muted-foreground font-medium text-sm mt-1">En son aldığın hizmetlere elite bir dokunuşla geri dön</p>
                </div>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                {data.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => router.push(`/randevu-al?business_id=${item.businessId}&services=${item.serviceIds}`)}
                        className="w-[300px] xs:w-[340px] snap-start shrink-0 group bg-white/40 backdrop-blur-xl border border-white/40 rounded-[36px] p-6 transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-primary/5 hover:border-primary/30 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                    >
                        {/* Elite Glow Effect */}
                        <div className="absolute top-0 right-0 size-24 bg-primary/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />

                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="size-16 rounded-2xl overflow-hidden bg-white p-1 shadow-sm ring-1 ring-black/5 group-hover:ring-primary/20 transition-all">
                                    {item.businessLogo ? (
                                        <img src={item.businessLogo} alt={item.businessName} className="size-full object-cover rounded-[14px]" />
                                    ) : (
                                        <div className="size-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl rounded-[14px]">
                                            {item.businessName.substring(0, 1)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-1 leading-tight">{item.businessName}</h3>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Sparkles className="size-3 text-primary" />
                                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">{item.category}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="size-11 rounded-2xl bg-white/80 border border-white/50 flex items-center justify-center text-gray-400 shadow-sm group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                                <RefreshCcw className="size-5 group-hover:rotate-180 transition-transform duration-700" />
                            </div>
                        </div>

                        <div className="mt-8 pt-5 border-t border-dashed border-gray-100 flex items-end justify-between relative z-10">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Son Tercihin</span>
                                <p className="text-sm font-black text-gray-700 line-clamp-1">{item.serviceNames}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                    <Clock className="size-3" />
                                    {new Date(item.lastDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                                </div>
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Hızlı Tekrarla →</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-[120px] shrink-0 flex items-center justify-center"
                >
                    <button
                        onClick={() => router.push('/randevularim')}
                        className="flex flex-col items-center gap-3 group"
                    >
                        <div className="size-16 rounded-full bg-white/50 backdrop-blur-md border border-white flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-xl group-hover:shadow-primary/20 transition-all duration-300">
                            <ArrowRight className="size-7 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Tümü</span>
                    </button>
                </motion.div>
            </div>
        </div>
    )
}
