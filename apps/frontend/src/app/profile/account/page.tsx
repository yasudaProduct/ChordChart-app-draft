export const runtime = 'edge'

import { redirect } from 'next/navigation'

/**
 * アカウント設定はマイページのモーダルに一本化したため、この画面は廃止。
 * 既存のリンク・ブックマークが 404 にならないようマイページへ送る。
 */
export default function AccountSettingsPage() {
  redirect('/profile')
}
