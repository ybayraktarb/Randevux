// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // UI hatalarını ve kullanıcı adımlarını izlemek için Replay entegrasyonu
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,       // KVKK: Tüm metin içeriklerini maskele
      blockAllMedia: true,     // Medya dosyalarını (resim/video) kaydetme
    }),
  ],

  // Performans izleme örnekleme oranı
  tracesSampleRate: 1.0,

  // Session Replay örnekleme oranları
  replaysSessionSampleRate: 0.1,    // Normal oturumlarda %10 kayıt
  replaysOnErrorSampleRate: 1.0,    // Hata anında %100 kayıt

  // KVKK / Gizlilik: Kullanıcı IP ve hassas PII verilerini gönderme
  sendDefaultPii: false,

  // SDK loglarını sadece development'ta aç
  enableLogs: process.env.NODE_ENV === "development",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
