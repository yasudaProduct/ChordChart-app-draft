import { test, expect } from './fixtures/test-base'

test.describe('ログインページ', () => {
  test('ログインページに独自ログインフォーム（Google）が表示される', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('おかえりなさい')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Google でログイン' })).toBeVisible()
  })

  test('新規登録ページに独自登録フォーム（Google）が表示される', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByText('ChordBook をはじめる')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Google で新規登録' })).toBeVisible()
  })
})
