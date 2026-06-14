'use client'

import { useMySummary } from '@/hooks/useMe'

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
  <div className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-[0_20px_50px_-40px_rgba(15,23,42,0.6)]">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
  </div>
)

export const StatsGrid = () => {
  const { summary, error, isLoading } = useMySummary()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-white/60 bg-white/60"
          />
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
        利用状況の取得に失敗しました。
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <StatCard label="総楽曲数" value={summary.total} />
      <StatCard label="公開" value={summary.public} />
      <StatCard label="非公開" value={summary.private} />
      <StatCard label="URL限定" value={summary.urlOnly} />
    </div>
  )
}
