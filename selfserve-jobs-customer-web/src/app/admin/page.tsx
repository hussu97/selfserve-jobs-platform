'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminRootPage() {
  const router = useRouter();
  const { isHydrated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    router.replace(isAdmin ? '/admin/dashboard' : '/admin/login');
  }, [isHydrated, isAdmin, router]);

  return null;
}
