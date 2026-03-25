// Finance service layer

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export class FinanceService {
  /**
   * Yeni bir kasa hareketi ekler.
   */
  static async addTransaction(data: {
    businessId: string
    type: "income" | "expense"
    category: string
    amount: number
    paymentMethod: string
    description?: string
    appointmentId?: string
    recordedBy: string
  }) {
    const supabase = await createClient()
    const { data: inserted, error } = await supabase.from("transactions").insert({
      business_id: data.businessId,
      type: data.type,
      category: data.category,
      amount: data.amount,
      payment_method: data.paymentMethod,
      description: data.description || null,
      appointment_id: data.appointmentId || null,
      recorded_by: data.recordedBy
    }).select("id").single()

    if (error) throw error
    revalidatePath("/finans")
    return { success: true, data: inserted }
  }

  /**
   * Kasa hareketlerini listeler.
   */
  static async getTransactions(businessId: string, startDate?: string, endDate?: string) {
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
  }

  /**
   * Kasa hareketini siler.
   */
  static async deleteTransaction(transactionId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from("transactions").delete().eq("id", transactionId)
    if (error) throw error
    revalidatePath("/finans")
    return { success: true }
  }

  /**
   * Personel komisyon kuralını günceller.
   */
  static async upsertStaffCommission(data: any) {
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
  }

  /**
   * Bordro kaydını oluşturur.
   */
  static async savePayrollRecord(data: any) {
    const supabase = await createClient()
    const { data: inserted, error } = await supabase.from("payroll_records").insert({
      business_id: data.businessId,
      staff_business_id: data.staffBusinessId,
      period_start: data.periodStart,
      period_end: data.periodEnd,
      base_salary_amount: data.baseSalaryAmount,
      service_commission_amount: data.serviceCommissionAmount,
      product_commission_amount: data.productCommissionAmount,
      total_amount: data.totalAmount,
      status: "paid",
      paid_at: new Date().toISOString(),
      notes: data.notes || null,
    }).select("id").single()

    if (error) throw error
    revalidatePath("/finans")
    return { success: true, data: inserted }
  }

  /**
   * Personel komisyon kurallarını ve personel listesini getirir.
   */
  static async getStaffCommissions(businessId: string) {
    const supabase = await createClient()
    const { data: staff, error } = await supabase
      .from("staff_business")
      .select(`
        id,
        role,
        user:users(id, name, email, avatar_url),
        commission_rule:staff_commissions(*)
      `)
      .eq("business_id", businessId)
      .eq("is_active", true)

    if (error) throw error

    return {
      success: true,
      data: (staff || []).map((s: any) => ({
          ...s,
          user: Array.isArray(s.user) ? s.user[0] : s.user,
          commission_rule: (Array.isArray(s.commission_rule) ? s.commission_rule[0] : s.commission_rule) || {
            service_commission_rate: 0,
            product_commission_rate: 0,
            base_salary: 0
          }
      }))
    }
  }

  /**
   * Bir personel için belirli bir dönemdeki hak ediş önizlemesini hesaplar.
   */
  static async generatePayrollPreview(businessId: string, staffBusinessId: string, startDate: string, endDate: string) {
    const supabase = await createClient()
    
    // 1. Komisyon kuralını al
    const { data: rule } = await supabase
      .from("staff_commissions")
      .select("*")
      .eq("staff_business_id", staffBusinessId)
      .maybeSingle()

    const serviceRate = rule?.service_commission_rate || 0
    const baseSalary = rule?.base_salary || 0

    // 2. Tamamlanmış randevuları ve toplam ciroya katkısını al
    const { data: appointments, error: aptErr } = await supabase
      .from("appointments")
      .select("id, total_price")
      .eq("business_id", businessId)
      .eq("staff_business_id", staffBusinessId)
      .eq("status", "Tamamlandı")
      .gte("appointment_date", startDate)
      .lte("appointment_date", endDate)

    if (aptErr) throw aptErr

    const totalServiceRevenue = (appointments || []).reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)
    const expectedServiceCommission = (totalServiceRevenue * serviceRate) / 100

    return {
      success: true,
      data: {
        staffBusinessId,
        periodStart: startDate,
        periodEnd: endDate,
        baseSalary,
        serviceRate,
        totalServiceRevenue,
        expectedServiceCommission,
        expectedProductCommission: 0,
        totalExpected: baseSalary + expectedServiceCommission
      }
    }
  }
}
