import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../layout/service/auth.service';

// ===== Modelos =====
export interface Donacion {
  idDonacion: number;
  fechaDonacion: string;  // ISO
  observaciones?: string;
  estado: number;         // 0/1

  idDonante: number;
  nombreDonante?: string;

  idTipoDonacion: number;
  descripcionTipoDonacion?: string;

  idEmpleado: number;
  nombreEmpleado?: string;

  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export type CrearDonacionDto = {
  fechaDonacion?: string;
  observaciones?: string;
  idDonante: number;
  idTipoDonacion: number;
  idEmpleado: number;
  estado?: 0 | 1;
};

export type ActualizarDonacionDto = Partial<CrearDonacionDto>;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // page index
  size: number;
}

@Injectable({ providedIn: 'root' })
export class DonacionService {

  private readonly BASE_URL = 'http://localhost:9090/api/donaciones';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private handleError = (e: any) => {
    console.error('DonacionService:', e);
    return throwError(() => e);
  };

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  private readonly adaptOne = (r: any): Donacion => ({
    idDonacion: r?.idDonacion ?? r?.id,
    fechaDonacion: r?.fechaDonacion,
    observaciones: r?.observaciones,
    estado: r?.estado,
    idDonante: r?.idDonante,
    nombreDonante: r?.nombreDonante,
    idTipoDonacion: r?.idTipoDonacion,
    descripcionTipoDonacion: r?.descripcionTipoDonacion,
    idEmpleado: r?.idEmpleado,
    nombreEmpleado: r?.nombreEmpleado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private readonly adaptPage = (p: any): PageResponse<Donacion> => ({
    content: (p?.content ?? p ?? []).map(this.adaptOne),
    totalElements: p?.totalElements ?? (p?.content?.length ?? 0),
    totalPages: p?.totalPages ?? 1,
    number: p?.number ?? 0,
    size: p?.size ?? (p?.content?.length ?? 0),
  });

  // ====== Endpoints ======

  /**
   * GET /api/donaciones?estado=&desde=&hasta=&page=&size=&sort=campo,dir
   * Ej: sort=fechaDonacion,desc
   */
  listarPage(params: {
    estado?: 0 | 1,
    desde?: string,  // 'YYYY-MM-DD'
    hasta?: string,  // 'YYYY-MM-DD'
    page?: number,
    size?: number,
    sort?: string
  } = {}): Observable<PageResponse<Donacion>> {

    let httpParams = new HttpParams();
    if (params.estado === 0 || params.estado === 1) httpParams = httpParams.set('estado', String(params.estado));
    if (params.desde) httpParams = httpParams.set('desde', params.desde);
    if (params.hasta) httpParams = httpParams.set('hasta', params.hasta);
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 20));
    httpParams = httpParams.set('sort', params.sort ?? 'fechaDonacion,desc');

    return this.http.get<any>(this.BASE_URL, { headers: this.getHeaders(), params: httpParams })
      .pipe(map(this.adaptPage), catchError(this.handleError));
  }

  /** GET /api/donaciones/{id} */
  obtener(id: number): Observable<Donacion> {
    return this.http.get<any>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/donaciones */
  crear(dto: CrearDonacionDto): Observable<Donacion> {
    return this.http.post<any>(this.BASE_URL, dto, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/donaciones/{id} */
  actualizar(id: number, dto: ActualizarDonacionDto): Observable<Donacion> {
    return this.http.put<any>(`${this.BASE_URL}/${id}`, dto, { headers: this.getHeaders() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PATCH /api/donaciones/{id}/estado?estado=0|1 */
  cambiarEstado(id: number, estado: 0 | 1): Observable<Donacion> {
    const params = new HttpParams().set('estado', String(estado));
    return this.http.patch<any>(`${this.BASE_URL}/${id}/estado`, null, { headers: this.getHeaders(), params })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** DELETE /api/donaciones/{id}  (hard delete, úsalo con cuidado) */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}
