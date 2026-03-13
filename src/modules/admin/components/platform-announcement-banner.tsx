"use client"

import { useState, useEffect } from "react"
import { Megaphone, X, Info, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react"
import { getActivePlatformAnnouncementsAction, type PlatformAnnouncement } from "@/src/modules/business/actions/announcement.actions"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface BannerProps {
    role: "patron" | "personel" | "musteri" | "admin"
}

export function PlatformAnnouncementBanner({ role }: BannerProps) {
    const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>([])
    const [dismissedIds, setDismissedIds] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchActive() {
            const res = await getActivePlatformAnnouncementsAction()
            if (res.success && res.data) {
                // Filter by role (admin sees all for testing)
                const relevant = res.data.filter((a: any) => {
                    if (role === 'admin') return true
                    if (a.target_role === 'all') return true
                    if (a.target_role === 'patron' && role === 'patron') return true
                    if (a.target_role === 'staff' && role === 'personel') return true
                    return false
                })
                setAnnouncements(relevant)
            }
            setLoading(false)
        }
        fetchActive()

        // Load dismissed from session storage
        const dismissed = sessionStorage.getItem("dismissed_platform_announcements")
        if (dismissed) setDismissedIds(JSON.parse(dismissed))
    }, [role])

    const handleDismiss = (id: string) => {
        const next = [...dismissedIds, id]
        setDismissedIds(next)
        sessionStorage.setItem("dismissed_platform_announcements", JSON.stringify(next))
    }

    const activeAnnouncements = announcements.filter(a => !dismissedIds.includes(a.id))

    if (loading || activeAnnouncements.length === 0) return null

    const typeConfig = {
        info: { icon: Info, cls: 'bg-blue-50 border-blue-200 text-blue-800', iconCls: 'text-blue-500' },
        warning: { icon: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-800', iconCls: 'text-amber-500' },
        danger: { icon: ShieldCheck, cls: 'bg-red-50 border-red-200 text-red-800', iconCls: 'text-red-500' },
        success: { icon: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', iconCls: 'text-emerald-500' }
    }

    return (
        <div className="flex flex-col gap-3 mb-6">
            <AnimatePresence>
                {activeAnnouncements.map((item) => {
                    const config = typeConfig[item.type as keyof typeof typeConfig] || typeConfig.info
                    const Icon = config.icon

                    return (
                        <motion.div
                            key={item.id}
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 0 }}
                            exit={{ height: 0, opacity: 0, marginTop: -12 }}
                            className={cn(
                                "relative overflow-hidden rounded-2xl border p-4 shadow-sm transition-all",
                                config.cls
                            )}
                        >
                            <div className="flex items-start gap-4 pr-8">
                                <div className={cn("mt-0.5 rounded-lg p-1.5 bg-white/50 shadow-sm", config.iconCls)}>
                                    <Icon className="size-4" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <h5 className="text-sm font-black tracking-tight">{item.title}</h5>
                                    <p className="text-xs font-bold opacity-90 leading-relaxed">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleDismiss(item.id)}
                                className="absolute right-3 top-3 rounded-lg p-1 hover:bg-black/5 transition-colors"
                            >
                                <X className="size-4 opacity-50" />
                            </button>
                        </motion.div>
                    )
                })}
            </AnimatePresence>
        </div>
    )
}
