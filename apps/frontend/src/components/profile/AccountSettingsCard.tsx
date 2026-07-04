'use client'

import Link from 'next/link'

export const AccountSettingsCard = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)]">
      <div>
        <h2 className="font-display text-lg font-semibold text-slate-900">アカウント設定</h2>
        <p className="text-sm text-slate-500">
          プロフィール・メールアドレス・接続済みアカウントなどを管理します。
        </p>
      </div>
      <Link
        href="/profile/account"
        className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        アカウント設定を開く
      </Link>
    </div>
  )
}
