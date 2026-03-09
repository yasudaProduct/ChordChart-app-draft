import type { Locator, Page } from '@playwright/test'

export class RegisterPage {
  readonly page: Page
  readonly heading: Locator
  readonly nameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly loginLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: '新規登録' })
    this.nameInput = page.getByLabel('表示名')
    this.emailInput = page.getByLabel('メールアドレス')
    this.passwordInput = page.getByLabel('パスワード', { exact: true })
    this.confirmInput = page.getByLabel('パスワード確認')
    this.submitButton = page.getByRole('button', { name: 'アカウント作成' })
    this.errorMessage = page.locator('[data-testid="auth-error"]')
    this.loginLink = page.locator('section').getByRole('link', { name: 'ログイン' })
  }

  async goto() {
    await this.page.goto('/register')
  }
}
