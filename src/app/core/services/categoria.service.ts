// categoria.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiResponse, Categoria, EstadisticasCategoria } from '../models/categoria.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = `http://localhost:9090/api/categorias`;

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    console.error('Error en CategoriaService:', error);
    return throwError(() => error);
  }

  // ==================== OPERACIONES CRUD ====================

  /**
   * Obtener todas las categorías
   */
  obtenerTodas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(this.apiUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categoría por ID
   */
  obtenerPorId(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear nueva categoría
   */
  crear(categoria: Categoria): Observable<ApiResponse<Categoria>> {
    return this.http.post<ApiResponse<Categoria>>(this.apiUrl, categoria)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar categoría existente
   */
  actualizar(id: number, categoria: Categoria): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}`, categoria)
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar categoría (eliminado lógico)
   */
  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // ==================== BÚSQUEDAS ESPECÍFICAS ====================

  /**
   * Obtener categorías activas
   */
  obtenerActivas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/activas`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar categorías por estado
   */
  buscarPorEstado(estado: number): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/estado/${estado}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar categoría por nombre
   */
  buscarPorNombre(nombre: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/nombre/${nombre}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar categorías que contengan texto
   */
  buscarPorNombreContaining(nombre: string): Observable<Categoria[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http.get<Categoria[]>(`${this.apiUrl}/buscar`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Buscar con filtros múltiples
   */
  buscarConFiltros(filtros: {
    nombreCategoria?: string;
    descripcion?: string;
    estado?: number;
  }): Observable<Categoria[]> {
    let params = new HttpParams();

    if (filtros.nombreCategoria) {
      params = params.set('nombreCategoria', filtros.nombreCategoria);
    }
    if (filtros.descripcion) {
      params = params.set('descripcion', filtros.descripcion);
    }
    if (filtros.estado !== undefined) {
      params = params.set('estado', filtros.estado.toString());
    }

    return this.http.get<Categoria[]>(`${this.apiUrl}/filtros`, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categorías para select/dropdown
   */
  obtenerParaSelect(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/select`)
      .pipe(catchError(this.handleError));
  }

  // ==================== CAMBIOS DE ESTADO ====================

  /**
   * Activar categoría
   */
  activar(id: number): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}/activar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Desactivar categoría
   */
  desactivar(id: number): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}/desactivar`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Cambiar estado de categoría
   */
  cambiarEstado(id: number, nuevoEstado: number): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.apiUrl}/${id}/estado/${nuevoEstado}`, {})
      .pipe(catchError(this.handleError));
  }

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  /**
   * Obtener estadísticas de categorías
   */
  obtenerEstadisticas(): Observable<EstadisticasCategoria> {
    return this.http.get<EstadisticasCategoria>(`${this.apiUrl}/estadisticas`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categorías con artículos
   */
  obtenerConArticulos(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/con-articulos`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener categorías sin artículos
   */
  obtenerSinArticulos(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/sin-articulos`)
      .pipe(catchError(this.handleError));
  }

  // ==================== VALIDACIONES ====================

  /**
   * Validar si existe una categoría por nombre
   */
  validarNombre(nombre: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/validar/nombre/${nombre}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar si se puede eliminar una categoría
   */
  puedeEliminar(id: number): Observable<{ puedeEliminar: boolean }> {
    return this.http.get<{ puedeEliminar: boolean }>(`${this.apiUrl}/${id}/puede-eliminar`)
      .pipe(catchError(this.handleError));
  }

  // ==================== OPERACIONES DE NEGOCIO ====================

  /**
   * Crear categoría rápida
   */
  crearRapida(nombreCategoria: string, descripcion?: string): Observable<ApiResponse<Categoria>> {
    const params = new HttpParams()
      .set('nombreCategoria', nombreCategoria)
      .set('descripcion', descripcion || '');

    return this.http.post<ApiResponse<Categoria>>(`${this.apiUrl}/rapida`, {}, { params })
      .pipe(catchError(this.handleError));
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Verificar si una categoría está activa
   */
  estaActiva(categoria: Categoria): boolean {
    return categoria.estado === 1;
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
}
