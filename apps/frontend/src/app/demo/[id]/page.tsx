"use client";

import { useParams } from 'next/navigation'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SongDetailContent } from '@/app/songs/[id]/SongDetailContent'
import { useDemoSong } from '@/hooks/useDemoSong'

export default function DemoSongDetailPage() {
  const params = useParams<{ id: string }>()
  const { song, isLoading, error } = useDemoSong(params.id)

  return (
    <main className="min-h-screen">
      <SiteHeader variant="public" />
      <SongDetailContent
        id={params.id}
        mode="demo"
        song={song}
        isLoading={isLoading}
        error={error}
      />
    </main>
  )
}
