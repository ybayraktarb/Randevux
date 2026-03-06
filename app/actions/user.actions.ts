"use server"

import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
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

        businessName: z
            .string()
            .min(2, "İşletme adı en az 2 karakter olmalıdır.")
            .max(100, "İşletme adı en fazla 100 karakter olabilir.")
            .optional(),

        moduleId: z
            .string()
            .uuid("Geçerli bir modül seçiniz.")
            .optional(),

        existingBusinessId: z
            .string()
            .uuid("Geçerli bir işletme seçiniz.")
            .optional(),
    })
    // EKLENDI — Cross-field: patron rolü için işletme bilgisi zorunlu
    .refine(
        (data) => {
            if (data.role === "patron") {
                return !!data.existingBusinessId || (!!data.businessName && !!data.moduleId)
            }
            return true
        },
        {
            message:
                "Patron hesabı oluştururken yeni bir İşletme Adı + Modül seçimi veya mevcut bir İşletme seçimi zorunludur.",
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
            businessName: formData.get("businessName")?.toString().trim() || undefined,
            moduleId: formData.get("moduleId")?.toString() || undefined,
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
            businessName,
            moduleId,
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

            // Yeni işletme oluşturulacaksa
            if (!businessId && businessName && moduleId) {
                const { data: businessData, error: bizError } = await supabaseAdmin.from("businesses").insert({
                    name: businessName,
                    module_id: moduleId,
                    phone: phone || null,
                    is_active: true
                }).select("id").single()

                if (bizError || !businessData) {
                    Sentry.captureException(bizError ?? new Error("createUserAction: business insert returned null"), {
                        tags: { action: "createUserAction", step: "createBusiness" },
                    })
                    return {
                        success: false,
                        error: {
                            message: "Kullanıcı oluşturuldu ancak işletme oluşturulurken bir hata oluştu.",
                        },
                    }
                }

                businessId = businessData.id

                // Yeni işletmeye varsayılan çalışma saatleri ekle
                const businessHours = Array.from({ length: 7 }).map((_, idx) => ({
                    business_id: businessId,
                    day_of_week: idx, // 0 = Pazar
                    open_time: "09:00:00",
                    close_time: "19:00:00",
                    is_open: idx !== 0 // Sadece pazar (0) kapalı
                }))

                await supabaseAdmin.from("business_hours").insert(businessHours)
            }

            // İşletme sahibi ekle (Yeni oluşturulan veya var olan)
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
