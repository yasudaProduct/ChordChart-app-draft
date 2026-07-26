'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

type AccountSettingsModalProps = {
  onClose: () => void
}

type Feedback = { type: 'success' | 'error'; text: string }

/** アバター画像の上限（Clerk 側の制限に合わせる） */
const MAX_AVATAR_BYTES = 10 * 1024 * 1024

/** 連携アカウントの表示名。未知のプロバイダはそのままのIDを出す */
const PROVIDER_LABELS: Record<string, string> = {
  google: 'Google',
  github: 'GitHub',
  apple: 'Apple',
}

/** Clerk のエラーは errors[] に詳細が入るため、可能ならそれを表示する */
const toErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const { errors } = error as { errors?: Array<{ longMessage?: string; message?: string }> }
    const first = errors?.[0]
    if (first?.longMessage || first?.message) return first.longMessage ?? first.message!
  }
  return fallback
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{children}</p>
)

export const AccountSettingsModal = ({ onClose }: AccountSettingsModalProps) => {
  const { user, isLoaded } = useUser()

  const [name, setName] = useState(() => user?.fullName ?? user?.firstName ?? '')
  const [isSavingName, setSavingName] = useState(false)
  const [isSavingAvatar, setSavingAvatar] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const displayName = user?.fullName ?? user?.firstName ?? 'ゲスト'
  const avatarUrl = user?.imageUrl
  const email = user?.primaryEmailAddress?.emailAddress ?? '-'
  const externalAccounts = user?.externalAccounts ?? []
  const isBusy = isSavingName || isSavingAvatar

  /**
   * 表示名は Clerk の firstName に 1 本化して保存する。
   * 姓名を分けないため lastName は空にし、fullName が入力値と一致するようにする。
   */
  const handleSaveName = async () => {
    if (!user || isBusy) return
    const trimmed = name.trim()
    if (!trimmed) {
      setFeedback({ type: 'error', text: '表示名を入力してください。' })
      return
    }

    setFeedback(null)
    setSavingName(true)
    try {
      await user.update({ firstName: trimmed, lastName: '' })
      setFeedback({ type: 'success', text: '表示名を更新しました。' })
    } catch (error) {
      setFeedback({ type: 'error', text: toErrorMessage(error, '表示名を更新できませんでした。') })
    } finally {
      setSavingName(false)
    }
  }

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 同じファイルを選び直しても change が発火するようにリセットする
    event.target.value = ''
    if (!user || !file || isBusy) return

    if (!file.type.startsWith('image/')) {
      setFeedback({ type: 'error', text: '画像ファイルを選択してください。' })
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFeedback({ type: 'error', text: '画像サイズは 10MB 以下にしてください。' })
      return
    }

    setFeedback(null)
    setSavingAvatar(true)
    try {
      await user.setProfileImage({ file })
      setFeedback({ type: 'success', text: 'アバターを更新しました。' })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: toErrorMessage(error, 'アバターを更新できませんでした。'),
      })
    } finally {
      setSavingAvatar(false)
    }
  }

  const handleAvatarRemove = async () => {
    if (!user || isBusy) return
    setFeedback(null)
    setSavingAvatar(true)
    try {
      await user.setProfileImage({ file: null })
      setFeedback({ type: 'success', text: 'アバターを削除しました。' })
    } catch (error) {
      setFeedback({
        type: 'error',
        text: toErrorMessage(error, 'アバターを削除できませんでした。'),
      })
    } finally {
      setSavingAvatar(false)
    }
  }

  return (
    <Modal title="アカウント設定" onClose={onClose}>
      {!isLoaded || !user ? (
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <div className="space-y-6">
          <div>
            <SectionTitle>アバター</SectionTitle>
            <div className="mt-3 flex items-center gap-4">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                  {displayName.slice(0, 1)}
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label
                  className={`cursor-pointer rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-700 transition hover:border-slate-400 ${
                    isBusy ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {isSavingAvatar ? '更新中...' : '画像を変更'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isBusy}
                    onChange={handleAvatarSelect}
                  />
                </label>
                {user.hasImage && (
                  <Button variant="danger" onClick={handleAvatarRemove} disabled={isBusy}>
                    削除
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">PNG / JPEG などの画像、10MB まで。</p>
          </div>

          <div>
            <SectionTitle>表示名</SectionTitle>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={50}
                  placeholder="表示名"
                  disabled={isBusy}
                />
              </div>
              <Button onClick={handleSaveName} disabled={isBusy}>
                {isSavingName ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>

          <div>
            <SectionTitle>メールアドレス</SectionTitle>
            <p className="mt-3 truncate text-sm text-slate-700">{email}</p>
            <p className="mt-1 text-xs text-slate-400">
              連携アカウントから取得しているため変更できません。
            </p>
          </div>

          <div>
            <SectionTitle>連携アカウント</SectionTitle>
            {externalAccounts.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">連携中のアカウントはありません。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {externalAccounts.map((account) => (
                  <li
                    key={account.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-2"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {PROVIDER_LABELS[account.provider] ?? account.provider}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {account.emailAddress || '-'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {feedback && (
            <p
              className={
                feedback.type === 'success'
                  ? 'rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs text-emerald-700'
                  : 'rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600'
              }
            >
              {feedback.text}
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
