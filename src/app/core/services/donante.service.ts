import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export interface Donante {
  idDonante: number;
  nombre: string;
  apellido: string;
  ci?: string;
  email?: string;
  telefono?: string;
  direccion?: string;

  fechaRegistro: string;          // ISO (yyyy-MM-dd)
  tipoDonanteId: number;
  tipoDonanteDescripcion?: string;

  estado: number;                 // 1 = activo, 0 = inactivo
  fechaCreacion?: string;         // ISO
  fechaActualizacion?: string;    // ISO
}

export type CrearDonanteDto = {
  nombre: string;
  apellido: string;
  idTipoDonante: number;
  ci?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro?: string; // ISO (opcional)
};

export type ActualizarDonanteDto = CrearDonanteDto;

@Injectable({ providedIn: 'root' })
export class DonanteService {

  private readonly BASE_URL = 'http://localhost:9090/api/donantes';

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    console.error('Error en DonanteService:', error);
    return throwError(() => error);
  }

  // ---- adaptadores (id <-> idDonante) ----
  private adaptOne = (r: any): Donante => ({
    idDonante: r?.idDonante ?? r?.id,
    nombre: r?.nombre,
    apellido: r?.apellido,
    ci: r?.ci,
    email: r?.email,
    telefono: r?.telefono,
    direccion: r?.direccion,

    fechaRegistro: r?.fechaRegistro,
    tipoDonanteId: r?.tipoDonanteId ?? r?.idTipoDonante,
    tipoDonanteDescripcion: r?.tipoDonanteDescripcion,

    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private adaptMany = (arr: any[]): Donante[] => (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/donantes?estado=0|1 (sin estado => todos) */
  listar(estado?: 0 | 1): Observable<Donante[]> {
    let params = new HttpParams();
    if (estado === 0 || estado === 1) params = params.set('estado', String(estado));

    return this.http
      .get<any[]>(`${this.BASE_URL}`, { params })
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/donantes/{id} */
  obtenerPorId(id: number): Observable<Donante> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/donantes */
  crear(payload: CrearDonanteDto): Observable<Donante> {
    return this.http
      .post<any>(`${this.BASE_URL}`, payload)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/donantes/{id} */
  actualizar(id: number, payload: ActualizarDonanteDto): Observable<Donante> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== ESTADO (0/1) ======================

  /** PATCH /api/donantes/{id}/deshabilitar (204) */
  deshabilitar(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/deshabilitar`, {})
      .pipe(catchError(this.handleError));
  }

  /** PATCH /api/donantes/{id}/habilitar (204) */
  habilitar(id: number): Observable<void> {
    return this.http
      .patch<void>(`${this.BASE_URL}/${id}/habilitar`, {})
      .pipe(catchError(this.handleError));
  }

  /** Alias si tu UI usaba "eliminarLogico" */
  eliminarLogico(id: number): Observable<void> {
    return this.deshabilitar(id);
  }

  // Azúcar: aplicar acción y luego obtener el recurso actualizado
  deshabilitarYObtener(id: number): Observable<Donante> {
    return this.deshabilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }

  habilitarYObtener(id: number): Observable<Donante> {
    return this.habilitar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }
}
