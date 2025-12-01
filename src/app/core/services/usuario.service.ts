import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Role } from '../../layout/service/auth.service';

export interface Usuario {
  login: string;
  estado: number;
  roles?: Role[];
}

export interface UsuarioConRoles {
  login: string;
  estado: number;
  roles: {
    idRol: number;
    nombre: string;
    descripcion?: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = 'http://localhost:9090/api/usuarios';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `${token}` });
  }

  // Obtener todos los usuarios con sus roles
  getUsuariosConRoles(): Observable<UsuarioConRoles[]> {
    const headers = this.getHeaders();
    return this.http.get<UsuarioConRoles[]>(`${this.apiUrl}/with-roles`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener usuario por login
  getUsuarioPorLogin(login: string): Observable<Usuario> {
    const headers = this.getHeaders();
    return this.http.get<Usuario>(`http://localhost:9090/usuarios/${login}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Activar usuario
  activarUsuario(login: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${login}/activar`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Desactivar usuario
  desactivarUsuario(login: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(`${this.apiUrl}/${login}/desactivar`, {}, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Cambiar contraseña
  cambiarPassword(login: string, nuevaPassword: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.put(
      `http://localhost:9090/api/gestion-usuarios/cambiar-password`,
      null,
      { 
        headers, 
        params: { login, nuevaPassword } 
      }
    ).pipe(catchError(this.handleError));
  }

  // Obtener estadísticas de usuarios
  getEstadisticas(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get(`${this.apiUrl}/stats`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en UsuarioService:', error);
    return throwError(() => error);
  }
}