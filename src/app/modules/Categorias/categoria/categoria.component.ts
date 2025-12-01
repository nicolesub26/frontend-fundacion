import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Categoria, EstadisticasCategoria } from '../../../core/models/categoria.model';
import { CategoriaService } from '../../../core/services/categoria.service';


@Component({
  selector: 'app-categoria',
  imports: [CommonModule,FormsModule, ReactiveFormsModule],
  standalone: true,
  templateUrl: './categoria.component.html',
  styleUrl: './categoria.component.css'
})
export class CategoriaComponent implements OnInit {
  // Estados del componente
  categorias: Categoria[] = [];
  categoriasFiltradas: Categoria[] = [];
  estadisticas: EstadisticasCategoria | null = null;
  
  // Modal y formulario
  showModal = false;
  isEditMode = false;
  categoriaForm!: FormGroup;
  categoriaSeleccionada: Categoria | null = null;
  
  // Carga y filtros
  isLoading = false;
  searchTerm = '';
  filtroEstado = 'todos'; // 'todos', 'activos', 'inactivos'
  
  // Paginación
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;
Math: any;

  constructor(
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
    this.categoriaForm = this.fb.group({
      nombreCategoria: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(100)
      ]],
      descripcion: ['', [
        Validators.maxLength(200)
      ]]
    });
  }

  private async cargarDatos(): Promise<void> {
    this.isLoading = true;
    
    try {
      // Cargar categorías y estadísticas en paralelo
      const [categorias, estadisticas] = await Promise.all([
        this.categoriaService.obtenerTodas().toPromise(),
        this.categoriaService.obtenerEstadisticas().toPromise()
      ]);
      
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
 trackByCategoria(index: number, categoria: any): number {
    return categoria.idCategoria; // Asegúrate de que 'idCategoria' sea una propiedad única en tus objetos de categoría
  }
  aplicarFiltros(): void {
    let categoriasFiltradas = [...this.categorias];
    
    // Filtro por término de búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      categoriasFiltradas = categoriasFiltradas.filter(categoria =>
        categoria.nombreCategoria.toLowerCase().includes(term) ||
        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(term))
      );
    }
    
    // Filtro por estado
    if (this.filtroEstado !== 'todos') {
      const estado = this.filtroEstado === 'activos' ? 1 : 0;
      categoriasFiltradas = categoriasFiltradas.filter(categoria => categoria.estado === estado);
    }
    
    this.categoriasFiltradas = categoriasFiltradas;
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

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtroEstado = 'todos';
    this.currentPage = 1;
    this.aplicarFiltros();
  }

  // ==================== PAGINACIÓN ====================

  private calcularPaginacion(): void {
    this.totalPages = Math.ceil(this.categoriasFiltradas.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get categoriasPaginadas(): Categoria[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.categoriasFiltradas.slice(startIndex, endIndex);
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
    this.categoriaSeleccionada = null;
    this.categoriaForm.reset();
    this.showModal = true;
  }

  abrirModalEditar(categoria: Categoria): void {
    this.isEditMode = true;
    this.categoriaSeleccionada = categoria;
    this.categoriaForm.patchValue({
      nombreCategoria: categoria.nombreCategoria,
      descripcion: categoria.descripcion
    });
    this.showModal = true;
  }

  cerrarModal(): void {
    this.showModal = false;
    this.categoriaForm.reset();
    this.categoriaSeleccionada = null;
  }

  async onSubmit(): Promise<void> {
    if (this.categoriaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const formData = this.categoriaForm.value;
    
    try {
      this.isLoading = true;
      
      if (this.isEditMode && this.categoriaSeleccionada) {
        // Actualizar
        const categoria: Categoria = {
          ...this.categoriaSeleccionada,
          nombreCategoria: formData.nombreCategoria,
          descripcion: formData.descripcion
        };
        
        await this.categoriaService.actualizar(this.categoriaSeleccionada.idCategoria!, categoria).toPromise();
        this.mostrarExito('Categoría actualizada correctamente');
        
      } else {
        // Crear
        const categoria: Categoria = {
          nombreCategoria: formData.nombreCategoria,
          descripcion: formData.descripcion,
          estado: 1
        };
        
        await this.categoriaService.crear(categoria).toPromise();
        this.mostrarExito('Categoría creada correctamente');
      }
      
      this.cerrarModal();
      await this.cargarDatos();
      
    } catch (error: any) {
      console.error('Error al guardar:', error);
      const mensaje = error.error?.error || 'Error al guardar la categoría';
      this.mostrarError(mensaje);
    } finally {
      this.isLoading = false;
    }
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.categoriaForm.controls).forEach(key => {
      this.categoriaForm.get(key)?.markAsTouched();
    });
  }

  // ==================== OPERACIONES CRUD ====================

  async cambiarEstado(categoria: Categoria): Promise<void> {
    const nuevoEstado = categoria.estado === 1 ? 0 : 1;
    const accion = nuevoEstado === 1 ? 'activar' : 'desactivar';
    
    const resultado = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} esta categoría?`,
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
        await this.categoriaService.cambiarEstado(categoria.idCategoria!, nuevoEstado).toPromise();
        
        this.mostrarExito(`Categoría ${accion === 'activar' ? 'activada' : 'desactivada'} correctamente`);
        await this.cargarDatos();
        
      } catch (error: any) {
        console.error('Error al cambiar estado:', error);
        const mensaje = error.error?.error || `Error al ${accion} la categoría`;
        this.mostrarError(mensaje);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async eliminar(categoria: Categoria): Promise<void> {
    // Verificar si se puede eliminar
    try {
      const respuesta = await this.categoriaService.puedeEliminar(categoria.idCategoria!).toPromise();
      
      if (!respuesta?.puedeEliminar) {
        this.mostrarError('No se puede eliminar esta categoría porque tiene artículos asociados');
        return;
      }
    } catch (error) {
      console.error('Error al verificar eliminación:', error);
      this.mostrarError('Error al verificar si se puede eliminar');
      return;
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
        await this.categoriaService.eliminar(categoria.idCategoria!).toPromise();
        
        this.mostrarExito('Categoría eliminada correctamente');
        await this.cargarDatos();
        
      } catch (error: any) {
        console.error('Error al eliminar:', error);
        const mensaje = error.error?.error || 'Error al eliminar la categoría';
        this.mostrarError(mensaje);
      } finally {
        this.isLoading = false;
      }
    }
  }

  // ==================== VALIDACIONES ====================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.categoriaForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.categoriaForm.get(fieldName);
    if (field?.errors) {
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
      'nombreCategoria': 'Nombre de categoría',
      'descripcion': 'Descripción'
    };
    return labels[fieldName] || fieldName;
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

  formatearFecha(fecha: string | undefined): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-ES');
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
      this.descargarArchivo(csvContent, 'categorias.csv', 'text/csv');
      this.mostrarExito('Datos exportados correctamente');
    } catch (error) {
      this.mostrarError('Error al exportar los datos');
    }
  }

  private generarCSV(): string {
    const headers = ['ID', 'Nombre', 'Descripción', 'Estado', 'Fecha Creación'];
    const rows = this.categorias.map(categoria => [
      categoria.idCategoria?.toString() || '',
      categoria.nombreCategoria,
      categoria.descripcion || '',
      this.obtenerTextoEstado(categoria.estado),
      this.formatearFecha(categoria.fechaCreacion)
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
    return this.categorias.length > 0;
  }

  get hayResultadosFiltrados(): boolean {
    return this.categoriasFiltradas.length > 0;
  }

  get totalCategorias(): number {
    return this.categorias.length;
  }

  get categoriasActivas(): number {
    return this.categorias.filter(c => c.estado === 1).length;
  }

  get categoriasInactivas(): number {
    return this.categorias.filter(c => c.estado === 0).length;
  }
  
}
