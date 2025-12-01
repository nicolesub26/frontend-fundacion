import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Proveedor {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

export interface ApiError {
  message: string;
  error: string;
  status: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private baseUrl = `http://localhost:9090/api/proveedores`;

  constructor(private http: HttpClient) {}

  // ✅ Añadir token a las cabeceras
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ✅ Manejo de errores con estructura común
  private handleError(error: HttpErrorResponse): Observable<never> {
    let apiError: ApiError = {
      message: 'Error desconocido',
      error: 'UNKNOWN_ERROR',
      status: error.status
    };

    if (error.error instanceof ErrorEvent) {
      apiError.message = `Error: ${error.error.message}`;
    } else {
      if (error.error && typeof error.error === 'object') {
        apiError.message = error.error.message || `Código de estado: ${error.status}`;
        apiError.error = error.error.error || 'ERROR_SERVIDOR';
      } else {
        apiError.message = `Código de estado: ${error.status}`;
      }
    }

    return throwError(() => apiError);
  }

  // Obtener todos los proveedores
  getAllProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.baseUrl, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Obtener proveedor por ID
  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Buscar proveedor por nombre
  searchProveedores(nombre: string): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.baseUrl}/search?nombre=${nombre}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Crear proveedor
  createProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.baseUrl, proveedor, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Actualizar proveedor
  updateProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.baseUrl}/${id}`, proveedor, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }

  // Eliminar proveedor
  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError));
  }
}
