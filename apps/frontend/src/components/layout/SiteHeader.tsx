'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuthModalStore } from '@/stores/authModalStore'

type HeaderVariant = 'public' | 'app'

type SiteHeaderProps = {
  variant?: HeaderVariant
}

const navItems = [
  { href: '/songs', label: '楽曲一覧' },
  { href: '/search', label: '検索' },
  { href: '/profile', label: 'プロフィール' },
]

export const SiteHeader = ({ variant = 'public' }: SiteHeaderProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuthStore()
  const { signOut } = useClerk()
  const openAuthModal = useAuthModalStore((s) => s.open)

  return (
    <header className="print-hidden sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold font-display tracking-tight">
            ChordBook
          </Link>
          {variant === 'app' && (
            <nav className="hidden items-center gap-3 text-sm text-slate-600 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-full px-3 py-1 transition',
                    pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href))
                      ? 'bg-slate-900 text-white'
                      : 'hover:bg-slate-100'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {variant === 'app' ? (
            <>
              <button
                type="button"
                onClick={() => router.push('/songs/new')}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + 新規作成
              </button>
              {user ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="hidden sm:inline">{user.name ?? user.email}</span>
                  <button
                    type="button"
                    onClick={() => void signOut()}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
                >
                  ログイン
                </button>
              )}
            </>
          ) : (
            <>
              {user ? (
                <Link
                  href="/songs"
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  楽曲一覧へ
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    ログイン
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    新規登録
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
