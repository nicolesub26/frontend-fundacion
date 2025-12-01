// src/app/components/entregas/entregas.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Entrega, EstadisticasEntrega, EntregaCreateDTO, FiltrosEntrega } from '../../../core/models/entrega.model';
import { EntregaService } from '../../../core/services/entrega.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { EmpleadoService } from '../../../core/services/empleado.service';
import { NotificacionesService } from '../../../layout/service/notificaciones.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { BeneficiarioService } from '../../../core/services/beneficiario.service';

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
  
  // Listas para dropdowns (debes cargarlas desde sus respectivos servicios)
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
    private articuloServide: ArticuloService,
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
    // Aquí deberías cargar también beneficiarios, empleados, artículos, etc.
     this.cargarBeneficiarios();
    this.cargarEmpleados();
     this.cargarArticulos();
  }

   cargarBeneficiarios():void{
    this.beneficiarioService.listar().subscribe({
      next: (data) => {
        this.beneficiarios = data;
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.notificacionesService.showError('Error al cargar los empleados');
      }
    } );
  }
  cargarArticulos():void{
    this.articuloServide.obtenerActivos().subscribe({
      next: (data) => {
        this.articulos = data;
        this.aplicarFiltros();
      },
      error: (error) => {
        console.error('Error al cargar empleados:', error);
        this.notificacionesService.showError('Error al cargar los empleados');
      }
    } );
  }

  cargarEmpleados(): void {
    this.empleadoService.getEmpleados().subscribe({
      next: (data) => {
        this.empleados = data;
        this.aplicarFiltros();
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
    this.agregarDetalle();
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
    this.entregaService.listarConDetalles().subscribe({
      next: (data) => {
        this.entregas = data;
        this.entregasFiltradas = data;
        this.calcularPaginacion();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar entregas:', error);
        this.loading = false;
        alert('Error al cargar las entregas');
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
      idBeneficiario: entrega.beneficiario.idBeneficiario,
      idEmpleado: entrega.empleado.id,
      idVoluntario: entrega.voluntario?.idVoluntario || '',
      observaciones: entrega.observaciones || ''
    });

    // Cargar detalles
    this.detalles.clear();
    if (entrega.detalles && entrega.detalles.length > 0) {
      entrega.detalles.forEach(detalle => {
        this.detalles.push(this.fb.group({
          idArticulo: [detalle.articulo.idArticulo, Validators.required],
          cantidad: [detalle.cantidad, [Validators.required, Validators.min(1)]],
          origen: [detalle.origen, Validators.required],
          observaciones: [detalle.observaciones || '']
        }));
      });
    }

    this.mostrarModal = true;
  }

  guardarEntrega(): void {
    if (this.entregaForm.invalid) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!this.imagenSeleccionada && !this.modoEdicion) {
      alert('Por favor seleccione una imagen de la entrega');
      return;
    }

    const formValue = this.entregaForm.value;
    const entregaDTO: EntregaCreateDTO = {
      fechaEntrega: formValue.fechaEntrega,
      idBeneficiario: Number(formValue.idBeneficiario),
      idEmpleado: Number(formValue.idEmpleado),
      idVoluntario: formValue.idVoluntario ? Number(formValue.idVoluntario) : undefined,
      observaciones: formValue.observaciones,
      detalles: formValue.detalles.map((d: any) => ({
        idArticulo: Number(d.idArticulo),
        cantidad: Number(d.cantidad),
        origen: d.origen,
        observaciones: d.observaciones
      }))
    };

    this.loading = true;

    if (this.modoEdicion && this.entregaSeleccionada) {
      // Actualizar
      this.entregaService.actualizar(
        this.entregaSeleccionada.idEntrega!,
        entregaDTO,
        this.imagenSeleccionada || undefined
      ).subscribe({
        next: (response) => {
          alert('Entrega actualizada exitosamente');
          this.cerrarModal();
          this.cargarEntregas();
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar la entrega: ' + (error.error?.error || error.message));
          this.loading = false;
        }
      });
    } else {
      // Crear
      this.entregaService.crear(entregaDTO, this.imagenSeleccionada!).subscribe({
        next: (response) => {
          alert('Entrega creada exitosamente');
          this.cerrarModal();
          this.cargarEntregas();
          this.cargarEstadisticas();
        },
        error: (error) => {
          console.error('Error al crear:', error);
          alert('Error al crear la entrega: ' + (error.error?.error || error.message));
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
        alert('Entrega eliminada exitosamente');
        this.cargarEntregas();
        this.cargarEstadisticas();
      },
      error: (error) => {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la entrega');
        this.loading = false;
      }
    });
  }

  // ==================== GESTIÓN DE DETALLES ====================
  
  agregarDetalle(): void {
    const detalleGroup = this.fb.group({
      idArticulo: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
      origen: ['DONACION_DIRECTA', Validators.required],
      observaciones: ['', Validators.maxLength(300)]
    });

    this.detalles.push(detalleGroup);
  }

  eliminarDetalle(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
    } else {
      alert('Debe haber al menos un artículo en la entrega');
    }
  }

  // ==================== GESTIÓN DE IMAGEN ====================
  
  onImagenSeleccionada(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor seleccione un archivo de imagen válido');
        return;
      }

      // Validar tamaño (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('La imagen no debe superar los 10MB');
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
      if (!filtros[key as keyof FiltrosEntrega]) {
        delete filtros[key as keyof FiltrosEntrega];
      }
    });

    if (Object.keys(filtros).length === 0) {
      this.entregasFiltradas = this.entregas;
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
    this.entregasFiltradas = this.entregas;
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
    this.entregaService.obtenerConDetalles(entrega.idEntrega!).subscribe({
      next: (data) => {
        this.entregaSeleccionada = data;
        this.mostrarModalDetalle = true;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar detalle:', error);
        alert('Error al cargar el detalle de la entrega');
        this.loading = false;
      }
    });
  }

 /**  obtenerUrlImagen(id: number): void {
     this.entregaService.obtenerUrlImagen(id);
  }*/
  obtenerUrlImagen(entrega: Entrega | null): string {
  if (!entrega || !entrega.fotoEntrega) return '';
  return `http://localhost:9090/imagenes/${entrega.fotoEntrega}`;
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
        alert('Error al descargar la imagen');
      }
    });
  }

  // ==================== EXPORTAR PDF ====================
  
  exportarPDF(): void {
    // Este método se implementará en el frontend usando jsPDF o similar
    // Aquí solo preparamos los datos
    console.log('Exportando a PDF...');
    alert('Función de exportar PDF disponible. Implementar con jsPDF en el frontend.');
    
    // Ejemplo de uso con jsPDF (deberás instalarlo):
 
    // 
    const doc = new jsPDF();
     doc.text('Reporte de Entregas', 14, 15);
    // 
     const datos = this.entregasFiltradas.map(e => [
       e.idEntrega,
      e.fechaEntrega,
       `${e.beneficiario.nombre} ${e.beneficiario.apellido}`,
       `${e.empleado.nombre} ${e.empleado.apellido}`,
       this.calcularTotalArticulos(e),
       this.entregaService.textoEstado(e.estado)
     ]);
     
     autoTable(doc, {
       head: [['ID', 'Fecha', 'Beneficiario', 'Empleado', 'Artículos', 'Estado']],
      body: [[ datos.length , 'Fecha', 'Beneficiario', 'Empleado', 'Artículos', 'Estado']],
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