"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { HeroProps } from "@/src/modules/landing/lib/types"

interface HeroSectionProps {
  hero: HeroProps
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start">
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground lg:text-xl">
              {hero.subtitle}
            </p>
            <a href="/register" className="mt-10 inline-flex items-center gap-2 rounded-[32px] bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition-all hover:opacity-90">
              {hero.ctaText}
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-muted shadow-2xl shadow-primary/5">
              <Image
                src={hero.imageUrl}
                alt="Randesk Platform"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="absolute -bottom-4 -left-4 -z-10 h-full w-full rounded-[32px] bg-accent/10" />
          </div>
        </div>
      </div>
    </section>
  )
}
