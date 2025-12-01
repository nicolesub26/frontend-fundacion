// src/app/core/services/tipo-gasto.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';


// src/app/core/models/tipo-gasto.model.ts
export interface TipoGasto {
  idTipoGasto: number;
  descripcion: string;
  observaciones?: string;
  estado: 0 | 1;               // 1 = activo, 0 = inactivo
  fechaCreacion?: string;      // ISO string
  fechaActualizacion?: string; // ISO string
}

export type CrearTipoGastoDto = Omit<TipoGasto, 'idTipoGasto' | 'fechaCreacion' | 'fechaActualizacion'>;
export type ActualizarTipoGastoDto = Partial<CrearTipoGastoDto>;


@Injectable({ providedIn: 'root' })
export class TipoGastoService {

  private readonly BASE_URL = 'http://localhost:9090/api/tipos-gasto';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any) {
    console.error('Error en TipoGastoService:', error);
    return throwError(() => error);
  }

  // ---- adaptadores (id <-> idTipoGasto) ----
  private readonly adaptOne = (r: any): TipoGasto => ({
    idTipoGasto: r?.idTipoGasto ?? r?.id,
    descripcion: r?.descripcion,
    observaciones: r?.observaciones,
    estado: r?.estado as 0 | 1,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private readonly adaptMany = (arr: any[]): TipoGasto[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/tipos-gasto?estado=0|1 (sin estado => todos) */
  listar(estado?: 0 | 1): Observable<TipoGasto[]> {
    let params = new HttpParams();
    if (estado === 0 || estado === 1) params = params.set('estado', String(estado));

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params })
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/tipos-gasto/{id} */
  obtenerPorId(id: number): Observable<TipoGasto> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/tipos-gasto */
  crear(payload: CrearTipoGastoDto): Observable<TipoGasto> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/tipos-gasto/{id} */
  actualizar(id: number, payload: ActualizarTipoGastoDto): Observable<TipoGasto> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/tipos-gasto/{id}/deshabilitar (204) */
  deshabilitar(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /** PATCH /api/tipos-gasto/{id}/habilitar (204) */
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
  deshabilitarYObtener(id: number): Observable<TipoGasto> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }

  habilitarYObtener(id: number): Observable<TipoGasto> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }
}