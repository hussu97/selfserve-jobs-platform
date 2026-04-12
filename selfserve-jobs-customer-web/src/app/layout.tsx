import type { Metadata } from 'next';
import { Newsreader, Manrope } from 'next/font/google';
import Script from 'next/script';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { AppShell } from '@/components/layout/AppShell';
import { AuthProvider } from '@/context/AuthContext';
import { JsonLd } from '@/components/seo/JsonLd';
import { organizationSchema, websiteSchema } from '@/lib/schema';
import { ToastProvider } from '@/context/ToastContext';

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
    default: 'hirebridge — UAE Jobs & Talent, No Signup Required',
    template: '%s | hirebridge',
  },
  description:
    'hirebridge is a free UAE job board connecting talent with top companies in Dubai, Abu Dhabi, and across the Emirates. Post jobs or profiles without creating an account.',
  keywords: [
    'UAE jobs',
    'Dubai jobs',
    'Abu Dhabi jobs',
    'jobs in UAE',
    'remote jobs UAE',
    'no signup job board',
    'free job posting UAE',
    'Middle East careers',
    'UAE hiring',
    'Dubai careers',
  ],
  openGraph: {
    type: 'website',
    siteName: 'hirebridge',
    title: 'hirebridge — UAE Jobs & Talent, No Signup Required',
    description:
      'Free UAE job board. Post jobs and talent profiles without creating an account. No fees, no middlemen.',
    url: SITE_URL,
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'hirebridge — UAE Jobs & Talent',
    description:
      'Free UAE job board. Post jobs and talent profiles without creating an account. No fees, no middlemen.',
    images: ['/og-image.png'],
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
    <html lang="en" className={`${newsreader.variable} ${manrope.variable}`} data-scroll-behavior="smooth">
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[300] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-white focus:text-sm focus:font-semibold focus:shadow-ambient-hover"
        >
          Skip to main content
        </a>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <AuthProvider>
          <ToastProvider>
            <Header />
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
        <SpeedInsights />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="/lib/app.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            data-host-url={SITE_URL}
            data-do-not-track="false"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
