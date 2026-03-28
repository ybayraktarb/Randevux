import type { LandingPageProps } from "./types"

export const landingPageFallback: LandingPageProps = {
  hero: {
    title: "Randevularınızı Kolaylaştırın, İşinizi Büyütün",
    subtitle:
      "Randesk ile müşteri randevularınızı tek bir platformdan yönetin. Akıllı hatırlatmalar, otomatik planlama ve detaylı raporlarla zamanınızı verimli kullanın.",
    imageUrl:
      "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop",
    ctaText: "Hemen Ücretsiz Başlayın",
  },
  features: [
    {
      icon: "calendar",
      title: "Akıllı Takvim",
      description:
        "Sezgisel takvim arayüzü ile randevuvularınızı kolayca planlayın. Çakışmaları otomatik tespit edin.",
    },
    {
      icon: "users",
      title: "Müşteri Yönetimi",
      description:
        "Müşteri bilgilerini tek bir yerde saklayın. Randevu geçmişi ve notlarına anında erişin.",
    },
    {
      icon: "bar-chart",
      title: "Detaylı Analiz",
      description:
        "İşletmenizin performansını gerçek zamanlı raporlarla takip edin. Veri odaklı kararlar alın.",
    },
    {
      icon: "bell",
      title: "Otomatik Hatırlatmalar",
      description:
        "SMS ve e-posta ile müşterilerinize otomatik hatırlatmalar gönderin. İptal oranlarını düşürün.",
    },
    {
      icon: "smartphone",
      title: "Mobil Uygulama",
      description:
        "Her yerden randevularınıza erişin. iOS ve Android uygulamalarımızla işinizi cebinizde taşıyın.",
    },
    {
      icon: "shield",
      title: "Güvenli Altyapı",
      description:
        "KVKK uyumlu altyapımız ile verileriniz güvende. SSL şifreleme ve düzenli yedekleme.",
    },
  ],
  packages: [],
  about: {
    title: "Hakkımızda",
    subtitle: "Randesk olarak işletmelerin randevu yönetimini dijitalleştiriyoruz.",
    vision: {
      title: "Vizyonumuz",
      description:
        "Türkiye'nin lider randevu yönetim platformu olarak, her ölçekte işletmenin dijital dönüşümüne öncülük etmek.",
    },
    mission: {
      title: "Misyonumuz",
      description:
        "İşletmelerin müşteri ilişkilerini güçlendirmelerine yardımcı olmak, zaman kayıplarını en aza indirmek ve verimliliği artırmak.",
    },
    story:
      "2020 yılında küçük bir girişim olarak yola çıktık. Bugün 10.000'den fazla işletme Randesk ile randevularını yönetiyor.",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop",
  },
  contact: {
    title: "İletişim",
    subtitle: "Sorularınız mı var? Ekibimiz size yardımcı olmaktan mutluluk duyar.",
    info: {
      email: "destek@randesk.com",
      phone: "+90 212 555 0123",
      address: "Levent Mahallesi, Büyükdere Caddesi No: 123, Şişli / İstanbul",
    },
    formLabels: {
      name: "Ad Soyad",
      email: "E-posta",
      subject: "Konu",
      message: "Mesajınız",
      submit: "Mesaj Gönder",
    },
  },
}
