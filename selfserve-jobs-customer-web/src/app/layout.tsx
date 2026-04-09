import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: {
    default: 'jobs4u — Find Your Next Opportunity',
    template: '%s | jobs4u',
  },
  description:
    'jobs4u is a no-signup jobs platform connecting talent with opportunities. Browse jobs and candidate profiles worldwide.',
  keywords: ['jobs', 'careers', 'hiring', 'remote work', 'freelance', 'talent'],
  openGraph: {
    type: 'website',
    siteName: 'jobs4u',
    title: 'jobs4u — Find Your Next Opportunity',
    description:
      'A no-signup jobs platform connecting talent with opportunities worldwide.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'jobs4u — Find Your Next Opportunity',
    description:
      'A no-signup jobs platform connecting talent with opportunities worldwide.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
