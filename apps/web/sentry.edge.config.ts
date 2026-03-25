// Sentry edge runtime initialization
// Bu dosya middleware ve Edge API Routes için çalışır.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs"

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    tracesSampleRate: 1.0,
})
