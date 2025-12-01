import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AsignacionService } from '../../../core/services/asignacion.service';
import { MenuService } from '../../../core/services/menu.service';
import { Rol, RoleService } from '../../../core/services/role.service';
import { Menu } from '../../../layout/service/auth.service';

interface RolConMenus extends Rol {
  menus?: Menu[];
}

@Component({
  selector: 'app-rol-menu',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rol-menu.component.html',
  styleUrl: './rol-menu.component.css'
})
export class RolMenuComponent implements OnInit {
  roles: Rol[] = [];
  menusDisponibles: Menu[] = [];
  rolSeleccionado: Rol | null = null;
  menusDelRol: Menu[] = [];
  cargando = false;
  busqueda = '';
  filtroEstado: string = 'todos';

  // --- Propiedades para crear/editar rol ---
  showFormModal = false;
  isEditMode = false; // false = crear, true = editar
  formRol: Partial<Rol> = {
    nombre: '',
    descripcion: '',
    estado: 1
  };

  constructor(
    private roleService: RoleService,
    private menuService: MenuService,
    private asignacionService: AsignacionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar roles
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar roles:', error);
        this.mostrarError('Error al cargar roles');
        this.cargando = false;
      }
    });

    // Cargar menús disponibles
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        this.menusDisponibles = menus.filter(m => m.estado === 1);
      },
      error: (error) => {
        console.error('Error al cargar menús:', error);
      }
    });
  }

  get rolesFiltrados(): Rol[] {
    let resultado = this.roles;

    // Filtrar por búsqueda
    if (this.busqueda) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(r => 
        r.nombre.toLowerCase().includes(busquedaLower) ||
        (r.descripcion && r.descripcion.toLowerCase().includes(busquedaLower))
      );
    }

    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      const estado = this.filtroEstado === 'activos' ? 1 : 0;
      resultado = resultado.filter(r => r.estado === estado);
    }

    return resultado;
  }

  seleccionarRol(rol: Rol): void {
    this.rolSeleccionado = rol;
    this.cargando = true;

    // Cargar menús del rol
    this.menuService.getMenusByRole(rol.idRol).subscribe({
      next: (menus) => {
        this.menusDelRol = menus;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error al cargar menús del rol:', error);
        this.mostrarError('Error al cargar menús del rol');
        this.cargando = false;
      }
    });
  }

  tieneMenu(menuId: number): boolean {
    return this.menusDelRol.some(m => m.idMenu === menuId);
  }

  async asignarMenu(menuId: number): Promise<void> {
    if (!this.rolSeleccionado) return;

    const menu = this.menusDisponibles.find(m => m.idMenu === menuId);
    if (!menu) return;

    const result = await Swal.fire({
      title: '¿Asignar menú?',
      html: `¿Deseas asignar el menú <strong>${menu.nombre}</strong> al rol <strong>${this.rolSeleccionado.nombre}</strong>?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0ea5e9',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      
      this.asignacionService.asignarMenuARol(this.rolSeleccionado.idRol, menuId).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Menú asignado correctamente',
            icon: 'success',
            confirmButtonColor: '#0ea5e9',
            timer: 2000
          });
          if (this.rolSeleccionado) {
            this.seleccionarRol(this.rolSeleccionado);
          }
        },
        error: (error) => {
          console.error('Error al asignar menú:', error);
          this.mostrarError('Error al asignar menú');
          this.cargando = false;
        }
      });
    }
  }

  async desasignarMenu(menuId: number): Promise<void> {
    if (!this.rolSeleccionado) return;

    const menu = this.menusDelRol.find(m => m.idMenu === menuId);
    if (!menu) return;

    const result = await Swal.fire({
      title: '¿Desasignar menú?',
      html: `¿Deseas quitar el menú <strong>${menu.nombre}</strong> del rol <strong>${this.rolSeleccionado.nombre}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, desasignar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.cargando = true;
      
      this.asignacionService.desasignarMenuDeRol(this.rolSeleccionado.idRol, menuId).subscribe({
        next: () => {
          Swal.fire({
            title: '¡Éxito!',
            text: 'Menú desasignado correctamente',
            icon: 'success',
            confirmButtonColor: '#0ea5e9',
            timer: 2000
          });
          if (this.rolSeleccionado) {
            this.seleccionarRol(this.rolSeleccionado);
          }
        },
        error: (error) => {
          console.error('Error al desasignar menú:', error);
          this.mostrarError('Error al desasignar menú');
          this.cargando = false;
        }
      });
    }
  }

  // ---------------- Crear / Editar rol ----------------
  abrirCrearRol(): void {
    this.isEditMode = false;
    this.formRol = { nombre: '', descripcion: '', estado: 1 };
    this.showFormModal = true;
  }

  abrirEditarRol(rol: Rol): void {
    this.isEditMode = true;
    // Copiar valores para evitar mutar directamente
    this.formRol = { idRol: rol.idRol, nombre: rol.nombre, descripcion: rol.descripcion, estado: rol.estado };
    this.showFormModal = true;
  }

  cerrarForm(): void {
    this.showFormModal = false;
    this.formRol = { nombre: '', descripcion: '', estado: 1 };
  }

  guardarRol(): void {
    // Validaciones mínimas
    if (!this.formRol.nombre || this.formRol.nombre.trim().length === 0) {
      this.mostrarError('El nombre del rol es requerido');
      return;
    }

    this.cargando = true;

    if (this.isEditMode && this.formRol.idRol != null) {
      const id = this.formRol.idRol;
      const payload: Rol = {
        idRol: id,
        nombre: this.formRol.nombre!.trim(),
        descripcion: this.formRol.descripcion || '',
        estado: this.formRol.estado ?? 1
      };

      this.roleService.updateRol(id, payload).subscribe({
        next: (updated) => {
          Swal.fire({ title: '¡Éxito!', text: 'Rol actualizado correctamente', icon: 'success', timer: 1800, confirmButtonColor: '#0ea5e9' });
          this.cargarDatos();
          this.cerrarForm();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al actualizar rol:', error);
          this.mostrarError('Error al actualizar rol');
          this.cargando = false;
        }
      });

    } else {
      // Crear
      const payload: Rol = {
        idRol: 0, // backend debe ignorar/crear
        nombre: this.formRol.nombre!.trim(),
        descripcion: this.formRol.descripcion || '',
        estado: this.formRol.estado ?? 1
      };

      this.roleService.createRol(payload).subscribe({
        next: (created) => {
          Swal.fire({ title: '¡Éxito!', text: 'Rol creado correctamente', icon: 'success', timer: 1800, confirmButtonColor: '#0ea5e9' });
          this.cargarDatos();
          this.cerrarForm();
          this.cargando = false;
        },
        error: (error) => {
          console.error('Error al crear rol:', error);
          this.mostrarError('Error al crear rol');
          this.cargando = false;
        }
      });
    }
  }

  // ---------------- Helpers ----------------
  getEstadoBadge(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  getEstadoClass(estado: number): string {
    return estado === 1 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  }

  cerrarModal(): void {
    this.rolSeleccionado = null;
    this.menusDelRol = [];
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

