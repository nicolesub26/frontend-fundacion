// src/app/services/entrega.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  Entrega,
  EntregaCreateDTO,
  FiltrosEntrega,
  EstadisticasEntrega,
  ApiResponse
} from '../models/entrega.model';

@Injectable({
  providedIn: 'root'
})
export class EntregaService {
  private readonly apiUrl = 'http://localhost:9090/api/entregas';

  constructor(private http: HttpClient) {}

  // ==================== HEADERS ====================

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private getHeadersMultipart(): HttpHeaders {
    const token = localStorage.getItem('token');
    // NO incluir Content-Type para multipart, el browser lo establece automáticamente
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en EntregaService:', error);
    return throwError(() => error);
  }

  // ==================== OPERACIONES CRUD ====================

  /**
   * Crear nueva entrega con imagen
   */
  crear(entrega: EntregaCreateDTO, imagen: File): Observable<ApiResponse<Entrega>> {
    const formData = new FormData();
    
    // Agregar el JSON como blob
    const entregaBlob = new Blob([JSON.stringify(entrega)], { type: 'application/json' });
    formData.append('entrega', entregaBlob);
    
    // Agregar la imagen
    formData.append('imagen', imagen);

    return this.http.post<ApiResponse<Entrega>>(
      this.apiUrl,
      formData,
      { headers: this.getHeadersMultipart() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Actualizar entrega existente
   */
  actualizar(id: number, entrega: EntregaCreateDTO, imagen?: File): Observable<ApiResponse<Entrega>> {
    const formData = new FormData();
    
    const entregaBlob = new Blob([JSON.stringify(entrega)], { type: 'application/json' });
    formData.append('entrega', entregaBlob);
    
    if (imagen) {
      formData.append('imagen', imagen);
    }

    return this.http.put<ApiResponse<Entrega>>(
      `${this.apiUrl}/${id}`,
      formData,
      { headers: this.getHeadersMultipart() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entrega por ID
   */
  obtenerPorId(id: number): Observable<Entrega> {
    return this.http.get<Entrega>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entrega por ID con detalles completos
   */
  obtenerConDetalles(id: number): Observable<Entrega> {
    return this.http.get<Entrega>(
      `${this.apiUrl}/${id}/detalles`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Listar todas las entregas
   */
  listar(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      this.apiUrl,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Listar todas las entregas con detalles
   */
  listarConDetalles(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/con-detalles`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Eliminar entrega (lógica)
   */
  eliminar(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${id}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== BÚSQUEDAS Y FILTROS ====================

  /**
   * Buscar entregas por beneficiario
   */
  buscarPorBeneficiario(idBeneficiario: number): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/beneficiario/${idBeneficiario}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar entregas por empleado
   */
  buscarPorEmpleado(idEmpleado: number): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/empleado/${idEmpleado}`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Buscar entregas por fecha específica
   */
  buscarPorFecha(fecha: string): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/fecha/${fecha}`,
      { headers: this.getHeaders() }
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
      `${this.apiUrl}/entre-fechas`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas del día actual
   */
  obtenerDelDia(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/hoy`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas de la semana actual
   */
  obtenerDeLaSemana(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/semana`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas del mes actual
   */
  obtenerDelMes(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/mes`,
      { headers: this.getHeaders() }
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
      `${this.apiUrl}/filtros`,
      { headers: this.getHeaders(), params }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Obtener entregas activas
   */
  obtenerActivas(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(
      `${this.apiUrl}/activas`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== GESTIÓN DE ESTADO ====================

  /**
   * Activar entrega
   */
  activar(id: number): Observable<ApiResponse<Entrega>> {
    return this.http.put<ApiResponse<Entrega>>(
      `${this.apiUrl}/${id}/activar`,
      {},
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Desactivar entrega
   */
  desactivar(id: number): Observable<ApiResponse<Entrega>> {
    return this.http.put<ApiResponse<Entrega>>(
      `${this.apiUrl}/${id}/desactivar`,
      {},
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas generales de entregas
   */
  obtenerEstadisticas(): Observable<EstadisticasEntrega> {
    return this.http.get<EstadisticasEntrega>(
      `${this.apiUrl}/estadisticas`,
      { headers: this.getHeaders() }
    ).pipe(catchError(this.handleError));
  }

  // ==================== GESTIÓN DE IMÁGENES ====================

  /**
   * Obtener URL de la imagen de una entrega
   */
  obtenerUrlImagen(id: number):Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/imagen`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Descargar imagen como blob
   */
  descargarImagen(id: number): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${id}/imagen`,
      {
        headers: this.getHeaders(),
        responseType: 'blob'
      }
    ).pipe(catchError(this.handleError));
  }

  // ==================== UTILIDADES ====================

  /**
   * Formatear fecha para display
   */
  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
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