import type { Metadata } from 'next'
import { Gowun_Dodum, Inter, Open_Sans, Roboto } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ToastProvider } from '@/components/ui/toast'

const gowunDodum = Gowun_Dodum({
  subsets: ['latin', 'latin-ext', 'korean'],
  weight: '400',
  variable: '--font-gowun-dodum',
  display: 'swap',
})

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: '부산EDU 학원관리 시스템',
  description: '학원 관리 시스템 PWA',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '부산EDU',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${gowunDodum.className} ${inter.variable} ${openSans.variable} ${roboto.variable}`}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
