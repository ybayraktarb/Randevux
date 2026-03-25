// Service configuration service layer

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { ServiceInput, Service } from "../types"

export class ServiceConfigService {
  /**
   * Hizmetleri listeler (Personel eşleşmeleriyle birlikte).
   */
  static async getServices(businessId: string): Promise<{ success: boolean; data: Service[]; error?: string }> {
    const supabase = await createClient()
    
    // 1. Hizmetleri çek
    const { data: svcData, error: svcErr } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: true })

    if (svcErr) return { success: false, error: svcErr.message, data: [] }

    // 2. Personel eşleşmelerini çek
    const { data: staffSvcData } = await supabase
      .from("staff_services")
      .select("staff_business_id, service_id, staff:staff_business(user:users(name))")
      .eq("is_active", true)

    // 3. Verileri birleştir
    const mappedServices: Service[] = (svcData || []).map((svc) => {
      const assigned = (staffSvcData || []).filter((ss) => ss.service_id === svc.id)
      return {
        ...svc,
        staffCount: assigned.length,
        staffNames: assigned.map((a: any) => a.staff?.user?.name || "?"),
        staffIds: assigned.map((a) => a.staff_business_id)
      }
    })

    return { success: true, data: mappedServices }
  }

  /**
   * Yeni hizmet ekler veya günceller.
   */
  static async upsertService(input: ServiceInput) {
    const supabase = await createClient()
    const { staffIds, ...serviceData } = input
    
    const payload = {
      business_id: serviceData.businessId,
      name: serviceData.name,
      description: serviceData.description || null,
      base_duration_minutes: serviceData.baseDurationMinutes,
      base_price: serviceData.basePrice,
      buffer_time_minutes: serviceData.bufferTimeMinutes,
      is_active: serviceData.isActive
    }

    let serviceId: string

    if (input.id) {
      const { error } = await supabase.from("services").update(payload).eq("id", input.id)
      if (error) return { success: false, error: error.message }
      serviceId = input.id
    } else {
      // ─── Limit Kontrolü ───
      const { data: limitData } = await supabase
        .from('subscriptions')
        .select(`packages ( max_services )`)
        .eq('business_id', payload.business_id)
        .eq('is_active', true)
        .eq('status', 'active')
        .single();
        
      const maxServices = (limitData?.packages as any)?.max_services;
      
      if (maxServices !== undefined && maxServices !== null) {
        const { count } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('business_id', payload.business_id)
          .eq('is_active', true)
          .is('deleted_at', null);

        if (count !== null && count >= maxServices) {
           return { success: false, error: `Maksimum hizmet limitine ulaşıldı (Paket Limiti: ${maxServices})` };
        }
      }
      // ─── Limit Kontrolü Sonu ───

      const { data, error } = await supabase.from("services").insert(payload).select("id").single()
      if (error) return { success: false, error: error.message }
      serviceId = data.id
    }

    // Personel eşleşmelerini senkronize et
    if (staffIds) {
      await this.syncStaffMappings(supabase, serviceId, staffIds)
    }

    revalidatePath("/hizmetler")
    return { success: true, id: serviceId }
  }

  /**
   * Hizmet aktiflik durumunu basitçe değiştirir.
   */
  static async toggleServiceStatus(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { error } = await supabase.from("services").update({ is_active: isActive }).eq("id", id)
    if (error) return { success: false, error: error.message }
    revalidatePath("/hizmetler")
    return { success: true }
  }

  // Private Helper: Personel-Hizmet eşleşmelerini günceller
  private static async syncStaffMappings(supabase: any, serviceId: string, staffIds: string[]) {
    // Mevcut eşleşmeleri al
    const { data: existing } = await supabase
      .from("staff_services")
      .select("staff_business_id")
      .eq("service_id", serviceId)
    
    const existingStaffIds = (existing || []).map((e: any) => e.staff_business_id)

    const toAdd = staffIds.filter((id: string) => !existingStaffIds.includes(id))
    const toRemove = existingStaffIds.filter((id: string) => !staffIds.includes(id))

    if (toAdd.length > 0) {
      await supabase.from("staff_services").insert(toAdd.map(sid => ({
        staff_business_id: sid,
        service_id: serviceId,
        is_active: true
      })))
    }

    if (toRemove.length > 0) {
      await supabase.from("staff_services").delete().eq("service_id", serviceId).in("staff_business_id", toRemove)
    }
  }
}
