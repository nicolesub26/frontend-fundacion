import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

// ==================== INTERFACES ====================

export interface LoginCredentials {
  login: string;
  password: string; // Cambiado de 'passwd' a 'password' para mayor claridad
}

export interface Role {
  idRol: number;
  nombre: string;
  descripcion?: string;
  estado?: number;
}

export interface Menu {
  idMenu: number;
  nombre: string;
  direccion: string;
  estado: number;
}

export interface UserResponse {
  login: string;
  token: string;
  estado: number;
  roles: Role[];
  mensaje?: string;
}

export interface User {
  login: string;
  token: string;
  estado: number;
}

// Interfaces adicionales para las nuevas funcionalidades
export interface PasswordChangeRequest {
  login: string;
  nuevaPassword: string;
}

export interface RoleAssignmentRequest {
  login: string;
  rolId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:9090/api';
  
  // BehaviorSubjects para manejar el estado
  private currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  private currentRoleSubject = new BehaviorSubject<Role | null>(null);
  private currentMenusSubject = new BehaviorSubject<Menu[]>([]);
  
  constructor(private http: HttpClient) {
    this.initializeFromStorage();
  }

  // ==================== INICIALIZACIÓN ====================

  private initializeFromStorage(): void {
    try {
      const storedUser = localStorage.getItem('currentUser');
      const storedRole = localStorage.getItem('currentRole');
      const storedMenus = localStorage.getItem('currentMenus');
      
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
        console.log('Usuario cargado desde localStorage:', user);
        
        if (storedRole) {
          const role = JSON.parse(storedRole);
          this.currentRoleSubject.next(role);
          console.log('Rol cargado desde localStorage:', role);
        }
        
        if (storedMenus) {
          const menus = JSON.parse(storedMenus);
          this.currentMenusSubject.next(menus);
          console.log('Menús cargados desde localStorage:', menus);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos desde localStorage:', error);
      this.clearStorage();
    }
  }

  // ==================== AUTENTICACIÓN ====================

  /**
   * Login mejorado que funciona con el nuevo controlador
   */
  login(username: string, password: string): Observable<UserResponse> {
    const loginData: LoginCredentials = {
      login: username,
      password: password
    };

    console.log('Enviando request de login:', { login: username, password: '***' });

    return this.http.post<UserResponse>(`${this.apiUrl}/login`, loginData).pipe(
      tap(response => {
        console.log('Respuesta del servidor:', response);
        
        // Guardar datos en localStorage
        localStorage.setItem('currentUser', JSON.stringify(response));
        localStorage.setItem('token', response.token);
        
        // Actualizar BehaviorSubjects
        this.currentUserSubject.next(response);
        
        // Si solo hay un rol, seleccionarlo automáticamente
        if (response.roles && response.roles.length === 1) {
          console.log('Estableciendo rol único automáticamente:', response.roles[0]);
          this.setCurrentRole(response.roles[0]);
        } else if (response.roles && response.roles.length > 1) {
          console.log('Múltiples roles disponibles:', response.roles);
        }
      }),
      catchError(error => {
        console.error('Error durante el login:', error);
        
        // Manejar diferentes tipos de errores
        let errorMessage = 'Error al iniciar sesión';
        
        if (error.status === 401) {
          errorMessage = 'Credenciales inválidas';
        } else if (error.status === 403) {
          errorMessage = 'Usuario inactivo';
        } else if (error.status === 500) {
          errorMessage = 'Error interno del servidor';
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        }
        
        return throwError(() => ({ ...error, message: errorMessage }));
      })
    );
  }

  /**
   * Login alternativo para mantener compatibilidad (usando parámetros)
   */
  loginLegacy(username: string, password: string): Observable<UserResponse> {
    const params = new HttpParams()
      .set('login', username)
      .set('passwd', password);

    return this.http.post<UserResponse>(`${this.apiUrl}/login-legacy`, null, { params }).pipe(
      tap(response => {
        this.handleLoginSuccess(response);
      }),
      catchError(error => {
        console.error('Error during legacy login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout mejorado
   */
  logout(): void {
    console.log('Cerrando sesión...');
    
    // Limpiar localStorage
    this.clearStorage();
    
    // Limpiar BehaviorSubjects
    this.currentUserSubject.next(null);
    this.currentRoleSubject.next(null);
    this.currentMenusSubject.next([]);
    
    console.log('Sesión cerrada correctamente');
  }

  // ==================== GESTIÓN DE ROLES ====================

  /**
   * Establecer rol actual y cargar menús
   */
  setCurrentRole(role: Role): void {
    console.log('Estableciendo rol actual:', role);
    
    localStorage.setItem('currentRole', JSON.stringify(role));
    this.currentRoleSubject.next(role);
    
    // Obtener los menús para el rol seleccionado
    this.fetchMenusByRole(role.idRol).subscribe({
      next: (menus) => {
        console.log('Menús obtenidos para el rol:', menus);
        localStorage.setItem('currentMenus', JSON.stringify(menus));
        this.currentMenusSubject.next(menus);
      },
      error: (error) => {
        console.error('Error al obtener menús:', error);
        // En caso de error, limpiar menús
        this.currentMenusSubject.next([]);
      }
    });
  }

  /**
   * Obtener menús por rol
   */
  private fetchMenusByRole(rolId: number): Observable<Menu[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<Menu[]>(`${this.apiUrl}/menus/role/${rolId}`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener menús por rol:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener menús por usuario (todos los menús de todos sus roles)
   */
  fetchMenusByUser(login: string): Observable<Menu[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<Menu[]>(`${this.apiUrl}/menus/usuario/${login}`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener menús por usuario:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GESTIÓN DE USUARIOS ====================

  /**
   * Obtener usuarios con roles
   */
  getUsersWithRoles(): Observable<any[]> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any[]>(`${this.apiUrl}/usuarios/with-roles`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener usuarios con roles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  getUserStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.get<any>(`${this.apiUrl}/usuarios/stats`, { headers }).pipe(
      catchError(error => {
        console.error('Error al obtener estadísticas:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Activar usuario
   */
  activateUser(login: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/usuarios/${login}/activar`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error al activar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Desactivar usuario
   */
  deactivateUser(login: string): Observable<any> {
    const headers = this.getAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/usuarios/${login}/desactivar`, {}, { headers }).pipe(
      catchError(error => {
        console.error('Error al desactivar usuario:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cambiar contraseña
   */
  changePassword(login: string, newPassword: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('login', login)
      .set('nuevaPassword', newPassword);
    
    return this.http.put<any>(`${this.apiUrl}/gestion-usuarios/cambiar-password`, {}, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al cambiar contraseña:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Asignar rol a usuario
   */
  assignRole(login: string, rolId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('login', login)
      .set('rolId', rolId.toString());
    
    return this.http.post<any>(`${this.apiUrl}/gestion-usuarios/asignar-rol`, {}, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al asignar rol:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Remover rol de usuario
   */
  removeRole(login: string, rolId: number): Observable<any> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('login', login)
      .set('rolId', rolId.toString());
    
    return this.http.delete<any>(`${this.apiUrl}/gestion-usuarios/remover-rol`, { headers, params }).pipe(
      catchError(error => {
        console.error('Error al remover rol:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== GETTERS Y OBSERVABLES ====================

  getCurrentUser(): Observable<UserResponse | null> {
    return this.currentUserSubject.asObservable();
  }

  getCurrentRole(): Observable<Role | null> {
    return this.currentRoleSubject.asObservable();
  }

  getCurrentMenus(): Observable<Menu[]> {
    return this.currentMenusSubject.asObservable();
  }

  getCurrentUserValue(): UserResponse | null {
    return this.currentUserSubject.value;
  }

  getCurrentRoleValue(): Role | null {
    return this.currentRoleSubject.value;
  }

  getCurrentMenusValue(): Menu[] {
    return this.currentMenusSubject.value;
  }

  isLoggedIn(): boolean {
    const user = this.currentUserSubject.value;
    return !!(user && user.token);
  }

  getToken(): string | null {
    const user = this.currentUserSubject.value;
    const token = user?.token || localStorage.getItem('token');
    console.log('Token obtenido:', token ? 'Token presente' : 'No token');
    return token;
  }

  // ==================== VALIDACIONES ====================

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleName: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => role.nombre === roleName);
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roleNames: string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => roleNames.includes(role.nombre));
  }

  /**
   * Verificar si el usuario está activo
   */
  isUserActive(): boolean {
    const user = this.currentUserSubject.value;
    return !!(user && user.estado === 1);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Obtener headers de autorización
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      console.warn('No hay token disponible para la petición');
      return new HttpHeaders();
    }
    
    return new HttpHeaders({
      'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Manejar éxito del login
   */
  private handleLoginSuccess(response: UserResponse): void {
    console.log('Login exitoso:', response);
    
    localStorage.setItem('currentUser', JSON.stringify(response));
    localStorage.setItem('token', response.token);
    
    this.currentUserSubject.next(response);
    
    if (response.roles && response.roles.length === 1) {
      this.setCurrentRole(response.roles[0]);
    }
  }

  /**
   * Limpiar almacenamiento
   */
  private clearStorage(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentRole');
    localStorage.removeItem('currentMenus');
    localStorage.removeItem('token');
  }

  // ==================== MÉTODOS DE VALIDACIÓN DE CONECTIVIDAD ====================

  /**
   * Verificar conectividad con el servidor
   */
  checkServerHealth(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl.replace('/api', '')}/api/health`).pipe(
      catchError(error => {
        console.error('Error al verificar salud del servidor:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtener estado del sistema
   */
  getSystemStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl.replace('/api', '')}/api/status`).pipe(
      catchError(error => {
        console.error('Error al obtener estado del sistema:', error);
        return throwError(() => error);
      })
    );
  }

  // ==================== MÉTODOS DE DEBUGGING ====================

  /**
   * Log del estado actual del servicio
   */
  debugCurrentState(): void {
    console.log('=== Estado actual del AuthService ===');
    console.log('Usuario actual:', this.currentUserSubject.value);
    console.log('Rol actual:', this.currentRoleSubject.value);
    console.log('Menús actuales:', this.currentMenusSubject.value);
    console.log('Token:', this.getToken());
    console.log('Está logueado:', this.isLoggedIn());
    console.log('===================================');
  }
}