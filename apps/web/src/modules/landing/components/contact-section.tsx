"use client"

import { Mail, Phone, MapPin, Send } from "lucide-react"
import type { ContactProps } from "@/src/modules/landing/lib/types"

interface ContactSectionProps {
  contact: ContactProps
}

export function ContactSection({ contact }: ContactSectionProps) {
  return (
    <section id="iletisim" className="bg-secondary/50 px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {contact.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {contact.subtitle}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4 rounded-[24px] border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-secondary">
                  <Mail className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">E-posta</h3>
                  <a
                    href={`mailto:${contact.info.email}`}
                    className="mt-1 text-muted-foreground transition-colors hover:text-accent"
                  >
                    {contact.info.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[24px] border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-secondary">
                  <Phone className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Telefon</h3>
                  <a
                    href={`tel:${contact.info.phone.replace(/\s/g, "")}`}
                    className="mt-1 text-muted-foreground transition-colors hover:text-accent"
                  >
                    {contact.info.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4 rounded-[24px] border border-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-secondary">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Adres</h3>
                  <p className="mt-1 text-muted-foreground">{contact.info.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <form
              className="rounded-[32px] border border-border bg-card p-8"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    {contact.formLabels.name}
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="rounded-[16px] border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="Adınız Soyadınız"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-foreground">
                    {contact.formLabels.email}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="rounded-[16px] border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  {contact.formLabels.subject}
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="rounded-[16px] border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Mesajınızın konusu"
                />
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">
                  {contact.formLabels.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="resize-none rounded-[16px] border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Mesajınızı buraya yazın..."
                />
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-[32px] bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition-all hover:opacity-90"
              >
                <Send className="h-5 w-5" />
                {contact.formLabels.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
