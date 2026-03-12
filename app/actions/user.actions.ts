"use server"

import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import type { ActionResult } from "@/lib/validations/action-types"
import { createClient as createClientJS } from "@supabase/supabase-js"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

const supabaseAdmin = createClientJS(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Projede bu key .env dosyasında tanımlanmalı
)

// Yardımcı bekleme fonksiyonu (Trigger'ın asenkron çalışabilmesi ihtimalini tolere etmek için)
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// EKLENDI — Telefon regex yardımcısı (opsiyonel ama girilirse format kontrol edilir)
const phoneRegex = /^(\+?[\d\s\-]{7,15})$/

// EKLENDI — createUserAction Zod şeması
const CreateUserSchema = z
    .object({
        name: z
            .string({ required_error: "İsim zorunludur." })
            .min(2, "İsim en az 2 karakter olmalıdır.")
            .max(50, "İsim en fazla 50 karakter olabilir."),

        email: z
            .string({ required_error: "E-posta zorunludur." })
            .email("Geçerli bir e-posta adresi giriniz."),

        password: z
            .string({ required_error: "Şifre zorunludur." })
            .min(8, "Şifre en az 8 karakter olmalıdır."),

        phone: z
            .string()
            .regex(phoneRegex, "Geçerli bir telefon numarası giriniz. (Örn: +90 555 123 4567)")
            .optional()
            .or(z.literal("")),

        role: z
            .enum(["patron", "personel", "musteri", "super_admin", "user"], {
                errorMap: () => ({ message: "Geçersiz kullanıcı rolü seçildi." }),
            })
            .default("user"),

        existingBusinessId: z
            .string()
            .uuid("Geçerli bir işletme seçiniz.")
            .optional(),
    })
    // EKLENDI — Cross-field: patron rolü için işletme bilgisi zorunlu
    .refine(
        (data) => {
            if (data.role === "patron") {
                return !!data.existingBusinessId
            }
            return true
        },
        {
            message:
                "Patron hesabı oluştururken mevcut bir İşletme seçimi zorunludur.",
            path: ["existingBusinessId"],
        }
    )

// DEĞİŞTİRİLDİ — Dönüş tipi ActionResult olarak güncellendi
export async function createUserAction(
    formData: FormData
): Promise<ActionResult<{ user: User }>> {
    try {
        // EKLENDI — Ham değerleri formData'dan al
        const rawData = {
            name: formData.get("name")?.toString().trim() ?? "",
            email: formData.get("email")?.toString().trim() ?? "",
            password: formData.get("password")?.toString() ?? "",
            phone: formData.get("phone")?.toString().trim() || undefined,
            role: formData.get("role")?.toString() || "user",
            existingBusinessId: formData.get("existingBusinessId")?.toString() || undefined,
        }

        // EKLENDI — Zod ile parse et; hata varsa erken return
        const parsed = CreateUserSchema.safeParse(rawData)
        if (!parsed.success) {
            const firstError = parsed.error.errors[0]
            return {
                success: false,
                error: {
                    field: firstError.path.join(".") || undefined,
                    message: firstError.message,
                },
            }
        }

        // DEĞİŞTİRİLDİ — Artık doğrulanmış verilerden destructure ediyoruz
        const {
            name,
            email,
            password,
            phone,
            role,
            existingBusinessId,
        } = parsed.data

        // Supabase Admin API ile kullanıcı oluştur
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            phone: phone || undefined,
            email_confirm: true, // E-posta doğrulamasını atla
            user_metadata: {
                name: name,
            }
        })

        if (error || !data?.user) {
            Sentry.captureException(error ?? new Error("createUserAction: user null after createUser"), {
                tags: { action: "createUserAction" },
                extra: { role: parsed.data.role }, // hassas veri (email/password) eklenmedi
            })

            return {
                success: false,
                error: {
                    message: error?.message || "Kullanıcı oluşturulamadı. (E-posta/Telefon kullanımda olabilir)",
                },
            }
        }

        const userId = data.user.id

        // Auth trigger'ın `public.users` tablosuna yazmasını garantilemek için çok kısa bir süre bekleyelim
        await delay(300)

        // Rol atamaları
        if (role === "super_admin") {
            const { error: saError } = await supabaseAdmin.from("super_admins").insert({ user_id: userId })
            if (saError) console.error("Super Admin ekleme hatası:", saError)
        } else if (role === "patron") {
            let businessId: string | undefined = existingBusinessId

            // İşletme sahibi ekle (Var olan işletmeye ata)
            if (businessId) {
                await supabaseAdmin.from("business_owners").insert({
                    user_id: userId,
                    business_id: businessId
                })

                // PATRONU AYNI ZAMANDA BİR ÇALIŞAN OLARAK EKLE (Kendi takvimi için)
                await supabaseAdmin.from("staff_business").insert({
                    user_id: userId,
                    business_id: businessId,
                    can_set_own_price: true,
                    can_set_own_duration: true
                })
            }
        }
        
        // EKLENDI — Users tablosundaki role kolonunu güncelle
        const { error: roleUpdateError } = await supabaseAdmin
            .from("users")
            .update({ role: role })
            .eq("id", userId)
            
        if (roleUpdateError) {
            console.error("createUserAction: role update error:", roleUpdateError)
        }

        // DEĞİŞTİRİLDİ — ActionResult formatında döndür
        return { success: true, data: { user: data.user } }
    } catch (error) {
        Sentry.captureException(error, {
            tags: { action: "createUserAction", type: "runtime_error" },
        })
        return {
            success: false,
            error: { message: "Beklenmedik bir hata oluştu." }
        }
    }
}

