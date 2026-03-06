"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"
import { logAuditAction } from "./audit.actions"

// ============================================================================
// 1. Kasa Hareketleri (Transactions)
// ============================================================================

export async function addTransactionAction(data: {
    businessId: string
    type: "income" | "expense"
    category: string
    amount: number
    paymentMethod: "cash" | "credit_card" | "transfer" | "other"
    description?: string
    appointmentId?: string
}) {
    try {
        const supabase = await createClient()
        const { data: userAuth, error: authErr } = await supabase.auth.getUser()
        if (authErr || !userAuth.user) throw new Error("Unauthorized")

        const { data: inserted, error } = await supabase.from("transactions").insert({
            business_id: data.businessId,
            type: data.type,
            category: data.category,
            amount: data.amount,
            payment_method: data.paymentMethod,
            description: data.description || null,
            appointment_id: data.appointmentId || null,
            recorded_by: userAuth.user.id
        }).select("id").single()

        if (error) {
            console.error("ADD TRANSACTION ERROR:", error)
            throw error
        }

        try {
            await logAuditAction({
                action: "created",
                targetTable: "transactions",
                targetId: inserted.id
            })
        } catch (e) { console.error("Audit log failed", e) }

        revalidatePath("/finans")
        return { success: true, data: inserted }
    } catch (err: any) {
        console.error("ADD TRANSACTION CATCH:", err)
        Sentry.captureException(err)
        return { success: false, error: err?.message || JSON.stringify(err) || "İşlem kaydedilemedi" }
    }
}

export async function checkoutAppointmentAction(data: {
    businessId: string
    appointmentId: string
    amount: number
    paymentMethod: "cash" | "credit_card" | "transfer" | "other"
}) {
    try {
        const supabase = await createClient()

        // 1. Randevuyu tamamlandı (completed) yap
        const { error: aptErr } = await supabase.from("appointments")
            .update({ status: "Tamamlandı", total_price: data.amount })
            .eq("id", data.appointmentId)

        if (aptErr) throw aptErr

        // 2. Kasa girişi (Transaction) ekle
        await addTransactionAction({
            businessId: data.businessId,
            type: "income",
            category: "service", // Hizmet geliri
            amount: data.amount,
            paymentMethod: data.paymentMethod,
            description: "Randevu Tahsilatı",
            appointmentId: data.appointmentId
        })

        // 3. Personellerin komisyonunu anlık hesaplayabilir veya ay sonunda yapılmak üzere bırakabiliriz.
        // Genelde ay sonunda payroll_records oluşturulur.

        revalidatePath("/patron-dashboard")
        revalidatePath("/randevular")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Tahsilat yapılamadı" }
    }
}

export async function getTransactionsAction(businessId: string, startDate?: string, endDate?: string) {
    try {
        const supabase = await createClient()
        let query = supabase.from("transactions")
            .select("*")
            .eq("business_id", businessId)
            .order("transaction_date", { ascending: false })

        if (startDate) query = query.gte("transaction_date", startDate)
        if (endDate) query = query.lte("transaction_date", endDate)

        const { data, error } = await query
        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: "Hareketler yüklenemedi" }
    }
}

export async function deleteTransactionAction(transactionId: string, businessId: string) {
    try {
        const supabase = await createClient()

        // Önce yetki kontrolü (Basitçe business_id eşleşmesi)
        const { data: existing, error: fetchErr } = await supabase
            .from("transactions")
            .select("id")
            .eq("id", transactionId)
            .eq("business_id", businessId)
            .maybeSingle()

        if (fetchErr || !existing) throw new Error("İşlem bulunamadı veya yetkiniz yok.")

        const { error } = await supabase
            .from("transactions")
            .delete()
            .eq("id", transactionId)

        if (error) throw error

        try {
            await logAuditAction({
                action: "deleted",
                targetTable: "transactions",
                targetId: transactionId
            })
        } catch (e) { console.error("Audit log failed", e) }

        revalidatePath("/finans")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "İşlem silinemedi" }
    }
}

// ============================================================================
// 2. Personel Komisyon Kuralları (Staff Commissions)
// ============================================================================

export async function upsertStaffCommissionAction(data: {
    staffBusinessId: string
    serviceRate: number
    productRate: number
    baseSalary?: number
}) {
    try {
        const supabase = await createClient()
        const { error } = await supabase.from("staff_commissions").upsert({
            staff_business_id: data.staffBusinessId,
            service_commission_rate: data.serviceRate,
            product_commission_rate: data.productRate,
            base_salary: data.baseSalary || 0
        }, { onConflict: "staff_business_id" })

        if (error) throw error

        revalidatePath("/finans")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Prim kuralları güncellenemedi" }
    }
}

