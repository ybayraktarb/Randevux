"use server"

import { createClient } from "@/lib/supabase/server"
import * as Sentry from "@sentry/nextjs"

import { ActionResult } from "@/lib/validations/action-types"

export interface DiscoveryBusiness {
    id: string
    name: string
    address: string
    phone: string
    description: string
    logo_url: string
    category_name: string
    rating?: number
    review_count?: number
}

export interface Category {
    id: string
    name: string
    display_name: string
}

/**
 * Searches for businesses by name or category
 */
export async function searchBusinessesAction(query: string, categoryId?: string): Promise<ActionResult<DiscoveryBusiness[]>> {
    try {
        const supabase = await createClient()

        let serviceMatchIds: string[] = []
        if (query) {
            const { data: sData } = await supabase
                .from("services")
                .select("business_id")
                .ilike("name", `%${query}%`)
                .eq("is_active", true)
                .limit(100)

            if (sData) {
                serviceMatchIds = Array.from(new Set(sData.map(s => s.business_id)))
            }
        }

        let dbQuery = supabase
            .from("businesses")
            .select(`
                id,
                name,
                address,
                phone,
                description,
                logo_url,
                module:modules(display_name),
                business_reviews(rating)
            `)
            .eq("is_active", true)

        if (query) {
            let filter = `name.ilike.%${query}%,description.ilike.%${query}%`
            if (serviceMatchIds.length > 0) {
                filter += `,id.in.(${serviceMatchIds.map(id => `"${id}"`).join(",")})`
            }
            dbQuery = dbQuery.or(filter)
        }

        if (categoryId) {
            dbQuery = dbQuery.eq("module_id", categoryId)
        }

        const { data, error } = await dbQuery.limit(20)

        if (error) throw error

        const formatted: DiscoveryBusiness[] = (data || []).map((b: any) => {
            const ratings = b.business_reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0

            return {
                id: b.id,
                name: b.name,
                address: b.address,
                phone: b.phone,
                description: b.description,
                logo_url: b.logo_url,
                category_name: (b.module as any)?.display_name || "Diğer",
                rating: Number(avgRating.toFixed(1)),
                review_count: ratings.length
            }
        })

        return { success: true, data: formatted }
    } catch (err: any) {
        console.error("searchBusinessesAction Error:", err)
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Arama yapilirken bir hata olustu" } }
    }
}

/**
 * Fetches all active modules/categories
 */
export async function getCategoriesAction(): Promise<ActionResult<Category[]>> {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase
            .from("modules")
            .select("id, name, display_name")
            .eq("is_active", true)

        if (error) throw error
        return { success: true, data: data as Category[] }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Kategoriler yuklenemedi" } }
    }
}

/**
 * Fetches recommended businesses (featured or top rated)
 */
export async function getRecommendedBusinessesAction(): Promise<ActionResult<DiscoveryBusiness[]>> {
    try {
        const supabase = await createClient()

        // For now, let's just get the latest 6 active businesses
        // In a real scenario, we could use a 'is_featured' flag or order by rating
        const { data, error } = await supabase
            .from("businesses")
            .select(`
        id,
        name,
        address,
        phone,
        description,
        logo_url,
        module:modules(display_name),
        business_reviews(rating)
      `)
            .eq("is_active", true)
            .limit(6)

        if (error) throw error

        const formatted: DiscoveryBusiness[] = (data || []).map((b: any) => {
            const ratings = b.business_reviews?.map((r: any) => r.rating) || []
            const avgRating = ratings.length > 0
                ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
                : 0

            return {
                id: b.id,
                name: b.name,
                address: b.address,
                phone: b.phone,
                description: b.description,
                logo_url: b.logo_url,
                category_name: (b.module as any)?.display_name || "Diğer",
                rating: Number(avgRating.toFixed(1)),
                review_count: ratings.length
            }
        })

        return { success: true, data: formatted }
    } catch (err: any) {
        Sentry.captureException(err)
        return { success: false, error: { message: err.message || "Onerilen isletmeler yuklenemedi" } }
    }
}
