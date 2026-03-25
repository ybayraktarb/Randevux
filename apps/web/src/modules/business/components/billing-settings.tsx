"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { CreditCard, Check, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { RxButton } from "@/src/modules/core/components/rx-button"

interface BillingSettingsProps {
  businessId: string
}

export function BillingSettings({ businessId }: BillingSettingsProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  
  const [activePackage, setActivePackage] = useState<any>(null)
  const [allPackages, setAllPackages] = useState<any[]>([])
  const [allFeatures, setAllFeatures] = useState<any[]>([])
  const [activeFeatures, setActiveFeatures] = useState<string[]>([])
  
  useEffect(() => {
    fetchBillingData()
  }, [businessId])

  async function fetchBillingData() {
    setLoading(true)
    
    // Aktif Paketi Bul
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('package_id, packages(*)')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .eq('status', 'active')
      .single()

    if (subData?.packages) {
      setActivePackage(subData.packages)
    }

    // Tüm Paketler
    const { data: pkgs } = await supabase.from('packages').select('*').eq('is_active', true).order('price_monthly')
    if (pkgs) setAllPackages(pkgs)

    // Tüm Eklentiler
    const { data: feats } = await supabase.from('features').select('*').eq('is_active', true).gt('price_monthly', 0).order('category')
    if (feats) setAllFeatures(feats)

    // Açık olan eklentiler (Add-ons)
    const { data: bizFeats } = await supabase
      .from('business_features')
      .select('feature_id')
      .eq('business_id', businessId)
      .eq('is_enabled', true)

    if (bizFeats) {
      setActiveFeatures(bizFeats.map(bf => bf.feature_id))
    }

    setLoading(false)
  }

  const handleToggleAddon = async (featureId: string, isCurrentlyActive: boolean) => {
    setActionLoading(true)
    try {
      if (isCurrentlyActive) {
        // İptal et (Sil)
        await supabase
          .from('business_features')
          .delete()
          .eq('business_id', businessId)
          .eq('feature_id', featureId)
      } else {
        // Ekle
        await supabase
          .from('business_features')
          .insert({
            business_id: businessId,
            feature_id: featureId,
            source: 'addon',
            is_enabled: true
          })
      }
      await fetchBillingData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  const handleChangePackage = async (newPackageId: string) => {
    if (newPackageId === activePackage?.id) return;
    setActionLoading(true)
    try {
      // Önceki aboneliği pasif yap
      await supabase
        .from('subscriptions')
        .update({ is_active: false, status: 'canceled' })
        .eq('business_id', businessId)
        .eq('is_active', true)

      // Yeni abonelik oluştur
      await supabase
        .from('subscriptions')
        .insert({
          business_id: businessId,
          package_id: newPackageId,
          is_active: true,
          status: 'active'
        })

      await fetchBillingData()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary size-8" /></div>

  const totalPrice = (activePackage?.price_monthly || 0) + 
    allFeatures.filter(f => activeFeatures.includes(f.id)).reduce((acc, f) => acc + (f.price_monthly || 0), 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* Aktif Paket Özeti */}
      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
            <CreditCard className="size-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Mevcut Planınız</p>
            <h2 className="text-2xl font-black text-foreground">{activePackage?.name || "Bilinmiyor"}</h2>
          </div>
        </div>
        <div className="text-center sm:text-right bg-white px-6 py-4 rounded-2xl shadow-sm border border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Aylık Toplam Tutar</p>
          <div className="flex justify-center sm:justify-end items-baseline">
            <span className="text-3xl font-black text-primary">{totalPrice}₺</span>
            <span className="text-muted-foreground ml-1 font-medium">/ Ay</span>
          </div>
        </div>
      </div>

      {/* Paket Değişimi */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard className="size-5 text-primary" /> Üyelik Paketleri</h3>
          <p className="text-sm text-muted-foreground">İşletmenizin büyümesine uygun pakete geçiş yapın.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-4">
          {allPackages.map(pkg => {
            const isActive = pkg.id === activePackage?.id;
            return (
              <div 
                key={pkg.id} 
                className={cn(
                  "p-5 rounded-2xl border-2 transition-all flex flex-col justify-between",
                  isActive ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-border hover:border-primary/40 bg-card"
                )}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg">{pkg.name}</h4>
                    {isActive && <span className="bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-full font-bold uppercase">Aktif</span>}
                  </div>
                  <div className="flex items-baseline mb-4">
                    <span className="text-2xl font-black">{pkg.price_monthly}₺</span><span className="text-xs text-muted-foreground ml-1">/ay</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex gap-2 items-center"><Check className="size-4 text-success" /> {pkg.max_staff ? `${pkg.max_staff} Personel` : 'Sınırsız Personel'}</li>
                    <li className="flex gap-2 items-center"><Check className="size-4 text-success" /> {pkg.max_services ? `${pkg.max_services} Hizmet` : 'Sınırsız Hizmet'}</li>
                  </ul>
                </div>
                <RxButton 
                  variant={isActive ? "secondary" : "primary"} 
                  disabled={isActive || actionLoading} 
                  onClick={() => handleChangePackage(pkg.id)}
                  className="w-full"
                >
                  {isActive ? "Mevcut Plan" : (pkg.price_monthly > (activePackage?.price_monthly || 0) ? "Yükselt" : "Düşür")}
                </RxButton>
              </div>
            )
          })}
        </div>
      </div>

      {/* İsteğe Bağlı Eklentiler */}
      {allFeatures.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/50">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2"><CreditCard className="size-5 text-primary" /> İsteğe Bağlı Eklentiler</h3>
            <p className="text-sm text-muted-foreground">İhtiyacınız olan özellikleri esnek olarak açıp kapatın.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {allFeatures.map(feat => {
              const isActive = activeFeatures.includes(feat.id);
              return (
                <div 
                  key={feat.id} 
                  className={cn(
                    "p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4",
                    isActive ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-foreground">{feat.display_name}</h4>
                      <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-bold uppercase">{feat.category || 'Eklenti'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{feat.description}</p>
                    <div className="mt-2 text-sm font-black text-primary">+{feat.price_monthly}₺<span className="text-xs font-normal text-muted-foreground">/ay</span></div>
                  </div>
                  <div className="flex-shrink-0">
                    <RxButton 
                      variant={isActive ? "danger" : "primary"} 
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleToggleAddon(feat.id, isActive)}
                    >
                      {isActive ? "İptal Et" : "Ekle"}
                    </RxButton>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="p-4 bg-muted/50 rounded-xl flex items-start gap-3 text-sm text-muted-foreground border border-border">
        <AlertCircle className="size-5 text-primary flex-shrink-0" />
        <p>Paket değişiklikleri ve eklenti aktivasyonları anında faturanıza yansıtılır. Yıllık planlara geçiş yapmak veya detaylı fatura geçmişinizi görüntülemek için destek ile iletişime geçebilirsiniz.</p>
      </div>

    </div>
  )
}
