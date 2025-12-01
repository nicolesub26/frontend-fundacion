// articulo.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Articulo, Categoria, EstadisticasArticulo } from '../../../core/models/categoria.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { CategoriaService } from '../../../core/services/categoria.service';

@Component({
  selector: 'app-articulo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './articulo.component.html',
  styleUrls: ['./articulo.component.css']
})
export class ArticuloComponent implements OnInit {
  // Estados del componente
  articulos: Articulo[] = [];
  articulosFiltrados: Articulo[] = [];
  categorias: Categoria[] = [];
  estadisticas: EstadisticasArticulo | null = null;

  // Modal y formulario
  showModal = false;
  isEditMode = false;
  articuloForm!: FormGroup;
  articuloSeleccionado: Articulo | null = null;

  // Carga y filtros
  isLoading = false;
  searchTerm = '';
  filtroEstado = 'todos'; // 'todos', 'activos', 'inactivos'
  filtroCategoria = 'todas'; // 'todas', o ID de categoría
  filtroStock = 'todos'; // 'todos', 'con_stock', 'sin_stock'

  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
  Math: any = Math; // Para usar Math en el template si es necesario

  constructor(
    private articuloService: ArticuloService,
    private categoriaService: CategoriaService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  // ==================== INICIALIZACIÓN ====================

  private initializeForm(): void {
    this.articuloForm = this.fb.group({
      nombreArticulo: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(150)
      ]],
      descripcion: ['', [
        Validators.maxLength(300)
      ]],
      categoria: ['', [
        Validators.required
      ]]
    });
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading = true;

    try {
      // Cargar datos en paralelo
      const [articulos, categorias, estadisticas] = await Promise.all([
        this.articuloService.obtenerTodos().toPromise(),
        this.categoriaService.obtenerActivas().toPromise(),
        this.articuloService.obtenerEstadisticas().toPromise()
      ]);

      this.articulos = articulos || [];
      this.categorias = categorias || [];
      this.estadisticas = estadisticas || null;
      this.aplicarFiltros();

    } catch (error) {
      console.error('Error al cargar datos:', error);
      this.mostrarError('Error al cargar los datos');
    } finally {
      this.isLoading = false;
    }
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  aplicarFiltros(): void {
    let articulosFiltrados = [...this.articulos];

    // Filtro por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      articulosFiltrados = articulosFiltrados.filter(articulo =>
        articulo.nombreArticulo.toLowerCase().includes(term) ||
        (articulo.descripcion && articulo.descripcion.toLowerCase().includes(term)) ||
        (articulo.categoria && articulo.categoria.nombreCategoria.toLowerCase().includes(term))
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      const estado = this.filtroEstado === 'activos' ? 1 : 0;
      articulosFiltrados = articulosFiltrados.filter(articulo => articulo.estado === estado);
    }

    // Filtro por categoría
    if (this.filtroCategoria !== 'todas') {
      const categoriaId = parseInt(this.filtroCategoria);
      articulosFiltrados = articulosFiltrados.filter(articulo =>
        articulo.categoria && articulo.categoria.idCategoria === categoriaId
      );
    }

    // Filtro por stock (simulado - en la realidad necesitarías datos de inventario)
    if (this.filtroStock !== 'todos') {
      // Aquí iría la lógica real de filtro por stock
      // Por ahora lo dejamos como placeholder
    }

