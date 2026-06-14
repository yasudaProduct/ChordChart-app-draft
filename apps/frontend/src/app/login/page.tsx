'use client'

export const runtime = 'edge'

import { useState } from 'react'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { AuthForm } from '@/components/auth/AuthForm'
import type { AuthModalMode } from '@/stores/authModalStore'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthModalMode>('login')

  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16">
        <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
          <AuthForm mode={mode} onModeChange={setMode} redirectComplete="/songs" />
        </div>
      </section>
    </main>
  )
}
