// Sentry server-side initialization
// Bu dosya Node.js runtime'da (Server Actions, API Routes) çalışır.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 1.0,

    // Server-side'da session replay yoktur
    // Profiling için:
    // profilesSampleRate: 1.0,
})
