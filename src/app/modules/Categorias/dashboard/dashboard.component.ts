import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Articulo } from '../../../core/models/categoria.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Beneficiario, BeneficiarioService } from '../../../core/services/beneficiario.service';
import { Empleado, EmpleadoService } from '../../../core/services/empleado.service';
import { Voluntario, VoluntarioService } from '../../../core/services/voluntario.service';

// Importar servicios

interface DashboardStats {
  articulos: {
    total: number;
    activos: number;
    disponibles: number;
    sinStock: number;
  };
  empleados: {
    total: number;
    activos: number;
    porDepartamento: Map<string, number>;
  };
  beneficiarios: {
    total: number;
    activos: number;
    inactivos: number;
  };
  voluntarios: {
    total: number;
    activos: number;
    porDisponibilidad: Map<string, number>;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  error: string | null = null;

  // Datos del dashboard
  stats: DashboardStats = {
    articulos: { total: 0, activos: 0, disponibles: 0, sinStock: 0 },
    empleados: { total: 0, activos: 0, porDepartamento: new Map() },
    beneficiarios: { total: 0, activos: 0, inactivos: 0 },
    voluntarios: { total: 0, activos: 0, porDisponibilidad: new Map() }
  };

  // Datos recientes para mostrar
  articulosRecientes: Articulo[] = [];
  empleadosRecientes: Empleado[] = [];
  beneficiariosRecientes: Beneficiario[] = [];
  voluntariosRecientes: Voluntario[] = [];

  // Rutas de navegación
  routes = [
    { 
      path: '/empleados', 
      label: 'Empleados', 
      icon: 'users',
      color: 'cyan',
      count: 0 
    },
    { 
      path: '/voluntarios', 
      label: 'Voluntarios', 
      icon: 'heart',
      color: 'emerald',
      count: 0 
    },
    { 
      path: '/beneficiarios', 
      label: 'Beneficiarios', 
      icon: 'user-group',
      color: 'purple',
      count: 0 
    },
    { 
      path: '/articulos', 
      label: 'Artículos', 
      icon: 'cube',
      color: 'orange',
      count: 0 
    }
  ];

  constructor(
    private articuloService: ArticuloService,
    private empleadoService: EmpleadoService,
    private beneficiarioService: BeneficiarioService,
    private voluntarioService: VoluntarioService
  ) {}

  ngOnInit(): void {
    this.cargarDatosDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarDatosDashboard(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      // Estadísticas
      articuloStats: this.articuloService.obtenerEstadisticas(),
      empleadoStats: this.empleadoService.getEstadisticas(),
      beneficiarioStats: this.beneficiarioService.listar(),
      voluntarioStats: this.voluntarioService.estadisticas(),
      
      // Datos recientes
      articulos: this.articuloService.obtenerTodos(),
      empleados: this.empleadoService.getEmpleados(),
      beneficiarios: this.beneficiarioService.listar(),
      voluntarios: this.voluntarioService.listar()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        // Procesar estadísticas de artículos
        this.stats.articulos = {
          total: data.articuloStats.totalArticulos || 0,
          activos: data.articuloStats.articulosActivos || 0,
          disponibles: data.articuloStats.articulosActivos || 0,
          sinStock: data.articuloStats.articulosSinInventario || 0
        };

        // Procesar estadísticas de empleados
        this.stats.empleados = {
          total: data.empleadoStats.total || 0,
          activos: data.empleadoStats.activos || 0,
          porDepartamento: new Map()
        };

        // Procesar estadísticas de beneficiarios
        this.stats.beneficiarios = {
          total: data.beneficiarioStats.length || 0,
          activos: data.beneficiarioStats.length || 0,
          inactivos: data.beneficiarioStats.length || 0
        };

        // Procesar estadísticas de voluntarios
        this.stats.voluntarios = {
          total: data.voluntarioStats.total || 0,
          activos: data.voluntarioStats.activos || 0,
          porDisponibilidad: new Map([
            ['Mañana', data.voluntarioStats.manana || 0],
            ['Tarde', data.voluntarioStats.tarde || 0],
            ['Noche', data.voluntarioStats.noche || 0],
            ['Fines de Semana', data.voluntarioStats.finesSemana || 0],
            ['Completa', data.voluntarioStats.completa || 0]
          ])
        };

        // Guardar datos recientes (últimos 5)
        this.articulosRecientes = data.articulos.slice(0, 5);
        this.empleadosRecientes = data.empleados.slice(0, 5);
        this.beneficiariosRecientes = data.beneficiarios.slice(0, 5);
        this.voluntariosRecientes = data.voluntarios.slice(0, 5);

        // Actualizar contadores en rutas
        this.routes[0].count = this.stats.empleados.total;
        this.routes[1].count = this.stats.voluntarios.total;
        this.routes[2].count = this.stats.beneficiarios.total;
        this.routes[3].count = this.stats.articulos.total;

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del dashboard:', err);
        this.error = 'Error al cargar los datos del dashboard';
        this.loading = false;
      }
    });
  }

  getInitials(nombre: string, apellido?: string): string {
    if (!nombre) return '??';
    const first = nombre.charAt(0).toUpperCase();
    const last = apellido ? apellido.charAt(0).toUpperCase() : nombre.charAt(1)?.toUpperCase() || '';
    return first + last;
  }

  getEstadoBadgeClass(estado: number): string {
    return estado === 1 
      ? 'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800'
      : 'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800';
  }

  getEstadoTexto(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  recargarDatos(): void {
    this.cargarDatosDashboard();
  }
}