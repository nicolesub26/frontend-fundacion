
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    // Verificar si está logueado
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
      return false;
    }

    // Obtener roles requeridos de la ruta
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Si no se especifican roles, permitir acceso
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const hasRequiredRole = this.authService.hasAnyRole(requiredRoles);
    
    if (!hasRequiredRole) {
      console.log('Usuario sin permisos suficientes');
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
