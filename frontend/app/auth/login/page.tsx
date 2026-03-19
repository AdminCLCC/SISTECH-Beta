'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('admin@ingenik.local');
  const [password, setPassword] = useState('Admin123*');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const response = await login(email, password);
    setLoading(false);

    if (!response.success || !response.data) {
      setError(response.message || 'Credenciales inválidas');
      return;
    }

    signIn(response.data.accessToken, response.data.user);

    switch (response.data.user.roleCode) {
      case 'WORKSHOP_MANAGER':
        router.push('/dashboard/workshop-manager');
        break;
      case 'OPERATIONS_MANAGER':
        router.push('/dashboard/operations');
        break;
      default:
        router.push('/dashboard/technician');
    }
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="hero">
          <div className="brand">INGENIK</div>
          <h1 className="h1">Ingreso al sistema</h1>
          <div className="muted">Conectado al backend NestJS mediante JWT.</div>
        </div>
        <form onSubmit={onSubmit} className="grid">
          <div>
            <label className="label">Correo</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <div className="badge danger">{error}</div> : null}
          <button className="button primary" type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
          <div className="small muted">Usuario inicial sugerido: admin@ingenik.local / Admin123*</div>
        </form>
      </div>
    </div>
  );
}
