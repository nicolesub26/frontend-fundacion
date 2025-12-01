import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService, Role, UserResponse } from '../../service/auth.service';
import { SidebarService } from '../../service/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {
  // Estados del componente
  showDropdown = false;
  showLoginModal = false;
  showRoleModal = false;
  
  // Formulario y datos
  loginForm!: FormGroup;
  availableRoles: Role[] = [];
  
  // Observables
  currentUser$!: Observable<UserResponse | null>;
  currentRole$!: Observable<Role | null>;
  currentMenus$!: Observable<any[]>;
  
  // Estados para manejo de errores y carga
  isLoading = false;
  errorMessage = '';
  showError = false;
  
  // Para la gestión de suscripciones
  private destroy$ = new Subject<void>();

  constructor(
    public sidebarService: SidebarService,
    public authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.initializeObservables();
    this.setupSubscriptions();
    this.loadAvailableRoles(); // Cargar roles disponibles al iniciar
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== INICIALIZACIÓN ====================

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.email
      ]],
      password: ['', [
        Validators.required, 
        Validators.minLength(3)
      ]]
    });
  }

  private initializeObservables(): void {
    this.currentUser$ = this.authService.getCurrentUser();
    this.currentRole$ = this.authService.getCurrentRole();
    this.currentMenus$ = this.authService.getCurrentMenus();
  }

  private setupSubscriptions(): void {
    // Suscribirse a cambios de usuario
    this.currentUser$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(user => {
      if (user) {
        console.log('Usuario actualizado en header:', user);
        
        // Actualizar roles disponibles cuando cambia el usuario
        this.loadAvailableRoles();
        
        // Si hay múltiples roles y no se ha seleccionado uno, mostrar modal
        if (user.roles && user.roles.length > 1 && !this.authService.getCurrentRoleValue()) {
          this.showRoleModal = true;
        }
      } else {
        // Si no hay usuario, limpiar roles disponibles
        this.availableRoles = [];
      }
    });

    // Suscribirse a cambios de rol
    this.currentRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(role => {
      if (role) {
        console.log('Rol actualizado en header:', role);
        this.showRoleModal = false;
      }
    });
  }

  // ==================== MANEJO DE ROLES ====================

  /**
   * Cargar los roles disponibles del usuario actual
   */
  private loadAvailableRoles(): void {
    const user = this.currentUserValue;
    if (user && user.roles && user.roles.length > 0) {
      this.availableRoles = [...user.roles]; // Hacer una copia para evitar referencias
      console.log('Roles disponibles cargados:', this.availableRoles);
    } else {
      this.availableRoles = [];
    }
  }

  /**
   * Verificar si el usuario tiene múltiples roles
   */
  hasMultipleRoles(): boolean {
    return this.availableRoles.length > 1;
  }

  /**
   * Obtener el nombre del rol actual
   */
  getCurrentRoleName(): string {
    const role = this.currentRoleValue;
    return role ? role.nombre : 'Sin rol';
  }

  // ==================== GETTERS ====================

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get currentUserValue(): UserResponse | null {
    return this.authService.getCurrentUserValue();
  }

  get currentRoleValue(): Role | null {
    return this.authService.getCurrentRoleValue();
  }

  // ==================== MANEJO DE MODALES ====================

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  toggleLoginModal(): void {
    this.showLoginModal = !this.showLoginModal;
    if (!this.showLoginModal) {
      this.resetLoginForm();
    }
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  openRoleModal(): void {
    const user = this.currentUserValue;
    if (user && user.roles && user.roles.length > 1) {
      // Recargar roles disponibles antes de abrir el modal
      this.loadAvailableRoles();
      this.showRoleModal = true;
      this.showDropdown = false;
      console.log('Modal de roles abierto. Roles disponibles:', this.availableRoles);
    } else if (user && user.roles && user.roles.length === 1) {
      // Si solo hay un rol, mostrar mensaje
      this.showErrorMessage('Solo tienes un rol asignado');
    } else {
      this.showErrorMessage('No tienes roles disponibles');
    }
  }

  closeRoleModal(): void {
    this.showRoleModal = false;
    // NO limpiar availableRoles aquí para mantenerlos disponibles
  }

  // ==================== AUTENTICACIÓN ====================

  handleLogin(): void {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.clearError();
    
    const { username, password } = this.loginForm.value;
    
    console.log('Intentando login con:', { username, password: '***' });
    
    this.authService.login(username, password).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
        this.handleLoginSuccess(response);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.handleLoginError(error);
      }
    });
  }

  private handleLoginSuccess(response: UserResponse): void {
    this.isLoading = false;
    this.showLoginModal = false;
    this.resetLoginForm();
    
    // Mostrar mensaje de éxito
    this.showSuccessMessage(response.mensaje || 'Login exitoso');
    
    // Cargar roles disponibles
    this.loadAvailableRoles();
    
    // Manejar roles
    if (response.roles && response.roles.length > 1) {
      console.log('Múltiples roles detectados, esperando selección');
    } else if (response.roles && response.roles.length === 1) {
      console.log('Rol único establecido automáticamente');
      this.navigateToMain();
    }
  }

  private handleLoginError(error: any): void {
    this.isLoading = false;
    
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.status === 0) {
      errorMessage = 'No se puede conectar al servidor';
    }
    
    this.showErrorMessage(errorMessage);
  }

  selectRole(role: Role): void {
    console.log('Rol seleccionado:', role);
    this.authService.setCurrentRole(role);
    this.closeRoleModal();
    
    // Redirigir después de seleccionar rol
    this.navigateToMain();
  }

  logout(): void {
    console.log('Cerrando sesión...');
    this.authService.logout();
    this.availableRoles = []; // Limpiar roles al cerrar sesión
    this.closeDropdown();
    
    // Redirigir a la página de inicio
    this.router.navigate(['/home']);
    
    this.showSuccessMessage('Sesión cerrada correctamente');
  }

  // ==================== NAVEGACIÓN ====================

    private navigateToMain(): void {
    // Aquí puedes definir la lógica de navegación según el rol
    const role = this.currentRoleValue;
    
    if (role) {
      switch (role.nombre) {
        case 'ADMIN':
          this.router.navigate(['/dashboard']);
          break;
        case 'COORDINADOR':
          this.router.navigate(['/home']);
          break;
        case 'BENEFICIARIO':
          this.router.navigate(['/donacion']);
          break;
        case 'VOLUNTARIO':
          this.router.navigate(['/home']);
          break;
        default:
          this.router.navigate(['/dashboard']);
      }
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // ==================== VALIDACIONES DEL FORMULARIO ====================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${fieldName === 'username' ? 'Usuario' : 'Contraseña'} es requerido`;
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `Mínimo ${minLength} caracteres`;
      }
      if (field.errors['email']) {
        return 'Email no válido';
      }
    }
    return '';
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private resetLoginForm(): void {
    this.loginForm.reset();
    this.clearError();
  }

  // ==================== MANEJO DE MENSAJES ====================

  private showSuccessMessage(message: string): void {
    // Implementa tu lógica de notificación de éxito aquí
    console.log('Éxito:', message);
    // Puedes usar un servicio de notificaciones tipo toast
  }

  private showErrorMessage(message: string): void {
    this.errorMessage = message;
    this.showError = true;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.clearError();
    }, 5000);
  }

  private clearError(): void {
    this.errorMessage = '';
    this.showError = false;
  }

  // ==================== MÉTODOS AUXILIARES ====================

  /**
   * Toggle del sidebar
   */
  toggleSidebar(): void {
    // Si tu SidebarService tiene un método diferente, ajústalo aquí
    // Por ejemplo: this.sidebarService.toggle();
    // O usa la propiedad directamente si existe
    if (typeof (this.sidebarService as any).toggle === 'function') {
      (this.sidebarService as any).toggle();
    } else if (typeof (this.sidebarService as any).toggleSidebar === 'function') {
      (this.sidebarService as any).toggleSidebar();
    } else {
      // Si no tiene método, intenta cambiar una propiedad
      console.log('Toggle sidebar');
    }
  }

  /**
   * Obtener la inicial del usuario de forma segura
   */
  getUserInitial(): string {
    const login = this.currentUserValue?.login;
    if (login && login.length > 0) {
      return login.charAt(0).toUpperCase();
    }
    return 'U'; // Default si no hay login
  }

  /**
   * Verificar si un rol está actualmente seleccionado
   */
  isRoleSelected(role: Role): boolean {
    const currentRole = this.currentRoleValue;
    return currentRole ? currentRole.idRol === role.idRol : false;
  }

  /**
   * Obtener clase CSS para el rol según su estado
   */
  getRoleClass(role: Role): string {
    return this.isRoleSelected(role) ? 'selected' : '';
  }
}