
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion?: string;
  estado: number;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:9090/api/roles';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `${token}` });
  }

  // Obtener todos los roles
  getAllRoles(): Observable<Rol[]> {
    const headers = this.getHeaders();
    return this.http.get<Rol[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener rol por ID
  getRolById(id: number): Observable<Rol> {
    const headers = this.getHeaders();
    return this.http.get<Rol>(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Crear rol
  createRol(rol: Rol): Observable<Rol> {
    const headers = this.getHeaders();
    return this.http.post<Rol>(this.apiUrl, rol, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar rol
  updateRol(id: number, rol: Rol): Observable<Rol> {
    const headers = this.getHeaders();
    return this.http.put<Rol>(`${this.apiUrl}/${id}`, rol, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar rol
  deleteRol(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en RoleService:', error);
    return throwError(() => error);
  }
}
