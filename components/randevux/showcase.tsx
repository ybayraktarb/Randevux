"use client"

import { useState } from "react"
import { Mail, Search, User, Calendar, Clock, MapPin } from "lucide-react"
import { RxButton } from "./rx-button"
import { RxInput, RxTextarea } from "./rx-input"
import { RxBadge } from "./rx-badge"
import { RxCard } from "./rx-card"
import { RxAvatar } from "./rx-avatar"
import { RxModal } from "./rx-modal"
import { RxEmptyState } from "./rx-empty-state"
import { RxToastProvider, showToast } from "./rx-toast"

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-foreground">{children}</h2>
      <div className="mt-2 h-0.5 w-12 rounded-full bg-primary" />
    </div>
  )
}

function Section({
  children,
  id,
}: {
  children: React.ReactNode
  id?: string
}) {
  return (
    <section id={id} className="scroll-mt-8">
      {children}
    </section>
  )
}

function ButtonsSection() {
  return (
    <Section id="butonlar">
      <SectionHeader>Butonlar</SectionHeader>
      <div className="space-y-8">
        {/* Variants */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Varyantlar
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <RxButton variant="primary">Birincil</RxButton>
            <RxButton variant="secondary">Ikincil</RxButton>
            <RxButton variant="danger">Tehlike</RxButton>
            <RxButton variant="ghost">Hayalet</RxButton>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Boyutlar
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <RxButton size="sm">Kucuk</RxButton>
            <RxButton size="md">Orta</RxButton>
            <RxButton size="lg">Buyuk</RxButton>
          </div>
        </div>

        {/* States */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Durumlar
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <RxButton loading>Yukleniyor</RxButton>
            <RxButton disabled>Devre Disi</RxButton>
            <RxButton variant="secondary" loading>
              Kaydediliyor
            </RxButton>
            <RxButton variant="danger" disabled>
              Silinemez
            </RxButton>
          </div>
        </div>
      </div>
    </Section>
  )
}

function InputsSection() {
  return (
    <Section id="girdi-alanlari">
      <SectionHeader>Girdi Alanlari</SectionHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <RxInput label="Ad Soyad" placeholder="Ahmet Yilmaz" />
        <RxInput
          label="E-posta"
          placeholder="ahmet@ornek.com"
          icon={<Mail className="size-4" />}
        />
        <RxInput
          label="Telefon"
          placeholder="+90 5XX XXX XX XX"
          error="Bu alan zorunludur"
        />
        <RxInput
          label="Arama"
          placeholder="Randevu ara..."
          icon={<Search className="size-4" />}
          disabled
        />
        <div className="md:col-span-2">
          <RxTextarea
            label="Notlar"
            placeholder="Randevu ile ilgili notlarinizi buraya yazin..."
          />
        </div>
        <div className="md:col-span-2">
          <RxTextarea
            label="Aciklama"
            placeholder="Detayli bilgi..."
            error="En az 10 karakter girmelisiniz"
          />
        </div>
      </div>
    </Section>
  )
}

function BadgesSection() {
  return (
    <Section id="rozetler">
      <SectionHeader>Rozetler</SectionHeader>
      <div className="flex flex-wrap items-center gap-3">
        <RxBadge variant="success">Onaylandi</RxBadge>
        <RxBadge variant="warning">Bekliyor</RxBadge>
        <RxBadge variant="danger">Iptal Edildi</RxBadge>
        <RxBadge variant="purple">Tamamlandi</RxBadge>
        <RxBadge variant="gray">No-Show</RxBadge>
      </div>
    </Section>
  )
}

function CardsSection() {
  return (
    <Section id="kartlar">
      <SectionHeader>Kartlar</SectionHeader>
      <div className="grid gap-6 md:grid-cols-2">
        <RxCard>
          <p className="text-sm text-muted-foreground">
            Basit bir kart bilesenini burada gorebilirsiniz. Varsayilan olarak
            beyaz arka plan, ince kenar ve yumusak golge kullanilir.
          </p>
        </RxCard>

        <RxCard
          header={
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Bugunku Randevular
              </h3>
              <RxBadge variant="purple">3 Randevu</RxBadge>
            </div>
          }
          footer={
            <RxButton variant="ghost" size="sm">
              Tumunu Gor
            </RxButton>
          }
        >
          <div className="space-y-3">
            {[
              {
                name: "Ayse Demir",
                time: "10:00",
                status: "success" as const,
                label: "Onaylandi",
              },
              {
                name: "Mehmet Kaya",
                time: "11:30",
                status: "warning" as const,
                label: "Bekliyor",
              },
              {
                name: "Fatma Ozturk",
                time: "14:00",
                status: "purple" as const,
                label: "Tamamlandi",
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <RxAvatar name={item.name} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <RxBadge variant={item.status}>{item.label}</RxBadge>
              </div>
            ))}
          </div>
        </RxCard>

        <RxCard
          header={
            <h3 className="font-semibold text-foreground">Randevu Detayi</h3>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>Ahmet Yilmaz</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              <span>15 Mart 2026, Pazar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>14:00 - 14:45</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" />
              <span>Istanbul, Kadikoy Subesi</span>
            </div>
          </div>
        </RxCard>

        <RxCard>
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-primary-light">
              <Calendar className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">248</p>
              <p className="text-sm text-muted-foreground">
                Bu Ayki Toplam Randevu
              </p>
            </div>
          </div>
        </RxCard>
      </div>
    </Section>
  )
}

function AvatarSection() {
  return (
    <Section id="avatar">
      <SectionHeader>Avatar</SectionHeader>
      <div className="space-y-8">
        {/* Sizes */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Boyutlar
          </p>
          <div className="flex items-center gap-4">
            <RxAvatar name="Ahmet Yilmaz" size="sm" />
            <RxAvatar name="Ahmet Yilmaz" size="md" />
            <RxAvatar name="Ahmet Yilmaz" size="lg" />
          </div>
        </div>

        {/* With Online Indicator */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Cevrimici Gostergesi
          </p>
          <div className="flex items-center gap-4">
            <RxAvatar name="Elif Sahin" size="sm" online />
            <RxAvatar name="Zeynep Arslan" size="md" online />
            <RxAvatar name="Burak Celik" size="lg" online />
          </div>
        </div>

        {/* Various Names */}
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Farkli Isimler
          </p>
          <div className="flex items-center gap-4">
            <RxAvatar name="Ayse Demir" size="md" />
            <RxAvatar name="Mehmet Kaya" size="md" online />
            <RxAvatar name="Fatma Ozturk" size="md" />
            <RxAvatar name="Can Yildiz" size="md" online />
            <RxAvatar name="Selin Korkmaz" size="md" />
          </div>
        </div>
      </div>
    </Section>
  )
}

function ModalSection() {
  const [open, setOpen] = useState(false)
  return (
    <Section id="modal">
      <SectionHeader>Modal</SectionHeader>
      <RxButton onClick={() => setOpen(true)}>Modali Ac</RxButton>
      <RxModal
        open={open}
        onClose={() => setOpen(false)}
        title="Randevu Detayi"
        footer={
          <>
            <RxButton variant="ghost" onClick={() => setOpen(false)}>
              Kapat
            </RxButton>
            <RxButton onClick={() => setOpen(false)}>Onayla</RxButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <RxAvatar name="Ahmet Yilmaz" size="lg" online />
            <div>
              <p className="font-semibold text-foreground">Ahmet Yilmaz</p>
              <p className="text-sm text-muted-foreground">
                ahmet@ornek.com
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-primary-light p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Calendar className="size-4 text-primary" />
              <span>15 Mart 2026, Pazar</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <Clock className="size-4 text-primary" />
              <span>14:00 - 14:45 (45 dk)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="size-4 text-primary" />
              <span>Istanbul, Kadikoy Subesi</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-1">Durum</p>
            <RxBadge variant="success">Onaylandi</RxBadge>
          </div>
        </div>
      </RxModal>
    </Section>
  )
}

function EmptyStateSection() {
  return (
    <Section id="bos-durum">
      <SectionHeader>Bos Durum</SectionHeader>
      <RxEmptyState
        title="Henuz randevu yok"
        description="Ilk randevunuzu olusturmak icin asagidaki butona tiklayin"
        actionLabel="Randevu Olustur"
        onAction={() => showToast("success", "Randevu basariyla olusturuldu")}
      />
    </Section>
  )
}

function ToastSection() {
  return (
    <Section id="bildirimler">
      <SectionHeader>Bildirimler</SectionHeader>
      <div className="flex flex-wrap gap-3">
        <RxButton
          variant="primary"
          onClick={() =>
            showToast("success", "Randevu basariyla olusturuldu")
          }
        >
          Basari Bildirimi
        </RxButton>
        <RxButton
          variant="danger"
          onClick={() =>
            showToast("error", "Bir hata olustu, lutfen tekrar deneyin")
          }
        >
          Hata Bildirimi
        </RxButton>
        <RxButton
          variant="secondary"
          onClick={() => showToast("info", "Yarin randevunuz var")}
        >
          Bilgi Bildirimi
        </RxButton>
      </div>
    </Section>
  )
}

const navItems = [
  { id: "butonlar", label: "Butonlar" },
  { id: "girdi-alanlari", label: "Girdi Alanlari" },
  { id: "rozetler", label: "Rozetler" },
  { id: "kartlar", label: "Kartlar" },
  { id: "avatar", label: "Avatar" },
  { id: "modal", label: "Modal" },
  { id: "bos-durum", label: "Bos Durum" },
  { id: "bildirimler", label: "Bildirimler" },
]

export function DesignSystemShowcase() {
  return (
    <>
      <RxToastProvider />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  RX
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  RandevuX
                </h1>
                <p className="text-xs text-muted-foreground">Tasarim Sistemi</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </header>

        {/* Hero */}
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-4">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              v1.0 - Aktif Gelistirme
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight text-balance md:text-5xl">
              Tasarim Sistemi
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
              RandevuX uygulamasi icin olusturulmus tum bilesen ve stillerin
              referans sayfasi.
            </p>
          </div>

          {/* Color Palette */}
          <div className="mb-16">
            <SectionHeader>Renk Paleti</SectionHeader>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {[
                { name: "Primary", color: "bg-primary", hex: "#6C63FF" },
                {
                  name: "Primary Light",
                  color: "bg-primary-light",
                  hex: "#F8F7FF",
                },
                {
                  name: "Accent / Danger",
                  color: "bg-destructive",
                  hex: "#FF6584",
                },
                {
                  name: "Foreground",
                  color: "bg-foreground",
                  hex: "#1A1A2E",
                },
                { name: "Border", color: "bg-border", hex: "#E5E7EB" },
              ].map((c) => (
                <div key={c.name} className="space-y-2">
                  <div
                    className={`h-16 rounded-lg ${c.color} border border-border`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {c.hex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* All Sections */}
          <div className="space-y-16">
            <ButtonsSection />
            <InputsSection />
            <BadgesSection />
            <CardsSection />
            <AvatarSection />
            <ModalSection />
            <EmptyStateSection />
            <ToastSection />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-border bg-card">
          <div className="mx-auto max-w-5xl px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              RandevuX Tasarim Sistemi &middot; Tum bilesenler Tailwind CSS ile
              olusturulmustur.
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
