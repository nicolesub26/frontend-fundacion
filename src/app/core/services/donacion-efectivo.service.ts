import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DonacionEfectivo {
  idDonacionEfectivo: number;
  idDonacion: number;
  monto: number;
  moneda: 'BOB' | 'USD' | 'EUR';
  descripcionUso?: string;
  fechaRegistro: string; // ISO
  estado: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
export type CrearDonacionEfectivoDto = Omit<DonacionEfectivo,'idDonacionEfectivo'|'fechaCreacion'|'fechaActualizacion'>;
export type ActualizarDonacionEfectivoDto = Partial<CrearDonacionEfectivoDto>;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class DonacionEfectivoService {
  private readonly BASE_URL = 'http://localhost:9090/api/donaciones-efectivo';
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
  private handleError = (e:any) => { console.error('DonacionEfectivoService', e); return throwError(() => e); };

  private readonly adaptOne = (r:any): DonacionEfectivo => ({
    idDonacionEfectivo: r?.idDonacionEfectivo ?? r?.id,
    idDonacion: r?.idDonacion,
    monto: Number(r?.monto),
    moneda: r?.moneda,
    descripcionUso: r?.descripcionUso,
    fechaRegistro: r?.fechaRegistro,
    estado: r?.estado,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private readonly adaptPage = (p:any): PageResponse<DonacionEfectivo> => ({
    content: (p?.content ?? p ?? []).map(this.adaptOne),
    totalElements: p?.totalElements ?? (p?.content?.length ?? 0),
    totalPages: p?.totalPages ?? 1,
    number: p?.number ?? 0,
    size: p?.size ?? (p?.content?.length ?? 0),
  });

  /** GET /api/donaciones-efectivo?estado=&page=&size=&sort=campo,dir */
  listarPage(params: { estado?: 0|1; page?: number; size?: number; sort?: string } = {}):
    Observable<PageResponse<DonacionEfectivo>> {

    let httpParams = new HttpParams();
    if (params.estado === 0 || params.estado === 1) httpParams = httpParams.set('estado', String(params.estado));
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 20));
    httpParams = httpParams.set('sort', params.sort ?? 'idDonacionEfectivo,desc');

    return this.http.get<any>(this.BASE_URL, { headers: this.headers(), params: httpParams })
      .pipe(map(this.adaptPage), catchError(this.handleError));
  }

  /** GET /api/donaciones-efectivo/{id} */
  obtener(id:number): Observable<DonacionEfectivo> {
    return this.http.get<any>(`${this.BASE_URL}/${id}`, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** GET /api/donaciones-efectivo/by-donacion/{idDonacion} */
  byDonacion(idDonacion:number): Observable<DonacionEfectivo> {
    return this.http.get<any>(`${this.BASE_URL}/by-donacion/${idDonacion}`, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/donaciones-efectivo */
  crear(dto: CrearDonacionEfectivoDto): Observable<DonacionEfectivo> {
    return this.http.post<any>(this.BASE_URL, dto, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/donaciones-efectivo/{id} */
  actualizar(id:number, dto: ActualizarDonacionEfectivoDto): Observable<DonacionEfectivo> {
    return this.http.put<any>(`${this.BASE_URL}/${id}`, dto, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PATCH /api/donaciones-efectivo/{id}/estado?estado=0|1 */
  cambiarEstado(id:number, estado:0|1): Observable<DonacionEfectivo> {
    const params = new HttpParams().set('estado', String(estado));
    return this.http.patch<any>(`${this.BASE_URL}/${id}/estado`, null, { headers: this.headers(), params })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** DELETE /api/donaciones-efectivo/{id} */
  eliminar(id:number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }
}
