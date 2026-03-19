export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    cache: 'no-store'
  });

  const json = (await response.json().catch(() => ({
    success: false,
    message: 'No fue posible leer la respuesta del servidor.'
  }))) as ApiResponse<T>;

  if (!response.ok) {
    return {
      success: false,
      message: json.message || `Error HTTP ${response.status}`,
      data: json.data,
      meta: json.meta
    };
  }

  return json;
}

export type UserSession = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleCode: string;
  roleId?: number;
  technicianId?: number | null;
};

export type LoginResponse = {
  accessToken: string;
  user: UserSession;
};

export type WorkOrderListItem = {
  id: number;
  orderNumber: string;
  receivedAt?: string;
  initialProblemDescription?: string | null;
  isRepairable?: boolean | null;
  readyForClosure: boolean;
  customer: { id: number; fullName: string };
  asset: {
    id: number;
    category: string;
    subcategory?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    brand?: { name?: string | null } | null;
  };
  currentStatus: { id: number; code: string; name: string };
  assignedTechnician?: { id: number; code: string; firstName: string; lastName: string } | null;
};

export type WorkOrderDetail = {
  id: number;
  orderNumber: string;
  receivedAt: string;
  initialProblemDescription?: string | null;
  isRepairable?: boolean | null;
  readyForClosure: boolean;
  closedAt?: string | null;
  customer: { id: number; fullName: string; phone?: string | null; email?: string | null };
  asset: {
    id: number;
    category: string;
    subcategory?: string | null;
    model?: string | null;
    serialNumber?: string | null;
    accessories?: string | null;
    physicalCondition?: string | null;
    notes?: string | null;
    brand?: { id: number; name: string } | null;
  };
  serviceType: { id: number; code: string; name: string };
  priority: { id: number; code: string; name: string };
  currentStatus: { id: number; code: string; name: string };
  assignedTechnician?: { id: number; code: string; firstName: string; lastName: string } | null;
  diagnosis?: Diagnosis | null;
};

export type Diagnosis = {
  id: number;
  workOrderId: number;
  technicianId: number;
  primaryDamageTypeId?: number | null;
  secondaryDamageTypeId?: number | null;
  nonRepairableReasonId?: number | null;
  technicalDescription?: string | null;
  proposedSolution?: string | null;
  estimatedHours?: number | string | null;
  notes?: string | null;
};

export type StageTime = {
  id: number;
  workOrderId: number;
  technicianId: number;
  processStageId: number;
  startedAt: string;
  endedAt?: string | null;
  durationMinutes?: number | null;
  notes?: string | null;
  processStage?: { id: number; code: string; name: string };
  technician?: { id: number; firstName: string; lastName: string; code: string };
};

export type StageSummary = {
  processStageId: number;
  processStageName: string;
  totalMinutes: number;
};

export type WorkOrderStatusHistory = {
  id: number;
  changedAt: string;
  changeReason?: string | null;
  previousStatus?: { code: string; name: string } | null;
  newStatus: { code: string; name: string };
  changedByUser: { firstName: string; lastName: string; email: string };
};

export type ClosureState = {
  id?: number;
  workOrderId?: number;
  diagnosisCompleted: boolean;
  timesCompleted: boolean;
  sparePartsChecked: boolean;
  costsChecked: boolean;
  closureAllowed: boolean;
  closureNotes?: string | null;
  closedAt?: string | null;
};

export type InventoryStatusResponse = {
  summary: {
    totalItems: number;
    belowMinimum: number;
    totalStockValue: number;
  };
  items: Array<{
    id: number;
    code: string;
    name: string;
    currentStock: number | string;
    minimumStock: number | string;
    standardCost?: number | string | null;
  }>;
};

export async function login(email: string, password: string) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function me(token: string) {
  return apiFetch<UserSession>('/auth/me', { method: 'GET' }, token);
}

export async function getWorkOrders(token: string, params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  });
  return apiFetch<WorkOrderListItem[]>(`/work-orders${qs.toString() ? `?${qs.toString()}` : ''}`, { method: 'GET' }, token);
}

export async function getWorkOrder(token: string, id: number) {
  return apiFetch<WorkOrderDetail>(`/work-orders/${id}`, { method: 'GET' }, token);
}

export async function updateRepairability(token: string, id: number, isRepairable: boolean) {
  return apiFetch(`/work-orders/${id}/repairability`, {
    method: 'PATCH',
    body: JSON.stringify({ isRepairable })
  }, token);
}

export async function getDiagnosis(token: string, workOrderId: number) {
  return apiFetch<Diagnosis>(`/work-orders/${workOrderId}/diagnosis`, { method: 'GET' }, token);
}

export async function upsertDiagnosis(token: string, workOrderId: number, payload: Record<string, unknown>) {
  return apiFetch<Diagnosis>(`/work-orders/${workOrderId}/diagnosis`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function getStageTimes(token: string, workOrderId: number) {
  return apiFetch<StageTime[]>(`/work-orders/${workOrderId}/stage-times`, { method: 'GET' }, token);
}

export async function getStageSummary(token: string, workOrderId: number) {
  return apiFetch<StageSummary[]>(`/work-orders/${workOrderId}/stage-times/summary`, { method: 'GET' }, token);
}

export async function startStage(token: string, workOrderId: number, payload: Record<string, unknown>) {
  return apiFetch<StageTime>(`/work-orders/${workOrderId}/stage-times/start`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function finishStage(token: string, workOrderId: number, stageTimeId: number, payload: Record<string, unknown>) {
  return apiFetch<StageTime>(`/work-orders/${workOrderId}/stage-times/${stageTimeId}/finish`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, token);
}

export async function changeWorkOrderStatus(token: string, workOrderId: number, newStatusId: number, reason?: string) {
  return apiFetch(`/work-orders/${workOrderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ newStatusId, reason })
  }, token);
}

export async function getWorkOrderStatusHistory(token: string, workOrderId: number) {
  return apiFetch<WorkOrderStatusHistory[]>(`/work-orders/${workOrderId}/status-history`, { method: 'GET' }, token);
}

export async function markReadyForClosure(token: string, workOrderId: number, readyForClosure: boolean) {
  return apiFetch(`/work-orders/${workOrderId}/ready-for-closure`, {
    method: 'PATCH',
    body: JSON.stringify({ readyForClosure })
  }, token);
}

export async function getClosure(token: string, workOrderId: number) {
  return apiFetch<ClosureState>(`/work-orders/${workOrderId}/closure`, { method: 'GET' }, token);
}

export async function validateClosure(token: string, workOrderId: number, closureNotes?: string) {
  return apiFetch<ClosureState>(`/work-orders/${workOrderId}/closure/validate`, {
    method: 'POST',
    body: JSON.stringify({ closureNotes })
  }, token);
}

export async function executeClosure(token: string, workOrderId: number, closureNotes?: string) {
  return apiFetch(`/work-orders/${workOrderId}/closure/close`, {
    method: 'POST',
    body: JSON.stringify({ closureNotes })
  }, token);
}

export async function getInventoryStatus(token: string) {
  return apiFetch<InventoryStatusResponse>('/inventory/status', { method: 'GET' }, token);
}
