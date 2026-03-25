"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useCurrentUser } from "@/src/modules/core/hooks/use-current-user"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { 
  getBusinessServicesAction, 
  toggleServiceStatusAction 
} from "@/src/modules/business/actions/business.actions"
import { ServiceList } from "@/src/modules/business/components/service-list"
import { ServiceForm } from "@/src/modules/business/components/service-form"
import { 
  TooltipProvider 
} from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import { X } from "lucide-react"
import { RxButton } from "@/src/modules/core/components/rx-button"
import type { Service } from "@/src/modules/business/types"

type TabKey = "list" | "add"

export function ServiceManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>("list")
  const { user } = useCurrentUser()
  const [services, setServices] = useState<Service[]>([])
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  const supabase = createClient()

  // Get business_id from the current user
  useEffect(() => {
    if (!user) return
    async function fetchBusinessId() {
      const { data } = await supabase
        .from("business_owners")
        .select("business_id")
        .eq("user_id", user!.id)
        .maybeSingle()
      if (data) setBusinessId(data.business_id)
    }
    fetchBusinessId()
  }, [user, supabase])

  const fetchServices = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    try {
      const res = await getBusinessServicesAction(businessId)
      if (res.success && res.data) setServices(res.data)

      // Fetch staff for this business (Still using direct supabase for now as it belongs to staff module)
      const { data: staffData } = await supabase
        .from("staff_business")
        .select("id, user_id, can_set_own_price, can_set_own_duration, is_active, user:users(name, email, phone, avatar_url)")
        .eq("business_id", businessId)
        .eq("is_active", true)

      setStaffMembers((staffData || []).map(s => ({
        ...s,
        user: Array.isArray(s.user) ? s.user[0] : s.user
      })))
    } finally {
      setLoading(false)
    }
  }, [businessId, supabase])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    const previousServices = services
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_active: !currentActive } : s))

    const res = await toggleServiceStatusAction(id, !currentActive)
    if (!res.success) {
      setServices(previousServices)
      toast.error("Hizmet durumu güncellenemedi.")
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "list", label: "Hizmet Listesi" },
    { key: "add", label: editingService ? "Hizmet Düzenle" : "Hizmet Ekle" },
  ]

  return (
    <>
      <div className="-mt-5 lg:-mt-8 -mx-5 lg:-mx-8 mb-5 shrink-0 border-b border-border bg-card px-4 lg:px-8">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key)
                if (tab.key === "list") setEditingService(null)
              }}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <TooltipProvider delayDuration={100}>
        {activeTab === "list" && (
          <ServiceList
            loading={loading}
            services={services}
            onAddNew={() => setActiveTab("add")}
            onEdit={(svc) => {
              setEditingService(svc)
              setActiveTab("add")
            }}
            onToggleStatus={handleToggleStatus}
          />
        )}
        {activeTab === "add" && businessId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full pb-20"
          >
            <div className="bg-white rounded-[40px] border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-8 lg:p-12">
                <div className="flex items-center justify-between mb-12">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                      {editingService ? "Hizmeti Düzenle" : "Yeni Hizmet Oluştur"}
                    </h2>
                    <p className="text-[13px] text-gray-500 font-medium">Hizmet detaylarını ve görevli personelleri belirleyin.</p>
                  </div>
                  <RxButton variant="ghost" onClick={() => { setActiveTab("list"); setEditingService(null) }} className="rounded-2xl hover:bg-gray-50">
                    <X className="size-5" />
                  </RxButton>
                </div>
                
                <ServiceForm 
                  businessId={businessId}
                  service={editingService}
                  staffMembers={staffMembers}
                  onClose={() => { setActiveTab("list"); setEditingService(null) }}
                  onSuccess={() => {
                    fetchServices()
                    setActiveTab("list")
                    setEditingService(null)
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </TooltipProvider>
    </>
  )
}
