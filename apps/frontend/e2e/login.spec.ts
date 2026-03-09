import { test, expect } from './fixtures/test-base'

const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL || 'test01@example.com'
const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD || 'password123'

test.describe('ログイン', () => {
  test('ログインフォームが表示される', async ({ loginPage }) => {
    await loginPage.goto()

    await expect(loginPage.heading).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
    await expect(loginPage.submitButton).toHaveText('ログイン')
  })

  test('新規登録ページへのリンクがある', async ({ loginPage }) => {
    await loginPage.goto()

    await expect(loginPage.registerLink).toBeVisible()
    await loginPage.registerLink.click()
    await expect(loginPage.page).toHaveURL(/\/register/)
  })

  test('正しい認証情報でログインすると /songs にリダイレクトされる', async ({
    loginPage,
  }) => {
    await loginPage.goto()
    await loginPage.login(E2E_USER_EMAIL, E2E_USER_PASSWORD)

    await expect(loginPage.page).toHaveURL(/\/songs/, { timeout: 10_000 })
  })

  test('redirect パラメータがある場合、ログイン後にその先へ遷移する', async ({
    loginPage,
  }) => {
    test.skip(!E2E_USER_EMAIL, 'E2E_USER_EMAIL が未設定')

    await loginPage.goto({ redirect: '/profile' })
    await loginPage.login(E2E_USER_EMAIL, E2E_USER_PASSWORD)

    await expect(loginPage.page).toHaveURL(/\/profile/, { timeout: 10_000 })
  })

  test('誤った認証情報でエラーメッセージが表示される', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.login('invalid@example.com', 'wrongpassword')

    await expect(loginPage.errorMessage).toBeVisible({ timeout: 10_000 })
  })

  test('送信中はボタンが無効化され「ログイン中...」と表示される', async ({
    loginPage,
  }) => {
    await loginPage.goto()
    await loginPage.emailInput.fill('test@example.com')
    await loginPage.passwordInput.fill('password')
    await loginPage.submitButton.click()

    await expect(loginPage.submitButton).toBeDisabled()
    await expect(loginPage.submitButton).toHaveText('ログイン中...')
  })

  test('メールアドレスが空の場合は送信されない', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.passwordInput.fill('password')
    await loginPage.submitButton.click()

    // フォームが送信されずログインページのまま
    await expect(loginPage.page).toHaveURL(/\/login/)
    await expect(loginPage.errorMessage).not.toBeVisible()
  })
})
