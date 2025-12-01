import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Articulo } from '../../../core/models/categoria.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { 
  CompraEfectivoResponse, 
  CompraEfectivoService, 
  CompraEfectivoRequest,
  DetalleCompraRequest
} from '../../../core/services/compra-efectivo.service';
import { 
  DonacionEfectivo, 
  DonacionEfectivoService 
} from '../../../core/services/donacion-efectivo.service';
import { Empleado, EmpleadoService } from '../../../core/services/empleado.service';

interface EstadisticasCompras {
  totalCompras: number;
  totalGastado: number;
  comprasHoy: number;
  promedioPorCompra: number;
}

@Component({
  selector: 'app-compra-efectivo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './compra-efectivo.component.html',
  styleUrls: ['./compra-efectivo.component.css']
})
export class CompraEfectivoComponent implements OnInit {
  // ===== LISTAS DE DATOS =====
  compras: CompraEfectivoResponse[] = [];
  donaciones: DonacionEfectivo[] = [];
  empleados: Empleado[] = [];
  articulos: Articulo[] = [];

  // ===== FILTROS =====
  filtroEstado: number | null = null;
  busquedaTexto: string = '';

  // ===== MODAL CREAR/EDITAR =====
  showModal: boolean = false;
  compraForm!: FormGroup;
  submitting: boolean = false;

  // ===== MODAL DETALLE =====
  compraSeleccionada: CompraEfectivoResponse | null = null;
  showDetalleModal: boolean = false;

  // ===== ESTADÍSTICAS =====
  estadisticas: EstadisticasCompras = {
    totalCompras: 0,
    totalGastado: 0,
    comprasHoy: 0,
    promedioPorCompra: 0
  };

  // ===== ESTADOS DE CARGA =====
  loading: boolean = false;
  loadingDonaciones: boolean = false;
  loadingEmpleados: boolean = false;
  loadingArticulos: boolean = false;

