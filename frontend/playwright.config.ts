import { defineConfig, devices } from '@playwright/test'

/**
 * E2E konfiguratsiyasi. Vite dev-serverni o'zi ko'taradi (webServer) — u /api va /ws'ni
 * VITE_API_URL'dagi backendga proxy qiladi. Chat (backend bilan) testlari uchun backend
 * alohida ishga tushirilgan bo'lishi kerak; smoke testlari backend'siz ham o'tadi.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { VITE_API_URL: process.env.VITE_API_URL || 'http://localhost:8089' },
  },
})
