import type { Metadata } from 'next'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Arabic } from 'next/font/google'

import { PERSON, SITE } from '@/data/content'
import './globals.css'

/** Display. Large sizes only, for section claims. Never for UI. */
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
})

/** Body. Quiet, technical heritage, and specifically not Inter. */
const plexSans = IBM_Plex_Sans({
  variable: '--font-plex-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
})

/** Data. Carries confidence, signal labels, axes, code. A first-class role. */
const plexMono = IBM_Plex_Mono({
  variable: '--font-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

/**
 * Arabic is a genuine visual asset here, not an afterthought — mixed RTL/LTR in
 * one customer message is what Mo'een actually deals with, so it needs a face
 * that handles it properly.
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: '--font-plex-arabic',
  subsets: ['arabic'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${PERSON.name} — ${PERSON.role}`,
  description: SITE.description,
  openGraph: {
    type: 'website',
    url: SITE.url,
    siteName: PERSON.name,
    title: `${PERSON.name} — ${PERSON.role}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${PERSON.name} — ${PERSON.role}`,
    description: SITE.description,
  },
  alternates: { canonical: '/' },
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
