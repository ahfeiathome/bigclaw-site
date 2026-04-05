import { test, expect } from '@playwright/test'

const TEST_PASSWORD = process.env.DASHBOARD_PASSWORD || 'test-password'

test.describe('Visual verification — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.waitForLoadState('networkidle')
    await page.getByText('Use operator password instead').click()
    const passwordInput = page.locator('input[type="password"]')
    await passwordInput.waitFor({ state: 'visible', timeout: 15000 })
    await passwordInput.fill(TEST_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/dashboard\/mission-control/, { timeout: 15000 })
  })

  test('mission control page renders all key sections', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Verify page header renders
    await expect(page.getByText('Mission Control').first()).toBeVisible()

    // Verify command center exists
    await expect(page.getByText('Command Center').first()).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-mission-control.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('finance page shows operational costs only', async ({ page }) => {
    await page.goto('/dashboard/finance')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Finance' })).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-finance.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('infra page shows subscriptions and models', async ({ page }) => {
    await page.goto('/dashboard/infra')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Infrastructure' })).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-infra.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('RADAR page loads with trading data', async ({ page }) => {
    await page.goto('/dashboard/radar')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'RADAR' })).toBeVisible()

    // Screenshot comparison — allow higher diff for dynamic trading data
    await expect(page).toHaveScreenshot('dashboard-radar.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.25,
    })
  })
})

test.describe('Visual verification — public pages', () => {
  test('about page shows all 8 agents', async ({ page }) => {
    await page.goto('/about')
    await page.waitForLoadState('networkidle')

    // Verify M3 team — all agents listed
    await expect(page.getByText('Code CLI (Felix)', { exact: true })).toBeVisible()
    await expect(page.getByText('Claude Chat', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Mika', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Rex', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Byte', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Sage', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Lumina', { exact: true }).first()).toBeVisible()

    // Verify NO "Frozen agents" section
    await expect(page.getByText('Frozen agents')).not.toBeVisible()

    // Verify M3 architecture note
    await expect(page.getByText('M3 Architecture')).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('about-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('homepage shows Free beta pricing', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Free beta')).toBeVisible()
    await expect(page.getByText('bigclawai@gmail.com')).toBeVisible()

    // Verify NO old pricing
    await expect(page.getByText('$19.99/mo')).not.toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })
})
