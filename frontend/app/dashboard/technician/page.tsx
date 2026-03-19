'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { Protected } from '@/components/Protected';
import { SectionCard } from '@/components/SectionCard';
import { getWorkOrders, WorkOrderListItem } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function TechnicianDashboardPage() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<WorkOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getWorkOrders(token, {
      assignedTechnicianId: user?.technicianId ?? undefined,
      take: 50,
    })
      .then((response) => {
        if (!response.success || !response.data) {
          setError(response.message || 'No fue posible cargar las órdenes.');
          setOrders([]);
          return;
        }
        setOrders(response.data);
      })
      .finally(() => setLoading(false));
  }, [token, user?.technicianId]);

  const kpis = useMemo(() => {
    const active = orders.length;
    const diag = orders.filter((item) => item.currentStatus?.code === 'EN_DIAGNOSTICO').length;
    const repair = orders.filter((item) => item.currentStatus?.code === 'EN_REPARACION').length;
    const closure = orders.filter((item) => item.readyForClosure).length;
    return { active, diag, repair, closure };
  }, [orders]);

  return (
    <Protected roles={['ADMIN', 'TECHNICIAN']}>
      <AppShell title="Panel técnico" subtitle="Flujo real de trabajo para diagnóstico, tiempos y cierre.">
        <div className="grid cols-4">
          <KpiCard title="Órdenes activas" value={String(kpis.active)} hint="Asignadas al técnico" />
          <KpiCard title="En diagnóstico" value={String(kpis.diag)} hint="Requieren análisis" />
          <KpiCard title="En reparación" value={String(kpis.repair)} hint="Etapa operativa" />
          <KpiCard title="Listas para cierre" value={String(kpis.closure)} hint="Pendientes de validar" />
        </div>

        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <SectionCard title="Mis órdenes" subtitle="Selecciona una orden para trabajar el diagnóstico, tiempos y cierre.">
            {loading ? <div className="muted">Cargando órdenes...</div> : null}
            {error ? <div className="badge danger">{error}</div> : null}
            {!loading && !orders.length ? <div className="muted">No hay órdenes asignadas para este técnico.</div> : null}
            {!!orders.length && (
              <table className="table">
                <thead>
                  <tr>
                    <th>OT</th>
                    <th>Activo</th>
                    <th>Marca</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.asset.category}{order.asset.model ? ` · ${order.asset.model}` : ''}</td>
                      <td>{order.asset.brand?.name || '—'}</td>
                      <td>
                        <span className={`badge ${order.readyForClosure ? 'success' : order.currentStatus?.code === 'EN_DIAGNOSTICO' ? 'warning' : ''}`}>
                          {order.currentStatus?.name || 'Sin estado'}
                        </span>
                      </td>
                      <td>
                        <Link className="button" href={`/dashboard/technician/work-orders/${order.id}`}>
                          Abrir orden
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Uso esperado" subtitle="Este panel ya está conectado al backend del MVP.">
            <div className="grid">
              <div className="card muted-block">
                1. Abre una orden y marca si es reparable o no.
              </div>
              <div className="card muted-block">
                2. Registra el diagnóstico técnico y la solución propuesta.
              </div>
              <div className="card muted-block">
                3. Inicia y finaliza etapas para dejar tiempos reales.
              </div>
              <div className="card muted-block">
                4. Cambia el estado, marca lista para cierre y ejecuta el cierre final.
              </div>
            </div>
          </SectionCard>
        </div>
      </AppShell>
    </Protected>
  );
}