/**
 * Kullanıcı profil bilgilerini ve bildirim tercihlerini günceller
 */
export async function updateUserProfileAction(
    name: string,
    phone: string,
    notificationSettings: any
): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: { message: "Oturum açılmamış." } }
        }

        // public.users tablosunu güncelle
        const { error } = await supabase
            .from("users")
            .update({
                name,
                phone,
                notification_settings: notificationSettings
            })
            .eq("id", user.id)

        if (error) {
            console.error("Profile update error:", error)
            return { success: false, error: { message: error.message } }
        }

        // Auth metadata'yı da güncelleyelim (Opsiyonel ama isim görünsün diye iyi olur)
        await supabase.auth.updateUser({
            data: { name }
        })

        return { success: true }
    } catch (err: any) {
        return { success: false, error: { message: err.message || "Bilinmeyen bir hata oluştu." } }
    }
}

/**
 * Müşterinin son 3 başarılı randevusunu getirir. (Hızlı Tekrar Al özelliği için)
 */
export async function getQuickRebookDataAction() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Oturum açılmamış." }

        const { data, error } = await supabase
            .from("appointments")
            .select(`
                id,
                appointment_date,
                business_id,
                business:businesses(name, logo_url, category),
                services:appointment_services(service:services(name, id))
            `)
            .eq("customer_user_id", user.id)
            .order("appointment_date", { ascending: false })
            .limit(3)

        if (error) throw error

        const formatted = (data || []).map((a: any) => {
            const b = Array.isArray(a.business) ? a.business[0] : a.business
            const s = Array.isArray(a.services) ? a.services : []
            const serviceNames = s.map((svc: any) => svc.service?.name).filter(Boolean).join(", ")
            const serviceIds = s.map((svc: any) => svc.service?.id).filter(Boolean).join(",")

            return {
                id: a.id,
                businessId: a.business_id,
                businessName: b?.name || "İşletme",
                businessLogo: b?.logo_url,
                category: b?.category || "Genel",
                serviceNames,
                serviceIds,
                lastDate: a.appointment_date
            }
        })

        return { success: true, data: formatted }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: err.message || "Randevu geçmişi alınamadı." }
    }
}
/**
 * Kullanıcıyı kalıcı olarak siler (Auth + Database).
 * Sadece Super Admin yetkisiyle çalıştırılmalıdır (RLS tarafından korunur ama Admin API kullanıyoruz).
 */
export async function deleteUserAction(userId: string): Promise<ActionResult<void>> {
    try {
        const supabase = await createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()

        if (!currentUser) {
            return { success: false, error: { message: "Oturum açılmamış." } }
        }

        // 1. Yetki Kontrolü (İsteğe bağlı: server tarafında da explicit check)
        const { data: sa } = await supabase.from("users").select("global_role").eq("id", currentUser.id).single()
        if (sa?.global_role !== "super_admin") {
            return { success: false, error: { message: "Bu işlem için yetkiniz yok." } }
        }

        // 2. Kendi hesabını silmeyi engelle
        if (userId === currentUser.id) {
            return { success: false, error: { message: "Kendi hesabınızı silemezsiniz." } }
        }

        // 3. İşletme Sahipliği Kontrolü (Product Grade Safeguard)
        // Kullanıcı bir işletme sahibi mi?
        const { data: ownerships } = await supabase
            .from("business_owners")
            .select("business_id, businesses(name, is_active)")
            .eq("user_id", userId)

        if (ownerships && ownerships.length > 0) {
            for (const ownership of ownerships) {
                const business = Array.isArray(ownership.businesses) ? ownership.businesses[0] : ownership.businesses
                // Eğer işletme aktifse, mülkiyeti kontrol et
                if (business?.is_active) {
                    // Bu işletmenin başka sahibi var mı?
                    const { count } = await supabase
                        .from("business_owners")
                        .select("*", { count: 'exact', head: true })
                        .eq("business_id", ownership.business_id)

                    if (count === 1) {
                        return { 
                            success: false, 
                            error: { 
                                message: `Bu kullanıcı "${business.name}" işletmesinin tek sahibidir. Silmeden önce mülkiyeti devredin veya işletmeyi pasife alın.` 
                            } 
                        }
                    }
                }
            }
        }

        // 4. Supabase Admin API ile kullanıcıyı sil
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error("deleteUserAction error:", error)
            return { success: false, error: { message: "Kullanıcı silinemedi: " + error.message } }
        }

        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: "Bilinmeyen bir hata oluştu." } }
    }
}

/**
 * Süper Admin'in bir kullanıcıyı impersonate (taklit) etmesini sağlar.
 * Güvenli bir cookie set eder.
 */
export async function impersonateUserAction(targetUserId: string): Promise<ActionResult<void>> {
    try {
        const cookieStore = await cookies()
        
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: { message: "Oturum açılmamış." } }

        // Yetki kontrolü
        const { data: sa } = await supabase.from("users").select("role").eq("id", user.id).single()
        if (sa?.role !== "super_admin") {
            return { success: false, error: { message: "Bu işlem için yetkiniz yok." } }
        }

        // Impersonation cookie'sini set et (Expires in 2 hours)
        cookieStore.set("x-impersonate-user-id", targetUserId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 2 // 2 saat
        })

        revalidatePath("/")
        return { success: true }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Impersonation başlatılamadı." } }
    }
}

/**
 * Impersonation modundan çıkar.
 */
export async function stopImpersonatingAction(): Promise<ActionResult<void>> {
    try {
        const cookieStore = await cookies()
        cookieStore.delete("x-impersonate-user-id")
        revalidatePath("/")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: { message: "Impersonation sonlandırılamadı." } }
    }
}

