import { z } from "zod"

// ─── Transaction Schemas ─────────────────────────────────────────────────────

export const transactionTypeSchema = z.enum(["income", "expense"])
export const paymentMethodSchema = z.enum(["cash", "credit_card", "transfer"])

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  type: transactionTypeSchema,
  category: z.string().min(1, "Kategori seçiniz"),
  amount: z.number().positive("Tutar sıfırdan büyük olmalıdır"),
  paymentMethod: paymentMethodSchema,
  description: z.string().min(3, "Açıklama çok kısa"),
  transactionDate: z.string().optional(),
})

export type TransactionInput = z.infer<typeof transactionSchema>

// ─── Commission Schemas ──────────────────────────────────────────────────────

export const commissionRuleSchema = z.object({
  staffBusinessId: z.string().uuid(),
  serviceRate: z.number().min(0).max(100),
  productRate: z.number().min(0).max(100).default(0),
  baseSalary: z.number().min(0),
})

export type CommissionInput = z.infer<typeof commissionRuleSchema>

// ─── Payroll Schemas ────────────────────────────────────────────────────────

export const payrollPreviewSchema = z.object({
  businessId: z.string().uuid(),
  staffBusinessId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
})

export type PayrollPreviewInput = z.infer<typeof payrollPreviewSchema>

export const payrollRecordSchema = z.object({
  businessId: z.string().uuid(),
  staffBusinessId: z.string().uuid(),
  periodStart: z.string(),
  periodEnd: z.string(),
  baseSalaryAmount: z.number().min(0),
  serviceCommissionAmount: z.number().min(0),
  productCommissionAmount: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
})

export type PayrollRecordInput = z.infer<typeof payrollRecordSchema>

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Transaction {
  id: string
  transaction_date: string
  type: "income" | "expense"
  category: string
  amount: number
  payment_method: string
  description: string
}

export interface PayrollPreview {
  periodStart: string
  periodEnd: string
  baseSalary: number
  serviceRate: number
  totalServiceRevenue: number
  expectedServiceCommission: number
  totalExpected: number
}
