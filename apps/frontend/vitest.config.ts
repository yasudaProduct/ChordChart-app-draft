import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

// lib/ の純粋関数（音楽理論ロジック等）の単体テスト用の最小構成。
// コンポーネントテスト基盤（jsdom + Testing Library）は
// docs/plans/frontend-component-guidelines-and-refactoring.md の Phase 2 で導入する。
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
