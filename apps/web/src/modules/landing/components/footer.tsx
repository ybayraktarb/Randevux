const footerLinks = {
  urun: {
    title: "Ürün",
    links: [
      { label: "Özellikler", href: "#ozellikler" },
      { label: "Fiyatlandırma", href: "#fiyatlandirma" },
      { label: "Entegrasyonlar", href: "#entegrasyonlar" },
      { label: "API", href: "#api" },
    ],
  },
  sirket: {
    title: "Şirket",
    links: [
      { label: "Hakkımızda", href: "#hakkimizda" },
      { label: "Blog", href: "#blog" },
      { label: "Kariyer", href: "#kariyer" },
      { label: "İletişim", href: "#iletisim" },
    ],
  },
  destek: {
    title: "Destek",
    links: [
      { label: "Yardım Merkezi", href: "#yardim" },
      { label: "Dokümantasyon", href: "#dokumanlar" },
      { label: "Topluluk", href: "#topluluk" },
      { label: "Durum", href: "#durum" },
    ],
  },
  yasal: {
    title: "Yasal",
    links: [
      { label: "Gizlilik Politikası", href: "#gizlilik" },
      { label: "Kullanım Şartları", href: "#kullanim-sartlari" },
      { label: "KVKK", href: "#kvkk" },
    ],
  },
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="text-lg font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-xl font-semibold text-foreground">Randesk</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Modern işletmeler için tasarlanmış akıllı randevu yönetim sistemi. 
              Zamanınızı verimli kullanın, işinizi büyütün.
            </p>
          </div>
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-foreground">
                {section.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Randesk. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6">
            <a
              href="#twitter"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Twitter
            </a>
            <a
              href="#linkedin"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              LinkedIn
            </a>
            <a
              href="#instagram"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
