import { BusinessOnboarding } from "@/components/randevux/business-onboarding"

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col justify-center">
        <BusinessOnboarding />
      </div>
    </main>
  )
}
