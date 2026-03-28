"use client"

import {
  Calendar,
  Users,
  BarChart3,
  Bell,
  Shield,
  Smartphone,
  Clock,
  Zap,
  Globe,
  type LucideIcon,
} from "lucide-react"
import type { FeatureProps } from "@/src/modules/landing/lib/types"

const iconMap: Record<string, LucideIcon> = {
  calendar: Calendar,
  users: Users,
  "bar-chart": BarChart3,
  bell: Bell,
  shield: Shield,
  smartphone: Smartphone,
  clock: Clock,
  zap: Zap,
  globe: Globe,
}

interface FeaturesSectionProps {
  features: FeatureProps[]
}

export function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section id="ozellikler" className="bg-secondary/50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Neden Randesk?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Modern randevu yönetimi için ihtiyacınız olan her şey tek bir platformda.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Calendar
            return (
              <div
                key={index}
                className="group relative rounded-[32px] bg-card p-8 shadow-sm transition-all hover:shadow-lg"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                  <IconComponent className="h-7 w-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
