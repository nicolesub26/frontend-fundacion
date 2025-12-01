import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, switchMap, throwError } from 'rxjs';

// Tipos auxiliares
export type EstadoBinario = 0 | 1;
// src/app/core/models/voluntario.model.ts
export type Disponibilidad =
  | 'MANANA'
  | 'TARDE'
  | 'NOCHE'
  | 'FINES_SEMANA'
  | 'COMPLETA';

export interface VoluntarioUsuario {
  login: string;
  estado: EstadoBinario;
  id?: number; // por si lo necesitas
}

export interface Voluntario {
  idVoluntario: number;
  nombre: string;
  apellido: string;
  ci: string;
  email: string;
  telefono: string;
  direccion?: string;
  fechaRegistro?: string;       // ISO string
  especialidad?: string;
  disponibilidad?: Disponibilidad;
  estado: EstadoBinario;

  // El backend devuelve un objeto 'usuario'; además exponemos un alias útil
  usuario?: VoluntarioUsuario | null;
  usuarioLogin?: string | null;
}

// DTOs
export type CrearVoluntarioDto = Omit<
  Voluntario,
  'idVoluntario' | 'usuario' | 'usuarioLogin'
>;

export type ActualizarVoluntarioDto = Partial<CrearVoluntarioDto>;

// Stats del endpoint /estadisticas
export interface VoluntarioStats {
  total: number;
  activos: number;
  inactivos: number;
  manana: number;
  tarde: number;
  noche: number;
  finesSemana: number;
  completa: number;
}



@Injectable({ providedIn: 'root' })
export class VoluntarioService {
  private readonly BASE_URL = 'http://localhost:9090/api/voluntarios';

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('Error en VoluntarioService:', error);
    return throwError(() => error);
  }

  // ---------- Adaptadores ----------
  private readonly adaptOne = (r: any): Voluntario => ({
    idVoluntario: r?.idVoluntario ?? r?.id ?? 0,
    nombre: r?.nombre ?? '',
    apellido: r?.apellido ?? '',
    ci: r?.ci ?? '',
    email: r?.email ?? '',
    telefono: r?.telefono ?? '',
    direccion: r?.direccion ?? undefined,
    fechaRegistro: r?.fechaRegistro ?? undefined,
    especialidad: r?.especialidad ?? undefined,
    disponibilidad: r?.disponibilidad ?? undefined,
    estado: (r?.estado ?? 1) as EstadoBinario,
    usuario: r?.usuario
      ? {
        login: r?.usuario?.login,
        estado: (r?.usuario?.estado ?? 1) as EstadoBinario,
        id: r?.usuario?.id ?? r?.usuario?.idUsuario ?? undefined,
      }
      : null,
    usuarioLogin:
      r?.usuarioLogin ?? r?.usuario?.login ?? r?.login ?? null,
  });

  private readonly adaptMany = (arr: any[]): Voluntario[] =>
    (arr ?? []).map(this.adaptOne);

  // ====================== CRUD ======================

  /** GET /api/voluntarios (o /estado/{estado} si pasas estado) */
  listar(estado?: EstadoBinario): Observable<Voluntario[]> {
    if (estado === 0 || estado === 1) {
      return this.http
        .get<any[]>(`${this.BASE_URL}/estado/${estado}`)
        .pipe(map(this.adaptMany), catchError(this.handleError));
    }
    return this.http
      .get<any[]>(`${this.BASE_URL}`)
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/voluntarios/{id} */
  obtenerPorId(id: number): Observable<Voluntario> {
    return this.http
      .get<any>(`${this.BASE_URL}/${id}`)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /**
   * POST /api/voluntarios?conUsuario=true|false
   * Si conUsuario=true, el backend crea el usuario con login=email y pass=telefono
   */
  crear(payload: CrearVoluntarioDto, conUsuario = true): Observable<Voluntario> {
    const params = new HttpParams().set('conUsuario', String(conUsuario));
    return this.http
      .post<any>(`${this.BASE_URL}`, payload, { params })
      .pipe(
        // el backend puede responder { mensaje, voluntario, login } o el recurso directo
        map((r) => this.adaptOne(r?.voluntario ?? r)),
        catchError(this.handleError)
      );
  }

  /** PUT /api/voluntarios/{id} */
  actualizar(id: number, payload: ActualizarVoluntarioDto): Observable<Voluntario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}`, payload)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** DELETE /api/voluntarios/{id} */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ====================== ESTADO (0/1) ======================

  /** PUT /api/voluntarios/{id}/activar */
  activar(id: number): Observable<Voluntario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}/activar`, {})
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/voluntarios/{id}/desactivar */
  desactivar(id: number): Observable<Voluntario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}/desactivar`, {})
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/voluntarios/{id}/estado/{nuevoEstado} */
  cambiarEstado(id: number, nuevoEstado: EstadoBinario): Observable<Voluntario> {
    return this.http
      .put<any>(`${this.BASE_URL}/${id}/estado/${nuevoEstado}`, {})
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== BÚSQUEDAS / FILTROS ======================

  /** GET /api/voluntarios/disponibilidad/{disp} */
  listarPorDisponibilidad(disp: Disponibilidad): Observable<Voluntario[]> {
    return this.http
      .get<any[]>(`${this.BASE_URL}/disponibilidad/${encodeURIComponent(disp)}`)
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/voluntarios/especialidad?q=... */
  listarPorEspecialidad(q: string): Observable<Voluntario[]> {
    const params = new HttpParams().set('q', q ?? '');
    return this.http
      .get<any[]>(`${this.BASE_URL}/especialidad`, { params })
      .pipe(map(this.adaptMany), catchError(this.handleError));
  }

  /** GET /api/voluntarios/usuario/{login} */
  obtenerPorUsuario(login: string): Observable<Voluntario> {
    return this.http
      .get<any>(`${this.BASE_URL}/usuario/${encodeURIComponent(login)}`)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ====================== VALIDACIONES ======================

  /** GET /api/voluntarios/validar/ci/{ci} -> { existe: boolean } */
  validarCi(ci: string): Observable<boolean> {
    return this.http
      .get<any>(`${this.BASE_URL}/validar/ci/${encodeURIComponent(ci)}`)
      .pipe(map(r => !!r?.existe), catchError(this.handleError));
  }

  /** GET /api/voluntarios/validar/email/{email} -> { existe: boolean } */
  validarEmail(email: string): Observable<boolean> {
    return this.http
      .get<any>(`${this.BASE_URL}/validar/email/${encodeURIComponent(email)}`)
      .pipe(map(r => !!r?.existe), catchError(this.handleError));
  }

  /** GET /api/voluntarios/validar/telefono/{tel} -> { existe: boolean } */
  validarTelefono(tel: string): Observable<boolean> {
    return this.http
      .get<any>(`${this.BASE_URL}/validar/telefono/${encodeURIComponent(tel)}`)
      .pipe(map(r => !!r?.existe), catchError(this.handleError));
  }

  // ====================== ESTADÍSTICAS ======================

  /** GET /api/voluntarios/estadisticas */
  estadisticas(): Observable<VoluntarioStats> {
    return this.http
      .get<VoluntarioStats>(`${this.BASE_URL}/estadisticas`)
      .pipe(catchError(this.handleError));
  }

  // ====================== AZÚCAR ======================

  activarYObtener(id: number): Observable<Voluntario> {
    return this.activar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }

  desactivarYObtener(id: number): Observable<Voluntario> {
    return this.desactivar(id).pipe(
      switchMap(() => this.obtenerPorId(id)),
      catchError(this.handleError)
    );
  }
}
