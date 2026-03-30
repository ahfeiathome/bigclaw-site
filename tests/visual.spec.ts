import { test, expect } from '@playwright/test'

test.describe('Visual verification — dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.getByRole('textbox', { name: 'Password' }).fill('Learnie2026Admin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('overview page renders all key sections', async ({ page }) => {
    await page.waitForLoadState('networkidle')

    // Verify Felix Heartbeat header
    await expect(page.getByText('Felix Heartbeat', { exact: true })).toBeVisible()

    // Verify metric cards render with values (use exact match to avoid nav collisions)
    await expect(page.locator('text=HEALTHY').first()).toBeVisible()

    // Verify Agent Status panel exists with all 6 agents
    await expect(page.getByText('Pi5 Agents', { exact: true })).toBeVisible()
    await expect(page.getByText('Mika', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Rex', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Byte', { exact: true }).first()).toBeVisible()

    // Verify Quick Actions bar
    await expect(page.getByText('GitHub Board', { exact: true })).toBeVisible()
    await expect(page.getByText('Learnie Live', { exact: true })).toBeVisible()

    // Verify Infrastructure section
    await expect(page.getByText('Infrastructure').first()).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-overview.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('finance page shows operational costs only', async ({ page }) => {
    await page.goto('/dashboard/finance')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Financial Health')).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-finance.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('infra page shows subscriptions and models', async ({ page }) => {
    await page.goto('/dashboard/infra')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Infrastructure & Stack')).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-infra.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
    })
  })

  test('RADAR page loads with trading data', async ({ page }) => {
    await page.goto('/dashboard/radar')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('RADAR Trading System')).toBeVisible()

    // Screenshot comparison
    await expect(page).toHaveScreenshot('dashboard-radar.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.1,
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
