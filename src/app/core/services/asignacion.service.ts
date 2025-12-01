
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AsignacionService {
  private apiUrl = 'http://localhost:9090/api/asignaciones';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `${token}` });
  }

  // ===== GESTIÓN USUARIO-ROL =====

  // Asignar rol a usuario
  asignarRolAUsuario(login: string, rolId: number): Observable<any> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('login', login)
      .set('rolId', rolId.toString());
    
    return this.http.post(`${this.apiUrl}/usuario-rol`, null, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  // Desasignar rol de usuario
  desasignarRolDeUsuario(login: string, rolId: number): Observable<any> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('login', login)
      .set('rolId', rolId.toString());
    
    return this.http.delete(`${this.apiUrl}/usuario-rol`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener roles de un usuario
  getRolesDeUsuario(login: string): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/usuario/${login}/roles`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ===== GESTIÓN ROL-MENÚ =====

  // Asignar menú a rol
  asignarMenuARol(rolId: number, menuId: number): Observable<any> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('rolId', rolId.toString())
      .set('menuId', menuId.toString());
    
    return this.http.post(`${this.apiUrl}/rol-menu`, null, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  // Desasignar menú de rol
  desasignarMenuDeRol(rolId: number, menuId: number): Observable<any> {
    const headers = this.getHeaders();
    const params = new HttpParams()
      .set('rolId', rolId.toString())
      .set('menuId', menuId.toString());
    
    return this.http.delete(`${this.apiUrl}/rol-menu`, { headers, params }).pipe(
      catchError(this.handleError)
    );
  }

  // Listar usuarios
  listarUsuarios(): Observable<any[]> {
    const headers = this.getHeaders();
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en AsignacionService:', error);
    return throwError(() => error);
  }
}