import { withSentryConfig } from "@sentry/nextjs"
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

export default withBundleAnalyzer(withSentryConfig(nextConfig, {
  // Sentry organizasyon ve proje bilgileri
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "randevux",

  // Source maps gizli tutulur, Sentry'ye yüklenir
  silent: !process.env.CI,

  // Geniş bundle analizi
  widenClientFileUpload: true,

  // Tunnel üzerinden Sentry isteği gönder (ad blocker bypass)
  // tunnelRoute: "/monitoring",
}))

