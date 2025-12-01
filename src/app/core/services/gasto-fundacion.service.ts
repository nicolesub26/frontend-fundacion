// src/app/core/services/gasto-fundacion.service.ts
import { Injectable, Optional } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// ⚠️ Ajusta la ruta si tu AuthService está en otro lugar.
// Si no usas AuthService, puedes quitar la inyección y se usará localStorage.
import { AuthService } from '../../layout/service/auth.service';

export interface RefId { id?: number }
export interface RefTipoGasto { idTipoGasto: number }
export interface RefEmpleado { id: number }
export interface RefArticulo { idArticulo: number }

export interface GastoDetalle {
  idDetalle?: number;
  articulo: RefArticulo;
  cantidadComprada: number;
  precioUnitario: number;
  descripcion?: string;
  unidadMedida?: string;
  proveedor?: string;
  subtotal?: number; // opcional si el backend lo retorna
  estado?: 0 | 1;
}

export interface GastoFundacion {
  idGasto?: number;
  fechaGasto?: string;   // ISO
  descripcion?: string;
  comprobante?: string;
  tipoGasto: RefTipoGasto;
  empleado: RefEmpleado;
  estado?: 0 | 1;        // 1=activo, 0=inactivo
  monto?: number;
  detalles?: GastoDetalle[];
}

export interface FiltrosGasto {
  desde?: string;         // 'YYYY-MM-DD'
  hasta?: string;         // 'YYYY-MM-DD'
  idTipoGasto?: number;
  idEmpleado?: number;
  estado?: 0 | 1;
}

@Injectable({ providedIn: 'root' })
export class GastoFundacionService {

  private readonly BASE_URL = 'http://localhost:9090/api/gastos';

  constructor(
    private http: HttpClient,
    @Optional() private authService?: AuthService
  ) {}

  // === Headers con token (AuthService -> localStorage) ===
  private getHeaders(): HttpHeaders {
    const raw =
      (this.authService && typeof this.authService.getToken === 'function'
        ? this.authService.getToken()
        : null) ?? localStorage.getItem('token') ?? '';

    const token = raw?.startsWith('Bearer ') ? raw : (raw ? `Bearer ${raw}` : '');
    let headers = new HttpHeaders();

    if (token) headers = headers.set('Authorization', token);
    // Útil para POST/PUT/PATCH con JSON:
    headers = headers.set('Content-Type', 'application/json');

    return headers;
  }

  private handleError(err: any) {
    console.error('[GastoFundacionService] Error:', err);
    return throwError(() => err);
  }

  // ===================== GASTOS =====================

  /** GET /api/gastos?desde&hasta&idTipoGasto&idEmpleado&estado */
  listar(filtros: FiltrosGasto = {}): Observable<GastoFundacion[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });

    return this.http
      .get<GastoFundacion[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /** GET /api/gastos/{id} */
  obtenerPorId(id: number): Observable<GastoFundacion> {
    return this.http
      .get<GastoFundacion>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** POST /api/gastos */
  crear(payload: GastoFundacion): Observable<GastoFundacion> {
    return this.http
      .post<GastoFundacion>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** PUT /api/gastos/{id} (cabecera; los detalles van en rutas aparte) */
  actualizar(id: number, payload: Partial<GastoFundacion>): Observable<GastoFundacion> {
    return this.http
      .put<GastoFundacion>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/gastos/{id} (baja lógica: estado=0) */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** PATCH /api/gastos/{id}/estado?estado=0|1 */
  cambiarEstado(id: number, estado: 0 | 1): Observable<void> {
    const params = new HttpParams().set('estado', String(estado));
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/estado`, {}, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /** POST /api/gastos/{id}/recalcular -> number (total) */
  recalcularMonto(id: number): Observable<number> {
    return this.http
      .post<number>(`${this.BASE_URL}/${id}/recalcular`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ===================== DETALLES =====================

  /** GET /api/gastos/{id}/detalles */
  listarDetalles(idGasto: number): Observable<GastoDetalle[]> {
    return this.http
      .get<GastoDetalle[]>(`${this.BASE_URL}/${idGasto}/detalles`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** POST /api/gastos/{id}/detalles (recalcula monto) */
  crearDetalle(idGasto: number, detalle: GastoDetalle): Observable<GastoDetalle> {
    return this.http
      .post<GastoDetalle>(`${this.BASE_URL}/${idGasto}/detalles`, detalle, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** PUT /api/gastos/{id}/detalles/{idDetalle} (recalcula monto) */
  actualizarDetalle(idGasto: number, idDetalle: number, detalle: Partial<GastoDetalle>): Observable<GastoDetalle> {
    return this.http
      .put<GastoDetalle>(`${this.BASE_URL}/${idGasto}/detalles/${idDetalle}`, detalle, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** DELETE /api/gastos/{id}/detalles/{idDetalle} (recalcula monto) */
  eliminarDetalle(idGasto: number, idDetalle: number): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE_URL}/${idGasto}/detalles/${idDetalle}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ===================== Helpers UI =====================

  textoEstado(estado?: 0 | 1): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  claseEstado(estado?: 0 | 1): string {
    return estado === 1 ? 'badge-success' : 'badge-danger';
  }
}
