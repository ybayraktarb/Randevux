"use client"

import { Loader2 } from "lucide-react"

// Extracted Hook & Widgets
import { useBusinessProfileData } from "./profile-widgets/useBusinessProfileData"
import { BusinessHeaderWidget } from "./profile-widgets/BusinessHeaderWidget"
import { ConnectionBannerWidget } from "./profile-widgets/ConnectionBannerWidget"
import { ServicesSectionWidget } from "./profile-widgets/ServicesSectionWidget"
import { StaffSectionWidget } from "./profile-widgets/StaffSectionWidget"
import { WorkingHoursSectionWidget } from "./profile-widgets/WorkingHoursSectionWidget"
import { ReviewsSectionWidget } from "./profile-widgets/ReviewsSectionWidget"
import { StickyBottomBarWidget } from "./profile-widgets/StickyBottomBarWidget"

// Add Modal (Assume it exists, keeping the old behavior)
import { RxModal } from "@/src/modules/core/components/rx-modal"
import { RxButton } from "@/src/modules/core/components/rx-button"
import { UserPlus } from "lucide-react"

export interface BusinessProfileProps {
  businessId?: string
}

export function BusinessProfile({ businessId: propBusinessId }: BusinessProfileProps) {
  const {
    loading,
    business,
    todayInfo,
    showBanner,
    services,
    selectedServices,
    staff,
    workingHours,
    reviews,
    totalCost,
    totalDuration,
    connectModalOpen,
    setConnectModalOpen,
    toggleService,
    handleToggleFavorite,
    handleConnectBusiness,
    handleContinueToBooking
  } = useBusinessProfileData(propBusinessId)

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <p className="text-muted-foreground font-medium">Işletme bulunamadı.</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <BusinessHeaderWidget 
        business={business} 
        todayInfo={todayInfo} 
        onToggleFavorite={handleToggleFavorite} 
      />

      <div className="mt-8 flex flex-col gap-12 pb-32">
        {showBanner && (
          <ConnectionBannerWidget onConnect={() => setConnectModalOpen(true)} />
        )}

        <ServicesSectionWidget 
          services={services} 
          selectedIds={selectedServices} 
          onToggle={toggleService} 
        />

        <StaffSectionWidget staff={staff} />

        <WorkingHoursSectionWidget hours={workingHours} />

        <ReviewsSectionWidget reviews={reviews} />
      </div>

      {selectedServices.size > 0 && (
        <StickyBottomBarWidget 
          count={selectedServices.size} 
          total={totalCost} 
          duration={totalDuration} 
          onContinue={handleContinueToBooking} 
        />
      )}

      {/* Connect Modal */}
      <RxModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        title="Işletmeye Bağlan"
      >
        <div className="p-6 pt-0 flex flex-col gap-6">
          <div className="flex items-center gap-4 rounded-xl bg-primary/10 p-4">
            <UserPlus className="size-6 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Bu işletmeye bağlanarak randevu geçmişinizi, favori uzmanlarınızı ve işlemlerinizi tek bir yerden yönetebilirsiniz.
            </p>
          </div>
          <RxButton variant="primary" size="lg" className="w-full" onClick={handleConnectBusiness}>
            {"Onaylıyorum, Bağlan"}
          </RxButton>
        </div>
      </RxModal>
    </div>
  )
}
