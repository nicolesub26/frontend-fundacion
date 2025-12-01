import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table/data-table.component';
import { Empleado, EmpleadoService } from '../../../../core/services/empleado.service';
import { EmpleadoFromComponent } from '../empleado-from/empleado-from.component';
import { Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NotificacionesService } from '../../../../layout/service/notificaciones.service';

@Component({
  selector: 'app-empleados-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent,ReactiveFormsModule,FormsModule],
  templateUrl: './empleados-list.component.html',
  styleUrl: './empleados-list.component.css'
})
export class EmpleadosListComponent implements OnInit{
 empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  empleadosPaginados: Empleado[] = [];
  
  // Paginación
  paginaActual = 1;
  elementosPorPagina = 10;
  totalEmpleados = 0;
  totalPaginas = 0;
  
  // Filtros y búsqueda
  searchTerm = '';
  filtroEstado = '';
  filtroTurno = '';
  
  // Modal
  mostrarModal = false;
  modoEdicion = false;
  empleadoSeleccionado?: Empleado;
  
  // Formulario
  empleadoForm: FormGroup;
  cargando = false;

  constructor(
    private empleadoService: EmpleadoService,
    private fb: FormBuilder,
    private notificacionesService: NotificacionesService
  ) {
    this.empleadoForm = this.fb.group({
      nombre: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,\-]+$/)
      ]],
      apellido: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,\-]+$/)
      ]],
      ci: ['', [
        Validators.required, 
        Validators.minLength(7), 
        Validators.maxLength(15),
        Validators.pattern(/^[0-9]+(-[0-9A-Za-z]{1,3})?$/)
      ], [this.validarCiUnico.bind(this)]],
      correo: ['', [
        Validators.required, 
        Validators.email,
        Validators.maxLength(150)
      ], [this.validarCorreoUnico.bind(this)]],
      cargo: ['', [
        Validators.required, 
        Validators.minLength(2), 
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.,\-]+$/)
      ]],
      turno: ['', [Validators.required]],
      telefono: ['', [
        Validators.required, 
        Validators.pattern(/^[0-9]{7,15}$/)
      ], [this.validarTelefonoUnico.bind(this)]]
    });
  }

  ngOnInit(): void {
    this.cargarEmpleadosInicial();
  }

  cargarEmpleadosInicial(): void {
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

  onSearch(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [...this.empleados];

    // Filtro por término de búsqueda
    if (this.searchTerm) {
      const termino = this.searchTerm.toLowerCase();
      resultado = resultado.filter(empleado =>
        empleado.nombre.toLowerCase().includes(termino) ||
        empleado.apellido.toLowerCase().includes(termino) ||
        empleado.ci.includes(termino) ||
        empleado.correo.toLowerCase().includes(termino) ||
        empleado.cargo.toLowerCase().includes(termino)
      );
    }

    // Filtro por estado
    if (this.filtroEstado !== '') {
      resultado = resultado.filter(empleado => 
        empleado.estado?.toString() === this.filtroEstado
      );
    }

    // Filtro por turno
    if (this.filtroTurno) {
      resultado = resultado.filter(empleado => 
        empleado.turno === this.filtroTurno
      );
    }

    this.empleadosFiltrados = resultado;
    this.totalEmpleados = resultado.length;
    this.calcularPaginacion();
    this.actualizarPaginacion();
  }

  // Métodos de paginación
  calcularPaginacion(): void {
    this.totalPaginas = Math.ceil(this.totalEmpleados / this.elementosPorPagina);
    if (this.paginaActual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaActual = this.totalPaginas;
    }
    if (this.paginaActual < 1) {
      this.paginaActual = 1;
    }
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.elementosPorPagina;
    const fin = inicio + this.elementosPorPagina;
    this.empleadosPaginados = this.empleadosFiltrados.slice(inicio, fin);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.actualizarPaginacion();
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.actualizarPaginacion();
    }
  }

  irAPagina(pagina: number): void {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  getPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  getInicioPaginacion(): number {
    return this.totalEmpleados === 0 ? 0 : (this.paginaActual - 1) * this.elementosPorPagina + 1;
  }

  getFinPaginacion(): number {
    return Math.min(this.paginaActual * this.elementosPorPagina, this.totalEmpleados);
  }

  // Métodos del modal
  abrirModal(): void {
    this.mostrarModal = true;
    this.modoEdicion = false;
    this.empleadoForm.reset();
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modoEdicion = false;
    this.empleadoSeleccionado = undefined;
    this.empleadoForm.reset();
    
    // Limpiar todos los errores de validación
    Object.keys(this.empleadoForm.controls).forEach(key => {
      const control = this.empleadoForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
  }

  editarEmpleado(empleado: Empleado): void {
    this.empleadoSeleccionado = { ...empleado }; // Crear una copia del empleado
    this.modoEdicion = true;
    this.mostrarModal = true;
    
    this.empleadoForm.patchValue({
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      ci: empleado.ci,
      correo: empleado.correo,
      cargo: empleado.cargo,
      turno: empleado.turno,
      telefono: empleado.telefono
    });

    // Resetear el estado de validación
    this.empleadoForm.markAsUntouched();
    Object.keys(this.empleadoForm.controls).forEach(key => {
      const control = this.empleadoForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsUntouched();
      }
    });
  }

  guardarEmpleado(): void {
    if (this.empleadoForm.valid) {
      this.cargando = true;
      const formData = this.empleadoForm.value;

      if (this.modoEdicion && this.empleadoSeleccionado?.id) {
        // Para edición: construir empleado con todos los campos requeridos
        const empleadoParaActualizar: Empleado = {
          id: this.empleadoSeleccionado.id,
          nombre: formData.nombre,
          apellido: formData.apellido,
          ci: formData.ci,
          correo: formData.correo,
          cargo: formData.cargo,
          turno: formData.turno, // Ya viene en mayúsculas del select
          telefono: formData.telefono,
          fechaInicio: this.empleadoSeleccionado.fechaInicio, // Preservar fecha original
          estado: this.empleadoSeleccionado.estado // Preservar estado original
        };

        console.log('Datos a enviar para actualización:', empleadoParaActualizar);

        this.empleadoService.updateEmpleado(this.empleadoSeleccionado.id, empleadoParaActualizar).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.cargarEmpleados();
            this.cerrarModal();
            this.cargando = false;
            this.notificacionesService.showSuccess('Empleado actualizado exitosamente');
          },
          error: (error) => {
            console.error('Error completo al actualizar empleado:', error);
            console.error('Status:', error.status);
            console.error('Error body:', error.error);
            this.cargando = false;
            
            let mensajeError = 'Error al actualizar el empleado';
            if (error.status === 400) {
              if (error.error?.error) {
                mensajeError = error.error.error;
              } else {
                mensajeError = 'Datos inválidos. Verifica que todos los campos estén correctos.';
              }
            } else if (error.status === 404) {
              mensajeError = 'El empleado no fue encontrado.';
            } else if (error.error?.mensaje) {
              mensajeError = error.error.mensaje;
            }
            
            this.notificacionesService.showError(mensajeError);
          }
        });
      } else {
        // Para creación: construir empleado con todos los campos requeridos
        const nuevoEmpleado: Empleado = {
          nombre: formData.nombre,
          apellido: formData.apellido,
          ci: formData.ci,
          correo: formData.correo,
          cargo: formData.cargo,
          turno: formData.turno, // Ya viene en mayúsculas del select
          telefono: formData.telefono,
          fechaInicio: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
          estado: 1 // Activo por defecto
        };

        console.log('Datos a enviar para creación:', nuevoEmpleado);

        this.empleadoService.createEmpleado(nuevoEmpleado).subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            this.cargarEmpleados();
            this.cerrarModal();
            this.cargando = false;
            this.notificacionesService.showSuccess('Empleado creado exitosamente');
          },
          error: (error) => {
            console.error('Error al crear empleado:', error);
            this.cargando = false;
            
            let mensajeError = 'Error al crear el empleado';
            if (error.status === 400) {
              if (error.error?.error) {
                mensajeError = error.error.error;
              } else {
                mensajeError = 'Datos inválidos. Verifica que todos los campos estén correctos.';
              }
            } else if (error.error?.mensaje) {
              mensajeError = error.error.mensaje;
            }
            
            this.notificacionesService.showError(mensajeError);
          }
        });
      }
    } else {
      this.notificacionesService.showWarning('Por favor completa todos los campos correctamente');
      this.marcarCamposComoTocados();
    }
  }

  eliminarEmpleado(empleado: Empleado): void {
    this.notificacionesService.showConfirm(
      `Se eliminará permanentemente el empleado ${empleado.nombre} ${empleado.apellido}. Esta acción no se puede deshacer.`,
      '¿Estás seguro?'
    ).then((confirmed) => {
      if (confirmed && empleado.id) {
        this.empleadoService.deleteEmpleado(empleado.id).subscribe({
          next: () => {
            this.cargarEmpleados();
            this.notificacionesService.showSuccess('Empleado eliminado exitosamente');
          },
          error: (error) => {
            console.error('Error al eliminar empleado:', error);
            this.notificacionesService.showError('Error al eliminar el empleado');
          }
        });
      }
    });
  }

  toggleEstado(empleado: Empleado): void {
    if (empleado.id) {
      if (empleado.estado === 1) {
        this.empleadoService.desactivarEmpleado(empleado.id).subscribe({
          next: () => {
            this.cargarEmpleados();
            this.notificacionesService.showInfo(`Empleado ${empleado.nombre} ${empleado.apellido} desactivado`);
          },
          error: (error) => {
            console.error('Error al desactivar empleado:', error);
            this.notificacionesService.showError('Error al desactivar el empleado');
          }
        });
      } else {
        this.empleadoService.activarEmpleado(empleado.id).subscribe({
          next: () => {
            this.cargarEmpleados();
            this.notificacionesService.showInfo(`Empleado ${empleado.nombre} ${empleado.apellido} activado`);
          },
          error: (error) => {
            console.error('Error al activar empleado:', error);
            this.notificacionesService.showError('Error al activar el empleado');
          }
        });
      }
    }
  }

  // Métodos auxiliares
  getIniciales(nombre: string, apellido: string): string {
    return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
  }

  getTurnoClass(turno: string): string {
    switch (turno) {
      case 'MAÑANA':
        return 'bg-yellow-100 text-yellow-800';
      case 'TARDE':
        return 'bg-orange-100 text-orange-800';
      case 'NOCHE':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLETO':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTurnoDisplayName(turno: string): string {
    switch (turno) {
      case 'MAÑANA':
        return 'Mañana';
      case 'TARDE':
        return 'Tarde';
      case 'NOCHE':
        return 'Noche';
      case 'COMPLETO':
        return 'Completo';
      default:
        return turno;
    }
  }

  // Validadores asíncronos
  validarCiUnico(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || control.value === '') {
      return Promise.resolve(null);
    }

    // Si estamos editando, no validar el CI del mismo empleado
    if (this.modoEdicion && this.empleadoSeleccionado?.ci === control.value) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      // Agregar un pequeño delay para evitar demasiadas llamadas
      setTimeout(() => {
        this.empleadoService.validarCi(control.value).subscribe({
          next: (response) => {
            resolve(response.existe ? { ciExiste: true } : null);
          },
          error: (error) => {
            console.error('Error al validar CI:', error);
            resolve(null);
          }
        });
      }, 300);
    });
  }

  validarCorreoUnico(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || control.value === '') {
      return Promise.resolve(null);
    }

    // Si estamos editando, no validar el correo del mismo empleado
    if (this.modoEdicion && this.empleadoSeleccionado?.correo === control.value) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        this.empleadoService.validarCorreo(control.value).subscribe({
          next: (response) => {
            resolve(response.existe ? { correoExiste: true } : null);
          },
          error: (error) => {
            console.error('Error al validar correo:', error);
            resolve(null);
          }
        });
      }, 300);
    });
  }

  validarTelefonoUnico(control: AbstractControl): Promise<ValidationErrors | null> {
    if (!control.value || control.value === '') {
      return Promise.resolve(null);
    }

    // Si estamos editando, no validar el teléfono del mismo empleado
    if (this.modoEdicion && this.empleadoSeleccionado?.telefono === control.value) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        this.empleadoService.validarTelefono(control.value).subscribe({
          next: (response) => {
            resolve(response.existe ? { telefonoExiste: true } : null);
          },
          error: (error) => {
            console.error('Error al validar teléfono:', error);
            resolve(null);
          }
        });
      }, 300);
    });
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.empleadoForm.controls).forEach(key => {
      const control = this.empleadoForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  // ==================== MÉTODOS DE EXPORTACIÓN ====================

  exportarExcel(): void {
    try {
      // Preparar datos para exportación
      const datosExportacion = this.empleadosFiltrados.map(empleado => ({
        'ID': empleado.id,
        'Nombre': empleado.nombre,
        'Apellido': empleado.apellido,
        'CI': empleado.ci,
        'Correo': empleado.correo,
        'Cargo': empleado.cargo,
        'Turno': this.getTurnoDisplayName(empleado.turno),
        'Teléfono': empleado.telefono,
        'Fecha Inicio': empleado.fechaInicio,
        'Estado': empleado.estado === 1 ? 'Activo' : 'Inactivo'
      }));

      // Crear workbook y worksheet
      const ws = this.crearWorksheet(datosExportacion);
      const wb = { Sheets: { 'Empleados': ws }, SheetNames: ['Empleados'] };

      // Aplicar estilos al header
      this.aplicarEstilosExcel(ws, datosExportacion.length);

      // Generar archivo Excel
      const excelBuffer = this.writeExcelFile(wb);
      this.guardarArchivoExcel(excelBuffer, 'empleados.xlsx');

      this.notificacionesService.showSuccess('Archivo Excel exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      this.notificacionesService.showError('Error al exportar archivo Excel');
    }
  }

  exportarPDF(): void {
    try {
      // Crear documento PDF
      const doc = this.crearDocumentoPDF();
      
      // Agregar encabezado
      this.agregarEncabezadoPDF(doc);
      
      // Agregar tabla de empleados
      this.agregarTablaPDF(doc);
      
      // Agregar pie de página
      this.agregarPiePaginaPDF(doc);
      
      // Guardar archivo
      doc.save('empleados.pdf');
      
      this.notificacionesService.showSuccess('Archivo PDF exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      this.notificacionesService.showError('Error al exportar archivo PDF');
    }
  }

  // ==================== MÉTODOS AUXILIARES PARA EXCEL ====================

  private crearWorksheet(datos: any[]): any {
    // Simular creación de worksheet (necesitarás la librería XLSX real)
    const ws: any = {};
    
    if (datos.length === 0) return ws;

    // Headers
    const headers = Object.keys(datos[0]);
    headers.forEach((header, index) => {
      const cellAddress = this.numberToExcelColumn(index + 1) + '1';
      ws[cellAddress] = { v: header, t: 's' };
    });

    // Data rows
    datos.forEach((row, rowIndex) => {
      headers.forEach((header, colIndex) => {
        const cellAddress = this.numberToExcelColumn(colIndex + 1) + (rowIndex + 2);
        ws[cellAddress] = { v: row[header], t: typeof row[header] === 'number' ? 'n' : 's' };
      });
    });

    // Set range
    const range = `A1:${this.numberToExcelColumn(headers.length)}${datos.length + 1}`;
    ws['!ref'] = range;

    return ws;
  }

  private aplicarEstilosExcel(ws: any, dataLength: number): void {
    // Aplicar estilos al header (fila 1)
    const headers = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'];
    headers.forEach(cell => {
      if (ws[cell]) {
        ws[cell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '6366F1' } },
          alignment: { horizontal: 'center' }
        };
      }
    });

    // Aplicar auto-ancho a las columnas
    const columnWidths = [
      { wch: 5 },   // ID
      { wch: 15 },  // Nombre
      { wch: 15 },  // Apellido
      { wch: 12 },  // CI
      { wch: 25 },  // Correo
      { wch: 20 },  // Cargo
      { wch: 10 },  // Turno
      { wch: 12 },  // Teléfono
      { wch: 12 },  // Fecha Inicio
      { wch: 10 }   // Estado
    ];
    ws['!cols'] = columnWidths;
  }

  private writeExcelFile(wb: any): ArrayBuffer {
    // Simular escritura del archivo Excel
    // En implementación real, usar: XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const jsonStr = JSON.stringify(wb);
    const buffer = new ArrayBuffer(jsonStr.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < jsonStr.length; i++) {
      view[i] = jsonStr.charCodeAt(i) & 0xFF;
    }
    return buffer;
  }

  private guardarArchivoExcel(buffer: ArrayBuffer, filename: string): void {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private numberToExcelColumn(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }

  // ==================== MÉTODOS AUXILIARES PARA PDF ====================

  private crearDocumentoPDF(): any {
    // Crear documento PDF simulado
    const doc = {
      content: [] as any[],
      pageSize: 'A4',
      pageOrientation: 'landscape' as 'landscape',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        fontSize: 10,
        font: 'Helvetica'
      },
      save: (filename: string) => {
        this.simularGuardadoPDF(filename);
      }
    };
    return doc;
  }

  private agregarEncabezadoPDF(doc: any): void {
    const fechaActual = new Date().toLocaleDateString('es-ES');
    
    doc.content.push({
      text: 'REPORTE DE EMPLEADOS',
      style: 'header',
      alignment: 'center',
      margin: [0, 0, 0, 20]
    });

    doc.content.push({
      text: `Fecha de generación: ${fechaActual}`,
      style: 'subheader',
      alignment: 'right',
      margin: [0, 0, 0, 10]
    });

    doc.content.push({
      text: `Total de empleados: ${this.empleadosFiltrados.length}`,
      style: 'subheader',
      alignment: 'left',
      margin: [0, 0, 0, 20]
    });

    // Definir estilos
    doc.styles = {
      header: {
        fontSize: 18,
        bold: true,
        color: '#6366F1'
      },
      subheader: {
        fontSize: 12,
        color: '#64748B'
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'white',
        fillColor: '#6366F1'
      }
    };
  }

  private agregarTablaPDF(doc: any): void {
    const tableBody = [];
    
    // Header de la tabla
    tableBody.push([
      { text: 'ID', style: 'tableHeader', alignment: 'center' },
      { text: 'Nombre', style: 'tableHeader', alignment: 'center' },
      { text: 'Apellido', style: 'tableHeader', alignment: 'center' },
      { text: 'CI', style: 'tableHeader', alignment: 'center' },
      { text: 'Correo', style: 'tableHeader', alignment: 'center' },
      { text: 'Cargo', style: 'tableHeader', alignment: 'center' },
      { text: 'Turno', style: 'tableHeader', alignment: 'center' },
      { text: 'Teléfono', style: 'tableHeader', alignment: 'center' },
      { text: 'Estado', style: 'tableHeader', alignment: 'center' }
    ]);

    // Datos de la tabla
    this.empleadosFiltrados.forEach(empleado => {
      tableBody.push([
        { text: empleado.id?.toString() || '', alignment: 'center' },
        { text: empleado.nombre, alignment: 'left' },
        { text: empleado.apellido, alignment: 'left' },
        { text: empleado.ci, alignment: 'center' },
        { text: empleado.correo, alignment: 'left', fontSize: 8 },
        { text: empleado.cargo, alignment: 'left' },
        { text: this.getTurnoDisplayName(empleado.turno), alignment: 'center' },
        { text: empleado.telefono, alignment: 'center' },
        { 
          text: empleado.estado === 1 ? 'Activo' : 'Inactivo', 
          alignment: 'center',
          color: empleado.estado === 1 ? '#10B981' : '#EF4444'
        }
      ]);
    });

    doc.content.push({
      table: {
        headerRows: 1,
        widths: ['5%', '12%', '12%', '10%', '20%', '15%', '8%', '10%', '8%'],
        body: tableBody
      },
      layout: {
        fillColor: (rowIndex: number) => {
          return (rowIndex === 0) ? '#6366F1' : (rowIndex % 2 === 0 ? '#F8FAFC' : null);
        },
        hLineWidth: () => 0.5,
        vLineWidth: () => 0.5,
        hLineColor: () => '#E2E8F0',
        vLineColor: () => '#E2E8F0'
      }
    });
  }

  private agregarPiePaginaPDF(doc: any): void {
    doc.content.push({
      text: '\n\nEste reporte fue generado automáticamente por el Sistema de Gestión de Empleados.',
      style: 'footer',
      alignment: 'center',
      margin: [0, 30, 0, 0]
    });

    doc.styles.footer = {
      fontSize: 8,
      color: '#94A3B8',
      italics: true
    };

    // Agregar numeración de páginas
    doc.footer = (currentPage: number, pageCount: number) => {
      return {
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'center',
        fontSize: 8,
        color: '#94A3B8'
      };
    };
  }

  private simularGuardadoPDF(filename: string): void {
    // Crear contenido HTML para convertir a PDF
    const contenidoHTML = this.generarContenidoHTML();
    
    // Crear blob y descargar
    const blob = new Blob([contenidoHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.pdf', '.html');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    // Mostrar instrucciones para convertir a PDF
    setTimeout(() => {
      this.notificacionesService.showInfo('Se ha descargado un archivo HTML. Para convertir a PDF, abre el archivo y usa "Imprimir > Guardar como PDF" en tu navegador.');
    }, 1000);
  }

  private generarContenidoHTML(): string {
    const fechaActual = new Date().toLocaleDateString('es-ES');
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Empleados</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; color: #6366F1; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .fecha { text-align: right; color: #64748B; }
          .total { color: #64748B; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; }
          th { background-color: #6366F1; color: white; text-align: center; }
          tr:nth-child(even) { background-color: #F8FAFC; }
          .activo { color: #10B981; font-weight: bold; }
          .inactivo { color: #EF4444; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94A3B8; font-style: italic; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">REPORTE DE EMPLEADOS</div>
        <div class="info">
          <div class="fecha">Fecha de generación: ${fechaActual}</div>
          <div class="total">Total de empleados: ${this.empleadosFiltrados.length}</div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>CI</th>
              <th>Correo</th>
              <th>Cargo</th>
              <th>Turno</th>
              <th>Teléfono</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    this.empleadosFiltrados.forEach(empleado => {
      const estadoClass = empleado.estado === 1 ? 'activo' : 'inactivo';
      const estadoTexto = empleado.estado === 1 ? 'Activo' : 'Inactivo';
      
      html += `
        <tr>
          <td style="text-align: center;">${empleado.id || ''}</td>
          <td>${empleado.nombre}</td>
          <td>${empleado.apellido}</td>
          <td style="text-align: center;">${empleado.ci}</td>
          <td>${empleado.correo}</td>
          <td>${empleado.cargo}</td>
          <td style="text-align: center;">${this.getTurnoDisplayName(empleado.turno)}</td>
          <td style="text-align: center;">${empleado.telefono}</td>
          <td style="text-align: center;" class="${estadoClass}">${estadoTexto}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
        
        <div class="footer">
          Este reporte fue generado automáticamente por el Sistema de Gestión de Empleados.
        </div>
        
        <div class="no-print" style="margin-top: 30px; padding: 15px; background-color: #FEF3C7; border-radius: 8px; border: 1px solid #F59E0B;">
          <strong>Instrucciones:</strong> Para convertir este archivo a PDF, presiona Ctrl+P (o Cmd+P en Mac), 
          selecciona "Guardar como PDF" como destino y haz clic en "Guardar".
        </div>
      </body>
      </html>
    `;

    return html;
  }
  
  
}
