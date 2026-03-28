import { Header } from "./header"
import { HeroSection } from "./hero-section"
import { FeaturesSection } from "./features-section"
import { PricingSection } from "./pricing-section"
import { AboutSection } from "./about-section"
import { ContactSection } from "./contact-section"
import { Footer } from "./footer"
import type { LandingPageProps } from "@/src/modules/landing/lib/types"

export function LandingPage({ hero, features, packages, about, contact }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection hero={hero} />
        <FeaturesSection features={features} />
        <PricingSection packages={packages} />
        <AboutSection about={about} />
        <ContactSection contact={contact} />
      </main>
      <Footer />
    </div>
  )
}
