'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { Protected } from '@/components/Protected';
import { SectionCard } from '@/components/SectionCard';
import { getWorkOrders, WorkOrderListItem } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function WorkshopManagerDashboardPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<WorkOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getWorkOrders(token, { take: 100 }).then((response) => {
      setOrders(response.data || []);
      setLoading(false);
    });
  }, [token]);

  const summary = useMemo(() => {
    const vehicles = orders.filter((o) => /moto|veh/i.test(o.asset.category)).length;
    const appliances = orders.filter((o) => !/moto|veh/i.test(o.asset.category)).length;
    const delayed = orders.filter((o) => ['PENDIENTE_REPUESTO', 'LISTA_CIERRE'].includes(o.currentStatus.code)).length;
    const assigned = new Map<string, number>();
    orders.forEach((o) => {
      const key = o.assignedTechnician ? `${o.assignedTechnician.firstName} ${o.assignedTechnician.lastName}` : 'Sin asignar';
      assigned.set(key, (assigned.get(key) || 0) + 1);
    });
    return { vehicles, appliances, delayed, loadRows: Array.from(assigned.entries()) };
  }, [orders]);

  return (
    <Protected roles={['ADMIN', 'WORKSHOP_MANAGER']}>
      <AppShell title="Jefe de taller" subtitle="Resumen operativo del taller y de la utilización de órdenes.">
        <div className="grid cols-4">
          <KpiCard title="Órdenes abiertas" value={loading ? '...' : String(orders.length)} />
          <KpiCard title="Vehículos / motos" value={loading ? '...' : String(summary.vehicles)} />
          <KpiCard title="Electrodomésticos y otros" value={loading ? '...' : String(summary.appliances)} />
          <KpiCard title="Críticas o pendientes" value={loading ? '...' : String(summary.delayed)} />
        </div>

        <div className="grid cols-2" style={{ marginTop: 16 }}>
          <SectionCard title="Utilización por técnico" subtitle="Conteo simple de órdenes activas por responsable.">
            <table className="table">
              <thead>
                <tr><th>Técnico</th><th>OT activas</th></tr>
              </thead>
              <tbody>
                {summary.loadRows.map(([name, count]) => (
                  <tr key={name}><td>{name}</td><td>{count}</td></tr>
                ))}
              </tbody>
            </table>
          </SectionCard>

          <SectionCard title="Órdenes en taller" subtitle="Vista consolidada por sección y estado.">
            <table className="table">
              <thead>
                <tr><th>OT</th><th>Activo</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {orders.slice(0, 12).map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.asset.category} · {order.asset.brand?.name || '—'}</td>
                    <td>{order.currentStatus.name}</td>
                    <td><Link className="button" href={`/dashboard/technician/work-orders/${order.id}`}>Ver</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </AppShell>
    </Protected>
  );
}
