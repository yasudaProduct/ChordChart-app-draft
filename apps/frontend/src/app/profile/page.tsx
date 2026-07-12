'use client'

export const runtime = 'edge'

import { SiteHeader } from '@/components/layout/SiteHeader'
import { ProfileHeaderCard } from '@/components/profile/ProfileHeaderCard'
import { StatsGrid } from '@/components/profile/StatsGrid'
import { RecentSongs } from '@/components/profile/RecentSongs'
import { AccountSettingsCard } from '@/components/profile/AccountSettingsCard'

export default function ProfilePage() {
  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <ProfileHeaderCard />
        <StatsGrid />
        <RecentSongs />
        <AccountSettingsCard />
      </section>
    </main>
  )
}
