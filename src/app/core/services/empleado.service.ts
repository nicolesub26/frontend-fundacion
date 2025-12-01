// Servicio para gestión de empleados
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../layout/service/auth.service';

export interface Empleado {
  id?: number;
  nombre: string;
  apellido: string;
  ci: string;
  correo: string;
  cargo: string;
  turno: string;
  telefono: string;
  fechaInicio?: string;
  estado?: number;
}

export interface EmpleadoResponse {
  mensaje: string;
  empleado: Empleado;
  login?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {
  private apiUrl = 'http://localhost:9090/api/empleados';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', token.startsWith('Bearer ') ? token : `Bearer ${token}`);
    }
    headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  // Obtener todos los empleados
  getEmpleados(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  // Obtener empleado por ID
  getEmpleadoById(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Crear empleado
  createEmpleado(empleado: Empleado, password: string = '123456'): Observable<EmpleadoResponse> {
    const params = new HttpParams().set('password', password);
    return this.http.post<EmpleadoResponse>(this.apiUrl, empleado, { headers: this.getHeaders(), params });
  }

  // Actualizar empleado
  updateEmpleado(id: number, empleado: Empleado): Observable<EmpleadoResponse> {
    return this.http.put<EmpleadoResponse>(`${this.apiUrl}/${id}`, empleado, { headers: this.getHeaders() });
  }

  // Eliminar empleado
  deleteEmpleado(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // Obtener empleados activos
  getEmpleadosActivos(): Observable<Empleado[]> {
    return this.http.get<Empleado[]>(`${this.apiUrl}/activos`, { headers: this.getHeaders() });
  }

  // Buscar empleados con filtros
  buscarEmpleados(filtros: any): Observable<Empleado[]> {
    let params = new HttpParams();

    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.set(key, filtros[key]);
      }
    });

    return this.http.get<Empleado[]>(`${this.apiUrl}/filtros`, { headers: this.getHeaders(), params });
  }

  // Activar empleado
  activarEmpleado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activar`, {}, { headers: this.getHeaders() });
  }

  // Desactivar empleado
  desactivarEmpleado(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {}, { headers: this.getHeaders() });
  }

  // Obtener estadísticas
  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`, { headers: this.getHeaders() });
  }

  // Validar CI
  validarCi(ci: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/validar/ci/${ci}`, { headers: this.getHeaders() });
  }

  // Validar correo
  validarCorreo(correo: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/validar/correo/${correo}`, { headers: this.getHeaders() });
  }

  // Validar teléfono
  validarTelefono(telefono: string): Observable<{ existe: boolean }> {
    return this.http.get<{ existe: boolean }>(`${this.apiUrl}/validar/telefono/${telefono}`, { headers: this.getHeaders() });
  }
}