import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface TipoDonante {
  idTipoDonante: number;
  descripcion: string;
  caracteristicas?: string;
  beneficios?: string;
  estado: number;                // 1 = activo, 0 = inactivo
  fechaCreacion?: string;        // ISO string
  fechaActualizacion?: string;   // ISO string
}

export type CrearTipoDonanteDto = Omit<TipoDonante, 'idTipoDonante' | 'fechaCreacion' | 'fechaActualizacion'>;
export type ActualizarTipoDonanteDto = Partial<CrearTipoDonanteDto>;

@Injectable({ providedIn: 'root' })
export class TipoDonanteService {

  private readonly BASE_URL = 'http://localhost:9090/api/tipos-donante';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en TipoDonanteService:', error);
    return throwError(() => error);
  }

  // ---- helpers de adaptación (id <-> idTipoDonante) ----
  private adaptOne = (r: any): TipoDonante => ({
    idTipoDonante: r?.idTipoDonante ?? r?.id,
    descripcion: r?.descripcion,
    caracteristicas: r?.caracteristicas,
    beneficios: r?.beneficios,
    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private adaptMany = (arr: any[]): TipoDonante[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/tipos-donante?estado=0|1 (sin estado => todos) */
  listar(estado?: 0 | 1): Observable<TipoDonante[]> {
    let params = new HttpParams();
    if (estado === 0 || estado === 1) params = params.set('estado', String(estado));

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params })
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/tipos-donante/{id} */
  obtenerPorId(id: number): Observable<TipoDonante> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/tipos-donante */
  crear(payload: CrearTipoDonanteDto): Observable<TipoDonante> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/tipos-donante/{id} */
  actualizar(id: number, payload: ActualizarTipoDonanteDto): Observable<TipoDonante> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/tipos-donante/{id}/deshabilitar (204) */
  deshabilitar(id: number) {
  return this.http.patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {}, { headers: this.getHeaders() });
}
habilitar(id: number) {
  return this.http.patch<void>(`${this.BASE_URL}/${id}/habilitar`, {}, { headers: this.getHeaders() });
}


  // Alias si tu UI llamaba a "eliminarLogico"
  eliminarLogico(id: number): Observable<void> {
    return this.deshabilitar(id);
  }

  // Azúcar: aplicar acción y luego obtener el recurso actualizado
  deshabilitarYObtener(id: number): Observable<TipoDonante> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }

  habilitarYObtener(id: number): Observable<TipoDonante> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }
}