    this.articulosFiltrados = articulosFiltrados;
    this.calcularPaginacion();
  }

  onSearchChange(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value;
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  onFiltroEstadoChange(event: Event): void {
    this.filtroEstado = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  onFiltroCategoriaChange(event: Event): void {
    this.filtroCategoria = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  onFiltroStockChange(event: Event): void {
    this.filtroStock = (event.target as HTMLSelectElement).value;
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = 'todos';
    this.filtroCategoria = 'todas';
    this.filtroStock = 'todos';
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  // ==================== PAGINACIÓN ====================

  private calcularPaginacion(): void {
    this.totalPages = Math.ceil(this.articulosFiltrados.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get articulosPaginados(): Articulo[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.articulosFiltrados.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  cambiarPagina(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // ==================== MODAL Y FORMULARIO ====================

  abrirModalCrear(): void {
    this.isEditMode = false;
    this.articuloSeleccionado = null;
    this.articuloForm.reset();
    this.showModal = true;
  }

  abrirModalEditar(articulo: Articulo): void {
    this.isEditMode = true;
    this.articuloSeleccionado = articulo;
    this.articuloForm.patchValue({
      nombreArticulo: articulo.nombreArticulo,
      descripcion: articulo.descripcion,
      categoria: articulo.categoria?.idCategoria?.toString() || ''
    });
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.articuloForm.reset();
    this.articuloSeleccionado = null;
  }

  async onSubmit(): Promise<void> {
    if (this.articuloForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const formData = this.articuloForm.value;
    const categoriaSeleccionada = this.categorias.find(c => c.idCategoria?.toString() === formData.categoria);

    if (!categoriaSeleccionada) {
      this.mostrarError('Debe seleccionar una categoría válida');
      return;
    }

    try {
      this.isLoading = true;

      if (this.isEditMode && this.articuloSeleccionado) {
        // Actualizar
        const articulo: Articulo = {
          ...this.articuloSeleccionado,
          nombreArticulo: formData.nombreArticulo,
          descripcion: formData.descripcion,
          categoria: categoriaSeleccionada
        };

        await this.articuloService.actualizar(this.articuloSeleccionado.idArticulo!, articulo).toPromise();
        this.mostrarExito('Artículo actualizado correctamente');

      } else {
        // Crear
        const articulo: Articulo = {
          nombreArticulo: formData.nombreArticulo,
          descripcion: formData.descripcion,
          categoria: categoriaSeleccionada,
          estado: 1
        };

        await this.articuloService.crear(articulo).toPromise();
        this.mostrarExito('Artículo creado correctamente');
      }

      this.cerrarModal();
      await this.cargarDatos();

    } catch (error: any) {
      console.error('Error al guardar:', error);
      const mensaje = error.error?.error || 'Error al guardar el artículo';
      this.mostrarError(mensaje);
    } finally {
      this.isLoading = false;
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.articuloForm.controls).forEach(key => {
      this.articuloForm.get(key)?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.articuloForm.get(fieldName);
    return !!(field?.invalid && (field?.dirty || field?.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.articuloForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${minLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} no puede exceder ${maxLength} caracteres`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombreArticulo': 'Nombre del artículo',
      'descripcion': 'Descripción',
      'categoria': 'Categoría'
    };
    return labels[fieldName] || fieldName;
  }

  // ==================== OPERACIONES CRUD ====================

  async cambiarEstado(articulo: Articulo): Promise<void> {
    const nuevoEstado = articulo.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';

    const resultado = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} este artículo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#ef4444',
      confirmButtonText: `Sí, ${accion}`,
      cancelButtonText: 'Cancelar'
    });

    if (resultado.isConfirmed) {
      try {
        this.isLoading = true;
        await this.articuloService.cambiarEstado(articulo.idArticulo!, nuevoEstado).toPromise();

        this.mostrarExito(`Artículo ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`);
        await this.cargarDatos();

      } catch (error: any) {
        console.error('Error al cambiar estado:', error);
        const mensaje = error.error?.error || `Error al ${accion} el artículo`;
        this.mostrarError(mensaje);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async eliminar(articulo: Articulo): Promise<void> {
    // Verificar si se puede eliminar
    try {
      const respuesta = await this.articuloService.puedeEliminar(articulo.idArticulo!).toPromise();

      if (respuesta && !respuesta.puedeEliminar) {
        this.mostrarError(respuesta.mensaje || 'No se puede eliminar este artículo porque tiene movimientos asociados');
        return;
      }
    } catch (error) {
      // Si falla la verificación (ej. endpoint no existe), permitimos intentar eliminar
      // y dejamos que el backend maneje la restricción en el DELETE
      console.warn('No se pudo verificar si se puede eliminar:', error);
    }

    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (resultado.isConfirmed) {
      try {
        this.isLoading = true;
        await this.articuloService.eliminar(articulo.idArticulo!).toPromise();

        this.mostrarExito('Artículo eliminado correctamente');
        await this.cargarDatos();

      } catch (error: any) {
        console.error('Error al eliminar:', error);
        const mensaje = error.error?.error || 'Error al eliminar el artículo';
        this.mostrarError(mensaje);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async verInventario(articulo: Articulo): Promise<void> {
    try {
      this.isLoading = true;
      const inventario = await this.articuloService.obtenerInventario(articulo.idArticulo!).toPromise();

      if (inventario && inventario.idInventario) {
        const cantidadTotal = (inventario.cantidadDisponible || 0) + (inventario.cantidadReservada || 0);

        Swal.fire({
          title: `📦 Inventario: ${articulo.nombreArticulo}`,
          html: `
            <div style="text-align: left; padding: 10px;">
              <p style="margin: 8px 0;"><strong>📊 Cantidad Disponible:</strong> ${inventario.cantidadDisponible || 0} unidades</p>
              <p style="margin: 8px 0;"><strong>🔒 Cantidad Reservada:</strong> ${inventario.cantidadReservada || 0} unidades</p>
              <p style="margin: 8px 0;"><strong>📈 Cantidad Total:</strong> ${cantidadTotal} unidades</p>
              ${inventario.ubicacion ? `<p style="margin: 8px 0;"><strong>📍 Ubicación:</strong> ${inventario.ubicacion}</p>` : ''}
              ${inventario.fechaActualizacion ? `<p style="margin: 8px 0;"><strong>🕒 Última Actualización:</strong> ${this.formatearFecha(inventario.fechaActualizacion)}</p>` : ''}
            </div>
          `,
          icon: 'info',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Cerrar'
        });
      } else {
        this.mostrarInfoInventario('Este artículo no tiene inventario registrado');
      }

    } catch (error: any) {
      console.error('Error al consultar inventario:', error);

      if (error.status === 404) {
        this.mostrarInfoInventario('Este artículo no tiene inventario registrado');
      } else {
        const mensaje = error.error?.error || 'Error al obtener inventario';
        this.mostrarError(mensaje);
      }
    } finally {
      this.isLoading = false;
    }
  }

  private mostrarInfoInventario(mensaje: string): void {
    Swal.fire({
      title: 'Información',
      text: mensaje,
      icon: 'info',
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Entendido'
    });
  }

  // ==================== UTILIDADES ====================

  obtenerClaseEstado(estado: number): string {
    return estado === 1
      ? 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium'
      : 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium';
  }

  obtenerTextoEstado(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  obtenerNombreCategoria(articulo: Articulo): string {
    return articulo.categoria?.nombreCategoria || 'Sin categoría';
  }

  obtenerClaseCategoria(categoria: Categoria | undefined): string {
    if (!categoria) return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';

    // Colores diferentes según la categoría
    const colores = [
      'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-cyan-100 text-cyan-800'
    ];

    const index = (categoria.idCategoria || 0) % colores.length;
    return `${colores[index]} px-2 py-1 rounded-full text-xs font-medium`;
  }

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  trackByArticulo(index: number, articulo: Articulo): any {
    return articulo.idArticulo || index;
  }

  // ==================== ALERTAS ====================

  private mostrarExito(mensaje: string): void {
    Swal.fire({
      title: '¡Éxito!',
      text: mensaje,
      icon: 'success',
      confirmButtonColor: '#3b82f6',
      timer: 3000,
      showConfirmButton: false
    });
  }

  private mostrarError(mensaje: string): void {
    Swal.fire({
      title: 'Error',
      text: mensaje,
      icon: 'error',
      confirmButtonColor: '#ef4444'
    });
  }

  // ==================== EXPORTACIONES Y REPORTES ====================

  async exportarDatos(): Promise<void> {
    try {
      const csvContent = this.generarCSV();
      this.descargarArchivo(csvContent, 'articulos.csv', 'text/csv');
      this.mostrarExito('Datos exportados correctamente');
    } catch (error) {
      this.mostrarError('Error al exportar los datos');
    }
  }

  private generarCSV(): string {
    const headers = ['ID', 'Nombre', 'Descripción', 'Categoría', 'Estado', 'Fecha Creación'];
    const rows = this.articulos.map(articulo => [
      articulo.idArticulo?.toString() || '',
      articulo.nombreArticulo,
      articulo.descripcion || '',
      this.obtenerNombreCategoria(articulo),
      this.obtenerTextoEstado(articulo.estado),
      this.formatearFecha(articulo.fechaCreacion)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  private descargarArchivo(content: string, fileName: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // ==================== MÉTODOS AUXILIARES ====================

  get hayDatos(): boolean {
    return this.articulos.length > 0;
  }

  get hayResultadosFiltrados(): boolean {
    return this.articulosFiltrados.length > 0;
  }

  get totalArticulos(): number {
    return this.articulos.length;
  }

  get articulosActivos(): number {
    return this.articulos.filter(a => a.estado === 1).length;
  }

  get articulosInactivos(): number {
    return this.articulos.filter(a => a.estado === 0).length;
  }

  get articulosPorCategoria(): { [key: string]: number } {
    const conteo: { [key: string]: number } = {};
    this.articulos.forEach(articulo => {
      const categoria = this.obtenerNombreCategoria(articulo);
      conteo[categoria] = (conteo[categoria] || 0) + 1;
    });
    return conteo;
  }
}