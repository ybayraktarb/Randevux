"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navLinks = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "Fiyatlandırma", href: "#fiyatlandirma" },
  { label: "Hakkımızda", href: "#hakkimizda" },
  { label: "İletişim", href: "#iletisim" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">R</span>
          </div>
          <span className="text-xl font-semibold text-foreground">Randesk</span>
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href="/login"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Giriş Yap
          </a>
          <a
            href="/register"
            className="rounded-[32px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:opacity-90"
          >
            Ücretsiz Dene
          </a>
        </div>

        <button
          type="button"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menüyü aç/kapa"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <Menu className="h-6 w-6 text-foreground" />
          )}
        </button>
      </nav>

      <div
        className={cn(
          "overflow-hidden border-t border-border bg-background px-6 transition-all duration-300 lg:hidden",
          mobileMenuOpen ? "max-h-80 py-6 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <hr className="my-2 border-border" />
          <a
            href="/login"
            className="text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Giriş Yap
          </a>
          <a
            href="/register"
            className="inline-flex justify-center rounded-[32px] bg-primary px-6 py-3 text-base font-medium text-primary-foreground"
          >
            Ücretsiz Dene
          </a>
        </div>
      </div>
    </header>
  )
}
