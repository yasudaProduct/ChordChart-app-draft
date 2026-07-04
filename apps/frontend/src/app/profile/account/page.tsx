'use client'

export const runtime = 'edge'

import Link from 'next/link'
import { UserProfile } from '@clerk/nextjs'
import { SiteHeader } from '@/components/layout/SiteHeader'

export default function AccountSettingsPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
        <Link
          href="/profile"
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
        >
          ← マイページへ戻る
        </Link>
        <UserProfile routing="hash" />
      </section>
    </main>
  )
}
