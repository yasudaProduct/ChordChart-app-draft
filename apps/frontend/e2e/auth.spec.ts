import { test, expect } from './fixtures/test-base'

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || 'test01@example.com'
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD || 'password123'

test.describe('新規登録ページ', () => {
  test('新規登録フォームが表示される', async ({ registerPage }) => {
    await registerPage.goto()

    await expect(registerPage.heading).toBeVisible()
    await expect(registerPage.nameInput).toBeVisible()
    await expect(registerPage.emailInput).toBeVisible()
    await expect(registerPage.passwordInput).toBeVisible()
    await expect(registerPage.confirmInput).toBeVisible()
    await expect(registerPage.submitButton).toBeVisible()
  })

  test('ログインページへのリンクがある', async ({ registerPage }) => {
    await registerPage.goto()

    await expect(registerPage.loginLink).toBeVisible()
    await registerPage.loginLink.click()
    await expect(registerPage.page).toHaveURL(/\/login/)
  })
})

test.describe('認証保護', () => {
  test('未認証で保護ページにアクセスするとログインにリダイレクトされる', async ({
    page,
  }) => {
    await page.goto('/songs/new')

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('ログイン後にログアウトできる', async ({ loginPage, page }) => {
    await loginPage.goto()
    await loginPage.login(E2E_USER_EMAIL, E2E_USER_PASSWORD)
    await expect(page).toHaveURL(/\/songs/, { timeout: 10_000 })

    const logoutButton = page.getByRole('button', { name: 'ログアウト' })
    await logoutButton.click()

    await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible({
      timeout: 10_000,
    })
  })
})
