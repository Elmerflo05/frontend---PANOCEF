export const RADIOGRAPHY_REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED_BY_TECHNICIAN: 'rejected_by_technician'
} as const;

export type RadiographyRequestStatus =
  typeof RADIOGRAPHY_REQUEST_STATUS[keyof typeof RADIOGRAPHY_REQUEST_STATUS];

export const RADIOGRAPHY_REQUEST_STATUS_LABELS: Record<RadiographyRequestStatus, string> = {
  [RADIOGRAPHY_REQUEST_STATUS.PENDING]: 'Pendiente',
  [RADIOGRAPHY_REQUEST_STATUS.IN_PROGRESS]: 'En proceso',
  [RADIOGRAPHY_REQUEST_STATUS.COMPLETED]: 'Atendida',
  [RADIOGRAPHY_REQUEST_STATUS.DELIVERED]: 'Entregada',
  [RADIOGRAPHY_REQUEST_STATUS.CANCELLED]: 'Cancelada',
  [RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN]: 'Rechazada por técnico'
};

export const RADIOGRAPHY_REQUEST_STATUS_COLORS: Record<RadiographyRequestStatus, string> = {
  [RADIOGRAPHY_REQUEST_STATUS.PENDING]: '#F59E0B',
  [RADIOGRAPHY_REQUEST_STATUS.IN_PROGRESS]: '#3B82F6',
  [RADIOGRAPHY_REQUEST_STATUS.COMPLETED]: '#10B981',
  [RADIOGRAPHY_REQUEST_STATUS.DELIVERED]: '#059669',
  [RADIOGRAPHY_REQUEST_STATUS.CANCELLED]: '#6B7280',
  [RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN]: '#EF4444'
};

export const isRejectedByTechnician = (status?: string | null): boolean =>
  status === RADIOGRAPHY_REQUEST_STATUS.REJECTED_BY_TECHNICIAN;

export const isPending = (status?: string | null): boolean =>
  status === RADIOGRAPHY_REQUEST_STATUS.PENDING;

export const getStatusLabel = (status?: string | null): string => {
  if (!status) return 'Sin estado';
  return RADIOGRAPHY_REQUEST_STATUS_LABELS[status as RadiographyRequestStatus] || status;
};

export const getStatusColor = (status?: string | null): string => {
  if (!status) return '#6B7280';
  return RADIOGRAPHY_REQUEST_STATUS_COLORS[status as RadiographyRequestStatus] || '#6B7280';
};
