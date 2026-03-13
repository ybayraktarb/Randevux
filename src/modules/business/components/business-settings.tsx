"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { 
  Building2, 
  User, 
  Calendar, 
  Clock, 
  CalendarOff, 
  QrCode, 
  Loader2 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BusinessProfileForm } from "@/src/modules/business/components/business-profile-form"
import { AppointmentPoliciesForm } from "@/src/modules/business/components/appointment-policies-form"
import { BusinessHoursConfig } from "@/src/modules/business/components/business-hours-config"
import { ClosedDatesConfig } from "@/src/modules/business/components/closed-dates-config"
import { AnnouncementManager } from "@/src/modules/business/components/announcement-manager"
import { ProfileForm } from "@/src/modules/auth/components/profile-form"

export function BusinessSettings() {
    const { user } = useCurrentUser()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<"business" | "appointment" | "profile" | "hours" | "closed" | "announcements">("business")
    const [businessData, setBusinessData] = useState<any>(null)

    useEffect(() => {
        if (!user) return
        async function load() {
            setLoading(true)
            const { data: ownerData } = await supabase.from("business_owners").select("business_id").eq("user_id", user!.id).maybeSingle()
            if (ownerData?.business_id) {
                const { data: biz } = await supabase.from("businesses").select("*").eq("id", ownerData.business_id).maybeSingle()
                setBusinessData(biz)
            }
            setLoading(false)
        }
        load()
    }, [user, supabase])

    if (loading) return <div className="flex items-center justify-center p-20"><Loader2 className="size-8 animate-spin text-primary" /></div>

    const tabs = [
        { key: "business" as const, label: "İşletme", icon: Building2 },
        { key: "hours" as const, label: "Çalışma Saatleri", icon: Clock },
        { key: "closed" as const, label: "Kapalı Günler", icon: CalendarOff },
        { key: "announcements" as const, label: "Duyurular", icon: QrCode },
        { key: "appointment" as const, label: "Randevu Ayarları", icon: Calendar },
        { key: "profile" as const, label: "Profil", icon: User },
    ]

    return (
        <div className="flex flex-col gap-8 pb-20">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ayarlar</h1>
                <p className="text-sm font-bold text-muted-foreground">İşletme ve profil ayarlarınızı buradan yönetebilirsiniz.</p>
            </div>

            <div className="flex p-1.5 bg-gray-100/80 rounded-[20px] w-fit self-start border border-gray-200/50 sticky top-24 z-20 backdrop-blur-md">
                <div className="flex gap-1 relative">
                    {tabs.map((t) => {
                        const isActive = activeTab === t.key
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => setActiveTab(t.key as any)}
                                className={cn(
                                    "relative z-10 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    isActive
                                        ? "text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="settings-tab-active"
                                        className="absolute inset-0 bg-white rounded-2xl shadow-md -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <t.icon className="size-4" />
                                <span className="hidden sm:inline">{t.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="relative mt-2">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {activeTab === "business" && businessData && (
                            <BusinessProfileForm business={businessData} />
                        )}

                        {activeTab === "appointment" && businessData && (
                            <AppointmentPoliciesForm business={businessData} />
                        )}

                        {activeTab === "hours" && businessData && (
                            <BusinessHoursConfig businessId={businessData.id} />
                        )}

                        {activeTab === "closed" && businessData && (
                            <ClosedDatesConfig businessId={businessData.id} />
                        )}

                        {activeTab === "announcements" && businessData && (
                            <AnnouncementManager businessId={businessData.id} />
                        )}

                        {activeTab === "profile" && user && (
                            <ProfileForm 
                                user={user} 
                                initialData={{
                                    name: user.user_metadata?.name || "", 
                                    phone: user.user_metadata?.phone || "",
                                    email: user.email || ""
                                }} 
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
