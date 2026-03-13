"use server"

import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"
import { InventoryService } from "@/src/modules/inventory/services/inventory.service"
import { createClient } from "@/lib/supabase/server"
import { checkFeatureAccess } from "@/lib/permissions"
import { logAuditAction } from "@/src/modules/admin/actions/audit.actions"
import { createNotificationAction } from "@/src/modules/core/actions/notification.actions"

export async function upsertProductAction(data: any) {
  try {
    const hasAccess = await checkFeatureAccess(data.businessId, "inventory_module")
    if (!hasAccess) throw new Error("Bu özellik işletmeniz için aktif değildir.")

    const result = await InventoryService.upsertProduct(data)
    
    if (result.success && result.data) {
      await logAuditAction({
        action: data.id ? "updated" : "created",
        targetTable: "products",
        targetId: result.data.id
      })
    }

    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "Ürün kaydedilemedi" }
  }
}

export async function getProductsAction(businessId: string, search?: string) {
  try {
    return await InventoryService.listProducts(businessId, search)
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Ürünler yüklenemedi" }
  }
}

export async function adjustStockAction(data: any) {
  try {
    const supabase = await createClient()
    const { data: userAuth } = await supabase.auth.getUser()
    
    const hasAccess = await checkFeatureAccess(data.businessId, "inventory_module")
    if (!hasAccess) throw new Error("Bu özellik işletmeniz için aktif değildir.")

    const result = await InventoryService.adjustStock({
      ...data,
      recordedBy: userAuth.user?.id
    })

    if (result.success) {
      // Kritik stok bildirimi
      if (data.amountToAdjust < 0 && (result.newStock ?? 0) <= (result.minStockAlert ?? 0)) {
        const { data: owners } = await supabase.from("business_owners").select("user_id").eq("business_id", data.businessId)
        if (owners) {
          for (const o of owners) {
            await createNotificationAction({
              userId: o.user_id,
              title: "Kritik Stok Uyarısı",
              body: `Stok seviyesi düştü: Sadece ${result.newStock} ürün kaldı.`,
              type: "system"
            })
          }
        }
      }
    }

    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "Stok güncellenemedi" }
  }
}

export async function addProductToAppointmentAction(data: any) {
  try {
    const hasAccess = await checkFeatureAccess(data.businessId, "inventory_module")
    if (!hasAccess) throw new Error("Bu özellik işletmeniz için aktif değildir.")

    // 1. Ürün bilgisi ve strok kontrolü (InventoryService üzerinden basitleştirilebilir ama şimdilik direkt akış)
    const result = await InventoryService.addProductToAppointment(data)
    
    // 2. Stok düşümü
    await adjustStockAction({
      productId: data.productId,
      businessId: data.businessId,
      amountToAdjust: -data.quantity,
      reason: "sale",
      notes: `Adisyona ürün satış eklendi (#${data.appointmentId})`
    })

    return result
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: err.message || "Adisyona ürün eklenemedi" }
  }
}

export async function getInventoryLogsAction(productId: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("inventory_logs")
      .select(`
        *,
        recorded_user:users(name)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
    
    if (error) throw error
    return { success: true, data }
  } catch (err: any) {
    Sentry.captureException(err)
    return { success: false, error: "Stok hareketleri yüklenemedi" }
  }
}
