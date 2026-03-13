// Inventory service layer

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export class InventoryService {
  /**
   * Ürün ekler veya günceller.
   */
  static async upsertProduct(data: any) {
    const supabase = await createClient()
    const payload = {
      business_id: data.businessId,
      name: data.name,
      sku: data.sku || null,
      category: data.category || null,
      purchase_price: data.purchasePrice,
      selling_price: data.sellingPrice,
      stock_quantity: data.stockQuantity,
      min_stock_alert: data.minStockAlert,
      is_active: data.isActive
    }

    let result
    if (data.id) {
      result = await supabase.from("products").update(payload).eq("id", data.id).select().single()
    } else {
      result = await supabase.from("products").insert(payload).select().single()
    }

    if (result.error) throw result.error
    revalidatePath("/urunler")
    return { success: true, data: result.data }
  }

  /**
   * Stok miktarını ayarlar.
   */
  static async adjustStock(data: {
    productId: string
    businessId: string
    amountToAdjust: number
    reason: string
    notes?: string
    recordedBy?: string
  }) {
    const supabase = await createClient()
    
    // 1. Ürünün mevcut stoğunu al
    const { data: product, error: pErr } = await supabase.from("products").select("stock_quantity, min_stock_alert").eq("id", data.productId).single()
    if (pErr || !product) throw new Error("Ürün bulunamadı")

    const prevStock = product.stock_quantity
    const newStock = prevStock + data.amountToAdjust
    if (newStock < 0) throw new Error("Stok miktarı sıfırın altına düşemez")

    // 2. Stoğu güncelle
    const { error: updateErr } = await supabase.from("products").update({ stock_quantity: newStock }).eq("id", data.productId)
    if (updateErr) throw updateErr

    // 3. Logla
    await supabase.from("inventory_logs").insert({
      product_id: data.productId,
      business_id: data.businessId,
      change_type: data.reason,
      quantity_changed: data.amountToAdjust,
      previous_stock: prevStock,
      new_stock: newStock,
      notes: data.notes || null,
      recorded_by: data.recordedBy || null
    })

    revalidatePath("/urunler")
    return { success: true, newStock, minStockAlert: product.min_stock_alert }
  }

  /**
   * Ürün listesini getirir.
   */
  static async listProducts(businessId: string, search?: string) {
    const supabase = await createClient()
    let query = supabase.from("products").select("*").eq("business_id", businessId).order("name")
    if (search) query = query.ilike("name", `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    return { success: true, data }
  }

  /**
   * Randevuya ürün ekler.
   */
  static async addProductToAppointment(data: any) {
    const supabase = await createClient()
    const { error } = await supabase.from("appointment_products").insert({
      appointment_id: data.appointmentId,
      product_id: data.productId,
      quantity: data.quantity,
      unit_price_snapshot: data.unitPrice,
      sold_by_staff_id: data.staffBusinessId
    })
    if (error) throw error
    revalidatePath("/randevular")
    return { success: true }
  }
}
