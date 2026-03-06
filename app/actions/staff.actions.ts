"use server"

import * as Sentry from "@sentry/nextjs"
import { z } from "zod"
import type { ActionResult } from "@/lib/validations/action-types"
import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"

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

    password: z
        .string({ required_error: "Şifre zorunludur." })
        .min(6, "Şifre en az 6 karakter olmalıdır."),

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
            password: formData.get("password")?.toString() ?? "",
            phone: formData.get("phone")?.toString().trim() || undefined,
            businessId: formData.get("businessId")?.toString() ?? "",
            role: formData.get("role")?.toString() || "personel",
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
        const { name, email, password, phone, businessId, role } = parsed.data

        // 1. Supabase Auth'da kullanıcı oluştur (Admin API)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                name,
                role: role === "manager" ? "manager" : "staff"
            }
        })

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
            p_role: role
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

