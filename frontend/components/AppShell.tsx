'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

const roleNav: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: '/dashboard/technician', label: 'Vista técnica' },
    { href: '/dashboard/workshop-manager', label: 'Jefe de taller' },
    { href: '/dashboard/operations', label: 'Gerencia' }
  ],
  TECHNICIAN: [{ href: '/dashboard/technician', label: 'Mi panel' }],
  WORKSHOP_MANAGER: [{ href: '/dashboard/workshop-manager', label: 'Jefe de taller' }],
  OPERATIONS_MANAGER: [{ href: '/dashboard/operations', label: 'Gerencia' }]
};

export function AppShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const nav = roleNav[user?.roleCode || 'ADMIN'] || roleNav.ADMIN;

  return (
    <div className="page-shell">
      <header className="topbar">
        <div>
          <div className="brand">INGENIK · SISTEMA OPERATIVO</div>
          <div className="small muted">{subtitle || 'Control técnico, taller y operaciones'}</div>
        </div>
        <div className="row wrap">
          <div className="small muted">{user?.firstName} {user?.lastName} · {user?.roleCode}</div>
          <button className="button" onClick={() => { signOut(); router.replace('/auth/login'); }}>Salir</button>
        </div>
      </header>
      <div className="layout">
        <aside className="sidebar">
          <h3>Navegación</h3>
          <nav className="nav">
            {nav.map((item) => (
              <Link key={item.href} className={pathname === item.href ? 'active' : ''} href={item.href}>{item.label}</Link>
            ))}
          </nav>
        </aside>
        <main className="content">
          <div className="hero">
            <h1 className="h1">{title}</h1>
            {subtitle ? <div className="muted">{subtitle}</div> : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
