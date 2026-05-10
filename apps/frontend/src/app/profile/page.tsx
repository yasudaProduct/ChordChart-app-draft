'use client'

import { UserProfile } from '@clerk/nextjs'
import { SiteHeader } from '@/components/layout/SiteHeader'

export default function ProfilePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto w-full max-w-4xl px-6 py-12">
        <UserProfile routing="hash" />
      </section>
    </main>
  )
}
