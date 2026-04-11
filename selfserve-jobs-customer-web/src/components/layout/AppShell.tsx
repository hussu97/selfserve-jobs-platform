'use client';

import { usePathname } from 'next/navigation';
import { Footer } from './Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  return (
    <>
      <main id="main-content" className="flex-1">{children}</main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
