'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/KpiCard';
import { Protected } from '@/components/Protected';
import { SectionCard } from '@/components/SectionCard';
import { getInventoryStatus, getWorkOrders, InventoryStatusResponse, WorkOrderListItem } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

export default function OperationsDashboardPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<WorkOrderListItem[]>([]);
  const [inventory, setInventory] = useState<InventoryStatusResponse | null>(null);

  useEffect(() => {
    if (!token) return;
    getWorkOrders(token, { take: 100 }).then((response) => setOrders(response.data || []));
    getInventoryStatus(token).then((response) => setInventory(response.data || null));
  }, [token]);

  const summary = useMemo(() => {
    const readyForClosure = orders.filter((o) => o.readyForClosure).length;
    const diagnosed = orders.filter((o) => o.currentStatus.code !== 'INGRESADA').length;
    const repair = orders.filter((o) => o.currentStatus.code === 'EN_REPARACION').length;
    return { readyForClosure, diagnosed, repair };
  }, [orders]);

  return (
    <Protected roles={['ADMIN', 'OPERATIONS_MANAGER']}>
      <AppShell title="Gerencia de operaciones" subtitle="Indicadores ejecutivos conectados al MVP backend.">
        <div className="grid cols-4">
          <KpiCard title="Órdenes activas" value={String(orders.length)} />
          <KpiCard title="Con diagnóstico" value={String(summary.diagnosed)} />
          <KpiCard title="En reparación" value={String(summary.repair)} />
          <KpiCard title="Bajo stock mínimo" value={String(inventory?.summary.belowMinimum || 0)} />
        </div>

        <div className="grid cols-3" style={{ marginTop: 16 }}>
          <SectionCard title="Tiempos y flujo" subtitle="Indicadores iniciales derivados del estado de las órdenes.">
            <div className="grid">
              <div className="row between"><span className="muted">Órdenes listas para cierre</span><strong>{summary.readyForClosure}</strong></div>
              <div className="row between"><span className="muted">Órdenes en diagnóstico</span><strong>{orders.filter((o) => o.currentStatus.code === 'EN_DIAGNOSTICO').length}</strong></div>
              <div className="row between"><span className="muted">Órdenes en prueba</span><strong>{orders.filter((o) => o.currentStatus.code === 'EN_PRUEBA').length}</strong></div>
            </div>
          </SectionCard>
          <SectionCard title="Inventario" subtitle="Lectura desde /inventory/status.">
            <div className="grid">
              <div className="row between"><span className="muted">Items en catálogo</span><strong>{inventory?.summary.totalItems || 0}</strong></div>
              <div className="row between"><span className="muted">Valor total de stock</span><strong>${(inventory?.summary.totalStockValue || 0).toFixed(2)}</strong></div>
              <div className="row between"><span className="muted">Bajo mínimo</span><strong>{inventory?.summary.belowMinimum || 0}</strong></div>
            </div>
          </SectionCard>
          <SectionCard title="Top de repuestos" subtitle="Primeros repuestos del catálogo por stock visible.">
            <table className="table compact">
              <thead><tr><th>Código</th><th>Repuesto</th><th>Stock</th></tr></thead>
              <tbody>
                {(inventory?.items || []).slice(0, 5).map((item) => (
                  <tr key={item.id}><td>{item.code}</td><td>{item.name}</td><td>{String(item.currentStock)}</td></tr>
                ))}
              </tbody>
            </table>
          </SectionCard>
        </div>
      </AppShell>
    </Protected>
  );
}
