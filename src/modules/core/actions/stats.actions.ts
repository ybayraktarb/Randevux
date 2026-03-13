"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"

/**
 * Müşteriye özel harcama ve randevu istatistiklerini getirir
 */
export async function getCustomerStatsAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error("Oturum açmanız gerekiyor.")

        // 1. Tüm randevuları çek (Completed olanlar için istatistik)
        const { data: appointments, error } = await supabase
            .from("appointments")
            .select(`
                id,
                total_price,
                appointment_date,
                appointment_services (
                    services (
                        name
                    )
                )
            `)
            .eq("customer_user_id", user.id)
            .eq("status", "Tamamlandı")

        if (error) throw error

        if (!appointments || appointments.length === 0) {
            return {
                success: true,
                data: {
                    totalSpent: 0,
                    appointmentCount: 0,
                    topServices: [],
                    spendingByMonth: []
                }
            }
        }

        // 2. Hesaplamalar
        const totalSpent = appointments.reduce((sum, apt) => sum + Number(apt.total_price), 0)
        const appointmentCount = appointments.length

        // En çok alınan hizmetler
        const serviceCounts: Record<string, number> = {}
        appointments.forEach(apt => {
            apt.appointment_services?.forEach((as: any) => {
                const sName = as.services?.name
                if (sName) {
                    serviceCounts[sName] = (serviceCounts[sName] || 0) + 1
                }
            })
        })

        const topServices = Object.entries(serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)

        // Aylık harcama (Basit son 6 ay)
        const monthlyStats: Record<string, number> = {}
        appointments.forEach(apt => {
            const date = new Date(apt.appointment_date)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            monthlyStats[monthKey] = (monthlyStats[monthKey] || 0) + Number(apt.total_price)
        })

        const spendingByMonth = Object.entries(monthlyStats)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-6)

        return {
            success: true,
            data: {
                totalSpent,
                appointmentCount,
                topServices,
                spendingByMonth
            }
        }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "İstatistikler yüklenirken hata oluştu." }
    }
}
