'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { buildShareUrl, shareApi, type ShareInfo } from '@/lib/shareApi'
import { songApi } from '@/lib/songApi'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores/editorStore'
import type { Song, SongVisibility } from '@/types/song'

type SharePanelProps = {
  song: Song
  onClose: () => void
}

type VisibilityOption = {
  value: SongVisibility
  label: string
  description: string
}

// specific-users は共有先管理（ロードマップ G4）実装後に追加する
const VISIBILITY_OPTIONS: VisibilityOption[] = [
  { value: 'private', label: '非公開', description: '自分だけが閲覧できます' },
  {
    value: 'url-only',
    label: 'URL共有',
    description: '共有リンクを知っている人だけが閲覧できます',
  },
  { value: 'public', label: '公開', description: '公開ライブラリ・検索結果に表示されます' },
]

const EXPIRES_OPTIONS = [
  { value: '', label: '無期限' },
  { value: '7', label: '7日間' },
  { value: '30', label: '30日間' },
] as const

const formatExpiry = (expiresAt: string | null): string => {
  if (!expiresAt) return '無期限'
  const date = new Date(expiresAt)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')} まで`
}

export const SharePanel = ({ song, onClose }: SharePanelProps) => {
  const setSongVisibility = useEditorStore((s) => s.setSongVisibility)
  const setShareMessage = useEditorStore((s) => s.setShareMessage)

  const [share, setShare] = useState<ShareInfo | null>(null)
  const [isLoadingShare, setLoadingShare] = useState(true)
  const [isBusy, setBusy] = useState(false)
  const [expiresValue, setExpiresValue] = useState<string>('')

  const notify = useCallback(
    (message: string) => {
      setShareMessage(message)
      setTimeout(() => setShareMessage(''), 2500)
    },
    [setShareMessage]
  )

  // 現在の共有リンクを取得
  useEffect(() => {
    let cancelled = false
    shareApi
      .get(song.id)
      .then((result) => {
        if (!cancelled) setShare(result)
      })
      .catch(() => {
        if (!cancelled) setShare(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingShare(false)
      })
    return () => {
      cancelled = true
    }
  }, [song.id])

  // ESC で閉じる
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleVisibilityChange = async (visibility: SongVisibility) => {
    if (visibility === song.visibility || isBusy) return
    setBusy(true)
    try {
      await songApi.updateVisibility(song.id, visibility)
      setSongVisibility(visibility)
      notify('公開範囲を変更しました')
    } catch {
      notify('公開範囲の変更に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const handleCreateShare = async () => {
    if (isBusy) return
    setBusy(true)
    try {
      const created = await shareApi.create(
        song.id,
        expiresValue === '' ? null : Number(expiresValue)
      )
      setShare(created)
      notify('共有リンクを発行しました')
    } catch {
      notify('共有リンクの発行に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const handleRevokeShare = async () => {
    if (isBusy) return
    setBusy(true)
    try {
      await shareApi.remove(song.id)
      setShare(null)
      notify('共有リンクを失効させました')
    } catch {
      notify('共有リンクの失効に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      notify('URLをコピーしました')
    } catch {
      notify('URLのコピーに失敗しました')
    }
  }

  const shareUrl = share ? buildShareUrl(share.token) : null
  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/songs/${song.id}` : ''

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="共有設定"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">共有設定</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* 公開範囲 */}
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="公開範囲">
          {VISIBILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition',
                song.visibility === option.value
                  ? 'border-primary bg-indigo-50/60'
                  : 'border-slate-200 hover:border-slate-300',
                isBusy && 'opacity-60'
              )}
            >
              <input
                type="radio"
                name="visibility"
                value={option.value}
                checked={song.visibility === option.value}
                onChange={() => handleVisibilityChange(option.value)}
                disabled={isBusy}
                className="mt-1 accent-[#5c6bc0]"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                <span className="block text-xs text-slate-500">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        {/* 共有リンク管理（URL共有時） */}
        {song.visibility === 'url-only' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              共有リンク
            </p>
            {isLoadingShare ? (
              <p className="mt-2 text-sm text-slate-500">読み込み中...</p>
            ) : share && shareUrl ? (
              <div className="mt-2 space-y-2">
                <div className="break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                  {shareUrl}
                </div>
                <p className="text-xs text-slate-500">{formatExpiry(share.expiresAt)}</p>
                <div className="flex items-center gap-2">
                  <Button variant="primary" onClick={() => handleCopy(shareUrl)}>
                    URLをコピー
                  </Button>
                  <Button variant="danger" onClick={handleRevokeShare} disabled={isBusy}>
                    リンクを失効
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-slate-600">
                  共有リンクを発行すると、URLを知っている人が閲覧できます。
                </p>
                <div className="flex items-center gap-2">
                  <select
                    value={expiresValue}
                    onChange={(event) => setExpiresValue(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-primary"
                    aria-label="有効期限"
                  >
                    {EXPIRES_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button variant="primary" onClick={handleCreateShare} disabled={isBusy}>
                    共有リンクを発行
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 公開URL（公開時） */}
        {song.visibility === 'public' && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              公開URL
            </p>
            <div className="mt-2 space-y-2">
              <div className="break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                {publicUrl}
              </div>
              <Button variant="primary" onClick={() => handleCopy(publicUrl)}>
                URLをコピー
              </Button>
            </div>
          </div>
        )}

        {song.visibility === 'private' && (
          <p className="mt-4 text-xs text-slate-500">
            URL共有にすると共有リンクを発行できます。公開にすると誰でも検索・閲覧できます。
          </p>
        )}
      </div>
    </div>
  )
}
