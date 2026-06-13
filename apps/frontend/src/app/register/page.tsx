'use client'

export const runtime = 'edge'

import { SignUp } from '@clerk/nextjs'
import { SiteHeader } from '@/components/layout/SiteHeader'

export default function RegisterPage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16">
        <SignUp routing="hash" fallbackRedirectUrl="/songs" />
      </section>
    </main>
  )
}
