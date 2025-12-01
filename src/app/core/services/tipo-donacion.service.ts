// src/app/core/services/tipo-donacion.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// src/app/core/models/tipo-donacion.model.ts
export interface TipoDonacion {
  idTipoDonacion: number;
  descripcion: string;
  estado: number;              // 1 = activo, 0 = inactivo
  fechaCreacion?: string;      // ISO string
  fechaActualizacion?: string; // ISO string
}

export type CrearTipoDonacionDto = Omit<TipoDonacion, 'idTipoDonacion' | 'fechaCreacion' | 'fechaActualizacion'>;
export type ActualizarTipoDonacionDto = Partial<CrearTipoDonacionDto>;


@Injectable({ providedIn: 'root' })
export class TipoDonacionService {

  private readonly BASE_URL = 'http://localhost:9090/api/tipos-donacion';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token ?? ''}`
    });
  }

  private handleError(error: any) {
    console.error('Error en TipoDonacionService:', error);
    return throwError(() => error);
  }

  // ---- helpers de adaptación (id <-> idTipoDonacion) ----
  private readonly adaptOne = (r: any): TipoDonacion => ({
    idTipoDonacion: r?.idTipoDonacion ?? r?.id,
    descripcion: r?.descripcion,
    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private readonly adaptMany = (arr: any[]): TipoDonacion[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/tipos-donacion?estado=0|1 (sin estado => todos) */
  listar(estado?: 0 | 1): Observable<TipoDonacion[]> {
    let params = new HttpParams();
    if (estado === 0 || estado === 1) params = params.set('estado', String(estado));

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params })
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/tipos-donacion/{id} */
  obtenerPorId(id: number): Observable<TipoDonacion> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/tipos-donacion */
  crear(payload: CrearTipoDonacionDto): Observable<TipoDonacion> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/tipos-donacion/{id} */
  actualizar(id: number, payload: ActualizarTipoDonacionDto): Observable<TipoDonacion> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/tipos-donacion/{id}/deshabilitar (204) */
  deshabilitar(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** PATCH /api/tipos-donacion/{id}/habilitar (204) */
  habilitar(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/habilitar`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Alias si tu UI llamaba a "eliminarLogico"
  eliminarLogico(id: number): Observable<void> {
    return this.deshabilitar(id);
  }

  // Azúcar: aplicar acción y luego obtener el recurso actualizado
  deshabilitarYObtener(id: number): Observable<TipoDonacion> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }

  habilitarYObtener(id: number): Observable<TipoDonacion> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }
}
