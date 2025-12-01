import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../layout/service/auth.service';

// ===== Modelos =====
export interface Entrega {
  idEntrega: number;
  fechaEntrega: string; // ISO
  observaciones?: string;
  estado: number;       // 0/1

  idBeneficiario: number;
  nombreBeneficiario?: string;

  idEmpleado: number;
  nombreEmpleado?: string;

  idVoluntario?: number; // Added

  // Si el backend retorna la lista de detalles al consultar la entrega
  detalles?: EntregaDetalle[];

  fechaCreacion?: string;
  fechaActualizacion?: string;

  // Para la imagen
  fotoUrl?: string;
}

export interface EntregaDetalle {
  idDetalle?: number;
  idArticulo: number;
  nombreArticulo?: string;
  cantidad: number;
  origen?: string; // Added
  observaciones?: string;
}

// DTO para crear (sin imagen)
export interface CrearEntregaDto {
  fechaEntrega?: string;
  observaciones?: string;
  idBeneficiario: number;
  idEmpleado: number;
  idVoluntario?: number; // Added to match DB requirements
  detalles: {
    idArticulo: number;
    cantidad: number;
    origen?: string; // Added to match DB requirements
    observaciones?: string;
  }[];
  estado?: 0 | 1;
  fotoEntrega?: string; // Reverted to fotoEntrega to match DB column
}

export type ActualizarEntregaDto = Partial<CrearEntregaDto>;

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface FiltrosEntrega {
  idBeneficiario?: number;
  idEmpleado?: number;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: number;
}

export interface EstadisticasEntrega {
  totalEntregas: number;
  entregasActivas: number;
  entregasCanceladas: number;
  totalArticulosEntregados: number;
}

