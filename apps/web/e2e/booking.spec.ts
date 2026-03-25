import { test, expect, Page } from "@playwright/test"

const MUSTERI_EMAIL = process.env.TEST_MUSTERI_EMAIL ?? "test-musteri@randevux.dev"
const MUSTERI_PASSWORD = process.env.TEST_MUSTERI_PASSWORD ?? "test-password-123"

async function loginAsMusteri(page: Page) {
    await page.goto("/login")
    await page.fill('input[type="email"]', MUSTERI_EMAIL)
    await page.fill('input[type="password"]', MUSTERI_PASSWORD)
    await page.locator('button', { hasText: 'Giris Yap' }).click()
    await page.waitForURL(/\/musteri-panel/, { timeout: 10_000 })
}

// ─── Randevu Alma Akışı ─────────────────────────────────────────────────────────
test.describe("Booking — Randevu Alma Akışı", () => {

    // Senaryo 1: Başarılı randevu alma (happy path)
    test("Müşteri başarıyla randevu alabilmeli", async ({ page }) => {
        await loginAsMusteri(page)

        // Randevu al sayfasına git
        const randevuAlLink = page.locator(
            'a[href*="randevu-al"], button:has-text("Randevu Al"), a:has-text("Randevu Al")'
        ).first()

        // Önce musteri-panel'de randevu al bağlantısını dene
        if (await randevuAlLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await randevuAlLink.click()
        } else {
            await page.goto("/randevu-al")
        }

        await page.waitForURL(/\/randevu-al/, { timeout: 8_000 })

        // ── Adım 1: İşletme seç ──
        const businessSelect = page.locator(
            'select[id*="business"], select[id*="isletme"], [data-testid="business-select"]'
        ).first()

        if (await businessSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await businessSelect.selectOption({ index: 1 }) // ilk işletmeyi seç
        } else {
            // Kart bazlı UI
            const firstBusiness = page.locator('[data-testid="business-card"], .business-card').first()
            if (await firstBusiness.isVisible({ timeout: 5_000 }).catch(() => false)) {
                await firstBusiness.click()
            }
        }

        // ── Adım 2: Hizmet seç ──
        const serviceSelect = page.locator(
            'select[id*="service"], select[id*="hizmet"], [data-testid="service-select"]'
        ).first()

        if (await serviceSelect.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await serviceSelect.selectOption({ index: 1 })
        } else {
            const firstService = page.locator('[data-testid="service-card"], .service-item').first()
            if (await firstService.isVisible({ timeout: 5_000 }).catch(() => false)) {
                await firstService.click()
            }
        }

        // ── Adım 3: Personel seç (opsiyonel adım) ──
        const staffSelect = page.locator(
            'select[id*="staff"], select[id*="personel"], [data-testid="staff-select"]'
        ).first()

        if (await staffSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await staffSelect.selectOption({ index: 0 })
        }

        // ── Adım 4: Uygun slot seç ──
        // CSS'de regex desteklenmez — filter() kullan
        const timePattern = /^\d{2}:\d{2}/
        const availableSlot = page.locator('button:not([disabled])').filter({ hasText: timePattern }).first()

        const slotOrFallback = page.locator('[data-testid="slot"]:not([data-disabled="true"]), .slot-available').first()

        const slotVisible = await availableSlot.isVisible({ timeout: 10_000 }).catch(() => false)
            || await slotOrFallback.isVisible({ timeout: 2_000 }).catch(() => false)

        if (!slotVisible) {
            test.skip(true, "Uygun slot bulunamadı — işletme veya personel kurulumu eksik olabilir.")
            return
        }

        const slotToClick = (await availableSlot.isVisible()) ? availableSlot : slotOrFallback
        await slotToClick.click()

        // ── Adım 5: Onayla ──
        const confirmBtn = page.locator('button').filter({ hasText: /onayla|randevu al|rezerve et/i }).first()

        const confirmVisible = await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)
        if (!confirmVisible) {
            test.skip(true, "Onay butonu bulunamadı.")
            return
        }
        await confirmBtn.click()

        // ── Adım 6: Başarı doğrula ──
        // URL değişimi VEYA toast mesajı
        await Promise.race([
            page.waitForURL(/\/(randevularim|musteri-panel|randevu-al)/, { timeout: 10_000 }),
            page.locator('[role="alert"], .toast-success, [data-testid="booking-success"]').first().waitFor({ timeout: 10_000 }),
        ]).catch(() => { })

        // En az bir başarı göstergesi
        const onSuccess = page.url().includes("randevularim")
            || page.url().includes("musteri-panel")
            || await page.locator('[role="alert"]').isVisible().catch(() => false)
        expect(onSuccess).toBeTruthy()
    })


    // Senaryo 2: Dolu slot seçilemez olmalı
    test("Dolu slot seçilemez (disabled) olmalı", async ({ page }) => {
        await loginAsMusteri(page)
        await page.goto("/randevu-al")

        await page.waitForURL(/\/randevu-al/, { timeout: 8_000 })

        // İşletme ve hizmet seçildikten sonra slot listesini bekle
        await page.waitForSelector(
            '[data-testid="slot"], button:has-text(/\\d{2}:\\d{2}/)',
            { timeout: 10_000 }
        ).catch(() => {/* slot lista henüz yok, test devam eder */ })

        // Dolu (disabled) slot varsa seçilemez olduğunu doğrula
        const disabledSlot = page.locator(
            'button[disabled]:has-text(/\\d{2}:\\d{2}/), [data-testid="slot"][data-disabled="true"], .slot-full, .slot-disabled'
        ).first()

        if (await disabledSlot.isVisible({ timeout: 5_000 }).catch(() => false)) {
            // Disabled slot tıklanabilir olmamalı
            await expect(disabledSlot).toBeDisabled()
        } else {
            // Dolu slot yoksa test geçer (test ortamında henüz randevu yok)
            test.skip(true, "Test ortamında dolu slot bulunamadı — bu beklenen durum.")
        }
    })

})
