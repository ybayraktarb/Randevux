"use server"

import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import type { ActionResult } from "@/lib/validations/action-types"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createNotificationAction } from "@/app/actions/notification.actions"

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// EKLENDI — Telefon regex yardımcısı
const phoneRegex = /^(\+?[\d\s\-]{7,15})$/

// EKLENDI — createStaffAction Zod şeması
const CreateStaffSchema = z.object({
    name: z
        .string({ required_error: "İsim zorunludur." })
        .min(2, "İsim en az 2 karakter olmalıdır.")
        .max(50, "İsim en fazla 50 karakter olabilir."),

    email: z
        .string({ required_error: "E-posta zorunludur." })
        .email("Geçerli bir e-posta adresi giriniz."),

    phone: z
        .string()
        .regex(phoneRegex, "Geçerli bir telefon numarası giriniz. (Örn: +90 555 123 4567)")
        .optional()
        .or(z.literal("")),

    businessId: z
        .string({ required_error: "İşletme seçimi zorunludur." })
        .uuid("Geçerli bir işletme seçiniz."),

    role: z
        .enum(["staff", "manager", "personel"], {
            errorMap: () => ({ message: "Geçersiz personel rolü seçildi." }),
        })
        .default("personel"),

    expertiseLevel: z.string().optional().default("Mid-Level"),
    calendarColor: z.string().optional().default("#3b82f6"),
})

// DEĞİŞTİRİLDİ — Dönüş tipi ActionResult olarak güncellendi
export async function createStaffAction(
    formData: FormData
): Promise<ActionResult<{ user: object }>> {
    try {
        // EKLENDI — Ham değerleri formData'dan al
        const rawData = {
            name: formData.get("name")?.toString().trim() ?? "",
            email: formData.get("email")?.toString().trim() ?? "",
            phone: formData.get("phone")?.toString().trim() || undefined,
            businessId: formData.get("businessId")?.toString() ?? "",
            role: formData.get("role")?.toString() || "personel",
            expertiseLevel: formData.get("expertiseLevel")?.toString() || "Mid-Level",
            calendarColor: formData.get("calendarColor")?.toString() || "#3b82f6",
        }

        // EKLENDI — Zod ile parse et; hata varsa erken return
        const parsed = CreateStaffSchema.safeParse(rawData)
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
        const { name, email, phone, businessId, role, expertiseLevel, calendarColor } = parsed.data

        // 1. Supabase Auth Davet Gönder/Kullanıcı Oluştur
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            email,
            {
                data: {
                    name,
                    role: role === "manager" ? "manager" : "staff"
                },
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
            }
        )

        let userId = authData?.user?.id

        if (authError) {
            if (authError.message.includes("already registered") || authError.status === 422) {
                // Zaten kayıtlıysa, public.users tablosundan bul
                const { data: existingUser } = await supabaseAdmin
                    .from("users")
                    .select("id")
                    .eq("email", email)
                    .maybeSingle()

                if (existingUser) {
                    userId = existingUser.id
                } else {
                    return {
                        success: false,
                        error: {
                            field: "email",
                            message: "Bu e-posta adresi önceden kayıtlı ancak profili bulunamadı.",
                        },
                    }
                }
            } else {
                Sentry.captureException(authError, {
                    tags: { action: "createStaffAction", step: "authCreate" },
                })
                return {
                    success: false,
                    error: {
                        message: "Kullanıcı oluşturulamadı: " + authError.message,
                    },
                }
            }
        }

        if (!userId) {
            return {
                success: false,
                error: {
                    message: "Kullanıcı oluşturuldu ancak ID alınamadı.",
                },
            }
        }

        // 2. RPC Tarafından Güvenli Kayıt (Transaction)
        // Bu işlem users ve staff_business tablosuna kaydı atomik olarak atar.
        const { error: rpcError } = await supabaseAdmin.rpc("create_staff_user_transaction", {
            p_auth_user_id: userId,
            p_email: email,
            p_name: name,
            p_phone: phone || null,
            p_business_id: businessId,
            p_role: role,
            p_expertise_level: expertiseLevel,
            p_calendar_color: calendarColor
        })

        if (rpcError) {
            console.error("RPC Hatası:", rpcError);
            Sentry.captureException(rpcError, {
                tags: { action: "createStaffAction", step: "rpcTransaction" },
                extra: { userId, email },
            })
            return {
                success: false,
                error: {
                    message: rpcError.message || "Personel hesabı oluşturulamadı (İşletmeye atama başarısız).",
                },
            }
        }

        revalidatePath("/personel")

        return { success: true, data: { user: authData?.user || { id: userId } } }
    } catch (error) {
        Sentry.captureException(error, {
            tags: { action: "createStaffAction", type: "runtime_error" },
        })
        return {
            success: false,
            error: { message: "Beklenmedik bir hata oluştu." }
        }
    }
}

// EKLENDI — Personel detay güncelleme action'ı
export async function updateStaffDetailAction(
    staffBusinessId: string,
    data: {
        role?: string
        is_active?: boolean
        expertise_level?: string
        calendar_color?: string
    }
): Promise<ActionResult<{ success: true }>> {
    try {
        const { error } = await supabaseAdmin
            .from("staff_business")
            .update(data)
            .eq("id", staffBusinessId)

        if (error) throw error

        revalidatePath("/personel")
        return { success: true, data: { success: true } }
    } catch (error: any) {
        console.error("updateStaffDetailAction error:", error)
        return { success: false, error: { message: "Güncelleme başarısız: " + error.message } }
    }
}

/**
 * Bir personelin gelecekteki randevu sayısını getirir.
 */