  constructor(
    private compraService: CompraEfectivoService,
    private donacionService: DonacionEfectivoService,
    private articuloService: ArticuloService,
    private empleadoService: EmpleadoService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ============================================
  // INICIALIZACIÓN
  // ============================================

  initForm(): void {
    this.compraForm = this.fb.group({
      idDonacionEfectivo: [null, Validators.required],
      fechaCompra: [this.getFechaActual(), Validators.required],
      idEmpleado: [null, Validators.required],
      proveedor: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
      descripcion: ['', Validators.maxLength(300)],
      comprobante: ['', Validators.maxLength(100)],
      detalles: this.fb.array([])
    });

    // Agregar primer detalle automáticamente
    this.agregarDetalle();
  }

  getFechaActual(): string {
    return new Date().toISOString().split('T')[0];
  }

  get detalles(): FormArray {
    return this.compraForm.get('detalles') as FormArray;
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  cargarDatos(): void {
    this.loading = true;
    Promise.all([
      this.cargarCompras(),
      this.cargarDonaciones(),
      this.cargarEmpleados(),
      this.cargarArticulos()
    ]).finally(() => {
      this.loading = false;
    });
  }

  async cargarCompras(): Promise<void> {
    try {
      // Usar método actualizado del servicio
      if (this.filtroEstado !== null && this.filtroEstado !== undefined) {
        const response = await this.compraService.listarPorEstadoPage(
          this.filtroEstado,
          { page: 0, size: 1000, sort: 'fechaCompra,desc' }
        ).toPromise();
        this.compras = response?.content || [];
      } else {
        const response = await this.compraService.listarPage({
          page: 0,
          size: 1000,
          sort: 'fechaCompra,desc'
        }).toPromise();
        this.compras = response?.content || [];
      }
      this.calcularEstadisticas();
    } catch (error: any) {
      console.error('Error al cargar compras:', error);
      Swal.fire('Error', error?.message || 'No se pudieron cargar las compras', 'error');
    }
  }

  async cargarDonaciones(): Promise<void> {
    this.loadingDonaciones = true;
    try {
      // Cargar solo donaciones activas con estado = 1
      const response = await this.donacionService.listarPage({ 
        estado: 1, 
        page: 0,
        size: 100,
        sort: 'idDonacionEfectivo,desc'
      }).toPromise();
      this.donaciones = response?.content || [];
      
      console.log('Donaciones cargadas:', this.donaciones);
    } catch (error: any) {
      console.error('Error al cargar donaciones:', error);
      Swal.fire('Error', 'No se pudieron cargar las donaciones', 'error');
    } finally {
      this.loadingDonaciones = false;
    }
  }

  async cargarEmpleados(): Promise<void> {
    this.loadingEmpleados = true;
    try {
      this.empleados = await this.empleadoService.getEmpleadosActivos().toPromise() || [];
    } catch (error: any) {
      console.error('Error al cargar empleados:', error);
      Swal.fire('Error', 'No se pudieron cargar los empleados', 'error');
    } finally {
      this.loadingEmpleados = false;
    }
  }

  async cargarArticulos(): Promise<void> {
    this.loadingArticulos = true;
    try {
      this.articulos = await this.articuloService.obtenerActivos().toPromise() || [];
    } catch (error: any) {
      console.error('Error al cargar artículos:', error);
      Swal.fire('Error', 'No se pudieron cargar los artículos', 'error');
    } finally {
      this.loadingArticulos = false;
    }
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  calcularEstadisticas(): void {
    const hoy = new Date().toISOString().split('T')[0];
    
    this.estadisticas.totalCompras = this.compras.length;
    this.estadisticas.totalGastado = this.compras
      .filter(c => c.estado === 1)
      .reduce((sum, c) => sum + c.montoTotal, 0);
    this.estadisticas.comprasHoy = this.compras.filter(c => c.fechaCompra === hoy).length;
    this.estadisticas.promedioPorCompra = this.estadisticas.totalCompras > 0 
      ? this.estadisticas.totalGastado / this.estadisticas.totalCompras 
      : 0;
  }

  // ============================================
  // MODAL CREAR COMPRA
  // ============================================

  abrirModalCrear(): void {
    this.compraForm.reset({
      fechaCompra: this.getFechaActual()
    });
    this.detalles.clear();
    this.agregarDetalle();
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.compraForm.reset();
  }

  // ============================================
  // MANEJO DE DETALLES
  // ============================================

  agregarDetalle(): void {
    const detalleGroup = this.fb.group({
      idArticulo: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
      precioUnitario: [0, [Validators.required, Validators.min(0.01)]]
    });
    this.detalles.push(detalleGroup);
  }

  eliminarDetalle(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
    } else {
      Swal.fire('Advertencia', 'Debe haber al menos un detalle', 'warning');
    }
  }

  calcularSubtotal(index: number): number {
    const detalle = this.detalles.at(index).value;
    return this.compraService.calcularSubtotal(detalle.cantidad || 0, detalle.precioUnitario || 0);
  }

  calcularMontoTotal(): number {
    return this.detalles.controls.reduce((sum, control) => {
      const detalle = control.value;
      return sum + this.compraService.calcularSubtotal(detalle.cantidad || 0, detalle.precioUnitario || 0);
    }, 0);
  }

  // ============================================
  // CREAR COMPRA
  // ============================================

  async crearCompra(): Promise<void> {
    // Validar formulario
    if (this.compraForm.invalid) {
      Swal.fire('Error', 'Por favor complete todos los campos requeridos', 'error');
      this.markFormGroupTouched(this.compraForm);
      return;
    }

    if (this.detalles.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un detalle', 'error');
      return;
    }

    // Validar que todos los detalles tengan artículo seleccionado
    const detallesInvalidos = this.detalles.controls.some(c => !c.value.idArticulo);
    if (detallesInvalidos) {
      Swal.fire('Error', 'Todos los detalles deben tener un artículo seleccionado', 'error');
      return;
    }

    const montoTotal = this.calcularMontoTotal();
    if (montoTotal <= 0) {
      Swal.fire('Error', 'El monto total debe ser mayor a cero', 'error');
      return;
    }

    // Obtener donación seleccionada
    const idDonacionSeleccionada = this.compraForm.value.idDonacionEfectivo;
    const donacionSeleccionada = this.donaciones.find(d => d.idDonacionEfectivo === idDonacionSeleccionada);

    // Confirmar
    const confirmResult = await Swal.fire({
      title: '¿Crear Compra?',
      html: `
        <div class="text-left">
          <p><strong>Proveedor:</strong> ${this.compraForm.value.proveedor}</p>
          <p><strong>Monto Total:</strong> ${this.formatearMoneda(montoTotal)}</p>
          <p><strong>Artículos:</strong> ${this.detalles.length}</p>
          ${donacionSeleccionada ? `
            <div class="mt-3 p-3 bg-blue-50 rounded">
              <p class="text-sm text-gray-600">Donación seleccionada:</p>
              <p class="font-semibold">#${donacionSeleccionada.idDonacionEfectivo}</p>
              <p class="text-sm">Monto: ${this.formatearMonedaDonacion(donacionSeleccionada.monto, donacionSeleccionada.moneda)}</p>
            </div>
          ` : ''}
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmResult.isConfirmed) return;

    this.submitting = true;

    const request: CompraEfectivoRequest = {
      ...this.compraForm.value,
      montoTotal: montoTotal,
      detalles: this.detalles.value.map((d: any) => ({
        idArticulo: d.idArticulo,
        cantidad: d.cantidad,
        precioUnitario: Number(d.precioUnitario)
      }))
    };

    try {
      const response = await this.compraService.crear(request).toPromise();
      
      Swal.fire({
        title: '¡Éxito!',
        html: `
          <p>Compra creada exitosamente</p>
          <p><strong>ID:</strong> ${response?.idCompra}</p>
          <p><strong>Proveedor:</strong> ${response?.proveedor}</p>
          <p><strong>Total:</strong> ${this.formatearMoneda(response?.montoTotal || 0)}</p>
        `,
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });

      this.cerrarModal();
      await this.cargarDatos(); // Recargar todo
      
    } catch (error: any) {
      console.error('Error al crear compra:', error);
      const mensaje = error?.error?.message || error?.message || 'No se pudo crear la compra';
      Swal.fire({
        title: 'Error',
        text: mensaje,
        icon: 'error',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      this.submitting = false;
    }
  }

  // ============================================
  // DETALLE COMPRA
  // ============================================

  async verDetalle(compra: CompraEfectivoResponse): Promise<void> {
    try {
      // Recargar datos frescos
      this.compraSeleccionada = await this.compraService
        .obtenerPorId(compra.idCompra)
        .toPromise() || null;
      this.showDetalleModal = true;
    } catch (error: any) {
      Swal.fire('Error', error?.message || 'No se pudo cargar el detalle', 'error');
    }
  }

  cerrarDetalleModal(): void {
    this.showDetalleModal = false;
    this.compraSeleccionada = null;
  }

  // ============================================
  // CAMBIAR ESTADO / ELIMINAR
  // ============================================

  async cambiarEstado(compra: CompraEfectivoResponse): Promise<void> {
    const nuevoEstado = compra.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    const confirmResult = await Swal.fire({
      title: `¿${accion.charAt(0).toUpperCase() + accion.slice(1)} Compra?`,
      html: `
        <p>¿Está seguro de ${accion} esta compra?</p>
        <p class="text-sm text-gray-600 mt-2">
          ${nuevoEstado === 0 ? 'El monto se revertirá a la donación' : 'El monto se descontará de la donación'}
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: nuevoEstado === 1 ? '#10b981' : '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await this.compraService.cambiarEstado(compra.idCompra, nuevoEstado).toPromise();
      
      Swal.fire({
        title: '¡Éxito!',
        text: `Compra ${accion === 'activar' ? 'activada' : 'desactivada'} exitosamente`,
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });

      await this.cargarDatos();
    } catch (error: any) {
      console.error(`Error al ${accion} compra:`, error);
      const mensaje = error?.error?.message || error?.message || `Error al ${accion} la compra`;
      Swal.fire('Error', mensaje, 'error');
    }
  }

  async eliminarCompra(compra: CompraEfectivoResponse): Promise<void> {
    const confirmResult = await Swal.fire({
      title: '¿Eliminar Compra?',
      html: `
        <p>¿Está seguro de eliminar esta compra?</p>
        <p class="text-sm text-gray-600 mt-2">
          El monto se revertirá a la donación si la compra está activa
        </p>
        <div class="mt-3 p-3 bg-red-50 rounded text-left">
          <p><strong>ID:</strong> #${compra.idCompra}</p>
          <p><strong>Proveedor:</strong> ${compra.proveedor}</p>
          <p><strong>Monto:</strong> ${this.formatearMoneda(compra.montoTotal)}</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (!confirmResult.isConfirmed) return;

    try {
      await this.compraService.eliminar(compra.idCompra).toPromise();
      
      Swal.fire({
        title: '¡Eliminada!',
        text: 'La compra ha sido eliminada exitosamente',
        icon: 'success',
        confirmButtonColor: '#3b82f6'
      });

      await this.cargarDatos();
    } catch (error: any) {
      console.error('Error al eliminar compra:', error);
      const mensaje = error?.error?.message || error?.message || 'Error al eliminar la compra';
      Swal.fire('Error', mensaje, 'error');
    }
  }

  // ============================================
  // FILTROS
  // ============================================

  aplicarFiltros(): void {
    this.cargarCompras();
  }

  limpiarFiltros(): void {
    this.filtroEstado = null;
    this.busquedaTexto = '';
    this.cargarCompras();
  }

  get comprasFiltradas(): CompraEfectivoResponse[] {
    let resultado = [...this.compras];

    if (this.busquedaTexto.trim()) {
      const busqueda = this.busquedaTexto.toLowerCase();
      resultado = resultado.filter(c => 
        c.proveedor.toLowerCase().includes(busqueda) ||
        c.nombreEmpleado.toLowerCase().includes(busqueda) ||
        c.comprobante?.toLowerCase().includes(busqueda) ||
        c.idCompra.toString().includes(busqueda)
      );
    }

    return resultado;
  }

  // ============================================
  // REPORTES (PLACEHOLDER)
  // ============================================

  async generarReportePDF(): Promise<void> {
    Swal.fire({
      title: 'Generando Reporte',
      text: 'Por favor espere...',
      icon: 'info',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    // Simulación - Aquí integrarías jsPDF o similar
    setTimeout(() => {
      Swal.fire('Información', 'Funcionalidad de PDF en desarrollo', 'info');
    }, 1000);
  }

  exportarExcel(): void {
    Swal.fire('Información', 'Funcionalidad de Excel en desarrollo', 'info');
  }

  // ============================================
  // HELPERS DE FORMATO
  // ============================================

  formatearMoneda(monto: number): string {
    return this.compraService.formatearMoneda(monto);
  }

  formatearFecha(fecha: string): string {
    return this.compraService.formatearFecha(fecha);
  }

  formatearMonedaDonacion(monto: number, moneda: 'BOB' | 'USD' | 'EUR'): string {
    const config: { [key: string]: { locale: string; currency: string } } = {
      BOB: { locale: 'es-BO', currency: 'BOB' },
      USD: { locale: 'en-US', currency: 'USD' },
      EUR: { locale: 'es-ES', currency: 'EUR' }
    };

    const { locale, currency } = config[moneda] || config['BOB'];

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto);
  }

  getNombreArticulo(idArticulo: number): string {
    const articulo = this.articulos.find(a => a.idArticulo === idArticulo);
    return articulo?.nombreArticulo || 'Artículo no encontrado';
  }

  getNombreEmpleado(idEmpleado: number): string {
    const empleado = this.empleados.find(e => e.id === idEmpleado);
    return empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado no encontrado';
  }

  getEstadoBadgeClass(estado: number): string {
    return estado === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  }

  getEstadoTexto(estado: number): string {
    return estado === 1 ? 'Activa' : 'Inactiva';
  }

  getDonacionSeleccionada(): DonacionEfectivo | undefined {
    const idDonacion = this.compraForm.get('idDonacionEfectivo')?.value;
    return this.donaciones.find(d => d.idDonacionEfectivo === idDonacion);
  }

  get hayDonacionesDisponibles(): boolean {
    return this.donaciones.length > 0;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(c => {
          if (c instanceof FormGroup) {
            this.markFormGroupTouched(c);
          }
        });
      }
    });
  }
}