import type { Metadata } from 'next'
import { Noto_Sans_JP, Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { SWRProvider } from '@/components/providers/SWRProvider'
import '@/styles/globals.css'

const bodyFont = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-body',
})

const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'ChordBook',
  description: 'コード譜を作成・管理・共有できるWebアプリケーション',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body className={`${bodyFont.variable} ${displayFont.variable} font-body`}>
          <SWRProvider>
            <AuthProvider>{children}</AuthProvider>
          </SWRProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
