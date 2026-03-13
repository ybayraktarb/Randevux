import { z } from "zod"

// ─── Product Schemas ────────────────────────────────────────────────────────

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  businessId: z.string().uuid(),
  name: z.string().min(2, "Ürün adı en az 2 karakter olmalıdır"),
  sku: z.string().optional(),
  category: z.string().optional(),
  purchasePrice: z.number().min(0, "Maliyet sıfırdan küçük olamaz"),
  sellingPrice: z.number().min(0, "Fiyat sıfırdan küçük olamaz"),
  stockQuantity: z.number().int().min(0, "Stok negatif olamaz"),
  minStockAlert: z.number().int().min(0, "Uyarı sınırı negatif olamaz"),
  isActive: z.boolean().default(true),
})

export type ProductInput = z.infer<typeof productSchema>

// ─── Stock Adjustment Schemas ───────────────────────────────────────────────

export const stockReasonSchema = z.enum(["addition", "reduction", "adjustment", "return", "sale"])

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  businessId: z.string().uuid(),
  amountToAdjust: z.number().int("Tam sayı olmalıdır"),
  reason: stockReasonSchema,
  notes: z.string().optional(),
})

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  business_id: string
  name: string
  sku?: string
  category?: string
  purchase_price: number
  selling_price: number
  stock_quantity: number
  min_stock_alert: number
  is_active: boolean
  created_at: string
}

export interface InventoryLog {
  id: string
  product_id: string
  business_id: string
  change_type: string
  quantity_changed: number
  previous_stock: number
  new_stock: number
  notes?: string
  recorded_by?: string
  created_at: string
  recorded_user?: {
    name: string
  }
}
