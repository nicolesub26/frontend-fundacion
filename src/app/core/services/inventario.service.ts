// inventario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiResponse, Articulo } from '../models/categoria.model'; // Ajusta si tu Articulo está en otro archivo

// ===== Modelos =====
export interface Inventario {
  idInventario: number;
  articulo: Articulo;
  cantidadDisponible: number;
  cantidadReservada: number;
  fechaActualizacion: string;   // ISO string
  ubicacion?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export type InventarioCreateDto = {
  articulo: { idArticulo: number };
  cantidadDisponible: number;
  cantidadReservada?: number;
  ubicacion?: string;
};

// DTO para PUT (backend espera solo esto)
export type InventarioUpdateDto = {
  ubicacion?: string;
};

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly apiUrl = `http://localhost:9090/api/inventarios`;
  private readonly articulosApiUrl = `http://localhost:9090/api/articulos`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError = (error: any) => {
    // Unifica mensajes del backend para el componente
    const message =
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      'Error en la petición de Inventario';
    // Propaga un objeto de error con un mensaje legible
    const propagated = { ...error, message };
    console.error('Error en InventarioService:', propagated);
    return throwError(() => propagated);
  };

  // ==================== CRUD ====================

  /**
   * Listar inventarios con filtros opcionales
   * filtros: { articuloId?: number; ubicacion?: string; conStock?: boolean }
   */
  listar(filtros?: {
    articuloId?: number;
    ubicacion?: string;
    conStock?: boolean;
  }): Observable<Inventario[]> {
    let params = new HttpParams();
    if (filtros?.articuloId != null) params = params.set('articuloId', String(filtros.articuloId));
    if (filtros?.ubicacion) params = params.set('ubicacion', filtros.ubicacion);
    if (typeof filtros?.conStock === 'boolean') params = params.set('conStock', String(filtros.conStock));

    return this.http.get<Inventario[]>(this.apiUrl, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener inventario por ID (id_inventario)
   */
  obtenerPorId(id: number): Observable<Inventario> {
    return this.http.get<Inventario>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Crear inventario (requiere articulo.idArticulo)
   */
  crear(dto: InventarioCreateDto): Observable<Inventario> {
    return this.http.post<Inventario>(this.apiUrl, dto, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualizar inventario (DTO de actualización, típico: { ubicacion })
   * Mantengo compatibilidad si envías Partial<Inventario> con solo la ubicación.
   */
  actualizar(id: number, cambios: Partial<Inventario> | InventarioUpdateDto): Observable<Inventario> {
    const body: InventarioUpdateDto = { ubicacion: (cambios as any).ubicacion };
    return this.http.put<Inventario>(`${this.apiUrl}/${id}`, body, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Atajo para actualizar solo ubicación
   */
  actualizarUbicacion(id: number, ubicacion: string): Observable<Inventario> {
    const body: InventarioUpdateDto = { ubicacion };
    return this.http.put<Inventario>(`${this.apiUrl}/${id}`, body, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  /**
   * Eliminar inventario (no permite si hay reservas > 0 en el backend)
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // ==================== BUSCAR POR ARTÍCULO ====================

  /**
   * Obtener inventario por ID de artículo (devuelve el primero o null si no existe)
   * Backend: GET /api/inventarios?articuloId=XXX
   */
  obtenerPorArticuloId(articuloId: number): Observable<Inventario | null> {
    const params = new HttpParams().set('articuloId', String(articuloId));
    return this.http.get<Inventario[]>(this.apiUrl, { headers: this.getHeaders(), params })
      .pipe(
        map(list => list.length ? list[0] : null),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener **artículo** y su **inventario** juntos (útil para una vista de detalle)
   */
  obtenerArticuloEInventario(articuloId: number): Observable<{ articulo: Articulo; inventario: Inventario | null }> {
    const articulo$ = this.http.get<Articulo>(`${this.articulosApiUrl}/${articuloId}`, { headers: this.getHeaders() })
      .pipe(catchError(err => this.handleError(err)));
    const inventario$ = this.obtenerPorArticuloId(articuloId).pipe(catchError(() => of(null)));

    return forkJoin({ articulo: articulo$, inventario: inventario$ });
  }

  // ==================== OPERACIONES DE STOCK ====================

  /**
   * Ajustar disponible (delta puede ser positivo o negativo)
   * PATCH /api/inventarios/{id}/ajustar-disponible?delta=NN
   */
  ajustarDisponible(id: number, delta: number): Observable<Inventario> {
    const params = new HttpParams().set('delta', String(delta));
    return this.http.patch<Inventario>(`${this.apiUrl}/${id}/ajustar-disponible`, {}, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Reservar unidades: disponible -> reservada
   * PATCH /api/inventarios/{id}/reservar?cantidad=NN
   */
  reservar(id: number, cantidad: number): Observable<Inventario> {
    const params = new HttpParams().set('cantidad', String(cantidad));
    return this.http.patch<Inventario>(`${this.apiUrl}/${id}/reservar`, {}, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Liberar reservas: reservada -> disponible
   * PATCH /api/inventarios/{id}/liberar?cantidad=NN
   */
  liberar(id: number, cantidad: number): Observable<Inventario> {
    const params = new HttpParams().set('cantidad', String(cantidad));
    return this.http.patch<Inventario>(`${this.apiUrl}/${id}/liberar`, {}, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Consumir reservas (para entregas): baja de “reservada”
   * PATCH /api/inventarios/{id}/consumir?cantidad=NN
   */
  consumir(id: number, cantidad: number): Observable<Inventario> {
    const params = new HttpParams().set('cantidad', String(cantidad));
    return this.http.patch<Inventario>(`${this.apiUrl}/${id}/consumir`, {}, { headers: this.getHeaders(), params })
      .pipe(catchError(this.handleError));
  }

  // ==================== HELPERS DE UI ====================

  /**
   * ¿Hay stock disponible?
   */
  hayStock(inv: Inventario | null | undefined): boolean {
    return !!inv && inv.cantidadDisponible > 0;
  }

  /**
   * Cantidad total (disponible + reservada)
   */
  cantidadTotal(inv: Inventario | null | undefined): number {
    if (!inv) return 0;
    return (inv.cantidadDisponible || 0) + (inv.cantidadReservada || 0);
  }
}
