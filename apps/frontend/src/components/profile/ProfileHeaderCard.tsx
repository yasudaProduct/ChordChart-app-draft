'use client'

import { useUser } from '@clerk/nextjs'

const formatDate = (value: string | null | undefined) => {
  if (!value) return '-'
  const date = new Date(value)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')}`
}

export const ProfileHeaderCard = () => {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="h-28 animate-pulse rounded-3xl border border-white/60 bg-white/60" />
  }

  const displayName = user?.fullName ?? user?.firstName ?? 'ゲスト'
  const email = user?.primaryEmailAddress?.emailAddress ?? '-'
  const avatarUrl = user?.imageUrl
  const createdAt = user?.createdAt ? new Date(user.createdAt).toISOString() : null

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.5)]">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
          {displayName.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold text-slate-900">{displayName}</h1>
        <p className="truncate text-sm text-slate-500">{email}</p>
        <p className="mt-1 text-xs text-slate-400">登録日 {formatDate(createdAt)}</p>
      </div>
    </div>
  )
}
