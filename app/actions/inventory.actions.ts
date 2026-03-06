"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"
import { revalidatePath } from "next/cache"
import { logAuditAction } from "./audit.actions"
import { createNotificationAction } from "./notification.actions"

// ============================================================================
// 1. Ürün Kataloğu Servisleri (Products)
// ============================================================================

export async function upsertProductAction(data: {
    businessId: string
    id?: string
    name: string
    sku?: string
    category?: string
    purchasePrice: number
    sellingPrice: number
    stockQuantity: number
    minStockAlert: number
    isActive: boolean
}) {
    try {
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
            if (result.error) throw result.error
        } else {
            result = await supabase.from("products").insert(payload).select().single()
            if (result.error) throw result.error

            // İlk kez ürün eklenirken (stok > 0 ise) audit log at
            if (data.stockQuantity > 0) {
                await logInventoryChange(supabase, result.data.id, data.businessId, "addition", data.stockQuantity, 0, data.stockQuantity, "İlk Stok Girişi")
            }
        }

        try {
            await logAuditAction({
                action: data.id ? "updated" : "created",
                targetTable: "products",
                targetId: result.data.id
            })
        } catch (e) { console.error("Audit log failed") }

        revalidatePath("/urunler")
        return { success: true, data: result.data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Ürün kaydedilemedi" }
    }
}

export async function getProductsAction(businessId: string, search?: string) {
    try {
        const supabase = await createClient()
        let query = supabase.from("products").select("*").eq("business_id", businessId).order("name")

        if (search) {
            query = query.ilike("name", `%${search}%`)
        }

        const { data, error } = await query
        if (error) throw error

        return { success: true, data }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: "Ürünler yüklenemedi" }
    }
}

// ============================================================================
// 2. Stok Hareketleri (Inventory Logs)
// ============================================================================

// Helper: Sadece backend icinde call edilsin
async function logInventoryChange(supabase: any, productId: string, businessId: string, type: string, change: number, prev: number, next: number, notes?: string, recordedBy?: string) {
    let userToLog = recordedBy
    if (!userToLog) {
        const { data: { user } } = await supabase.auth.getUser()
        userToLog = user?.id || null
    }

    await supabase.from("inventory_logs").insert({
        product_id: productId,
        business_id: businessId,
        change_type: type,
        quantity_changed: change,
        previous_stock: prev,
        new_stock: next,
        notes: notes || null,
        recorded_by: userToLog
    })
}

export async function adjustStockAction(data: {
    productId: string
    businessId: string
    amountToAdjust: number // Pozitif veya negatif olabilir
    reason: "addition" | "reduction" | "adjustment" | "return" | "sale"
    notes?: string
}) {
    try {
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
        await logInventoryChange(supabase, data.productId, data.businessId, data.reason, data.amountToAdjust, prevStock, newStock, data.notes)

        // 4. Kritik stok kontrolü ve bildirim (Sadece düşüşlerde uyarı at)
        if (data.amountToAdjust < 0 && newStock <= product.min_stock_alert) {
            // Find owners
            const { data: owners } = await supabase.from("business_owners").select("user_id").eq("business_id", data.businessId)
            if (owners) {
                for (const o of owners) {
                    await createNotificationAction({
                        userId: o.user_id,
                        title: "Kritik Stok Uyarısı",
                        body: `Stok seviyesi düştü: Sadece ${newStock} ürün kaldı.`,
                        type: "system"
                    })
                }
            }
        }

        revalidatePath("/urunler")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Stok güncellenemedi" }
    }
}

export async function getInventoryLogsAction(productId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("inventory_logs")
            .select("*, recorded_user:users!inventory_logs_recorded_by_fkey(name)")
            .eq("product_id", productId)
            .order("created_at", { ascending: false })

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: "Stok hareketleri yüklenemedi" }
    }
}

// ============================================================================
// 3. Adisyon Sepeti / POS ve Ürün Satışı (Appointment Products)
// ============================================================================

export async function addProductToAppointmentAction(data: {
    appointmentId: string
    businessId: string
    productId: string
    quantity: number
    staffBusinessId: string // Satan makam (prim icin)
}) {
    try {
        const supabase = await createClient()

        // 1. Ürün bilgisi ve stoğu (Fiyat almak ve kontrol için)
        const { data: product, error: pErr } = await supabase.from("products").select("selling_price, stock_quantity, name").eq("id", data.productId).single()
        if (pErr || !product) throw new Error("Ürün bulunamadı")

        if (product.stock_quantity < data.quantity) {
            throw new Error(`Yetersiz stok. Mevcut stok: ${product.stock_quantity}`)
        }

        // 2. Randevu Ürünlerine ekle
        const { error: insertErr } = await supabase.from("appointment_products").insert({
            appointment_id: data.appointmentId,
            product_id: data.productId,
            quantity: data.quantity,
            unit_price_snapshot: product.selling_price,
            sold_by_staff_id: data.staffBusinessId
        })

        if (insertErr) throw insertErr

        // 3. Randevunun Total Price'ına ürünü dahil et
        const { data: aptData } = await supabase.from("appointments").select("total_price").eq("id", data.appointmentId).single()
        const currentTotal = Number(aptData?.total_price || 0)
        const addition = Number(product.selling_price) * data.quantity
        await supabase.from("appointments").update({ total_price: currentTotal + addition }).eq("id", data.appointmentId)

        // 4. Stoktan düşürelim (adjustStock mantığını kullanabiliriz)
        await adjustStockAction({
            productId: data.productId,
            businessId: data.businessId,
            amountToAdjust: -data.quantity,
            reason: "sale",
            notes: `Adiyona ürün satış eklendi (#${data.appointmentId})`
        })

        revalidatePath("/randevular")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Adisyona ürün eklenemedi" }
    }
}

export async function getAppointmentProductsAction(appointmentId: string) {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("appointment_products")
            .select("*, product:products(name), staff:staff_business(user:users(name))")
            .eq("appointment_id", appointmentId)

        if (error) throw error
        return { success: true, data }
    } catch (err: any) {
        return { success: false, error: "Adisyon ürünleri yüklenemedi" }
    }
}

export async function removeProductFromAppointmentAction(appointmentProductId: string, appointmentId: string, businessId: string) {
    try {
        const supabase = await createClient()

        // 1. Satılmış olandan detay alma
        const { data: soldItem, error: sErr } = await supabase.from("appointment_products").select("*").eq("id", appointmentProductId).single()
        if (sErr || !soldItem) throw new Error("Kayıt bulunamadı")

        // 2. Sil
        await supabase.from("appointment_products").delete().eq("id", appointmentProductId)

        // 3. Randevu totaline eksi yansıma yap
        const { data: aptData } = await supabase.from("appointments").select("total_price").eq("id", appointmentId).single()
        const currentTotal = Number(aptData?.total_price || 0)
        const dedection = Number(soldItem.unit_price_snapshot) * soldItem.quantity
        await supabase.from("appointments").update({ total_price: Math.max(0, currentTotal - dedection) }).eq("id", appointmentId)

        // 4. Stoğu geri ekle
        await adjustStockAction({
            productId: soldItem.product_id,
            businessId: businessId,
            amountToAdjust: soldItem.quantity,
            reason: "return",
            notes: `Adisyondan ürün çıkarıldı/iade oldu (#${appointmentId})`
        })

        revalidatePath("/randevular")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Ürün adisyondan çıkarılamadı" }
    }
}
