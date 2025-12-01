import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AsignacionService } from '../../../core/services/asignacion.service';
import { Rol, RoleService } from '../../../core/services/role.service';
import { UsuarioConRoles, UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-usuario-rol',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-rol.component.html',
  styleUrl: './usuario-rol.component.css'
})
export class UsuarioRolComponent implements OnInit {
  usuarios: UsuarioConRoles[] = [];
  rolesDisponibles: Rol[] = [];
  usuarioSeleccionado: UsuarioConRoles | null = null;
  rolesUsuario: any[] = [];
  cargando = false;
  busqueda = '';

  // Filtros
  filtroEstado: string = 'todos';

  constructor(
    private usuarioService: UsuarioService,
    private roleService: RoleService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    
    // Cargar usuarios con roles
    this.usuarioService.getUsuariosConRoles().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.mostrarError('Error al cargar usuarios');
        this.cargando = false;
      }
    });

    // Cargar roles disponibles
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.rolesDisponibles = roles.filter(r => r.estado === 1);
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
      }
    });
  }

  get usuariosFiltrados(): UsuarioConRoles[] {
    let resultado = this.usuarios;

    // Filtrar por búsqueda
    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(u => 
        u.login.toLowerCase().includes(busquedaLower)
      );
    }

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      const estado = this.filtroEstado === 'activos' ? 1 : 0;
      resultado = resultado.filter(u => u.estado === estado);
    }

    return resultado;
  }

  seleccionarUsuario(usuario: UsuarioConRoles): void {
    this.usuarioSeleccionado = usuario;
    this.rolesUsuario = [...usuario.roles];
  }

  tieneRol(rolId: number): boolean {
    if (!this.usuarioSeleccionado) return false;
    return this.usuarioSeleccionado.roles.some(r => r.idRol === rolId);
  }

  async asignarRol(rolId: number): Promise<void> {
    if (!this.usuarioSeleccionado) return;

    const rol = this.rolesDisponibles.find(r => r.idRol === rolId);
    if (!rol) return;

    const result = await Swal.fire({
      title: '¿Asignar rol?',
      html: `¿Deseas asignar el rol <strong>${rol.nombre}</strong> al usuario <strong>${this.usuarioSeleccionado.login}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      
      this.asignacionService.asignarRolAUsuario(this.usuarioSeleccionado.login, rolId).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Rol asignado correctamente',
            icon: 'success',
            confirmButtonColor: '#0ea5e9',
            timer: 2000
          });
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al asignar rol:', error);
          this.mostrarError('Error al asignar rol');
          this.cargando = false;
        }
      });
    }
  }

  async desasignarRol(rolId: number): Promise<void> {
    if (!this.usuarioSeleccionado) return;

    const rol = this.usuarioSeleccionado.roles.find(r => r.idRol === rolId);
    if (!rol) return;

    const result = await Swal.fire({
      title: '¿Desasignar rol?',
      html: `¿Deseas quitar el rol <strong>${rol.nombre}</strong> del usuario <strong>${this.usuarioSeleccionado.login}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      
      this.asignacionService.desasignarRolDeUsuario(this.usuarioSeleccionado.login, rolId).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Rol desasignado correctamente',
            icon: 'success',
            confirmButtonColor: '#0ea5e9',
            timer: 2000
          });
          this.cargarDatos();
        },
        error: (error) => {
          console.error('Error al desasignar rol:', error);
          this.mostrarError('Error al desasignar rol');
          this.cargando = false;
        }
      });
    }
  }

  getEstadoBadge(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClass(estado: number): string {
    return estado === 1 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  cerrarModal(): void {
    this.usuarioSeleccionado = null;
    this.rolesUsuario = [];
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonColor: '#0ea5e9'
    });
  }
}