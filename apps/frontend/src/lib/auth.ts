export const PROTECTED_PATHS = ['/songs/new', '/editor', '/profile']

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}
