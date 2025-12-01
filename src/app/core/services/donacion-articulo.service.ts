import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface DonacionArticulo {
  idDonacionArticulo: number;
  idDonacion: number;
  idArticulo: number;
  cantidad: number;
  descripcion?: string;
  fechaVencimiento?: string; // ISO
  estadoArticulo: 'NUEVO' | 'USADO_BUENO' | 'USADO_REGULAR' | 'REPARAR';
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
export type CrearDonacionArticuloDto = Omit<DonacionArticulo,'idDonacionArticulo'|'fechaCreacion'|'fechaActualizacion'>;
export type ActualizarDonacionArticuloDto = Partial<CrearDonacionArticuloDto>;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class DonacionArticuloService {
  private readonly BASE_URL = 'http://localhost:9090/api/donaciones-articulo';
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }
  private handleError = (e:any) => { console.error('DonacionArticuloService', e); return throwError(() => e); };

  private readonly adaptOne = (r:any): DonacionArticulo => ({
    idDonacionArticulo: r?.idDonacionArticulo ?? r?.id,
    idDonacion: r?.idDonacion,
    idArticulo: r?.idArticulo,
    cantidad: r?.cantidad,
    descripcion: r?.descripcion,
    fechaVencimiento: r?.fechaVencimiento,
    estadoArticulo: r?.estadoArticulo,
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion
  });

  private readonly adaptPage = (p:any): PageResponse<DonacionArticulo> => ({
    content: (p?.content ?? p ?? []).map(this.adaptOne),
    totalElements: p?.totalElements ?? (p?.content?.length ?? 0),
    totalPages: p?.totalPages ?? 1,
    number: p?.number ?? 0,
    size: p?.size ?? (p?.content?.length ?? 0),
  });

  /** GET /api/donaciones-articulo?page=&size=&sort=campo,dir */
  listarPage(params: { page?: number; size?: number; sort?: string } = {}):
    Observable<PageResponse<DonacionArticulo>> {

    let httpParams = new HttpParams()
      .set('page', String(params.page ?? 0))
      .set('size', String(params.size ?? 20))
      .set('sort', params.sort ?? 'idDonacionArticulo,desc');

    return this.http.get<any>(this.BASE_URL, { headers: this.headers(), params: httpParams })
      .pipe(map(this.adaptPage), catchError(this.handleError));
  }

  /** GET /api/donaciones-articulo/{id} */
  obtener(id:number): Observable<DonacionArticulo> {
    return this.http.get<any>(`${this.BASE_URL}/${id}`, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** POST /api/donaciones-articulo */
  crear(dto: CrearDonacionArticuloDto): Observable<DonacionArticulo> {
    return this.http.post<any>(this.BASE_URL, dto, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/donaciones-articulo/{id} */
  actualizar(id:number, dto: ActualizarDonacionArticuloDto): Observable<DonacionArticulo> {
    return this.http.put<any>(`${this.BASE_URL}/${id}`, dto, { headers: this.headers() })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** DELETE /api/donaciones-articulo/{id} */
  eliminar(id:number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`, { headers: this.headers() })
      .pipe(catchError(this.handleError));
  }
}
