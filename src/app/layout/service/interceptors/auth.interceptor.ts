import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // No agregar token a endpoints públicos
    const publicEndpoints = ['/api/login', '/api/health', '/api/status'];
    const isPublicEndpoint = publicEndpoints.some(endpoint => req.url.includes(endpoint));

    if (isPublicEndpoint) {
      return next.handle(req);
    }

    // Obtener token del servicio
    const token = this.authService.getToken();
    
    // Clonar la request y agregar el token si existe
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    }

    // Manejar la respuesta y errores
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('Error en interceptor:', error);

        // Si el token es inválido o expiró
        if (error.status === 401 || error.status === 403) {
          console.log('Token inválido o expirado, cerrando sesión');
          this.authService.logout();
          this.router.navigate(['/home']);
        }

        // Si hay error de conectividad
        if (error.status === 0) {
          console.error('Error de conectividad con el servidor');
        }

        return throwError(() => error);
      })
    );
  }
}
