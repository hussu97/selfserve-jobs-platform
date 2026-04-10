import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
