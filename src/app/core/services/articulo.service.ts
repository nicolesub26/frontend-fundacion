
// articulo.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Articulo, EstadisticasArticulo } from '../models/categoria.model';



@Injectable({
  providedIn: 'root'
})
export class ArticuloService {
  private readonly apiUrl = `http://localhost:9090/api/articulos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private handleError(error: any): Observable<never> {
    console.error('Error en ArticuloService:', error);
    return throwError(() => error);
  }

  // ==================== OPERACIONES CRUD ====================

  /**
   * Obtener todos los artículos
   */
  obtenerTodos(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículo por ID
   */
  obtenerPorId(id: number): Observable<Articulo> {
    return this.http.get<Articulo>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear nuevo artículo
   */
  crear(articulo: Articulo): Observable<ApiResponse<Articulo>> {
    return this.http.post<ApiResponse<Articulo>>(this.apiUrl, articulo, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar artículo existente
   */
  actualizar(id: number, articulo: Articulo): Observable<ApiResponse<Articulo>> {
    return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}`, articulo, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar artículo (eliminado lógico)
   */
  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== BÚSQUEDAS ESPECÍFICAS ====================

  /**
   * Obtener artículos activos
   */
  obtenerActivos(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/activos`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar artículos por estado
   */
  buscarPorEstado(estado: number): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/estado/${estado}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar artículo por nombre
   */
  buscarPorNombre(nombre: string): Observable<Articulo> {
    return this.http.get<Articulo>(`${this.apiUrl}/nombre/${nombre}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar artículos que contengan texto
   */
  buscarPorNombreContaining(nombre: string): Observable<Articulo[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Articulo[]>(`${this.apiUrl}/buscar`, { 
      headers: this.getHeaders(),
      params: params 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Buscar artículos por categoría
   */
  buscarPorCategoria(categoriaId: number): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/categoria/${categoriaId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar con filtros múltiples
   */
  buscarConFiltros(filtros: {
    nombreArticulo?: string;
    descripcion?: string;
    categoriaId?: number;
    estado?: number;
  }): Observable<Articulo[]> {
    let params = new HttpParams();
    
    if (filtros.nombreArticulo) {
      params = params.set('nombreArticulo', filtros.nombreArticulo);
    }
    if (filtros.descripcion) {
      params = params.set('descripcion', filtros.descripcion);
    }
    if (filtros.categoriaId) {
      params = params.set('categoriaId', filtros.categoriaId.toString());
    }
    if (filtros.estado !== undefined) {
      params = params.set('estado', filtros.estado.toString());
    }

    return this.http.get<Articulo[]>(`${this.apiUrl}/filtros`, { 
      headers: this.getHeaders(),
      params: params 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos para select/dropdown
   */
  obtenerParaSelect(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/select`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos disponibles (con stock)
   */
  obtenerDisponibles(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/disponibles`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== CAMBIOS DE ESTADO ====================

  /**
   * Activar artículo
   */
  activar(id: number): Observable<ApiResponse<Articulo>> {
    return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}/activar`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Desactivar artículo
   */
  desactivar(id: number): Observable<ApiResponse<Articulo>> {
    return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}/desactivar`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambiar estado de artículo
   */
  cambiarEstado(id: number, nuevoEstado: number): Observable<ApiResponse<Articulo>> {
    return this.http.put<ApiResponse<Articulo>>(`${this.apiUrl}/${id}/estado/${nuevoEstado}`, {}, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  /**
   * Obtener estadísticas de artículos
   */
  obtenerEstadisticas(): Observable<EstadisticasArticulo> {
    return this.http.get<EstadisticasArticulo>(`${this.apiUrl}/estadisticas`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos con stock
   */
  obtenerConStock(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/con-stock`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos sin inventario
   */
  obtenerSinInventario(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/sin-inventario`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos más donados
   */
  obtenerMasDonados(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/mas-donados`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener artículos más entregados
   */
  obtenerMasEntregados(): Observable<Articulo[]> {
    return this.http.get<Articulo[]>(`${this.apiUrl}/mas-entregados`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== VALIDACIONES ====================

  /**
   * Validar si existe un artículo por nombre
   */
  validarNombre(nombre: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/validar/nombre/${nombre}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar si un artículo tiene inventario
   */
  tieneInventario(id: number): Observable<{ tieneInventario: boolean }> {
    return this.http.get<{ tieneInventario: boolean }>(`${this.apiUrl}/${id}/tiene-inventario`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar si se puede eliminar un artículo
   */
  puedeEliminar(id: number): Observable<{ puedeEliminar: boolean }> {
    return this.http.get<{ puedeEliminar: boolean }>(`${this.apiUrl}/${id}/puede-eliminar`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== OPERACIONES DE NEGOCIO ====================

  /**
   * Crear artículo rápido
   */
  crearRapido(nombreArticulo: string, descripcion: string, categoriaId: number): Observable<ApiResponse<Articulo>> {
    const params = new HttpParams()
      .set('nombreArticulo', nombreArticulo)
      .set('descripcion', descripcion || '')
      .set('categoriaId', categoriaId.toString());

    return this.http.post<ApiResponse<Articulo>>(`${this.apiUrl}/rapido`, {}, { 
      headers: this.getHeaders(),
      params: params 
    }).pipe(catchError(this.handleError));
  }

  /**
   * Obtener estadísticas por categoría
   */
  obtenerEstadisticasPorCategoria(categoriaId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/estadisticas/categoria/${categoriaId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si un artículo está activo
   */
  estaActivo(articulo: Articulo): boolean {
    return articulo.estado === 1;
  }

  /**
   * Obtener texto del estado
   */
  obtenerTextoEstado(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  /**
   * Obtener clase CSS para el estado
   */
  obtenerClaseEstado(estado: number): string {
    return estado === 1 ? 'badge-success' : 'badge-danger';
  }

  /**
   * Obtener nombre de la categoría
   */
  obtenerNombreCategoria(articulo: Articulo): string {
    return articulo.categoria ? articulo.categoria.nombreCategoria : 'Sin categoría';
  }

  /**
   * Formatear fecha
   */
  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES');
  }
}