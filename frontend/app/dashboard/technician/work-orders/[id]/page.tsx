'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Protected } from '@/components/Protected';
import { SectionCard } from '@/components/SectionCard';
import {
  changeWorkOrderStatus,
  executeClosure,
  finishStage,
  getClosure,
  getDiagnosis,
  getStageSummary,
  getStageTimes,
  getWorkOrder,
  getWorkOrderStatusHistory,
  markReadyForClosure,
  startStage,
  updateRepairability,
  upsertDiagnosis,
  validateClosure,
  type ClosureState,
  type Diagnosis,
  type StageSummary,
  type StageTime,
  type WorkOrderDetail,
  type WorkOrderStatusHistory,
} from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

const STATUS_OPTIONS = [
  { id: 1, label: 'Ingresada' },
  { id: 2, label: 'En diagnóstico' },
  { id: 3, label: 'Pendiente de repuesto' },
  { id: 4, label: 'En reparación' },
  { id: 5, label: 'En prueba' },
  { id: 6, label: 'Lista para cierre' },
  { id: 7, label: 'Cerrada' },
];

const STAGE_OPTIONS = [
  { id: 1, label: 'Diagnóstico' },
  { id: 2, label: 'Reparación' },
  { id: 3, label: 'Prueba' },
  { id: 4, label: 'Entrega' },
];

const DAMAGE_OPTIONS = [
  { id: 1, label: 'Falla de encendido' },
];

const NON_REPAIRABLE_REASON_OPTIONS = [
  { id: 1, label: 'No tiene reparación económica' },
];

