import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import {
  TipoBeneficiario,
  TipoBeneficiarioService,
  CrearTipoBeneficiarioDto,
  ActualizarTipoBeneficiarioDto
} from '../../../core/services/tipo-beneficiario.service';

@Component({
  selector: 'app-tipo-beneficiario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tipo-beneficiario.component.html',
  styleUrls: ['./tipo-beneficiario.component.css']
})
export class TipoBeneficiarioComponent implements OnInit {

  // UI state
  loading = false;
  showModal = false;
  isEditing = false;
  editingId: number | null = null;

  // Filters
  search = '';
  filtroEstado: 'todos' | '1' | '0' = 'todos';

  // Data
  tipos: TipoBeneficiario[] = [];
  tiposFiltrados: TipoBeneficiario[] = [];

  // Stats
  total = 0;
  activos = 0;
  inactivos = 0;

  // Form
  form!: FormGroup;

  // Toast simple opcional
  toast = { show: false, type: 'info' as 'success'|'error'|'info', message: '' };

  constructor(
    private fb: FormBuilder,
    private service: TipoBeneficiarioService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
    this.cargar();
  }

  // -------- Helpers ----------
  isInvalid(control: string) {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  private notify(type: 'success'|'error'|'info', message: string) {
    this.toast = { show: true, type, message };
    setTimeout(() => (this.toast.show = false), 2500);
  }

  // -------- Cargar / Filtros ----------
  cargar() {
    this.loading = true;
    const estadoParam = this.filtroEstado === 'todos' ? undefined : (this.filtroEstado as unknown as 0|1);

    this.service.listar(estadoParam).subscribe({
      next: (data) => {
        this.tipos = data;
        this.aplicarFiltros();
        this.computeStats();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        Swal.fire('Error', 'No se pudo cargar la lista.', 'error');
      }
    });
  }

  aplicarFiltros() {
    const q = this.search.trim().toLowerCase();
    const bySearch = (t: TipoBeneficiario) => t.descripcion?.toLowerCase().includes(q);
    this.tiposFiltrados = !q ? [...this.tipos] : this.tipos.filter(bySearch);
  }

  limpiarFiltros() {
    this.search = '';
    this.filtroEstado = 'todos';
    this.cargar();
  }

  computeStats() {
    this.total = this.tipos.length;
    this.activos = this.tipos.filter(t => t.estado === 1).length;
    this.inactivos = this.tipos.filter(t => t.estado === 0).length;
  }

  // -------- Modal CRUD ----------
  abrirModalCrear() {
    this.isEditing = false;
    this.editingId = null;
    this.form.reset();
    this.showModal = true;
  }

  abrirModalEditar(item: TipoBeneficiario) {
    this.isEditing = true;
    this.editingId = item.idTipoBeneficiario;
    this.form.reset({
      descripcion: item.descripcion
    });
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.form.reset();
    this.isEditing = false;
    this.editingId = null;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CrearTipoBeneficiarioDto | ActualizarTipoBeneficiarioDto = {
      descripcion: this.form.value.descripcion.trim()
    };

    this.loading = true;

    if (!this.isEditing) {
      // Crear
      this.service.crear(payload as CrearTipoBeneficiarioDto).subscribe({
        next: (nuevo) => {
          this.loading = false;
          this.notify('success', 'Tipo de beneficiario creado.');
          this.cerrarModal();
          // refrescamos la lista (o push y recalcular filtros/stats)
          this.cargar();
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          Swal.fire('Error', err?.error?.message || 'No se pudo crear.', 'error');
        }
      });
    } else {
      // Actualizar
      this.service.actualizar(this.editingId!, payload).subscribe({
        next: (upd) => {
          this.loading = false;
          this.notify('success', 'Tipo de beneficiario actualizado.');
          this.cerrarModal();
          this.cargar();
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          Swal.fire('Error', err?.error?.message || 'No se pudo actualizar.', 'error');
        }
      });
    }
  }

  // -------- Estado ----------
  toggleEstado(item: TipoBeneficiario) {
    const activar = item.estado === 0;
    Swal.fire({
      title: activar ? '¿Habilitar?' : '¿Deshabilitar?',
      text: activar
        ? 'El tipo de beneficiario quedará ACTIVO.'
        : 'El tipo de beneficiario quedará INACTIVO.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: activar ? 'Sí, habilitar' : 'Sí, deshabilitar',
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;

      const req$ = activar ? this.service.habilitar(item.idTipoBeneficiario) :
                             this.service.deshabilitar(item.idTipoBeneficiario);

      req$.subscribe({
        next: () => {
          this.notify('success', activar ? 'Habilitado correctamente.' : 'Deshabilitado correctamente.');
          // Actualizar en memoria sin recargar todo
          item.estado = activar ? 1 : 0;
          this.aplicarFiltros();
          this.computeStats();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
        }
      });
    });
  }

}
