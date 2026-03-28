import { test, expect } from '@playwright/test'

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
    await expect(page.getByText('Learnie AI')).toBeVisible()
  })

  test('dashboard login page loads', async ({ page }) => {
    await page.goto('/dashboard/login')
    await expect(page.getByText('Dashboard Login')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })
})

test.describe('Dashboard auth', () => {
  test('dashboard redirects to login without auth', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard\/login/)
  })

  test('dashboard login works with correct password', async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.getByRole('textbox', { name: 'Password' }).fill('Learnie2026Admin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByText('Felix Heartbeat')).toBeVisible()
  })

  test('dashboard login rejects wrong password', async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByText('Invalid password')).toBeVisible()
  })
})

test.describe('Dashboard pages load with data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/login')
    await page.getByRole('textbox', { name: 'Password' }).fill('Learnie2026Admin')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
  })

  test('finance page loads', async ({ page }) => {
    await page.goto('/dashboard/finance')
    await expect(page.getByText('Financial Health')).toBeVisible()
  })

  test('projects page loads', async ({ page }) => {
    await page.goto('/dashboard/projects')
    await expect(page.getByText('Projects')).toBeVisible()
  })

  test('RADAR page loads', async ({ page }) => {
    await page.goto('/dashboard/radar')
    await expect(page.getByText('RADAR Trading System')).toBeVisible()
  })

  test('growth page loads', async ({ page }) => {
    await page.goto('/dashboard/bizdev')
    await expect(page.getByText('Growth')).toBeVisible()
  })
})
