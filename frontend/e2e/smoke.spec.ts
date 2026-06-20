import { test, expect } from '@playwright/test'

/**
 * Smoke testlari — backend ishlamasa ham o'tadi (faqat frontend render/routing).
 * Asosiy sahifalar yuklanishi va marshrutlash buzilmaganini tekshiradi.
 */
test.describe('Smoke', () => {
  test('bosh sahifa yuklanadi va sarlavhaga ega', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/.+/)
    // Hech bo'lmaganda body render bo'lgan (oq ekran emas)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('login sahifasida parol maydoni bor', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('register sahifasida parol maydonlari bor', async ({ page }) => {
    await page.goto('/register')
    // Register'da ikkita parol maydoni bor (parol + tasdiqlash) — birinchisini tekshiramiz.
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test("noma'lum marshrut oq ekran emas (auth-gate'ga yo'naltiradi)", async ({ page }) => {
    // Login qilinmagan foydalanuvchi har qanday marshrutda auth-gate (Sign in) ko'radi —
    // marshrutlash buzilmagani va ilova qulamagani tekshiriladi.
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByRole('link', { name: /sign in/i }).first()).toBeVisible({ timeout: 15_000 })
  })
})
