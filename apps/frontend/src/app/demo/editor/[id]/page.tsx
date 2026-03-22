"use client";

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { songApi } from '@/lib/songApi'
import { demoSongStorage } from '@/lib/demoSongStorage'
import { EditorContent } from '@/components/editor/EditorContent'
import type { Song } from '@/types/song'

export default function DemoEditorPage() {
  const params = useParams<{ id: string }>();

  const fetchSong = useCallback(async (id: string) => {
    const local = demoSongStorage.get(id)
    if (local) return local
    return songApi.get(id)
  }, [])

  const saveSong = useCallback(async (_id: string, song: Song) => {
    return demoSongStorage.save(song)
  }, [])

  return (
    <EditorContent
      songId={params.id}
      fetchSong={fetchSong}
      saveFn={saveSong}
      backHref="/demo"
    />
  );
}