export async function getStaffFutureAppointmentsCount(staffBusinessId: string) {
    try {
        const now = new Date().toISOString()
        const todayDate = now.split('T')[0]

        const { count, error } = await supabaseAdmin
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("staff_business_id", staffBusinessId)
            .gte("appointment_date", todayDate)
            .not("status", "in", '("İptal", "Gelmedi")')

        if (error) throw error
        return { success: true, count: count || 0 }
    } catch (error) {
        console.error("getStaffFutureAppointmentsCount error:", error)
        return { success: false, count: 0 }
    }
}

/**
 * Bir personelin performans metriklerini getirir (Toplam randevu, ortalama puan).
 */
export async function getStaffPerformanceMetrics(staffBusinessId: string) {
    try {
        const { count: totalApts, error: countErr } = await supabaseAdmin
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("staff_business_id", staffBusinessId)
            .eq("status", "Tamamlandı")

        if (countErr) throw countErr

        // Simple approach: get appointment IDs first
        const { data: apts, error: aptsErr } = await supabaseAdmin
            .from("appointments")
            .select("id")
            .eq("staff_business_id", staffBusinessId)

        if (aptsErr) throw aptsErr
        if (!apts || apts.length === 0) {
            return {
                success: true,
                data: { totalAppointments: totalApts || 0, averageRating: 0 }
            }
        }

        const aptIds = apts.map(a => a.id)
        const { data: reviews, error: reviewsErr } = await supabaseAdmin
            .from("business_reviews")
            .select("rating")
            .in("appointment_id", aptIds)

        if (reviewsErr) throw reviewsErr

        let avgRating = 0
        if (reviews && reviews.length > 0) {
            avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        }

        return {
            success: true,
            data: {
                totalAppointments: totalApts || 0,
                averageRating: Number(avgRating.toFixed(1))
            }
        }
    } catch (error) {
        console.error("getStaffPerformanceMetrics error:", error)
        return { success: false, data: { totalAppointments: 0, averageRating: 0 } }
    }
}

/**
 * Mevcut bir personele tekrar davet e-postası gönderir.
 */
export async function resendStaffInvitationAction(email: string) {
    try {
        const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
        if (error) throw error
        return { success: true }
    } catch (error: any) {
        console.error("resendStaffInvitationAction error:", error)
        return { success: false, error: error.message }
    }
}

/**
 * Bir personelin randevularını başka bir personele aktarır.
 */
export async function transferStaffAppointmentsAction(
    fromStaffId: string,
    toStaffId: string,
    businessId: string
): Promise<ActionResult<{ count: number }>> {
    try {
        const now = new Date().toISOString().split('T')[0]

        // 1. Aktarılacak randevuları bul (Bugün ve sonrası, Bekliyor veya Onaylandı)
        const { data: appts, error: fetchErr } = await supabaseAdmin
            .from("appointments")
            .select("id, customer_user_id, appointment_date, start_time")
            .eq("staff_business_id", fromStaffId)
            .eq("business_id", businessId)
            .gte("appointment_date", now)
            .in("status", ["Bekliyor", "Onaylandı"])

        if (fetchErr) throw fetchErr
        if (!appts || appts.length === 0) {
            return { success: true, data: { count: 0 } }
        }

        // 2. Randevuları güncelle
        const { error: updateErr } = await supabaseAdmin
            .from("appointments")
            .update({ staff_business_id: toStaffId })
            .in("id", appts.map(a => a.id))

        if (updateErr) throw updateErr

        // 3. Müşterilere bildirim gönder (Opsiyonel ama önerilir)
        try {
            for (const apt of appts) {
                if (apt.customer_user_id) {
                    await createNotificationAction({
                        userId: apt.customer_user_id,
                        type: "system",
                        title: "Personel Değişikliği",
                        body: `${apt.appointment_date} tarihindeki randevunuz için yeni bir uzman atanmıştır.`,
                        relatedId: apt.id,
                        relatedType: "appointment"
                    })
                }
            }
        } catch (notifierErr) {
            console.warn("Transfer notification failed:", notifierErr)
        }

        revalidatePath("/personel")
        return { success: true, data: { count: appts.length } }
    } catch (error: any) {
        console.error("transferStaffAppointmentsAction error:", error)
        return { success: false, error: { message: "Randevu aktarımı başarısız: " + error.message } }
    }
}

/**
 * Personeli işletmeden kaldırır (Soft Delete).
 */
export async function deleteStaffAction(
    staffBusinessId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        // 1. Gelecek randevu kontrolü (Opsiyonel ama güvenlik için iyi)
        const { count, success } = await getStaffFutureAppointmentsCount(staffBusinessId)
        if (success && count > 0) {
            return {
                success: false,
                error: { message: `Personelin gelecekte ${count} randevusu bulunuyor. Lütfen önce bu randevuları aktarın.` }
            }
        }

        // 2. Soft delete
        const { error } = await supabaseAdmin
            .from("staff_business")
            .update({ is_deleted: true, is_active: false })
            .eq("id", staffBusinessId)

        if (error) throw error

        revalidatePath("/personel")
        return { success: true, data: { success: true } }
    } catch (error: any) {
        console.error("deleteStaffAction error:", error)
        return { success: false, error: { message: "Kaldırma işlemi başarısız: " + error.message } }
    }
}

/**
 * İşletmedeki diğer aktif personelleri listeler (Aktarım için).
 */
export async function getActiveStaffForTransfer(businessId: string, excludeStaffId: string) {
    try {
        const { data, error } = await supabaseAdmin
            .from("staff_business")
            .select("id, user:users(name)")
            .eq("business_id", businessId)
            .eq("is_active", true)
            .neq("id", excludeStaffId)

        if (error) throw error
        return { success: true, data: data || [] }
    } catch (error: any) {
        console.error("getActiveStaffForTransfer error:", error)
        return { success: false, error: { message: error.message } }
    }
}

