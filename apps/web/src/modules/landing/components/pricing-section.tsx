"use client"

import { Check } from "lucide-react"
import type { PackageProps } from "@/src/modules/landing/lib/types"

interface PricingSectionProps {
  packages: PackageProps[]
}

function formatPrice(priceMonthly: number, priceYearly: number) {
  if (priceMonthly === 0) return { monthly: "Ücretsiz", yearly: null, suffix: "" }
  return {
    monthly: `₺${priceMonthly}`,
    yearly: priceYearly > 0 ? `₺${priceYearly}/yıl` : null,
    suffix: "/ay",
  }
}

export function PricingSection({ packages }: PricingSectionProps) {
  return (
    <section id="fiyatlandirma" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Size Uygun Planı Seçin
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Her ölçekte işletme için esnek fiyatlandırma seçenekleri.
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="mt-16 text-center text-muted-foreground">
            <p className="text-lg">Fiyatlandırma bilgisi yakında eklenecektir.</p>
          </div>
        ) : (
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 lg:grid-cols-3">
            {packages.map((pkg) => {
              const { monthly, yearly, suffix } = formatPrice(
                pkg.price_monthly,
                pkg.price_yearly
              )
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col rounded-[32px] p-8 ${
                    pkg.is_featured
                      ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/20 ring-2 ring-primary"
                      : "bg-card shadow-sm ring-1 ring-border"
                  }`}
                >
                  {pkg.is_featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="inline-flex rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground">
                        En Popüler
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3
                      className={`text-xl font-semibold ${
                        pkg.is_featured ? "text-primary-foreground" : "text-foreground"
                      }`}
                    >
                      {pkg.name}
                    </h3>
                    <p
                      className={`mt-2 text-sm ${
                        pkg.is_featured ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-bold tracking-tight ${
                          pkg.is_featured ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {monthly}
                      </span>
                      {suffix && (
                        <span
                          className={`text-sm ${
                            pkg.is_featured ? "text-primary-foreground/70" : "text-muted-foreground"
                          }`}
                        >
                          {suffix}
                        </span>
                      )}
                    </div>
                    {yearly && (
                      <p
                        className={`mt-1 text-xs ${
                          pkg.is_featured ? "text-primary-foreground/60" : "text-muted-foreground"
                        }`}
                      >
                        veya {yearly}
                      </p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-4">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check
                          className={`h-5 w-5 shrink-0 ${
                            pkg.is_featured ? "text-accent" : "text-accent"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            pkg.is_featured ? "text-primary-foreground/90" : "text-muted-foreground"
                          }`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full rounded-[32px] px-6 py-4 text-base font-medium transition-all ${
                      pkg.is_featured
                        ? "bg-card text-foreground hover:bg-card/90"
                        : "bg-primary text-primary-foreground hover:opacity-90"
                    }`}
                  >
                    Hemen Başla
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
