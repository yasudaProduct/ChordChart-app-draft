import type { Metadata } from 'next'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SongDetailContent } from './SongDetailContent'

export const runtime = 'edge'

export const metadata: Metadata = {
  title: '楽曲詳細 | ChordBook',
  description: 'コード譜の詳細を表示します。',
}

type SongDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function SongDetailPage({ params }: SongDetailPageProps) {
  const { id } = await params

  return (
    <main className="min-h-screen">
      <SiteHeader variant="app" />
      <SongDetailContent id={id} />
    </main>
  )
}
