import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// ===== MODELOS =====

/**
 * Request para crear un detalle de compra
 */
export interface DetalleCompraRequest {
  idArticulo: number;
  cantidad: number;
  precioUnitario: number;
}

/**
 * Request para crear una compra de efectivo
 */
export interface CompraEfectivoRequest {
  idDonacionEfectivo: number;
  fechaCompra: string; // ISO date string YYYY-MM-DD
  idEmpleado: number;
  proveedor: string;
  montoTotal: number;
  descripcion?: string;
  comprobante?: string;
  detalles: DetalleCompraRequest[];
}

/**
 * Response de un detalle de compra
 */
export interface DetalleCompraResponse {
  idDetalle: number;
  idArticulo: number;
  nombreArticulo: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

/**
 * Response de una compra de efectivo
 */
export interface CompraEfectivoResponse {
  idCompra: number;
  idDonacionEfectivo: number;
  fechaCompra: string;
  montoTotal: number;
  proveedor: string;
  descripcion?: string;
  comprobante?: string;
  idEmpleado: number;
  nombreEmpleado: string;
  estado: number;
  fechaCreacion: string;
  detalles: DetalleCompraResponse[];
}

/**
 * Response paginada del backend
 */
export interface PageResponse<T> {
  content: T[];
  pageable?: any;
  last?: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  sort?: any;
  first?: boolean;
  numberOfElements?: number;
  empty?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CompraEfectivoService {
  private readonly BASE_URL = 'http://localhost:9090/api/compras-efectivo';

  constructor(private http: HttpClient) {}

  /**
   * Obtener headers con autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejo de errores
   */
  private handleError = (error: any): Observable<never> => {
    const message = error?.error?.message || error?.error?.error || error?.message || 'Error en CompraEfectivoService';
    console.error('Error en CompraEfectivoService:', error);
    return throwError(() => ({ ...error, message }));
  };

  /**
   * POST /api/compras-efectivo
   * Crear una nueva compra
   */
  crear(dto: CompraEfectivoRequest): Observable<CompraEfectivoResponse> {
    return this.http.post<CompraEfectivoResponse>(this.BASE_URL, dto, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  /**
   * GET /api/compras-efectivo/{id}
   * Obtener compra por ID
   */
  obtenerPorId(id: number): Observable<CompraEfectivoResponse> {
    return this.http.get<CompraEfectivoResponse>(`${this.BASE_URL}/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  /**
   * GET /api/compras-efectivo
   * Listar todas las compras con paginación
   */
  listarPage(params: {
    page?: number;
    size?: number;
    sort?: string;
  } = {}): Observable<PageResponse<CompraEfectivoResponse>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<CompraEfectivoResponse>>(this.BASE_URL, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(catchError(this.handleError));
  }

  /**
   * GET /api/compras-efectivo
   * Listar todas las compras (sin paginación)
   */
  listar(params: {
    page?: number;
    size?: number;
  } = {}): Observable<CompraEfectivoResponse[]> {
    return this.listarPage({
      page: params.page ?? 0,
      size: params.size ?? 1000,
      sort: 'fechaCompra,desc'
    }).pipe(
      map(response => response.content)
    );
  }

  /**
   * GET /api/compras-efectivo/estado/{estado}
   * Listar compras por estado con paginación
   */
  listarPorEstadoPage(
    estado: number,
    params: {
      page?: number;
      size?: number;
      sort?: string;
    } = {}
  ): Observable<PageResponse<CompraEfectivoResponse>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<CompraEfectivoResponse>>(
      `${this.BASE_URL}/estado/${estado}`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * GET /api/compras-efectivo/estado/{estado}
   * Listar compras por estado (sin paginación)
   */
  listarPorEstado(estado: number): Observable<CompraEfectivoResponse[]> {
    return this.listarPorEstadoPage(estado, {
      page: 0,
      size: 1000,
      sort: 'fechaCompra,desc'
    }).pipe(
      map(response => response.content)
    );
  }

  /**
   * GET /api/compras-efectivo/fechas
   * Listar compras por rango de fechas
   */
  listarPorFechas(
    fechaInicio: string,
    fechaFin: string,
    params: {
      page?: number;
      size?: number;
      sort?: string;
    } = {}
  ): Observable<PageResponse<CompraEfectivoResponse>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('fechaInicio', fechaInicio);
    httpParams = httpParams.set('fechaFin', fechaFin);
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<CompraEfectivoResponse>>(
      `${this.BASE_URL}/fechas`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * GET /api/compras-efectivo/proveedor
   * Listar compras por proveedor
   */
  listarPorProveedor(
    proveedor: string,
    params: {
      page?: number;
      size?: number;
      sort?: string;
    } = {}
  ): Observable<PageResponse<CompraEfectivoResponse>> {
    let httpParams = new HttpParams();
    httpParams = httpParams.set('proveedor', proveedor);
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 10));
    if (params.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }

    return this.http.get<PageResponse<CompraEfectivoResponse>>(
      `${this.BASE_URL}/proveedor`,
      {
        headers: this.getHeaders(),
        params: httpParams
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * PUT /api/compras-efectivo/{id}
   * Actualizar una compra existente
   */
  actualizar(id: number, dto: CompraEfectivoRequest): Observable<CompraEfectivoResponse> {
    return this.http.put<CompraEfectivoResponse>(`${this.BASE_URL}/${id}`, dto, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * PATCH /api/compras-efectivo/{id}/estado
   * Cambiar el estado de una compra (activar/desactivar)
   */
  cambiarEstado(id: number, estado: number): Observable<CompraEfectivoResponse> {
    return this.http.patch<CompraEfectivoResponse>(
      `${this.BASE_URL}/${id}/estado`,
      null,
      {
        headers: this.getHeaders(),
        params: new HttpParams().set('estado', String(estado))
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * DELETE /api/compras-efectivo/{id}
   * Eliminar (desactivar) una compra (soft delete)
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  /**
   * DELETE /api/compras-efectivo/{id}/fisico
   * Eliminar físicamente una compra de la base de datos
   */
  eliminarFisico(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}/fisico`, {
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  // ===== MÉTODOS DE UTILIDAD =====

  /**
   * Calcular subtotal de un detalle
   */
  calcularSubtotal(cantidad: number, precioUnitario: number): number {
    return Math.round(cantidad * precioUnitario * 100) / 100;
  }

  /**
   * Calcular monto total de todos los detalles
   */
  calcularMontoTotal(detalles: DetalleCompraRequest[]): number {
    return detalles.reduce((sum, det) => 
      sum + this.calcularSubtotal(det.cantidad, det.precioUnitario), 0
    );
  }

  /**
   * Validar que el monto total coincida con la suma de detalles
   */
  validarMontoTotal(montoTotal: number, detalles: DetalleCompraRequest[]): boolean {
    const calculado = this.calcularMontoTotal(detalles);
    return Math.abs(montoTotal - calculado) < 0.01; // Tolerancia de 1 centavo
  }

  /**
   * Formatear fecha para display (DD/MM/YYYY)
   */
  formatearFecha(fecha: string | Date): string {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formatear fecha y hora para display
   */
  formatearFechaHora(fecha: string | Date): string {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formatear fecha para input HTML (YYYY-MM-DD)
   */
  formatearFechaInput(fecha: string | Date): string {
    if (!fecha) return '';
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toISOString().split('T')[0];
  }

  /**
   * Obtener fecha de hoy en formato YYYY-MM-DD
   */
  obtenerFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Formatear moneda BOB
   */
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  /**
   * Obtener texto del estado
   */
  getEstadoTexto(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtener clase CSS del badge de estado
   */
  getEstadoBadgeClass(estado: number): string {
    return estado === 1 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  /**
   * Validar que una compra tenga al menos un detalle
   */
  validarDetalles(detalles: DetalleCompraRequest[]): boolean {
    return detalles && detalles.length > 0;
  }

  /**
   * Validar campos requeridos de una compra
   */
  validarCompra(compra: CompraEfectivoRequest): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!compra.idDonacionEfectivo) {
      errores.push('Debe seleccionar una donación en efectivo');
    }

    if (!compra.fechaCompra) {
      errores.push('La fecha de compra es obligatoria');
    }

    if (!compra.idEmpleado) {
      errores.push('Debe seleccionar un empleado');
    }

    if (!compra.proveedor || compra.proveedor.trim().length < 2) {
      errores.push('El proveedor debe tener al menos 2 caracteres');
    }

    if (!compra.montoTotal || compra.montoTotal <= 0) {
      errores.push('El monto total debe ser mayor a 0');
    }

    if (!this.validarDetalles(compra.detalles)) {
      errores.push('Debe agregar al menos un artículo');
    }

    if (!this.validarMontoTotal(compra.montoTotal, compra.detalles)) {
      errores.push('El monto total no coincide con la suma de los detalles');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Crear objeto de compra vacío
   */
  crearCompraVacia(): CompraEfectivoRequest {
    return {
      idDonacionEfectivo: 0,
      fechaCompra: this.obtenerFechaHoy(),
      idEmpleado: 0,
      proveedor: '',
      montoTotal: 0,
      descripcion: '',
      comprobante: '',
      detalles: []
    };
  }

  /**
   * Crear detalle de compra vacío
   */
  crearDetalleVacio(): DetalleCompraRequest {
    return {
      idArticulo: 0,
      cantidad: 1,
      precioUnitario: 0
    };
  }
}