import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import { META_LABELS } from '@/shared/constants/uiLabels'
import './globals.scss'

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
})

export const metadata: Metadata = {
  title: META_LABELS.ROOT_TITLE,
  description: META_LABELS.ROOT_DESCRIPTION,
  icons: {
    icon: '/moments_logo.png',
    apple: '/moments_logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" className={rubik.variable}>
      <body>{children}</body>
    </html>
  )
}
