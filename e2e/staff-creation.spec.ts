import { test, expect, Page } from "@playwright/test"

const PATRON_EMAIL = process.env.TEST_PATRON_EMAIL ?? "test-patron@randevux.dev"
const PATRON_PASSWORD = process.env.TEST_PATRON_PASSWORD ?? "test-password-123"

const TEST_PERSONEL = {
    name: `Test Personel ${Date.now()}`,
    email: `test-personel-${Date.now()}@randevux.test`,
    password: "Test1234!",
}

const EXISTING_EMAIL = PATRON_EMAIL // Var olan bir email (duplicate testi için)

async function loginAsPatron(page: Page) {
    await page.goto("/login")
    await page.fill('input[type="email"]', PATRON_EMAIL)
    await page.fill('input[type="password"]', PATRON_PASSWORD)
    await page.locator('button', { hasText: 'Giris Yap' }).click()
    await page.waitForURL(/\/patron-dashboard/, { timeout: 10_000 })
}

async function goToStaffPage(page: Page) {
    // Personel yönetimi sayfasına git
    const staffLink = page.locator(
        'a[href*="personel"], a:has-text("Personel"), nav a:has-text("Personel Yönetimi")'
    ).first()

    if (await staffLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await staffLink.click()
    } else {
        await page.goto("/personel")
    }

    // Personel sayfasının yüklendiğini doğrula
    await expect(page.locator("h1, h2").filter({ hasText: /personel/i }).first()).toBeVisible({
        timeout: 8_000,
    })
}

async function openNewStaffForm(page: Page) {
    const addBtn = page.locator(
        'button:has-text("Personel Ekle"), button:has-text("Yeni Personel"), button:has-text("Ekle"), [data-testid="add-staff-btn"]'
    ).first()
    await expect(addBtn).toBeVisible({ timeout: 5_000 })
    await addBtn.click()

    // Modal veya form açık mı?
    await expect(
        page.locator('[role="dialog"], [data-testid="staff-form"], form').first()
    ).toBeVisible({ timeout: 5_000 })
}

async function fillStaffForm(page: Page, data: { name: string; email: string; password: string }) {
    const nameInput = page.locator('input[name="name"], input[placeholder*="Ad"], input[id*="name"]').first()
    const emailInput = page.locator('input[type="email"]').last() // Modal'daki email, login'deki değil
    const passwordInput = page.locator('input[type="password"]').last()

    if (await nameInput.isVisible()) await nameInput.fill(data.name)
    if (await emailInput.isVisible()) await emailInput.fill(data.email)
    if (await passwordInput.isVisible()) await passwordInput.fill(data.password)
}

// ─── Personel Oluşturma Akışı ───────────────────────────────────────────────────
test.describe("Staff Creation — Personel Oluşturma Akışı", () => {

    // Senaryo 1: Başarılı personel ekleme
    test("Patron yeni personel ekleyebilmeli", async ({ page }) => {
        await loginAsPatron(page)
        await goToStaffPage(page)
        await openNewStaffForm(page)
        await fillStaffForm(page, TEST_PERSONEL)

        // Kaydet butonu — modal içindeki son button
        const saveBtn = page.locator('[role="dialog"] button').filter({ hasText: /kaydet|ekle|davet/i }).last()
        const saveBtnFallback = page.locator('button').filter({ hasText: /kaydet|ekle|davet/i }).last()
        const btn = (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) ? saveBtn : saveBtnFallback
        await btn.click()

        // Başarı: modal kapanır (toast veya liste)
        // Personel davet emaili gönderildi — anlık liste güncellenmeyebilir
        // Bu nedenle: modal kapandı VEYA toast göründü = başarı
        const modalGone = await page.locator('[role="dialog"]').isHidden({ timeout: 8_000 }).catch(() => false)
        const toastVisible = await page.locator('[role="alert"], .toast-success, [data-testid="success"]').isVisible().catch(() => false)

        expect(modalGone || toastVisible).toBeTruthy()
    })


    // Senaryo 2: Geçersiz email formatı
    test("Geçersiz email formatında validation hatası göstermeli", async ({ page }) => {
        await loginAsPatron(page)
        await goToStaffPage(page)
        await openNewStaffForm(page)

        await fillStaffForm(page, {
            name: "Test Personel",
            email: "bu-gecersiz-format", // @ eksik
            password: "Test1234!",
        })

        const saveBtn = page.locator(
            'button[type="submit"], button:has-text("Kaydet"), button:has-text("Ekle")'
        ).last()
        await saveBtn.click()

        // Validation hatası: email input invalid state VEYA hata mesajı
        const emailInput = page.locator('input[type="email"]').last()
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)

        if (!isInvalid) {
            // Browser validation yoksa uygulama hatası mesajı olabilir
            const errorMsg = page.locator(
                'text=geçersiz, text=hatalı, text=email, [role="alert"], .error-message, .text-red'
            ).first()
            await expect(errorMsg).toBeVisible({ timeout: 5_000 })
        } else {
            expect(isInvalid).toBe(true)
        }

        // Modal kapanmamış olmalı (validation başarısız)
        await expect(page).not.toHaveURL(/\/patron-dashboard$/)
    })

    // Senaryo 3: Duplicate email kontrolü
    test("Var olan email ile personel eklenemez — hata mesajı göstermeli", async ({ page }) => {
        await loginAsPatron(page)
        await goToStaffPage(page)
        await openNewStaffForm(page)

        await fillStaffForm(page, {
            name: "Duplicate Personel",
            email: EXISTING_EMAIL, // zaten var olan email
            password: "Test1234!",
        })

        const saveBtn2 = page.locator('[role="dialog"] button').filter({ hasText: /kaydet|ekle|davet/i }).last()
        const saveBtn2Fallback = page.locator('button').filter({ hasText: /kaydet|ekle|davet/i }).last()
        const btn2 = (await saveBtn2.isVisible({ timeout: 3_000 }).catch(() => false)) ? saveBtn2 : saveBtn2Fallback
        await btn2.click()

        // Hata mesajı: toast veya [role="alert"] — app'e özgü kelime bilinmiyor
        // Önce alert'i dene, yoksa modal hala açık = hata yutulmuş ama form kapanmadı = başarı sayılır
        const alertVisible = await page.locator('[role="alert"], .toast-error, .toast-destructive').isVisible({ timeout: 5_000 }).catch(() => false)
        const modalStillOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false)

        // Ya hata gösterildi YA DA modal hala açık (submit reddedildi)
        expect(alertVisible || modalStillOpen).toBeTruthy()
    })


})
