import { test, expect } from './fixtures/test-base'

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || ''
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD || ''

test.describe('ログインページ', () => {
  test('ログインフォームが表示される', async ({ loginPage }) => {
    await loginPage.goto()

    await expect(loginPage.heading).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('新規登録ページへのリンクがある', async ({ loginPage }) => {
    await loginPage.goto()

    await expect(loginPage.registerLink).toBeVisible()
    await loginPage.registerLink.click()
    await expect(loginPage.page).toHaveURL(/\/register/)
  })

  test('正しい認証情報でログインできる', async ({ loginPage }) => {
    test.skip(!E2E_USER_EMAIL, 'E2E_USER_EMAIL が未設定')

    await loginPage.goto()
    await loginPage.login(E2E_USER_EMAIL, E2E_USER_PASSWORD)

    await expect(loginPage.page).toHaveURL(/\/songs/, { timeout: 10_000 })
  })

  test('誤った認証情報でエラーが表示される', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.login('invalid@example.com', 'wrongpassword')

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10_000 })
  })
})

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
    test.skip(!E2E_USER_EMAIL, 'E2E_USER_EMAIL が未設定')

    await loginPage.goto()
    await loginPage.login(E2E_USER_EMAIL, E2E_USER_PASSWORD)
    await expect(page).toHaveURL(/\/songs/, { timeout: 10_000 })

    const logoutButton = page.getByRole('button', { name: 'ログアウト' })
    await logoutButton.click()

    // ログアウト後、ログインリンクが表示されること
    await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible({
      timeout: 10_000,
    })
  })
})
