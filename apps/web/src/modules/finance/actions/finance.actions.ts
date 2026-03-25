"use server"

import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"
import { FinanceService } from "@/src/modules/finance/services/finance.service"
import { createClient } from "@/lib/supabase/server"
import { checkFeatureAccess } from "@/lib/permissions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"

export async function addTransactionAction(data: any) {
  try {
    const supabase = await createClient()
    const { data: userAuth } = await supabase.auth.getUser()
    if (!userAuth.user) throw new Error("Unauthorized")

    const hasAccess = await checkFeatureAccess(data.businessId, "finance_module")
    if (!hasAccess) throw new Error("Bu özellik işletmeniz için aktif değildir.")

    const result = await FinanceService.addTransaction({
      ...data,
      recordedBy: userAuth.user.id
    })

    if (result.success && result.data) {
      await logAuditAction({
        action: "created",
        targetTable: "transactions",
        targetId: result.data.id
      })
    }

    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "İşlem kaydedilemedi" }
  }
}

export async function checkoutAppointmentAction(data: {
  businessId: string
  appointmentId: string
  amount: number
  paymentMethod: any
}) {
  try {
    const supabase = await createClient()
    const { data: userAuth } = await supabase.auth.getUser()
    if (!userAuth.user) throw new Error("Unauthorized")

    const hasAccess = await checkFeatureAccess(data.businessId, "finance_module")
    if (!hasAccess) throw new Error("Bu özellik işletmeniz için aktif değildir.")

    // 1. Transaction ekle
    const tx = await FinanceService.addTransaction({
      businessId: data.businessId,
      type: "income",
      category: "service",
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      description: "Randevu Tahsilatı",
      appointmentId: data.appointmentId,
      recordedBy: userAuth.user.id
    })

    if (!tx.success) throw new Error("Kasa hareketi kaydedilemedi.")

    // 2. Randevu durumunu güncelle (AppointmentService de kullanılabilir ama burada direkt update basıyoruz legacy uyumu için)
    const { error: aptErr } = await supabase.from("appointments")
      .update({ status: "Tamamlandı", total_price: data.amount })
      .eq("id", data.appointmentId)

    if (aptErr) throw aptErr

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
    return await FinanceService.getTransactions(businessId, startDate, endDate)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hareketler yüklenemedi" }
  }
}

export async function deleteTransactionAction(transactionId: string, businessId: string) {
  try {
    const result = await FinanceService.deleteTransaction(transactionId)
    if (result.success) {
      await logAuditAction({
        action: "deleted",
        targetTable: "transactions",
        targetId: transactionId
      })
    }
    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "İşlem silinemedi" }
  }
}

export async function upsertStaffCommissionAction(data: any) {
  try {
    return await FinanceService.upsertStaffCommission(data)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "Prim kuralları güncellenemedi" }
  }
}

export async function savePayrollRecordAction(data: any) {
  try {
    const result = await FinanceService.savePayrollRecord(data)
    if (result.success && result.data) {
      await logAuditAction({
        action: "created",
        targetTable: "payroll_records",
        targetId: result.data.id
      })
    }
    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "Bordro kaydedilemedi" }
  }
}
export async function getStaffCommissionsAction(businessId: string) {
  try {
    return await FinanceService.getStaffCommissions(businessId)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Komisyon bilgileri yüklenemedi" }
  }
}

export async function generatePayrollPreviewAction(businessId: string, staffBusinessId: string, startDate: string, endDate: string) {
  try {
    return await FinanceService.generatePayrollPreview(businessId, staffBusinessId, startDate, endDate)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Hesaplama yapılamadı" }
  }
}
