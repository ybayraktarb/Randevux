"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { RefreshCcw, ArrowRight, Star, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { getQuickRebookDataAction } from "@/src/modules/auth/actions/auth.actions"
import { useRouter } from "next/navigation"

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
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {[1, 2].map((i) => (
                    <div key={i} className="w-[300px] shrink-0 h-40 bg-muted animate-pulse rounded-[32px]" />
                ))}
            </div>
        )
    }

    if (data.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Tekrar Randevu Al</h2>
                    <p className="text-muted-foreground font-medium text-sm">En son aldığın hizmetlere hızlıca dön</p>
                </div>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {data.map((item) => (
                    <Link
                        key={item.id}
                        href={`/randevu-al?business_id=${item.businessId}&services=${item.serviceIds}`}
                        className="w-[320px] shrink-0 group bg-white border border-gray-100 rounded-[32px] p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/20 cursor-pointer flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-2xl overflow-hidden bg-primary/5 p-0.5 border border-primary/10">
                                    {item.businessLogo ? (
                                        <img src={item.businessLogo} alt={item.businessName} className="size-full object-cover rounded-[18px]" />
                                    ) : (
                                        <div className="size-full bg-primary/20 flex items-center justify-center text-primary font-black text-xl rounded-[18px]">
                                            {item.businessName.substring(0, 1)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-black text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{item.businessName}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{item.category}</p>
                                </div>
                            </div>
                            <div className="size-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary group-hover:text-white transition-all">
                                <RefreshCcw className="size-5" />
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-end justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">En Son Hizmet</p>
                                <p className="text-sm font-bold text-gray-700 line-clamp-1">{item.serviceNames}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-black text-gray-300 uppercase">
                                <Clock className="size-3" />
                                {new Date(item.lastDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </div>
                        </div>
                    </Link>
                ))}

                <div className="w-[100px] shrink-0 flex items-center justify-center">
                    <button
                        onClick={() => router.push('/randevularim')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="size-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight className="size-6" />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">Geçmişim</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
