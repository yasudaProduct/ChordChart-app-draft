import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// /songs（マイライブラリ）はログイン必須。/songs/[id]（曲詳細）は公開曲の閲覧があるため除外。
const isProtectedRoute = createRouteMatcher([
  '/songs',
  '/songs/new(.*)',
  '/editor(.*)',
  '/profile(.*)',
])
const isDemoRoute = createRouteMatcher(['/demo(.*)'])
const isAuthPage = createRouteMatcher(['/login(.*)', '/register(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  const { userId } = await auth()

  // ログイン済みユーザーは認証ページ・デモページから楽曲一覧へ誘導する。
  if (userId && (isAuthPage(req) || isDemoRoute(req))) {
    return NextResponse.redirect(new URL('/songs', req.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
