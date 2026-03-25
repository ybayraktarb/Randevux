"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Clock, CreditCard, ExternalLink, ShieldAlert } from "lucide-react"
import { getSubscriptionAction } from "@/src/modules/business/actions/business.actions"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { cn } from "@/lib/utils"

interface SubscriptionBannerProps {
    businessId: string
    role: "patron" | "personel" | "super_admin" | "musteri"
}

export function SubscriptionBanner({ businessId, role }: SubscriptionBannerProps) {
    const [subData, setSubData] = useState<{
        status: string
        daysRemaining: number | null
    } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSubscription() {
            if (!businessId || (role !== "patron" && role !== "personel")) {
                setLoading(false)
                return
            }

            const result = await getSubscriptionAction(businessId)
            if (result.success && result.data) {
                setSubData({
                    status: result.data.status,
                    daysRemaining: result.data.daysRemaining
                })
            }
            setLoading(false)
        }

        fetchSubscription()
    }, [businessId, role])

    if (loading || !subData) return null

    // Sadece trialing (deneme) veya past_due (gecikmiş) durumlarında banner göster
    if (subData.status !== "trialing" && subData.status !== "past_due") return null

    const isPastDue = subData.status === "past_due"
    const isTrialing = subData.status === "trialing"

    return (
        <div className={cn(
            "w-full px-4 py-2 flex items-center justify-between text-sm transition-all animate-in fade-in slide-in-from-top-2",
            isPastDue ? "bg-red-600 text-white" : "bg-blue-600 text-white"
        )}>
            <div className="flex items-center gap-3">
                {isPastDue ? (
                    <ShieldAlert className="w-5 h-5" />
                ) : (
                    <Clock className="w-5 h-5" />
                )}
                <span>
                    {isPastDue ? (
                        <strong>Erişim Kısıtlı:</strong> 
                    ) : (
                        <strong>Deneme Süresi:</strong>
                    )}
                    {" "}
                    {isPastDue 
                        ? "Abonelik süreniz doldu. Bazı özellikler kısıtlanmış olabilir." 
                        : `Ücretsiz deneme sürenizin bitmesine ${subData.daysRemaining ?? "?"} gün kaldı.`}
                </span>
            </div>

            <div className="flex items-center gap-2">
                {role === "patron" && (
                    <RxButton 
                        variant="secondary" 
                        size="sm" 
                        className="h-8 gap-2 bg-white text-blue-700 hover:bg-blue-50 border-none"
                    >
                        <CreditCard className="w-4 h-4" />
                        Paketi Yükselt
                    </RxButton>
                )}
                {role === "personel" && isPastDue && (
                    <span className="opacity-80 italic">Lütfen yöneticinizle iletişime geçin.</span>
                )}
            </div>
        </div>
    )
}
