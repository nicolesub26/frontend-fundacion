import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { EntregaService, Entrega, CrearEntregaDto, EstadisticasEntrega, FiltrosEntrega } from '../../../core/services/entrega.service';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { NotificacionesService } from '../../../layout/service/notificaciones.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-entregas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './entregas.component.html',
  styleUrl: './entregas.component.css'
})
export class EntregasComponent implements OnInit {

  // ==================== VARIABLES ====================

  entregas: Entrega[] = [];
  entregasFiltradas: Entrega[] = [];
  entregaSeleccionada: Entrega | null = null;

  // Formularios
  entregaForm!: FormGroup;
  filtrosForm!: FormGroup;

  // Estados de UI
  loading = false;
  mostrarModal = false;
  mostrarModalDetalle = false;
  modoEdicion = false;

  // Imagen
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;

  // Estadísticas
  estadisticas: EstadisticasEntrega | null = null;

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 10;
  totalPaginas = 0;

  // Listas para dropdowns
  beneficiarios: any[] = [];
  empleados: any[] = [];
  voluntarios: any[] = [];
  articulos: any[] = [];

  // Opciones de origen
  opcionesOrigen = [
    { value: 'DONACION_DIRECTA', label: 'Donación Directa' },
    { value: 'COMPRA_EFECTIVO', label: 'Compra en Efectivo' },
    { value: 'MIXTO', label: 'Mixto' }
  ];

  // ==================== CONSTRUCTOR ====================

  constructor(
    private entregaService: EntregaService,
    private empleadoService: EmpleadoService,
    private articuloService: ArticuloService,
    private beneficiarioService: BeneficiarioService,
    private notificacionesService: NotificacionesService,
    private fb: FormBuilder
  ) {
    this.inicializarFormularios();
  }

  // ==================== CICLO DE VIDA ====================

  ngOnInit(): void {
    this.cargarEntregas();
    this.cargarEstadisticas();
    this.cargarBeneficiarios();
    this.cargarEmpleados();
    this.cargarArticulos();
  }

  cargarBeneficiarios(): void {
    this.beneficiarioService.listar().subscribe({
      next: (data) => {
        this.beneficiarios = data;
      },
      error: (error) => {
        console.error('Error al cargar beneficiarios:', error);
        this.notificacionesService.showError('Error al cargar los beneficiarios');
      }
    });
  }

  cargarArticulos(): void {
    this.articuloService.obtenerActivos().subscribe({
      next: (data: any) => {
        // Handle potential response wrapper
        this.articulos = Array.isArray(data) ? data : (data.data || []);
      },
      error: (error) => {
        console.error('Error al cargar artículos:', error);
        this.notificacionesService.showError('Error al cargar los artículos');
      }
    });
  }