export async function getStaffCommissionsAction(businessId: string) {
    try {
        const supabase = await createClient()
        // Kuralı olan veya olmayan tüm personeli listeleyelim
        const { data: staffData, error: staffErr } = await supabase.from("staff_business")
            .select(`
                id, 
                user:users(id, name, email, avatar_url),
                role,
                is_active
            `)
            .eq("business_id", businessId)

        if (staffErr) throw staffErr

        const { data: commissionData, error: commErr } = await supabase.from("staff_commissions")
            .select("*")
        // .in("staff_business_id", staffData.map(s => s.id)) // Patron sadece kendi işletmesindekileri okuyabilir RLS sayesinde

        if (commErr) throw commErr

        const combined = staffData.map(s => {
            const rule = commissionData?.find(c => c.staff_business_id === s.id)
            return {
                ...s,
                commission_rule: rule || {
                    service_commission_rate: 0,
                    product_commission_rate: 0,
                    base_salary: 0
                }
            }
        })

        return { success: true, data: combined }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: "Prim kuralları yüklenemedi" }
    }
}

// ============================================================================
// 3. Hak Ediş ve Maaş (Payroll Records)
// ============================================================================

export async function generatePayrollPreviewAction(
    businessId: string,
    staffBusinessId: string,
    periodStart: string,
    periodEnd: string
) {
    try {
        const supabase = await createClient()

        // 1. Personel Komisyon Kurallarını Çek
        const { data: rules, error: rulesErr } = await supabase.from("staff_commissions")
            .select("*")
            .eq("staff_business_id", staffBusinessId)
            .maybeSingle()

        if (rulesErr) throw rulesErr

        const serviceRate = rules?.service_commission_rate || 0
        const productRate = rules?.product_commission_rate || 0
        const baseSalary = rules?.base_salary || 0

        // 2. İlgili Tarih Aralığındaki Tamamlanan Randevuları Çek
        const { data: apts, error: aptErr } = await supabase.from("appointments")
            .select("id, total_price")
            .eq("staff_business_id", staffBusinessId)
            .eq("status", "Tamamlandı")
            .gte("appointment_date", periodStart)
            .lte("appointment_date", periodEnd)

        if (aptErr) throw aptErr

        const totalServiceRevenue = (apts || []).reduce((sum, a) => sum + (Number(a.total_price) || 0), 0)
        const expectedServiceCommission = (totalServiceRevenue * serviceRate) / 100

        // 3. İlgili Tarih Aralığındaki Satılan Ürünleri (Adisyon Ürünleri) Çek
        // appointment_products tablosundaki ürünler, o ürünleri satan staff'a göre filtrelenir.
        // Aynı zamanda bu ürünlerin satıldığı appointment'ların 'completed' statüsünde ve tarih aralığında olması gerekir.
        const { data: aptProducts, error: prodErr } = await supabase
            .from("appointment_products")
            .select(`
                total_price,
                appointment:appointments!inner(status, appointment_date)
            `)
            .eq("staff_business_id", staffBusinessId)
            .eq("appointment.status", "Tamamlandı")
            .gte("appointment.appointment_date", periodStart)
            .lte("appointment.appointment_date", periodEnd)

        if (prodErr) throw prodErr

        const totalProductRevenue = (aptProducts || []).reduce((sum, p) => sum + (Number(p.total_price) || 0), 0)
        const expectedProductCommission = (totalProductRevenue * productRate) / 100

        const totalExpected = Number(baseSalary) + expectedServiceCommission + expectedProductCommission

        return {
            success: true,
            data: {
                periodStart,
                periodEnd,
                baseSalary: Number(baseSalary),
                totalServiceRevenue,
                serviceRate,
                expectedServiceCommission,
                totalProductRevenue,
                productRate,
                expectedProductCommission,
                totalExpected
            }
        }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Hak ediş önizlemesi oluşturulamadı" }
    }
}

export async function savePayrollRecordAction(data: {
    businessId: string
    staffBusinessId: string
    periodStart: string
    periodEnd: string
    baseSalaryAmount: number
    serviceCommissionAmount: number
    productCommissionAmount: number
    totalAmount: number
    notes?: string
}) {
    try {
        const supabase = await createClient()

        // Hak ediş kaydını oluştur
        const { data: inserted, error } = await supabase.from("payroll_records").insert({
            business_id: data.businessId,
            staff_business_id: data.staffBusinessId,
            period_start: data.periodStart,
            period_end: data.periodEnd,
            base_salary_amount: data.baseSalaryAmount,
            service_commission_amount: data.serviceCommissionAmount,
            product_commission_amount: data.productCommissionAmount,
            total_amount: data.totalAmount,
            status: "paid", // Şimdilik anında ödendi kabul ediyoruz
            paid_at: new Date().toISOString(),
            notes: data.notes || null,
        }).select("id").single()

        if (error) throw error

        // Maaş/Prim ödendiği için kasadan çıkış (gider) olarak yazıyoruz
        await addTransactionAction({
            businessId: data.businessId,
            type: "expense",
            category: "salary",
            amount: data.totalAmount,
            paymentMethod: "transfer", // Default banka transferi gibi düşünülebilir
            description: `Maaş & Prim Ödemesi: ${data.periodStart} / ${data.periodEnd}`
        })

        try {
            await logAuditAction({
                action: "created",
                targetTable: "payroll_records",
                targetId: inserted.id
            })
        } catch (e) { console.error("Audit log failed", e) }

        revalidatePath("/finans")
        return { success: true, data: inserted }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Bordro kaydedilemedi" }
    }
}
