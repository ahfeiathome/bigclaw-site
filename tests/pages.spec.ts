import { test, expect } from '@playwright/test'

const TEST_EMAIL = 'michaelmkliu@gmail.com'

/** Login helper — logs in via email and waits for dashboard to load */
async function login(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/login')
  await page.getByRole('textbox', { name: 'Email address' }).fill(TEST_EMAIL)
  await page.getByRole('button', { name: 'Sign In' }).click()
  // Wait for navigation AWAY from login page (not just /dashboard/ which matches /dashboard/login)
  await page.waitForURL(url => url.pathname.startsWith('/dashboard') && !url.pathname.includes('/login'), { timeout: 15000 })
  await page.waitForLoadState('networkidle')
}

test.describe('Public pages', () => {
  test('homepage loads with Big Claw branding', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Big Claw/)
    await expect(page.getByRole('link', { name: 'Big Claw' })).toBeVisible()
    await expect(page.getByText('AI-native company')).toBeVisible()
  })

  test('about page loads', async ({ page }) => {
    await page.goto('/about')
    await expect(page).toHaveTitle(/Big Claw/)
  })

  test('projects page loads with product cards', async ({ page }) => {
    await page.goto('/projects')
    await expect(page).toHaveTitle(/Big Claw/)
    await expect(page.getByRole('heading', { name: 'GrovaKid' })).toBeVisible()
  })

  test('dashboard login page loads', async ({ page }) => {
    await page.goto('/dashboard/login')
    await expect(page.getByRole('textbox', { name: 'Email address' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})

test.describe('Dashboard auth', () => {
  test('dashboard redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard\/login/)
  })

  test('dashboard login works with authorized email', async ({ page }) => {
    await login(page)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('dashboard login rejects unauthorized email', async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.getByRole('textbox', { name: 'Email address' }).fill('nobody@example.com')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('not authorized')).toBeVisible()
  })
})

test.describe('Dashboard pages load with data', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('finance page loads', async ({ page }) => {
    await page.goto('/dashboard/finance')
    // Wait for page content — h1 if data loaded, error div if GitHub API unavailable locally
    await page.waitForSelector('h1, [class*="text-center"]', { timeout: 20000 })
  })

  test('projects page loads', async ({ page }) => {
    await page.goto('/dashboard/products')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
  })

  test('RADAR page loads', async ({ page }) => {
    await page.goto('/dashboard/products/radar')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'RADAR' })).toBeVisible({ timeout: 10000 })
  })
})
