import type { Metadata } from 'next'
import { Inter, Open_Sans, Roboto } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ToastProvider } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const roboto = Roboto({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-roboto' 
})

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Modern admin dashboard built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} ${openSans.variable} ${roboto.variable}`}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
