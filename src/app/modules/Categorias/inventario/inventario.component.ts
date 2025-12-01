import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { InventarioService, Inventario, InventarioCreateDto } from '../../../core/services/inventario.service';
import { ArticuloService } from '../../../core/services/articulo.service';
import { Articulo, Categoria } from '../../../core/models/categoria.model';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  public Math = Math; 
  // Datos
  inventarios: Inventario[] = [];
  inventariosFiltrados: Inventario[] = [];
  articulos: Articulo[] = [];

  // Estados UI
  isLoading = false;
  showModal = false;
  isEditMode = false;

  // Formularios
  inventarioForm!: FormGroup;
  inventarioSeleccionado: Inventario | null = null;

  // Filtros
  filtroUbicacion = '';
  filtroStock: 'todos' | 'con_stock' | 'sin_stock' = 'todos';
  filtroArticuloId = '';
  buscarInventarioId = '';

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    private articuloService: ArticuloService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ==================== INIT ====================

  private initForm() {
    this.inventarioForm = this.fb.group({
      articuloId: ['', [Validators.required]],
      cantidadDisponible: [0, [Validators.required, Validators.min(0)]],
      ubicacion: ['', [Validators.maxLength(100)]]
    });
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading = true;
    try {
      const [inventarios, articulos] = await Promise.all([
        this.inventarioService.listar().toPromise(),
        this.articuloService.obtenerActivos().toPromise()
      ]);

      this.inventarios = inventarios || [];
      this.articulos = articulos || [];
      this.aplicarFiltros();
    } catch (err) {
      this.mostrarError('Error al cargar inventario');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== FILTROS & BUSQUEDA ====================

  aplicarFiltros() {
    let data = [...this.inventarios];

    // Filtro por ubicación (contains)
    if (this.filtroUbicacion.trim()) {
      const term = this.filtroUbicacion.toLowerCase().trim();
      data = data.filter(i => (i.ubicacion || '').toLowerCase().includes(term));
    }

    // Filtro por stock
    if (this.filtroStock !== 'todos') {
      data = data.filter(i =>
        this.filtroStock === 'con_stock'
          ? i.cantidadDisponible > 0
          : i.cantidadDisponible === 0
      );
    }

    // Filtro por artículo específico (si está en la caja de filtro)
    if (this.filtroArticuloId.trim()) {
      const id = Number(this.filtroArticuloId);
      if (!Number.isNaN(id)) {
        data = data.filter(i => i.articulo?.idArticulo === id);
      }
    }

    this.inventariosFiltrados = data;
    this.calcularPaginacion();
  }

  async buscarPorInventarioId(): Promise<void> {
    const id = Number(this.buscarInventarioId);
    if (Number.isNaN(id) || id <= 0) {
      this.mostrarError('Ingresa un ID de inventario válido');
      return;
    }

    this.isLoading = true;
    try {
      const inv = await this.inventarioService.obtenerPorId(id).toPromise();
      this.inventariosFiltrados = inv ? [inv] : [];
      this.currentPage = 1;
      this.calcularPaginacion();

      if (!inv) this.mostrarInfo('No se encontró inventario con ese ID');
    } catch {
      this.mostrarError('Inventario no encontrado');
    } finally {
      this.isLoading = false;
    }
  }

  async buscarPorArticuloId(): Promise<void> {
    const id = Number(this.filtroArticuloId);
    if (Number.isNaN(id) || id <= 0) {
      this.mostrarError('Ingresa un ID de artículo válido');
      return;
    }

    this.isLoading = true;
    try {
      const inv = await this.inventarioService.obtenerPorArticuloId(id).toPromise();
      this.inventariosFiltrados = inv ? [inv] : [];
      this.currentPage = 1;
      this.calcularPaginacion();

      if (!inv) this.mostrarInfo('El artículo no tiene inventario registrado');
    } catch {
      this.mostrarError('Error al buscar inventario por artículo');
    } finally {
      this.isLoading = false;
    }
  }

  limpiarFiltros() {
    this.filtroUbicacion = '';
    this.filtroStock = 'todos';
    this.filtroArticuloId = '';
    this.buscarInventarioId = '';
    this.aplicarFiltros();
  }

  // ==================== CRUD ====================

  abrirModalCrear() {
    this.isEditMode = false;
    this.inventarioSeleccionado = null;
    this.inventarioForm.reset({
      articuloId: '',
      cantidadDisponible: 0,
      ubicacion: ''
    });
    this.showModal = true;
  }

  abrirModalEditar(inv: Inventario) {
    this.isEditMode = true;
    this.inventarioSeleccionado = inv;
    this.inventarioForm.reset({
      articuloId: inv.articulo?.idArticulo?.toString() || '',
      cantidadDisponible: inv.cantidadDisponible,
      ubicacion: inv.ubicacion || ''
    });
    // En edición no permitimos cambiar el artículo ni la cantidad por PUT
    this.inventarioForm.get('articuloId')?.disable();
    this.inventarioForm.get('cantidadDisponible')?.disable();
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.inventarioSeleccionado = null;
    this.inventarioForm.enable();
  }

  async onSubmit(): Promise<void> {
    if (this.inventarioForm.invalid) {
      this.marcarCamposTocados();
      return;
    }

    const form = this.inventarioForm.getRawValue();

    try {
      this.isLoading = true;

      if (this.isEditMode && this.inventarioSeleccionado) {
        // Solo actualizamos ubicación vía PUT
        const cambios = { ubicacion: form.ubicacion };
        await this.inventarioService.actualizar(this.inventarioSeleccionado.idInventario, cambios).toPromise();
        this.mostrarExito('Inventario actualizado');
      } else {
        // Crear
        // inventario.component.ts, dentro de onSubmit() (ramo CREAR)
const payload: InventarioCreateDto = {
  articulo: { idArticulo: Number(form.articuloId) },
  cantidadDisponible: Number(form.cantidadDisponible) || 0,
  cantidadReservada: 0,
  ubicacion: (form.ubicacion || '').toString(),
  // 👇 agrega esto si aún te falla por fecha
  // @ts-ignore (si tu DTO no la tiene)
  fechaActualizacion: new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
};


await this.inventarioService.crear(payload).toPromise();

        this.mostrarExito('Inventario creado');
      }

      this.cerrarModal();
      await this.cargarDatos();
    }  catch (err: any) {
  console.error('Crear/Actualizar inventario ->', err);
  const msg = err?.error?.message || err?.error?.error || 'Error al guardar el inventario';
  this.mostrarError(msg);
}
 finally {
      this.isLoading = false;
    }
  }

  async eliminar(inv: Inventario) {
    const res = await Swal.fire({
      title: '¿Eliminar inventario?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!res.isConfirmed) return;

    try {
      this.isLoading = true;
      await this.inventarioService.eliminar(inv.idInventario).toPromise();
      this.mostrarExito('Inventario eliminado');
      await this.cargarDatos();
    } catch (err: any) {
      const msg = err?.error?.message || err?.error?.error || 'No se pudo eliminar';
      this.mostrarError(msg);
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== STOCK OPS ====================

  async solicitarNumero(titulo: string, minimo = 1): Promise<number | null> {
    const { value, isConfirmed } = await Swal.fire({
      title: titulo,
      input: 'number',
      inputAttributes: { min: String(minimo), step: '1' },
      inputValue: minimo,
      showCancelButton: true,
      confirmButtonText: 'Aceptar',
      cancelButtonText: 'Cancelar'
    });
    if (!isConfirmed) return null;
    const n = Number(value);
    if (Number.isNaN(n) || n < minimo) return null;
    return n;
    }

  async ajustar(inv: Inventario) {
    const delta = await this.solicitarNumero('Indica el ajuste (positivo o negativo). Mínimo 1 en valor absoluto', 1);
    if (delta === null) return;

    // SweetAlert solo permite números positivos; preguntamos signo:
    const { value: signo } = await Swal.fire({
      title: '¿Sumar o restar?',
      input: 'radio',
      inputOptions: { '+': 'Sumar', '-': 'Restar' },
      inputValue: '+',
      showCancelButton: true
    });
    if (!signo) return;

    const realDelta = signo === '-' ? -Math.abs(delta) : Math.abs(delta);

    try {
      this.isLoading = true;
      await this.inventarioService.ajustarDisponible(inv.idInventario, realDelta).toPromise();
      this.mostrarExito('Ajuste aplicado');
      await this.cargarDatos();
    } catch (e: any) {
      const msg = e?.error?.message || e?.error?.error || 'No se pudo ajustar';
      this.mostrarError(msg);
    } finally {
      this.isLoading = false;
    }
  }

  async reservar(inv: Inventario) {
    const cant = await this.solicitarNumero('Cantidad a reservar', 1);
    if (cant === null) return;
    try {
      this.isLoading = true;
      await this.inventarioService.reservar(inv.idInventario, cant).toPromise();
      this.mostrarExito('Reserva realizada');
      await this.cargarDatos();
    } catch (e: any) {
      const msg = e?.error?.message || e?.error?.error || 'No se pudo reservar';
      this.mostrarError(msg);
    } finally {
      this.isLoading = false;
    }
  }

  async liberar(inv: Inventario) {
    const cant = await this.solicitarNumero('Cantidad a liberar', 1);
    if (cant === null) return;
    try {
      this.isLoading = true;
      await this.inventarioService.liberar(inv.idInventario, cant).toPromise();
      this.mostrarExito('Reserva liberada');
      await this.cargarDatos();
    } catch (e: any) {
      const msg = e?.error?.message || e?.error?.error || 'No se pudo liberar';
      this.mostrarError(msg);
    } finally {
      this.isLoading = false;
    }
  }

  async consumir(inv: Inventario) {
    const cant = await this.solicitarNumero('Cantidad a consumir', 1);
    if (cant === null) return;
    try {
      this.isLoading = true;
      await this.inventarioService.consumir(inv.idInventario, cant).toPromise();
      this.mostrarExito('Reserva consumida');
      await this.cargarDatos();
    } catch (e: any) {
      const msg = e?.error?.message || e?.error?.error || 'No se pudo consumir';
      this.mostrarError(msg);
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== UI HELPERS ====================

  getNombreArticulo(inv: Inventario): string {
    return inv.articulo?.nombreArticulo || `#${inv.articulo?.idArticulo ?? '-'}`;
  }

  total(inv: Inventario): number {
    return (inv.cantidadDisponible || 0) + (inv.cantidadReservada || 0);
  }

  formatearFecha(fecha?: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // ==================== PAGINACION ====================

  private calcularPaginacion() {
    this.totalPages = Math.ceil(this.inventariosFiltrados.length / this.itemsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get inventariosPaginados(): Inventario[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.inventariosFiltrados.slice(start, start + this.itemsPerPage);
  }

  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  trackByInv = (_: number, inv: Inventario) => inv.idInventario;

  // ==================== VALIDACIONES FORM ====================

  isInvalid(field: string): boolean {
    const c = this.inventarioForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  getError(field: string): string {
    const c = this.inventarioForm.get(field);
    if (!c?.errors) return '';
    if (c.errors['required']) return 'Campo requerido';
    if (c.errors['min']) return 'No puede ser negativo';
    if (c.errors['maxlength']) return 'Máximo 100 caracteres';
    return 'Valor inválido';
  }

  private marcarCamposTocados() {
    Object.keys(this.inventarioForm.controls).forEach(k => this.inventarioForm.get(k)?.markAsTouched());
  }

  // ==================== ALERTAS ====================

  private mostrarExito(text: string) {
    Swal.fire({ icon: 'success', title: '¡Éxito!', text, timer: 2200, showConfirmButton: false });
  }
  private mostrarInfo(text: string) {
    Swal.fire({ icon: 'info', title: 'Aviso', text });
  }
  private mostrarError(text: string) {
    Swal.fire({ icon: 'error', title: 'Error', text });
  }

  // ==================== STATS (opcionales para header) ====================

  get totalRegistros(): number { return this.inventarios.length; }
  get totalConStock(): number { return this.inventarios.filter(i => i.cantidadDisponible > 0).length; }
  get totalReservado(): number { return this.inventarios.reduce((a, i) => a + (i.cantidadReservada || 0), 0); }
}