export interface ApiResponse<T> {
  mensaje: string;
  data?: T;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class EntregaService {

  private readonly BASE_URL = 'http://localhost:9090/api/entregas';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private handleError = (e: any) => {
    console.error('EntregaService:', e);
    return throwError(() => e);
  };

  private readonly adaptOne = (r: any): Entrega => ({
    idEntrega: r?.idEntrega ?? r?.id,
    fechaEntrega: r?.fechaEntrega,
    observaciones: r?.observaciones,
    estado: r?.estado,
    idBeneficiario: r?.idBeneficiario,
    nombreBeneficiario: r?.nombreBeneficiario,
    idEmpleado: r?.idEmpleado,
    nombreEmpleado: r?.nombreEmpleado,
    idVoluntario: r?.idVoluntario,
    detalles: r?.detalles, // si viene
    fechaCreacion: r?.fechaCreacion,
    fechaActualizacion: r?.fechaActualizacion,
    fotoUrl: r?.fotoUrl
  });

  private readonly adaptPage = (p: any): PageResponse<Entrega> => ({
    content: (p?.content ?? p ?? []).map(this.adaptOne),
    totalElements: p?.totalElements ?? (p?.content?.length ?? 0),
    totalPages: p?.totalPages ?? 1,
    number: p?.number ?? 0,
    size: p?.size ?? (p?.content?.length ?? 0),
  });

  // ====== Endpoints ======

  /**
   * GET /api/entregas
   */
  listarPage(params: {
    estado?: 0 | 1,
    desde?: string,
    hasta?: string,
    page?: number,
    size?: number,
    sort?: string
  } = {}): Observable<PageResponse<Entrega>> {

    let httpParams = new HttpParams();
    if (params.estado === 0 || params.estado === 1) httpParams = httpParams.set('estado', String(params.estado));
    if (params.desde) httpParams = httpParams.set('desde', params.desde);
    if (params.hasta) httpParams = httpParams.set('hasta', params.hasta);
    httpParams = httpParams.set('page', String(params.page ?? 0));
    httpParams = httpParams.set('size', String(params.size ?? 20));
    httpParams = httpParams.set('sort', params.sort ?? 'fechaEntrega,desc');

    return this.http.get<any>(this.BASE_URL, { params: httpParams })
      .pipe(map(this.adaptPage), catchError(this.handleError));
  }

  /** GET /api/entregas/{id} */
  obtener(id: number): Observable<Entrega> {
    return this.http.get<any>(`${this.BASE_URL}/${id}`)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /**
   * POST /api/entregas
   * Crea la entrega (JSON). Si quieres subir foto, usa subirFoto después o el endpoint con FormData si existe.
   */
  crear(dto: CrearEntregaDto): Observable<Entrega> {
    return this.http.post<any>(this.BASE_URL, dto)
      .pipe(map(r => this.adaptOne(r.entrega || r)), catchError(this.handleError));
  }

  /**
   * POST /api/entregas/con-foto
   * Crea entrega + sube foto en una sola llamada (FormData).
   * Backend debe soportar @RequestPart("datos") y @RequestPart("archivo").
   */
  crearConFoto(dto: CrearEntregaDto, archivo: File): Observable<Entrega> {
    const formData = new FormData();
    // Convertir dto a Blob JSON
    formData.append('datos', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    formData.append('archivo', archivo);

    return this.http.post<any>(`${this.BASE_URL}/con-foto`, formData)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PUT /api/entregas/{id} */
  actualizar(id: number, dto: ActualizarEntregaDto): Observable<Entrega> {
    return this.http.put<any>(`${this.BASE_URL}/${id}`, dto)
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** PATCH /api/entregas/{id}/estado */
  cambiarEstado(id: number, estado: 0 | 1): Observable<Entrega> {
    const params = new HttpParams().set('estado', String(estado));
    return this.http.patch<any>(`${this.BASE_URL}/${id}/estado`, null, { params })
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  /** DELETE /api/entregas/{id} */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // === Manejo de Imagen extra (si hay endpoint separado) ===
  subirFoto(id: number, archivo: File): Observable<Entrega> {
    const formData = new FormData();
    formData.append('imagen', archivo); // Changed key to 'imagen'
    return this.http.put<any>(`${this.BASE_URL}/${id}/imagen`, formData) // Changed to PUT and /imagen
      .pipe(map(this.adaptOne), catchError(this.handleError));
  }

  // ==================== BÚSQUEDAS Y FILTROS ====================

  /**
   * Buscar entregas por beneficiario
   */
  buscarPorBeneficiario(idBeneficiario: number): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/beneficiario/${idBeneficiario}`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar entregas por empleado
   */
  buscarPorEmpleado(idEmpleado: number): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/empleado/${idEmpleado}`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar entregas por fecha específica
   */
  buscarPorFecha(fecha: string): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/fecha/${fecha}`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar entregas entre fechas
   */
  buscarEntreFechas(fechaInicio: string, fechaFin: string): Observable<Entrega[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);

    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/entre-fechas`,
      { params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas del día actual
   */
  obtenerDelDia(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/hoy`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas de la semana actual
   */
  obtenerDeLaSemana(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/semana`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas del mes actual
   */
  obtenerDelMes(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/mes`
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar con filtros combinados
   */
  buscarConFiltros(filtros: FiltrosEntrega): Observable<Entrega[]> {
    let params = new HttpParams();

    if (filtros.idBeneficiario) {
      params = params.set('idBeneficiario', filtros.idBeneficiario.toString());
    }
    if (filtros.idEmpleado) {
      params = params.set('idEmpleado', filtros.idEmpleado.toString());
    }
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.estado !== undefined) {
      params = params.set('estado', filtros.estado.toString());
    }

    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/filtros`,
      { params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas activas
   */
  obtenerActivas(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.BASE_URL}/activas`
    ).pipe(catchError(this.handleError));
  }

  // ==================== GESTIÓN DE ESTADO ====================

  /**
   * Activar entrega
   */
  activar(id: number): Observable<ApiResponse<Entrega>> {
    return this.http.put<ApiResponse<Entrega>>(
      `${this.BASE_URL}/${id}/activar`,
      {}
    ).pipe(catchError(this.handleError));
  }

  /**
   * Desactivar entrega
   */
  desactivar(id: number): Observable<ApiResponse<Entrega>> {
    return this.http.put<ApiResponse<Entrega>>(
      `${this.BASE_URL}/${id}/desactivar`,
      {}
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener estadísticas generales de entregas
   */
  obtenerEstadisticas(): Observable<EstadisticasEntrega> {
    return this.http.get<EstadisticasEntrega>(
      `${this.BASE_URL}/estadisticas`
    ).pipe(catchError(this.handleError));
  }

  // ==================== GESTIÓN DE IMÁGENES ====================

  /**
   * Obtener URL de la imagen de una entrega
   */
  obtenerUrlImagen(id: number): Observable<Blob> {
    return this.http.get(
      `${this.BASE_URL}/${id}/imagen`,
      {
        responseType: 'blob'
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Descargar imagen como blob
   */
  descargarImagen(id: number): Observable<Blob> {
    return this.http.get(
      `${this.BASE_URL}/${id}/imagen`,
      {
        responseType: 'blob'
      }
    ).pipe(catchError(this.handleError));
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear fecha para display (sin conversión de zona horaria)
   */
  formatearFecha(fecha: string): string {
    // Parse YYYY-MM-DD directly without timezone conversion
    const [year, month, day] = fecha.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener texto del estado
   */
  textoEstado(estado: number): string {
    return estado === 1 ? 'Activa' : 'Inactiva';
  }

  /**
   * Obtener clase CSS del estado
   */
  claseEstado(estado: number): string {
    return estado === 1 ? 'badge-success' : 'badge-danger';
  }

  /**
   * Obtener texto del origen
   */
  textoOrigen(origen: string): string {
    const origenes: { [key: string]: string } = {
      'DONACION_DIRECTA': 'Donación Directa',
      'COMPRA_EFECTIVO': 'Compra en Efectivo',
      'MIXTO': 'Mixto'
    };
    return origenes[origen] || origen;
  }

  /**
   * Calcular total de artículos en una entrega
   */
  calcularTotalArticulos(entrega: Entrega): number {
    if (!entrega.detalles || entrega.detalles.length === 0) {
      return 0;
    }
    return entrega.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
  }
}