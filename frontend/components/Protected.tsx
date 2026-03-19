'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function Protected({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!token || !user) {
      router.replace('/auth/login');
      return;
    }
    if (roles && !roles.includes(user.roleCode)) {
      router.replace('/dashboard/technician');
    }
  }, [isLoading, token, user, roles, router]);

  if (isLoading || !token || !user) {
    return <div className="login-wrap"><div className="card">Cargando sesión...</div></div>;
  }

  return <>{children}</>;
}
