/**
 * (customer) Route Group — Public Booking Layout
 *
 * Bu route group login gerektirmez.
 * QR kod, paylaşılan link veya direkt URL ile gelen
 * herkese açık randevu alma sayfasını kapsar.
 *
 * Rota: /book/[business_id]
 *
 * (musteri) route group'undan farkı:
 *   - Auth gerektirmez
 *   - App shell / sidebar içermez
 *   - Standalone sayfa deneyimi sunar
 */
export default function CustomerBookingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <>{children}</>
}
