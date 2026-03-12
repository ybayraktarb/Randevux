"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isSuperAdmin } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

// ─── TYPES ────────────────────────────────────────────────

export type InvitePatronInput = {
    email: string
    fullName: string
    phone?: string
    businessId?: string   // Hemen bir işletmeye bağlanacaksa
}

export type InvitationStatus = "pending" | "accepted" | "expired" | "cancelled"

export type Invitation = {
    id: string
    email: string
    full_name: string
    phone: string | null
    status: InvitationStatus
    business_id: string | null
    business_name?: string | null
    expires_at: string
    accepted_at: string | null
    created_at: string
}

export type Patron = {
    id: string
    email: string | null
    name: string | null
    phone: string | null
    created_at: string
    kvkk_consent_at: string | null
    businesses: { id: string; name: string; status: string }[]
}

// ─── ACTIONS ──────────────────────────────────────────────

/**
 * Super Admin tarafından patron davet eder.
 * Supabase inviteUserByEmail() ile magic link gönderir.
 * invitations tablosuna kayıt ekler.
 */
export async function invitePatronAction(input: InvitePatronInput) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()
        const adminClient = await createAdminClient()

        // Daha önce davet edilmiş mi? (pending)
        const { data: existing } = await supabase
            .from("invitations")
            .select("id, status, email")
            .eq("email", input.email)
            .eq("status", "pending")
            .maybeSingle()

        if (existing) {
            throw new Error(`${input.email} adresi için zaten beklemede bir davet var.`)
        }

        // Supabase Auth üzerinden invite gönder
        const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(
            input.email,
            {
                data: {
                    full_name: input.fullName,
                    invited_as: "patron",
                }
            }
        )

        if (authError) throw authError

        // Mevcut kullanıcı ID'sini al (SA)
        const { data: { user: saUser } } = await supabase.auth.getUser()
        if (!saUser) throw new Error("Oturum bulunamadı.")

        // invitations tablosuna kayıt ekle
        const { data: invitation, error: invErr } = await supabase
            .from("invitations")
            .insert({
                email: input.email,
                full_name: input.fullName,
                phone: input.phone || null,
                invited_by: saUser.id,
                business_id: input.businessId || null,
                status: "pending",
            })
            .select()
            .single()

        if (invErr) throw invErr

        // Audit log
        await supabase.rpc("log_admin_action", {
            p_action: "INVITE_PATRON",
            p_target_table: "invitations",
            p_target_id: invitation.id,
            p_business_id: input.businessId || null,
            p_after: { email: input.email, full_name: input.fullName },
        })

        revalidatePath("/admin-dashboard")
        return { success: true, data: invitation }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Tüm patron davetlerini listeler (SA için).
 */
export async function getInvitationsAction() {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("invitations")
            .select(`
                id,
                email,
                full_name,
                phone,
                status,
                business_id,
                expires_at,
                accepted_at,
                created_at,
                businesses ( id, name )
            `)
            .order("created_at", { ascending: false })

        if (error) throw error

        return { success: true, data: data || [] }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Süresi dolmuş davetleri 'expired' olarak işaretler.
 */
export async function expireInvitationsAction() {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("invitations")
            .update({ status: "expired" })
            .eq("status", "pending")
            .lt("expires_at", new Date().toISOString())

        if (error) throw error

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Bir daveti iptal eder.
 */
export async function cancelInvitationAction(invitationId: string) {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { error } = await supabase
            .from("invitations")
            .update({ status: "cancelled" })
            .eq("id", invitationId)
            .eq("status", "pending")

        if (error) throw error

        revalidatePath("/admin-dashboard")
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}

/**
 * Sisteme kayıtlı tüm patronları listeler (SA için).
 * İşletme bilgileriyle birlikte.
 */
export async function getPatronsAction() {
    try {
        if (!await isSuperAdmin()) throw new Error("Yetkisiz erişim.")

        const supabase = await createClient()

        const { data, error } = await supabase
            .from("business_owners")
            .select(`
                user_id,
                users!inner (
                    id,
                    email,
                    name,
                    phone,
                    created_at,
                    kvkk_consent_at
                ),
                businesses!inner (
                    id,
                    name,
                    status
                )
            `)
            .order("created_at", { ascending: false, referencedTable: "users" })

        if (error) throw error

        // Group by patron (bir patron birden fazla işletmeye sahip olabilir)
        const patronMap = new Map<string, Patron>()
        for (const row of (data || []) as any[]) {
            const u = row.users
            const b = row.businesses
            if (!patronMap.has(u.id)) {
                patronMap.set(u.id, {
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    phone: u.phone,
                    created_at: u.created_at,
                    kvkk_consent_at: u.kvkk_consent_at,
                    businesses: [],
                })
            }
            patronMap.get(u.id)!.businesses.push({ id: b.id, name: b.name, status: b.status })
        }

        return { success: true, data: Array.from(patronMap.values()) }
    } catch (err: any) {
        return { success: false, error: err.message }
    }
}
