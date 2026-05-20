import type { Metadata } from 'next'
import { Rubik } from 'next/font/google'
import './globals.scss'

const rubik = Rubik({
  subsets: ['latin', 'hebrew'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-rubik',
})

export const metadata: Metadata = {
  title: 'Moments — ניהול עסק',
  description: 'מערכת ניהול הזמנות, לקוחות ופיננסים',
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
