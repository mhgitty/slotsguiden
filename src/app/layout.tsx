import type { Metadata } from 'next'
import { Figtree } from 'next/font/google'
import { draftMode } from 'next/headers'
import { AdminBar } from '@/components/AdminBar'
import { PreviewBanner } from '@/components/PreviewBanner'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'
import './globals.css'

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-figtree',
  display: 'swap',
})

const BASE = 'https://slotsguiden.dk'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Slotsguiden — Din danske casinoguide',
    template: '%s',
  },
  description: 'Find de bedste onlinecasinoer og casinobonusser. Vi tester, anmelder og sammenligner alle de bedste casinoer.',
  keywords: ['casinobonus', 'onlinecasino', 'free spins', 'velkomstbonus', 'casinoanmeldelse', 'bedste casino'],
  alternates: { canonical: BASE + '/' },
  openGraph: {
    siteName: 'Slotsguiden.dk',
    locale: 'da_DK',
    type: 'website',
    url: BASE + '/',
    title: 'Slotsguiden — Din danske casinoguide',
    description: 'Find de bedste onlinecasinoer og casinobonusser.',
    images: [{ url: `${BASE}/og.png`, width: 1200, height: 630, alt: 'Slotsguiden.dk' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large', 'max-video-preview': -1 },
  },
  icons: {
    icon: [{ url: '/favicon.webp', type: 'image/webp' }],
    apple: '/favicon.webp',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled: isPreview } = await draftMode()
  return (
    <html lang="da" className={figtree.variable}>
      <body>
        {isPreview && <PreviewBanner />}
        <AdminBar />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  )
}
