import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

// Servicio para gestión de clientes
export interface Cliente {
  id?: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  nit: string;
  fechaRegistro?: string;
  estado?: number;
}

export interface ClienteResponse {
  mensaje: string;
  cliente: Cliente;
  login?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:9090/api/clientes';

  constructor(private http: HttpClient) {}

  // Obtener todos los clientes
  getClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.apiUrl);
  }

  // Obtener cliente por ID
  getClienteById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  // Crear cliente
  createCliente(cliente: Cliente, password: string = '123456'): Observable<ClienteResponse> {
    const params = new HttpParams().set('password', password);
    return this.http.post<ClienteResponse>(this.apiUrl, cliente, { params });
  }

  // Actualizar cliente
  updateCliente(id: number, cliente: Cliente): Observable<ClienteResponse> {
    return this.http.put<ClienteResponse>(`${this.apiUrl}/${id}`, cliente);
  }

  // Eliminar cliente
  deleteCliente(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Obtener clientes activos
  getClientesActivos(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/activos`);
  }

  // Buscar clientes con filtros
  buscarClientes(filtros: any): Observable<Cliente[]> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      if (filtros[key] !== null && filtros[key] !== undefined && filtros[key] !== '') {
        params = params.set(key, filtros[key]);
      }
    });

    return this.http.get<Cliente[]>(`${this.apiUrl}/filtros`, { params });
  }

  // Activar cliente
  activarCliente(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/activar`, {});
  }

  // Desactivar cliente
  desactivarCliente(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/desactivar`, {});
  }

  // Recuperar cliente
  recuperarCliente(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/recuperar`, {});
  }

  // Obtener estadísticas
  getEstadisticas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }

  // Reporte por fecha
  getReportePorFecha(fechaInicio: string, fechaFin: string): Observable<Cliente[]> {
    const params = new HttpParams()
      .set('fechaInicio', fechaInicio)
      .set('fechaFin', fechaFin);
    
    return this.http.get<Cliente[]>(`${this.apiUrl}/reporte/fecha-registro`, { params });
  }

  // Validar email
  validarEmail(email: string): Observable<{existe: boolean}> {
    return this.http.get<{existe: boolean}>(`${this.apiUrl}/validar/email/${email}`);
  }

  // Validar NIT
  validarNit(nit: string): Observable<{existe: boolean}> {
    return this.http.get<{existe: boolean}>(`${this.apiUrl}/validar/nit/${nit}`);
  }

  // Validar teléfono
  validarTelefono(telefono: string): Observable<{existe: boolean}> {
    return this.http.get<{existe: boolean}>(`${this.apiUrl}/validar/telefono/${telefono}`);
  }
}