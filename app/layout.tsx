import type { Metadata } from 'next'
import { Anton, Archivo, Azeret_Mono, IBM_Plex_Sans_Arabic } from 'next/font/google'

import { PERSON, SITE } from '@/data/content'
import './globals.css'

/**
 * Display. One weight, enormous, and the loudest thing on the page. The name
 * and the claim are set in this and nothing else is.
 */
const anton = Anton({
  variable: '--font-anton',
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
})

/** Body. A grotesque with enough width to hold up next to Anton. */
const archivo = Archivo({
  variable: '--font-archivo',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

/** Data. Carries labels, live values, code, and the status line. */
const azeret = Azeret_Mono({
  variable: '--font-azeret',
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

/*
 * Props typed explicitly rather than with Next's generated `LayoutProps<'/'>`.
 * That type lives in .next/types, so `tsc --noEmit` only passes once something
 * has already built — which meant typecheck passed locally off stale artifacts
 * and failed on a clean checkout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${archivo.variable} ${azeret.variable} ${plexArabic.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/*
          THESIS: A portfolio that asks why you came and commits to the answer,
          refusing the scrolling case-study wall and the ambient profiler alike.
          OWN-WORLD: Warm bone ground, near-black ink, one vermilion that only
          marks live or chosen state; Anton at display, Archivo for reading,
          Azeret for every measured value; pill controls, hairline rules, grain.
          STORY: A visitor learns who Waleed is in one line, declares why they
          came, sees that claim's proof first, and emails him.
          FIRST VIEWPORT: Pill nav and status line up top; the claim set as the
          wordmark at ~180px with "decides." in vermilion; lens pills across the
          foot; Get in touch pinned top-right from the first pixel.
          FORM: Studio (candidate E), chosen by the user over the roll's
          assignment; seed key 856e43cc.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md
        */}
        {children}
      </body>
    </html>
  )
}
