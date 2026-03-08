import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly heading: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorMessage: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'ログイン' })
    this.emailInput = page.getByLabel('メールアドレス')
    this.passwordInput = page.getByLabel('パスワード')
    this.submitButton = page.getByRole('button', { name: 'ログイン' })
    this.errorMessage = page.locator('[data-testid="auth-error"]')
    this.registerLink = page.locator('section').getByRole('link', { name: '新規登録' })
  }

  async goto(params?: Record<string, string>) {
    const query = params
      ? '?' + new URLSearchParams(params).toString()
      : ''
    await this.page.goto(`/login${query}`)
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
