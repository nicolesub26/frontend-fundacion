// src/app/models/entrega.model.ts

/**
 * Modelo de Entrega
 */
export interface Entrega {
  idEntrega?: number;
  fechaEntrega: string; // ISO format: 'YYYY-MM-DD'
  beneficiario: BeneficiarioRef;
  voluntario?: VoluntarioRef;
  empleado: EmpleadoRef;
  observaciones?: string;
  fotoEntrega?: string;
  estado: number; // 1 = activo, 0 = inactivo
  fechaCreacion?: string;
  fechaActualizacion?: string;
  detalles?: DetalleEntrega[];
  // Campos calculados para vista
  totalArticulos?: number;
  nombreBeneficiario?: string;
  nombreEmpleado?: string;
  nombreVoluntario?: string;
}

/**
 * Detalle de una entrega
 */
export interface DetalleEntrega {
  idDetalleEntrega?: number;
  articulo: ArticuloRef;
  cantidad: number;
  origen: 'DONACION_DIRECTA' | 'COMPRA_EFECTIVO' | 'MIXTO';
  observaciones?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  // Campos para vista
  nombreArticulo?: string;
}

/**
 * DTO para crear/actualizar entrega
 */
export interface EntregaCreateDTO {
  fechaEntrega: string; // 'YYYY-MM-DD'
  idBeneficiario: number;
  idVoluntario?: number;
  idEmpleado: number;
  observaciones?: string;
  detalles: DetalleEntregaDTO[];
}

/**
 * DTO para detalle de entrega
 */
export interface DetalleEntregaDTO {
  idArticulo: number;
  cantidad: number;
  origen: 'DONACION_DIRECTA' | 'COMPRA_EFECTIVO' | 'MIXTO';
  observaciones?: string;
}

/**
 * Referencias a otras entidades
 */
export interface BeneficiarioRef {
  idBeneficiario: number;
  nombre?: string;
  apellido?: string;
}

export interface EmpleadoRef {
  id: number;
  nombre?: string;
  apellido?: string;
}

export interface VoluntarioRef {
  idVoluntario: number;
  nombre?: string;
  apellido?: string;
}

export interface ArticuloRef {
  idArticulo: number;
  nombreArticulo?: string;
}

/**
 * Filtros para búsqueda de entregas
 */
export interface FiltrosEntrega {
  idBeneficiario?: number;
  idEmpleado?: number;
  fechaInicio?: string; // 'YYYY-MM-DD'
  fechaFin?: string; // 'YYYY-MM-DD'
  estado?: number; // 0 o 1
}

/**
 * Estadísticas de entregas
 */
export interface EstadisticasEntrega {
  totalEntregas: number;
  entregasActivas: number;
  entregasInactivas: number;
  entregasDelDia: number;
  entregasDelMes: number;
}

/**
 * Respuesta de la API
 */
export interface ApiResponse<T> {
  mensaje?: string;
  data?: T;
  error?: string;
  entrega?: T;
  articulo?: T;
}

/**
 * Opciones para origen de artículos
 */
export const ORIGENES_ARTICULO = [
  { value: 'DONACION_DIRECTA', label: 'Donación Directa' },
  { value: 'COMPRA_EFECTIVO', label: 'Compra en Efectivo' },
  { value: 'MIXTO', label: 'Mixto' }
] as const;

/**
 * Helper para obtener el label de un origen
 */
export function getOrigenLabel(origen: string): string {
  const item = ORIGENES_ARTICULO.find(o => o.value === origen);
  return item?.label || origen;
}

/**
 * Helper para formatear nombre completo
 */
export function getNombreCompleto(persona: { nombre?: string; apellido?: string }): string {
  if (!persona) return '';
  return `${persona.nombre || ''} ${persona.apellido || ''}`.trim();
}