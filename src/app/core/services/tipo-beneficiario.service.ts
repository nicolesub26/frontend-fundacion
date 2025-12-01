// src/app/core/services/tipo-beneficiario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface TipoBeneficiario {
  idTipoBeneficiario: number;
  descripcion: string;
  estado: number;                // 1 = activo, 0 = inactivo
  fechaCreacion?: string;        // ISO string
  fechaActualizacion?: string;   // ISO string
}

// En backend el request solo usa descripcion
export type CrearTipoBeneficiarioDto = { descripcion: string };
export type ActualizarTipoBeneficiarioDto = CrearTipoBeneficiarioDto;

@Injectable({ providedIn: 'root' })
export class TipoBeneficiarioService {

  private readonly BASE_URL = 'http://localhost:9090/api/tipos-beneficiario';

  constructor(private http: HttpClient) {}

  // --- headers idénticos ---
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any) {
    console.error('Error en TipoBeneficiarioService:', error);
    return throwError(() => error);
  }

  // ---- adaptadores (id <-> idTipoBeneficiario) ----
  private adaptOne = (r: any): TipoBeneficiario => ({
    idTipoBeneficiario: r?.idTipoBeneficiario ?? r?.id,
    descripcion: r?.descripcion,
    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private adaptMany = (arr: any[]): TipoBeneficiario[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/tipos-beneficiario?estado=0|1 (sin estado => todos) */
  listar(estado?: 0 | 1): Observable<TipoBeneficiario[]> {
    let params = new HttpParams();
    if (estado === 0 || estado === 1) params = params.set('estado', String(estado));

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params })
      .pipe(map(this.adaptMany), catchError(this.handleError.bind(this)));
  }

  /** GET /api/tipos-beneficiario/{id} */
  obtenerPorId(id: number): Observable<TipoBeneficiario> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  /** POST /api/tipos-beneficiario */
  crear(payload: CrearTipoBeneficiarioDto): Observable<TipoBeneficiario> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  /** PUT /api/tipos-beneficiario/{id} */
  actualizar(id: number, payload: ActualizarTipoBeneficiarioDto): Observable<TipoBeneficiario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/tipos-beneficiario/{id}/deshabilitar (204) */
  deshabilitar(id: number) {
    return this.http.patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {}, { headers: this.getHeaders() });
  }

  /** PATCH /api/tipos-beneficiario/{id}/habilitar (204) */
  habilitar(id: number) {
    return this.http.patch<void>(`${this.BASE_URL}/${id}/habilitar`, {}, { headers: this.getHeaders() });
  }

  // Alias para UI
  eliminarLogico(id: number): Observable<void> {
    return this.deshabilitar(id);
  }

  // Azúcar: aplicar acción y luego obtener el recurso actualizado
  deshabilitarYObtener(id: number): Observable<TipoBeneficiario> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError.bind(this))
    );
  }

  habilitarYObtener(id: number): Observable<TipoBeneficiario> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError.bind(this))
    );
  }
}
