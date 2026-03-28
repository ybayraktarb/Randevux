import { Target, Eye } from "lucide-react"
import type { AboutProps } from "@/src/modules/landing/lib/types"

interface AboutSectionProps {
  about: AboutProps
}

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="hakkimizda" className="bg-background px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {about.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {about.subtitle}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative overflow-hidden rounded-[32px]">
            <img
              src={about.imageUrl}
              alt="Randesk ekibi"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary">
                  <Eye className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {about.vision.title}
                </h3>
              </div>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {about.vision.description}
              </p>
            </div>

            <div className="mb-8">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-secondary">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {about.mission.title}
                </h3>
              </div>
              <p className="text-pretty leading-relaxed text-muted-foreground">
                {about.mission.description}
              </p>
            </div>

            <div className="rounded-[24px] border border-border bg-card p-6">
              <p className="text-pretty leading-relaxed text-muted-foreground italic">
                {about.story}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
