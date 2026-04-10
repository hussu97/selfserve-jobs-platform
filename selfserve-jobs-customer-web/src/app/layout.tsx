import type { Metadata } from 'next';
import { Newsreader, Manrope } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['300', '400', '500', '600', '700'],
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://hirebridgeuae.com';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'hirebridge — UAE Tech Jobs & Talent, No Signup Required',
    template: '%s | hirebridge',
  },
  description:
    'hirebridge is a free UAE job board connecting tech talent with top companies in Dubai, Abu Dhabi, and across the Emirates. Post jobs or profiles without creating an account.',
  keywords: [
    'UAE jobs',
    'Dubai jobs',
    'Abu Dhabi jobs',
    'tech jobs UAE',
    'remote jobs UAE',
    'software engineer jobs Dubai',
    'no signup job board',
    'free job posting UAE',
    'Middle East tech careers',
    'UAE hiring',
  ],
  openGraph: {
    type: 'website',
    siteName: 'hirebridge',
    title: 'hirebridge — UAE Tech Jobs & Talent, No Signup Required',
    description:
      'Free UAE job board. Post jobs and talent profiles without creating an account. No fees, no middlemen.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'hirebridge — UAE Tech Jobs & Talent',
    description:
      'Free UAE job board. Post jobs and talent profiles without creating an account. No fees, no middlemen.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${newsreader.variable} ${manrope.variable}`}>
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="/stats/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-host-url={
              process.env.NEXT_PUBLIC_SITE_URL
                ? `${process.env.NEXT_PUBLIC_SITE_URL}/stats`
                : undefined
            }
            strategy="afterInteractive"
          />
        )}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
