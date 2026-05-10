'use client'

import { useParams } from 'next/navigation'
import { songApi } from '@/lib/songApi'
import { EditorContent } from '@/components/editor/EditorContent'

export default function EditorPage() {
  const params = useParams<{ id: string }>()

  return <EditorContent songId={params.id} fetchSong={songApi.get} backHref="/songs" />
}
