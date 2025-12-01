// src/app/core/services/gasto-fundacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../layout/service/auth.service';

export interface RefId { id?: number }
export interface RefTipoGasto { idTipoGasto: number }
export interface RefEmpleado { id: number }
export interface RefArticulo { idArticulo: number }

export interface GastoDetalle {
  idDetalle?: number;
  idArticulo?: number;
  articulo?: RefArticulo;
  cantidadComprada: number;
  precioUnitario: number;
  descripcion?: string;
  unidadMedida?: string;
  proveedor?: string;
  subtotal?: number;
  estado?: 0 | 1;
  gasto?: any;
}

export interface GastoFundacion {
  idGasto?: number;
  fechaGasto?: string;
  descripcion?: string;
  comprobante?: string;
  tipoGasto: RefTipoGasto;
  empleado: RefEmpleado;
  estado?: 0 | 1;
  monto: number;
  detalles?: GastoDetalle[];
}

export interface FiltrosGasto {
  desde?: string;
  hasta?: string;
  idTipoGasto?: number;
  idEmpleado?: number;
  estado?: 0 | 1;
}

@Injectable({ providedIn: 'root' })
export class GastoFundacionService {
  private readonly BASE_URL = 'http://localhost:9090/api/gastos';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private handleError(err: any) {
    console.error('[GastoFundacionService] Error:', err);
    return throwError(() => err);
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  listar(filtros: FiltrosGasto = {}): Observable<GastoFundacion[]> {
    let params = new HttpParams();
    Object.entries(filtros).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<GastoFundacion[]>(this.BASE_URL, { headers: this.getHeaders(), params }).pipe(catchError(this.handleError.bind(this)));
  }

  obtenerPorId(id: number): Observable<GastoFundacion> {
    return this.http.get<GastoFundacion>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  crear(payload: GastoFundacion): Observable<GastoFundacion> {
    return this.http.post<GastoFundacion>(this.BASE_URL, payload, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  agregarDetalle(idGasto: number, detalle: any): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/${idGasto}/detalles`, detalle, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  actualizar(id: number, payload: Partial<GastoFundacion>): Observable<GastoFundacion> {
    return this.http.put<GastoFundacion>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  cambiarEstado(id: number, estado: 0 | 1): Observable<void> {
    const params = new HttpParams().set('estado', String(estado));
    return this.http.patch<void>(`${this.BASE_URL}/${id}/estado`, {}, { headers: this.getHeaders(), params }).pipe(catchError(this.handleError.bind(this)));
  }

  recalcularMonto(id: number): Observable<number> {
    return this.http.post<number>(`${this.BASE_URL}/${id}/recalcular`, {}, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  listarDetalles(idGasto: number): Observable<GastoDetalle[]> {
    return this.http.get<GastoDetalle[]>(`${this.BASE_URL}/${idGasto}/detalles`, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  crearDetalle(idGasto: number, detalle: GastoDetalle): Observable<GastoDetalle> {
    return this.http.post<GastoDetalle>(`${this.BASE_URL}/${idGasto}/detalles`, detalle, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  actualizarDetalle(idGasto: number, idDetalle: number, detalle: Partial<GastoDetalle>): Observable<GastoDetalle> {
    return this.http.put<GastoDetalle>(`${this.BASE_URL}/${idGasto}/detalles/${idDetalle}`, detalle, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  eliminarDetalle(idGasto: number, idDetalle: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${idGasto}/detalles/${idDetalle}`, { headers: this.getHeaders() }).pipe(catchError(this.handleError.bind(this)));
  }

  textoEstado(estado?: 0 | 1): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  claseEstado(estado?: 0 | 1): string {
    return estado === 1 ? 'badge-success' : 'badge-danger';
  }
}
