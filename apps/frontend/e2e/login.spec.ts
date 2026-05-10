import { test, expect } from './fixtures/test-base'

test.describe('ログインページ', () => {
  test('ログインページにClerk SignInコンポーネントが表示される', async ({ page }) => {
    await page.goto('/login')

    await expect(page.locator('.cl-rootBox')).toBeVisible({ timeout: 15_000 })
  })

  test('新規登録ページにClerk SignUpコンポーネントが表示される', async ({ page }) => {
    await page.goto('/register')

    await expect(page.locator('.cl-rootBox')).toBeVisible({ timeout: 15_000 })
  })
})