export default function TechnicianWorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const workOrderId = Number(params.id);
  const { token, user } = useAuth();

  const [order, setOrder] = useState<WorkOrderDetail | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [stageTimes, setStageTimes] = useState<StageTime[]>([]);
  const [stageSummary, setStageSummary] = useState<StageSummary[]>([]);
  const [statusHistory, setStatusHistory] = useState<WorkOrderStatusHistory[]>([]);
  const [closure, setClosure] = useState<ClosureState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [savingStage, setSavingStage] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingClosure, setSavingClosure] = useState(false);

  const [diagForm, setDiagForm] = useState({
    primaryDamageTypeId: '',
    secondaryDamageTypeId: '',
    nonRepairableReasonId: '',
    technicalDescription: '',
    proposedSolution: '',
    estimatedHours: '',
    notes: '',
  });
  const [statusForm, setStatusForm] = useState({ newStatusId: '2', reason: '' });
  const [stageForm, setStageForm] = useState({ processStageId: '1', notes: '' });
  const [closureNotes, setClosureNotes] = useState('');

  const activeStage = useMemo(() => stageTimes.find((item) => !item.endedAt), [stageTimes]);
  const technicianId = user?.technicianId ?? order?.assignedTechnician?.id ?? null;
  const diagnosisReady = order?.isRepairable === false
    ? !!diagForm.nonRepairableReasonId
    : !!diagForm.primaryDamageTypeId && !!diagForm.technicalDescription.trim() && !!diagForm.estimatedHours;

  async function loadAll() {
    if (!token || !workOrderId) return;
    setLoading(true);
    setError(null);

    const [orderRes, diagRes, timesRes, summaryRes, historyRes, closureRes] = await Promise.all([
      getWorkOrder(token, workOrderId),
      getDiagnosis(token, workOrderId),
      getStageTimes(token, workOrderId),
      getStageSummary(token, workOrderId),
      getWorkOrderStatusHistory(token, workOrderId),
      getClosure(token, workOrderId),
    ]);

    if (!orderRes.success || !orderRes.data) {
      setError(orderRes.message || 'No fue posible cargar la orden.');
      setLoading(false);
      return;
    }

    setOrder(orderRes.data);
    setDiagnosis(diagRes.data || null);
    setStageTimes(timesRes.data || []);
    setStageSummary(summaryRes.data || []);
    setStatusHistory(historyRes.data || []);
    setClosure(closureRes.data || null);

    const diagnosisData = diagRes.data;
    if (diagnosisData) {
      setDiagForm({
        primaryDamageTypeId: diagnosisData.primaryDamageTypeId ? String(diagnosisData.primaryDamageTypeId) : '',
        secondaryDamageTypeId: diagnosisData.secondaryDamageTypeId ? String(diagnosisData.secondaryDamageTypeId) : '',
        nonRepairableReasonId: diagnosisData.nonRepairableReasonId ? String(diagnosisData.nonRepairableReasonId) : '',
        technicalDescription: diagnosisData.technicalDescription || '',
        proposedSolution: diagnosisData.proposedSolution || '',
        estimatedHours: diagnosisData.estimatedHours ? String(diagnosisData.estimatedHours) : '',
        notes: diagnosisData.notes || '',
      });
    }

    setLoading(false);
  }

  useEffect(() => {
    void loadAll();
  }, [token, workOrderId]);

  async function handleRepairability(isRepairable: boolean) {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    const response = await updateRepairability(token, order.id, isRepairable);
    if (!response.success) {
      setError(response.message || 'No fue posible actualizar la reparabilidad.');
      return;
    }
    if (!isRepairable) {
      setDiagForm((s) => ({ ...s, primaryDamageTypeId: '', secondaryDamageTypeId: '', proposedSolution: '' }));
    } else {
      setDiagForm((s) => ({ ...s, nonRepairableReasonId: '' }));
    }
    setMessage('Reparabilidad actualizada.');
    await loadAll();
  }

  async function handleSaveDiagnosis() {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    if (!technicianId) {
      setError('No hay técnico vinculado al usuario ni técnico asignado a la orden.');
      return;
    }
    if (!diagnosisReady) {
      setError(order?.isRepairable === false ? 'Debes indicar la causa de no reparabilidad.' : 'Completa daño principal, descripción técnica y horas estimadas.');
      return;
    }
    setSavingDiagnosis(true);
    const payload = {
      technicianId,
      primaryDamageTypeId: diagForm.primaryDamageTypeId ? Number(diagForm.primaryDamageTypeId) : undefined,
      secondaryDamageTypeId: diagForm.secondaryDamageTypeId ? Number(diagForm.secondaryDamageTypeId) : undefined,
      nonRepairableReasonId: diagForm.nonRepairableReasonId ? Number(diagForm.nonRepairableReasonId) : undefined,
      technicalDescription: diagForm.technicalDescription,
      proposedSolution: diagForm.proposedSolution,
      estimatedHours: diagForm.estimatedHours ? Number(diagForm.estimatedHours) : undefined,
      notes: diagForm.notes,
    };
    const response = await upsertDiagnosis(token, order.id, payload);
    setSavingDiagnosis(false);
    if (!response.success) {
      setError(response.message || 'No fue posible guardar el diagnóstico.');
      return;
    }
    setMessage('Diagnóstico guardado correctamente.');
    await loadAll();
  }

  async function handleStartStage() {
    if (!token || !order || !technicianId) return;
    setError(null);
    setMessage(null);
    if (activeStage) {
      setError('Ya existe una etapa activa. Finalízala antes de iniciar otra.');
      return;
    }
    setSavingStage(true);
    const response = await startStage(token, order.id, {
      technicianId,
      processStageId: Number(stageForm.processStageId),
      startedAt: new Date().toISOString(),
      notes: stageForm.notes,
    });
    setSavingStage(false);
    if (!response.success) {
      setError(response.message || 'No fue posible iniciar la etapa.');
      return;
    }
    setMessage('Etapa iniciada correctamente.');
    await loadAll();
  }

  async function handleFinishStage() {
    if (!token || !order || !activeStage) return;
    setError(null);
    setMessage(null);
    setSavingStage(true);
    const response = await finishStage(token, order.id, activeStage.id, {
      endedAt: new Date().toISOString(),
      notes: stageForm.notes,
    });
    setSavingStage(false);
    if (!response.success) {
      setError(response.message || 'No fue posible finalizar la etapa.');
      return;
    }
    setMessage('Etapa finalizada correctamente.');
    await loadAll();
  }

  async function handleStatusChange() {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    setSavingStatus(true);
    const response = await changeWorkOrderStatus(token, order.id, Number(statusForm.newStatusId), statusForm.reason || undefined);
    setSavingStatus(false);
    if (!response.success) {
      setError(response.message || 'No fue posible cambiar el estado.');
      return;
    }
    setMessage('Estado actualizado correctamente.');
    await loadAll();
  }

  async function handleReadyForClosure() {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    setSavingClosure(true);
    const response = await markReadyForClosure(token, order.id, true);
    setSavingClosure(false);
    if (!response.success) {
      setError(response.message || 'No fue posible marcar la orden para cierre.');
      return;
    }
    setMessage('Orden marcada como lista para cierre.');
    await loadAll();
  }

  async function handleValidateClosure() {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    setSavingClosure(true);
    const response = await validateClosure(token, order.id, closureNotes || undefined);
    setSavingClosure(false);
    if (!response.success) {
      setError(response.message || 'No fue posible validar el cierre.');
      return;
    }
    setMessage('Validación de cierre ejecutada.');
    await loadAll();
  }

  async function handleCloseOrder() {
    if (!token || !order) return;
    setError(null);
    setMessage(null);
    setSavingClosure(true);
    const response = await executeClosure(token, order.id, closureNotes || undefined);
    setSavingClosure(false);
    if (!response.success) {
      setError(response.message || 'No fue posible cerrar la orden.');
      return;
    }
    setMessage('Orden cerrada correctamente.');
    await loadAll();
  }

  return (
    <Protected roles={['ADMIN', 'TECHNICIAN']}>
      <AppShell title={order ? `Orden ${order.orderNumber}` : 'Orden de trabajo'} subtitle="Diagnóstico, tiempos, cambios de estado y cierre.">
        <div className="row wrap" style={{ marginBottom: 16 }}>
          <Link className="button" href="/dashboard/technician">← Volver al panel</Link>
          {message ? <span className="badge success">{message}</span> : null}
          {error ? <span className="badge danger">{error}</span> : null}
        </div>

        {loading || !order ? (
          <div className="card">Cargando orden...</div>
        ) : (
          <div className="grid cols-2">
            <SectionCard title="Información general" subtitle="Datos principales del activo y su recepción.">
              <div className="detail-grid">
                <div><span className="muted small">Cliente</span><div>{order.customer.fullName}</div></div>
                <div><span className="muted small">Activo</span><div>{order.asset.category}</div></div>
                <div><span className="muted small">Marca</span><div>{order.asset.brand?.name || '—'}</div></div>
                <div><span className="muted small">Modelo</span><div>{order.asset.model || '—'}</div></div>
                <div><span className="muted small">Serie / chasis</span><div>{order.asset.serialNumber || '—'}</div></div>
                <div><span className="muted small">Estado actual</span><div><span className="badge">{order.currentStatus.name}</span></div></div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="muted small">Problema reportado</div>
                <div>{order.initialProblemDescription || 'Sin descripción inicial.'}</div>
              </div>
              <div className="row wrap" style={{ marginTop: 16 }}>
                <button className={`button ${order.isRepairable === true ? 'primary' : ''}`} onClick={() => void handleRepairability(true)}>Marcar reparable</button>
                <button className={`button ${order.isRepairable === false ? 'danger' : ''}`} onClick={() => void handleRepairability(false)}>Marcar no reparable</button>
              </div>
            </SectionCard>

            <SectionCard title="Diagnóstico técnico" subtitle="Ahora guarda con validaciones claras y usando el técnico vinculado o el técnico asignado a la orden.">
              <div className="form-grid">
                <div>
                  <label className="label">Daño principal</label>
                  <select className="select" value={diagForm.primaryDamageTypeId} onChange={(e) => setDiagForm((s) => ({ ...s, primaryDamageTypeId: e.target.value }))}>
                    <option value="">Selecciona un daño</option>
                    {DAMAGE_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Daño secundario</label>
                  <input className="input" value={diagForm.secondaryDamageTypeId} onChange={(e) => setDiagForm((s) => ({ ...s, secondaryDamageTypeId: e.target.value }))} placeholder="Opcional" />
                </div>
                <div>
                  <label className="label">Causa no reparable</label>
                  <select className="select" value={diagForm.nonRepairableReasonId} onChange={(e) => setDiagForm((s) => ({ ...s, nonRepairableReasonId: e.target.value }))}>
                    <option value="">Selecciona una causa</option>
                    {NON_REPAIRABLE_REASON_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Horas estimadas</label>
                  <input className="input" value={diagForm.estimatedHours} onChange={(e) => setDiagForm((s) => ({ ...s, estimatedHours: e.target.value }))} placeholder="Ej. 2.5" />
                </div>
              </div>
              <div style={{ marginTop: 8 }} className="muted small">Técnico usado para guardar: {technicianId ?? 'No disponible'}</div>
              <div style={{ marginTop: 14 }}>
                <label className="label">Descripción técnica</label>
                <textarea className="textarea" value={diagForm.technicalDescription} onChange={(e) => setDiagForm((s) => ({ ...s, technicalDescription: e.target.value }))} />
              </div>
              <div style={{ marginTop: 14 }}>
                <label className="label">Solución propuesta</label>
                <textarea className="textarea" value={diagForm.proposedSolution} onChange={(e) => setDiagForm((s) => ({ ...s, proposedSolution: e.target.value }))} />
              </div>
              <div style={{ marginTop: 14 }}>
                <label className="label">Observaciones</label>
                <textarea className="textarea" value={diagForm.notes} onChange={(e) => setDiagForm((s) => ({ ...s, notes: e.target.value }))} />
              </div>
              <div className="row wrap" style={{ marginTop: 16 }}>
                <button className="button primary" onClick={() => void handleSaveDiagnosis()} disabled={savingDiagnosis || !diagnosisReady || !technicianId}>
                  {savingDiagnosis ? 'Guardando...' : 'Guardar diagnóstico'}
                </button>
                {diagnosis ? <span className="badge success">Diagnóstico registrado</span> : <span className="badge warning">Sin diagnóstico guardado</span>}
              </div>
            </SectionCard>

            <SectionCard title="Etapas y tiempos" subtitle="Inicia y finaliza etapas para dejar trazabilidad operativa.">
              <div className="form-grid">
                <div>
                  <label className="label">Etapa</label>
                  <select className="select" value={stageForm.processStageId} onChange={(e) => setStageForm((s) => ({ ...s, processStageId: e.target.value }))}>
                    {STAGE_OPTIONS.map((stage) => (
                      <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Observación</label>
                  <input className="input" value={stageForm.notes} onChange={(e) => setStageForm((s) => ({ ...s, notes: e.target.value }))} placeholder="Detalle corto de la etapa" />
                </div>
              </div>
              <div className="row wrap" style={{ marginTop: 16 }}>
                <button className="button primary" onClick={() => void handleStartStage()} disabled={!!activeStage || savingStage || !technicianId}>Iniciar etapa</button>
                <button className="button" onClick={() => void handleFinishStage()} disabled={!activeStage || savingStage}>Finalizar etapa activa</button>
                {activeStage ? <span className="badge warning">Etapa activa en curso</span> : <span className="badge success">Sin etapa activa</span>}
              </div>
              <table className="table" style={{ marginTop: 16 }}>
                <thead>
                  <tr>
                    <th>Etapa</th>
                    <th>Inicio</th>
                    <th>Fin</th>
                    <th>Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {stageTimes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.processStage?.name || item.processStageId}</td>
                      <td>{new Date(item.startedAt).toLocaleString()}</td>
                      <td>{item.endedAt ? new Date(item.endedAt).toLocaleString() : 'En curso'}</td>
                      <td>{item.durationMinutes ? `${item.durationMinutes} min` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row wrap" style={{ marginTop: 12 }}>
                {stageSummary.map((item) => (
                  <span key={item.processStageId} className="badge">{item.processStageName}: {item.totalMinutes} min</span>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Estados y cierre" subtitle="Actualiza el estado y ejecuta el cierre formal cuando corresponda.">
              <div className="form-grid">
                <div>
                  <label className="label">Nuevo estado</label>
                  <select className="select" value={statusForm.newStatusId} onChange={(e) => setStatusForm((s) => ({ ...s, newStatusId: e.target.value }))}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status.id} value={status.id}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Motivo del cambio</label>
                  <input className="input" value={statusForm.reason} onChange={(e) => setStatusForm((s) => ({ ...s, reason: e.target.value }))} />
                </div>
              </div>
              <div className="row wrap" style={{ marginTop: 16 }}>
                <button className="button primary" onClick={() => void handleStatusChange()} disabled={savingStatus}>Actualizar estado</button>
                <button className="button" onClick={() => void handleReadyForClosure()} disabled={savingClosure}>Marcar lista para cierre</button>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="label">Notas de cierre</label>
                <textarea className="textarea" value={closureNotes} onChange={(e) => setClosureNotes(e.target.value)} />
              </div>
              <div className="row wrap" style={{ marginTop: 16 }}>
                <button className="button" onClick={() => void handleValidateClosure()} disabled={savingClosure}>Validar cierre</button>
                <button className="button danger" onClick={() => void handleCloseOrder()} disabled={!closure?.closureAllowed || savingClosure}>Cerrar orden</button>
              </div>
              {closure ? (
                <div className="grid" style={{ marginTop: 16 }}>
                  <span className={`badge ${closure.diagnosisCompleted ? 'success' : 'danger'}`}>Diagnóstico {closure.diagnosisCompleted ? 'OK' : 'pendiente'}</span>
                  <span className={`badge ${closure.timesCompleted ? 'success' : 'danger'}`}>Tiempos {closure.timesCompleted ? 'OK' : 'pendiente'}</span>
                  <span className={`badge ${closure.closureAllowed ? 'success' : 'warning'}`}>Cierre {closure.closureAllowed ? 'permitido' : 'bloqueado'}</span>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Historial de estados" subtitle="Trazabilidad de cambios realizados en la orden.">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Transición</th>
                    <th>Usuario</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {statusHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{new Date(item.changedAt).toLocaleString()}</td>
                      <td>{item.previousStatus?.name || 'Inicial'} → {item.newStatus.name}</td>
                      <td>{item.changedByUser.firstName} {item.changedByUser.lastName}</td>
                      <td>{item.changeReason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SectionCard>
          </div>
        )}
      </AppShell>
    </Protected>
  );
}
