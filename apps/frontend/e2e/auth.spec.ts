import { test, expect } from './fixtures/test-base'

test.describe('認証保護', () => {
  test('未認証で保護ページにアクセスするとログインにリダイレクトされる', async ({
    page,
  }) => {
    await page.context().clearCookies()
    await page.goto('/songs/new')

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
