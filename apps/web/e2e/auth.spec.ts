import { test, expect, Page } from "@playwright/test"

const PATRON_EMAIL = process.env.TEST_PATRON_EMAIL ?? "test-patron@randesk.dev"
const PATRON_PASSWORD = process.env.TEST_PATRON_PASSWORD ?? "test-password-123"
const PERSONEL_EMAIL = process.env.TEST_PERSONEL_EMAIL ?? "test-personel@randesk.dev"
const PERSONEL_PASSWORD = process.env.TEST_PERSONEL_PASSWORD ?? "test-password-123"
const MUSTERI_EMAIL = process.env.TEST_MUSTERI_EMAIL ?? "test-musteri@randesk.dev"
const MUSTERI_PASSWORD = process.env.TEST_MUSTERI_PASSWORD ?? "test-password-123"

// ─── Shared helper ──────────────────────────────────────────────────────────────
async function login(page: Page, email: string, password: string) {
    await page.goto("/login")
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    await page.locator('button', { hasText: 'Giris Yap' }).click()
}

// ─── Auth Akışları ──────────────────────────────────────────────────────────────
test.describe("Auth — Rol Bazlı Giriş ve Yönlendirme", () => {

    // Senaryo 1: Patron girişi
    test("Patron girişi → /patron-dashboard yönlendirmesi", async ({ page }) => {
        await login(page, PATRON_EMAIL, PATRON_PASSWORD)

        // URL yönlendirmesi yeterli doğrulama
        await expect(page).toHaveURL(/\/patron-dashboard/)
    })


    // Senaryo 2: Personel girişi
    test("Personel girişi → /personel-panel yönlendirmesi", async ({ page }) => {
        await login(page, PERSONEL_EMAIL, PERSONEL_PASSWORD)
        await page.waitForURL(/\/personel-panel/, { timeout: 10_000 })
        await expect(page).toHaveURL(/\/personel-panel/)
    })

    // Senaryo 3: Müşteri girişi
    test("Müşteri girişi → /musteri-panel yönlendirmesi", async ({ page }) => {
        await login(page, MUSTERI_EMAIL, MUSTERI_PASSWORD)
        await page.waitForURL(/\/musteri-panel/, { timeout: 10_000 })
        await expect(page).toHaveURL(/\/musteri-panel/)
    })

    // Senaryo 4: Yetkisiz erişim (giriş olmadan korumalı sayfa)
    test("Giriş yapılmadan /patron-dashboard → /login yönlendirmesi", async ({ page }) => {
        await page.goto("/patron-dashboard")
        await page.waitForURL(/\/login/, { timeout: 8_000 })
        await expect(page).toHaveURL(/\/login/)
    })

    // Senaryo 5: Çıkış (logout)
    test("Giriş → Çıkış → /login yönlendirmesi", async ({ page }) => {
        await login(page, PATRON_EMAIL, PATRON_PASSWORD)
        await page.waitForURL(/\/patron-dashboard/, { timeout: 10_000 })

        // Çıkış butonunu bul — farklı konumlarda olabilir (dropdown, sidebar)
        const logoutBtn = page.locator(
            'button:has-text("Çıkış"), button:has-text("Çık"), [aria-label="Çıkış Yap"]'
        )

        // Dropdown açılabilir (mobil/desktop farkı)
        const profileTrigger = page.locator(
            'button:has-text("Admin"), [data-testid="profile-menu"]'
        ).first()

        if (await profileTrigger.isVisible()) {
            await profileTrigger.click()
        }

        await logoutBtn.first().click()
        await page.waitForURL(/\/login/, { timeout: 8_000 })
        await expect(page).toHaveURL(/\/login/)
    })

})