  cargarEmpleados(): void {
    this.empleadoService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.notificacionesService.showError('Error al cargar los empleados');
      }
    });
  }

  // ==================== INICIALIZACIÓN ====================

  private inicializarFormularios(): void {
    // Formulario de entrega
    this.entregaForm = this.fb.group({
      fechaEntrega: [this.getFechaHoy(), Validators.required],
      idBeneficiario: ['', Validators.required],
      idEmpleado: ['', Validators.required],
      idVoluntario: [''],
      observaciones: ['', Validators.maxLength(500)],
      detalles: this.fb.array([])
    });

    // Formulario de filtros
    this.filtrosForm = this.fb.group({
      idBeneficiario: [''],
      idEmpleado: [''],
      fechaInicio: [''],
      fechaFin: [''],
      estado: ['']
    });

    // Agregar un detalle inicial
    // this.agregarDetalle(); // Don't add default detail on init, only when opening modal
  }

  // ==================== GETTERS ====================

  get detalles(): FormArray {
    return this.entregaForm.get('detalles') as FormArray;
  }

  get entregasPaginadas(): Entrega[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    return this.entregasFiltradas.slice(inicio, fin);
  }

  // ==================== CARGA DE DATOS ====================

  cargarEntregas(): void {
    this.loading = true;
    // Use listarPage with large size to simulate "get all" for client-side filtering
    this.entregaService.listarPage({ size: 1000 }).subscribe({
      next: (resp) => {
        this.entregas = resp.content;
        this.entregasFiltradas = [...this.entregas];
        this.calcularPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar entregas:', error);
        this.loading = false;
        this.notificacionesService.showError('Error al cargar las entregas');
      }
    });
  }

  cargarEstadisticas(): void {
    this.entregaService.obtenerEstadisticas().subscribe({
      next: (data) => {
        this.estadisticas = data;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  // ==================== CRUD - CREAR Y ACTUALIZAR ====================

  abrirModalCrear(): void {
    this.modoEdicion = false;
    this.entregaForm.reset({
      fechaEntrega: this.getFechaHoy()
    });
    this.detalles.clear();
    this.agregarDetalle();
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.mostrarModal = true;
  }

  abrirModalEditar(entrega: Entrega): void {
    this.modoEdicion = true;
    this.entregaSeleccionada = entrega;

    // Cargar datos en el formulario
    this.entregaForm.patchValue({
      fechaEntrega: entrega.fechaEntrega,
      idBeneficiario: entrega.idBeneficiario,
      idEmpleado: entrega.idEmpleado,
      idVoluntario: entrega.idVoluntario || '',
      observaciones: entrega.observaciones || ''
    });

    // Cargar detalles
    this.detalles.clear();
    if (entrega.detalles && entrega.detalles.length > 0) {
      entrega.detalles.forEach(detalle => {
        this.detalles.push(this.fb.group({
          idArticulo: [detalle.idArticulo, Validators.required],
          cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
          origen: [detalle.origen, Validators.required], // Restored
          observaciones: [detalle.observaciones || '']
        }));
      });
    } else {
      this.agregarDetalle();
    }

    this.mostrarModal = true;
  }

  guardarEntrega(): void {
    if (this.entregaForm.invalid) {
      this.notificacionesService.showWarning('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!this.imagenSeleccionada && !this.modoEdicion) {
      this.notificacionesService.showWarning('Por favor seleccione una imagen de la entrega');
      return;
    }

    const formValue = this.entregaForm.value;
    const entregaDTO: CrearEntregaDto = {
      fechaEntrega: formValue.fechaEntrega,
      idBeneficiario: Number(formValue.idBeneficiario),
      idEmpleado: Number(formValue.idEmpleado),
      idVoluntario: formValue.idVoluntario ? Number(formValue.idVoluntario) : undefined, // Restored
      observaciones: formValue.observaciones,
      detalles: formValue.detalles.map((d: any) => ({
        idArticulo: Number(d.idArticulo),
        cantidad: Number(d.cantidad),
        origen: d.origen, // Restored
        observaciones: d.observaciones
      })),
      fotoEntrega: 'temp.jpg' // Reverted to fotoEntrega with dummy value
    };

    this.loading = true;

    if (this.modoEdicion && this.entregaSeleccionada) {
      // Actualizar
      this.entregaService.actualizar(
        this.entregaSeleccionada.idEntrega!,
        entregaDTO
      ).pipe(
        switchMap(entrega => {
          if (this.imagenSeleccionada) {
            return this.entregaService.subirFoto(entrega.idEntrega, this.imagenSeleccionada);
          }
          return of(entrega);
        })
      ).subscribe({
        next: (response) => {
          this.notificacionesService.showSuccess('Entrega actualizada exitosamente');
          this.cerrarModal();
          this.cargarEntregas();
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          this.notificacionesService.showError('Error al actualizar la entrega');
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.entregaService.crear(entregaDTO)
        .pipe(
          switchMap(entrega => {
            if (this.imagenSeleccionada) {
              return this.entregaService.subirFoto(entrega.idEntrega, this.imagenSeleccionada);
            }
            return of(entrega);
          })
        ).subscribe({
          next: (response) => {
            this.notificacionesService.showSuccess('Entrega creada exitosamente');
            this.cerrarModal();
            this.cargarEntregas();
            this.cargarEstadisticas();
          },
          error: (error) => {
            console.error('Error al crear:', error);
            this.notificacionesService.showError('Error al crear la entrega');
            this.loading = false;
          }
        });
    }
  }

  // ==================== CRUD - ELIMINAR ====================

  eliminarEntrega(entrega: Entrega): void {
    if (!confirm(`¿Está seguro de eliminar la entrega #${entrega.idEntrega}?`)) {
      return;
    }

    this.loading = true;
    this.entregaService.eliminar(entrega.idEntrega!).subscribe({
      next: () => {
        this.notificacionesService.showSuccess('Entrega eliminada exitosamente');
        this.cargarEntregas();
        this.cargarEstadisticas();
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        this.notificacionesService.showError('Error al eliminar la entrega');
        this.loading = false;
      }
    });
  }

  // ==================== GESTIÓN DE DETALLES ====================

  agregarDetalle(): void {
    const detalleGroup = this.fb.group({
      idArticulo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
      origen: ['DONACION_DIRECTA', Validators.required], // Restored
      observaciones: ['', Validators.maxLength(300)]
    });

    this.detalles.push(detalleGroup);
  }

  eliminarDetalle(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
    } else {
      this.notificacionesService.showWarning('Debe haber al menos un artículo en la entrega');
    }
  }

  // ==================== GESTIÓN DE IMAGEN ====================

  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.notificacionesService.showWarning('Por favor seleccione un archivo de imagen válido');
        return;
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.notificacionesService.showWarning('La imagen no debe superar los 10MB');
        return;
      }

      this.imagenSeleccionada = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  aplicarFiltros(): void {
    const filtros: FiltrosEntrega = this.filtrosForm.value;

    // Limpiar filtros vacíos
    Object.keys(filtros).forEach(key => {
      const k = key as keyof FiltrosEntrega;
      if (!filtros[k]) {
        delete filtros[k];
      }
    });

    if (Object.keys(filtros).length === 0) {
      this.entregasFiltradas = [...this.entregas];
      this.calcularPaginacion();
      return;
    }

    this.loading = true;
    this.entregaService.buscarConFiltros(filtros).subscribe({
      next: (data) => {
        this.entregasFiltradas = data;
        this.paginaActual = 1;
        this.calcularPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al filtrar:', error);
        this.loading = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset();
    this.entregasFiltradas = [...this.entregas];
    this.calcularPaginacion();
  }

  buscarPorPeriodo(periodo: 'dia' | 'semana' | 'mes'): void {
    this.loading = true;
    let observable;

    switch (periodo) {
      case 'dia':
        observable = this.entregaService.obtenerDelDia();
        break;
      case 'semana':
        observable = this.entregaService.obtenerDeLaSemana();
        break;
      case 'mes':
        observable = this.entregaService.obtenerDelMes();
        break;
    }

    observable.subscribe({
      next: (data) => {
        this.entregasFiltradas = data;
        this.paginaActual = 1;
        this.calcularPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al buscar por periodo:', error);
        this.loading = false;
      }
    });
  }

  // ==================== DETALLE DE ENTREGA ====================

  verDetalle(entrega: Entrega): void {
    this.loading = true;
    this.entregaService.obtener(entrega.idEntrega!).subscribe({
      next: (data) => {
        this.entregaSeleccionada = data;
        this.mostrarModalDetalle = true;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        this.notificacionesService.showError('Error al cargar el detalle de la entrega');
        this.loading = false;
      }
    });
  }

  obtenerUrlImagen(entrega: Entrega | null): string {
    if (!entrega || !entrega.fotoUrl) return '';
    // Assuming fotoUrl is a full URL or relative path handled by backend
    // If it's just a filename:
    if (!entrega.fotoUrl.startsWith('http')) {
      return `http://localhost:9090/api/entregas/${entrega.idEntrega}/imagen`;
    }
    return entrega.fotoUrl;
  }

  descargarImagen(entrega: Entrega): void {
    this.entregaService.descargarImagen(entrega.idEntrega!).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `entrega_${entrega.idEntrega}_${entrega.fechaEntrega}.jpg`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar imagen:', error);
        this.notificacionesService.showError('Error al descargar la imagen');
      }
    });
  }

  // ==================== EXPORTAR PDF ====================

  exportarPDF(): void {
    const doc = new jsPDF();
    doc.text('Reporte de Entregas', 14, 15);

    const datos = this.entregasFiltradas.map(e => [
      e.idEntrega,
      this.formatearFecha(e.fechaEntrega),
      e.nombreBeneficiario || '-',
      e.nombreEmpleado || '-',
      this.calcularTotalArticulos(e),
      this.textoEstado(e.estado)
    ]);

    autoTable(doc, {
      head: [['ID', 'Fecha', 'Beneficiario', 'Empleado', 'Artículos', 'Estado']],
      body: datos,
      startY: 20
    });

    doc.save(`entregas_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // ==================== PAGINACIÓN ====================

  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.entregasFiltradas.length / this.itemsPorPagina);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  // ==================== UTILIDADES ====================

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.entregaSeleccionada = null;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.loading = false;
  }

  cerrarModalDetalle(): void {
    this.mostrarModalDetalle = false;
    this.entregaSeleccionada = null;
  }

  getFechaHoy(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatearFecha(fecha: string): string {
    return this.entregaService.formatearFecha(fecha);
  }

  textoEstado(estado: number): string {
    return this.entregaService.textoEstado(estado);
  }

  claseEstado(estado: number): string {
    return this.entregaService.claseEstado(estado);
  }

  textoOrigen(origen: string): string {
    return this.entregaService.textoOrigen(origen);
  }

  calcularTotalArticulos(entrega: Entrega): number {
    return this.entregaService.calcularTotalArticulos(entrega);
  }
}