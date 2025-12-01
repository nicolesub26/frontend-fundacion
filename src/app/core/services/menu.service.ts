
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Menu } from '../../layout/service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private apiUrl = 'http://localhost:9090/api/menus';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `${token}` });
  }

  // Obtener todos los menús
  getAllMenus(): Observable<Menu[]> {
    const headers = this.getHeaders();
    return this.http.get<Menu[]>(this.apiUrl, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener menús por rol
  getMenusByRole(rolId: number): Observable<Menu[]> {
    const headers = this.getHeaders();
    return this.http.get<Menu[]>(`http://localhost:9090/api/menus/role/${rolId}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Obtener menús por usuario
  getMenusByUser(login: string): Observable<Menu[]> {
    const headers = this.getHeaders();
    return this.http.get<Menu[]>(`http://localhost:9090/api/menus/usuario/${login}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Crear menú
  createMenu(menu: Menu): Observable<Menu> {
    const headers = this.getHeaders();
    return this.http.post<Menu>(this.apiUrl, menu, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Actualizar menú
  updateMenu(id: number, menu: Menu): Observable<Menu> {
    const headers = this.getHeaders();
    return this.http.put<Menu>(`${this.apiUrl}/${id}`, menu, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  // Eliminar menú
  deleteMenu(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/${id}`, { headers }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en MenuService:', error);
    return throwError(() => error);
  }
}