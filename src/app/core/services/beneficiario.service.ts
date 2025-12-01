// src/app/core/services/beneficiario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface Beneficiario {
  idBeneficiario: number;
  nombre: string;
  apellido: string;
  ci?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  situacionSocioeconomica?: string | null;
  fechaRegistro: string;            // ISO
  idTipoBeneficiario: number;
  tipoBeneficiarioDescripcion?: string;
  estado: number;                   // 1 = activo, 0 = inactivo
  fechaCreacion?: string;           // ISO
  fechaActualizacion?: string;      // ISO
}

// Crear/Actualizar (según tu backend)
export type CrearBeneficiarioDto = {
  nombre: string;
  apellido: string;
  ci?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  situacionSocioeconomica?: string | null;
  fechaRegistro?: string;           // ISO (opcional, el backend pone hoy si no viene)
  idTipoBeneficiario: number;
};
export type ActualizarBeneficiarioDto = CrearBeneficiarioDto;

@Injectable({ providedIn: 'root' })
export class BeneficiarioService {
  private readonly BASE_URL = 'http://localhost:9090/api/beneficiarios';

  constructor(private http: HttpClient) {}

  // --- headers idénticos ---
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any) {
    console.error('Error en BeneficiarioService:', error);
    return throwError(() => error);
  }

  // ---- adaptadores (acepta respuesta con id o idBeneficiario, y tipo embebido o plano) ----
  private adaptOne = (r: any): Beneficiario => ({
    idBeneficiario: r?.idBeneficiario ?? r?.id,
    nombre: r?.nombre,
    apellido: r?.apellido,
    ci: r?.ci ?? null,
    telefono: r?.telefono ?? null,
    direccion: r?.direccion ?? null,
    situacionSocioeconomica: r?.situacionSocioeconomica ?? null,
    fechaRegistro: r?.fechaRegistro,
    idTipoBeneficiario:
      r?.idTipoBeneficiario ??
      r?.tipoBeneficiario?.idTipoBeneficiario,
    tipoBeneficiarioDescripcion:
      r?.tipoBeneficiarioDescripcion ??
      r?.tipoBeneficiario?.descripcion,
    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private adaptMany = (arr: any[]): Beneficiario[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD & LISTADOS ======================

  /**
   * GET /api/beneficiarios?estado=0|1&tipo={idTipo}&q={texto}
   */
  listar(params?: { estado?: 0 | 1; tipo?: number; q?: string }): Observable<Beneficiario[]> {
    let httpParams = new HttpParams();
    if (params?.estado === 0 || params?.estado === 1) {
      httpParams = httpParams.set('estado', String(params.estado));
    }
    if (params?.tipo != null) httpParams = httpParams.set('tipo', String(params.tipo));
    if (params?.q) httpParams = httpParams.set('q', params.q.trim());

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { headers: this.getHeaders(), params: httpParams })
      .pipe(map(this.adaptMany), catchError(this.handleError.bind(this)));
  }

  /** GET /api/beneficiarios/{id} */
  obtenerPorId(id: number): Observable<Beneficiario> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  /** POST /api/beneficiarios */
  crear(payload: CrearBeneficiarioDto): Observable<Beneficiario> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  /** PUT /api/beneficiarios/{id} */
  actualizar(id: number, payload: ActualizarBeneficiarioDto): Observable<Beneficiario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError.bind(this)));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/beneficiarios/{id}/deshabilitar (204) */
  deshabilitar(id: number) {
    return this.http.patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {}, { headers: this.getHeaders() });
  }

  /** PATCH /api/beneficiarios/{id}/habilitar (204) */
  habilitar(id: number) {
    return this.http.patch<void>(`${this.BASE_URL}/${id}/habilitar`, {}, { headers: this.getHeaders() });
  }

  // Alias para UI
  eliminarLogico(id: number): Observable<void> {
    return this.deshabilitar(id);
  }

  // Azúcar: aplicar acción y luego obtener el recurso actualizado
  deshabilitarYObtener(id: number): Observable<Beneficiario> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError.bind(this))
    );
  }

  habilitarYObtener(id: number): Observable<Beneficiario> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError.bind(this))
    );
  }

  // ====================== VALIDACIONES ======================

  /** GET /api/beneficiarios/validar/ci/{ci} -> { existe: boolean } */
  validarCi(ci: string): Observable<{ existe: boolean }> {
    return this.http
      .get<{ existe: boolean }>(`${this.BASE_URL}/validar/ci/${encodeURIComponent(ci.trim())}`, {
        headers: this.getHeaders()
      })
      .pipe(catchError(this.handleError.bind(this)));
  }
}
