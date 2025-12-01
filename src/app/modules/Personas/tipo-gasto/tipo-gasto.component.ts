import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TipoGastoService, TipoGasto, CrearTipoGastoDto, ActualizarTipoGastoDto } from '../../../core/services/tipo-gasto.service';

type EstadoFiltro = 'all' | 1 | 0;

@Component({
  selector: 'app-tipo-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tipo-gasto.component.html',
  styleUrls: ['./tipo-gasto.component.css']
})
export class TipoGastoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TipoGastoService);

  // Data
  tipos: TipoGasto[] = [];
  filtrados: TipoGasto[] = [];
  loading = false;

  // Filtros
  search = '';
  estadoFiltro: EstadoFiltro = 'all';

  // Contadores
  total = 0;
  activos = 0;
  inactivos = 0;

  // Form (crear/editar)
  form!: FormGroup;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  showModal = false;

  // Toast
  toast: { show: boolean; type: 'success'|'error'|'info'; message: string } = { show: false, type: 'info', message: '' };

  ngOnInit(): void {
    this.initForm();
    this.cargar(); // carga inicial
  }

  private initForm() {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      observaciones: ['', [Validators.maxLength(200)]],
      estado: [1]
    });
  }

  // -------- Data ----------
  cargar(estado?: 0 | 1) {
    this.loading = true;
    this.service.listar(estado).subscribe({
      next: (data) => {
        this.tipos = data ?? [];
        this.aplicarFiltros();
        this.computeCounters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify('error', 'No se pudo cargar la lista de tipos de gasto');
        console.error(err);
      }
    });
  }

  private computeCounters() {
    this.total = this.tipos.length;
    this.activos = this.tipos.filter(t => t.estado === 1).length;
    this.inactivos = this.tipos.filter(t => t.estado === 0).length;
  }

  // -------- Filtros ----------
  onSearchChange() {
    this.aplicarFiltros();
  }

  onEstadoChange(value: string) {
    if (value === 'all') {
      this.estadoFiltro = 'all';
      this.cargar(); // todos
    } else {
      const v = Number(value) as 0 | 1;
      this.estadoFiltro = v;
      this.cargar(v); // filtrado desde backend
    }
  }
onActivoToggle(e: Event) {
  const checked = (e.target as HTMLInputElement | null)?.checked ?? false;
  this.form.patchValue({ estado: checked ? 1 : 0 });
}

  limpiarFiltros() {
    this.search = '';
    this.estadoFiltro = 'all';
    this.cargar();
  }

  private aplicarFiltros() {
    const term = this.search.trim().toLowerCase();
    this.filtrados = this.tipos.filter(t =>
      !term ||
      (t.descripcion ?? '').toLowerCase().includes(term) ||
      (t.observaciones ?? '').toLowerCase().includes(term) ||
      String(t.idTipoGasto).includes(term)
    );
  }

  trackById = (_: number, item: TipoGasto) => item.idTipoGasto;

  // -------- Crear / Editar ----------
  abrirNuevo() {
    this.formMode = 'create';
    this.editingId = null;
    this.form.reset({ descripcion: '', observaciones: '', estado: 1 });
    this.showModal = true;
  }

  abrirEditar(item: TipoGasto) {
    this.formMode = 'edit';
    this.editingId = item.idTipoGasto;
    this.form.reset({
      descripcion: item.descripcion ?? '',
      observaciones: item.observaciones ?? '',
      estado: item.estado
    });
    this.showModal = true;
  }

  cerrarModal() { this.showModal = false; }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload: CrearTipoGastoDto | ActualizarTipoGastoDto = {
      descripcion: this.form.value.descripcion.trim(),
      observaciones: this.form.value.observaciones?.trim() || undefined,
      estado: this.form.value.estado
    };

    if (this.formMode === 'create') {
      this.service.crear(payload as CrearTipoGastoDto).subscribe({
        next: (nuevo) => {
          // Si el filtro activo no coincide, recargar desde backend
          const debeRecargar = (this.estadoFiltro !== 'all') && (nuevo.estado !== this.estadoFiltro);
          if (debeRecargar) this.cargar(this.estadoFiltro as 0 | 1);
          else {
            this.tipos.unshift(nuevo);
            this.aplicarFiltros();
            this.computeCounters();
          }
          this.notify('success', 'Tipo de gasto creado correctamente');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo crear el tipo de gasto'));
          console.error(err);
        }
      });
    } else if (this.formMode === 'edit' && this.editingId != null) {
      this.service.actualizar(this.editingId, payload as ActualizarTipoGastoDto).subscribe({
        next: (upd) => {
          const idx = this.tipos.findIndex(t => t.idTipoGasto === upd.idTipoGasto);
          if (idx > -1) this.tipos[idx] = upd;
          else this.tipos.unshift(upd);
          this.aplicarFiltros();
          this.computeCounters();
          this.notify('success', 'Tipo de gasto actualizado');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo actualizar'));
          console.error(err);
        }
      });
    }
  }

  // -------- Estado ----------
  toggleEstado(item: TipoGasto) {
    const activar = item.estado === 0;
    const ok = confirm(`¿Seguro que deseas ${activar ? 'habilitar' : 'deshabilitar'} este tipo de gasto?`);
    if (!ok) return;

    const req$ = activar
      ? this.service.habilitarYObtener(item.idTipoGasto)
      : this.service.deshabilitarYObtener(item.idTipoGasto);

    req$.subscribe({
      next: (res) => {
        // Si tenemos filtro por estado y cambió, recargamos
        const filtroEspecifico = this.estadoFiltro !== 'all';
        const yaNoCoincide = filtroEspecifico && res.estado !== this.estadoFiltro;
        if (yaNoCoincide) this.cargar(this.estadoFiltro as 0 | 1);
        else {
          const idx = this.tipos.findIndex(t => t.idTipoGasto === res.idTipoGasto);
          if (idx > -1) this.tipos[idx] = res;
          this.aplicarFiltros();
          this.computeCounters();
        }
        this.notify('success', `Tipo ${activar ? 'habilitado' : 'deshabilitado'} correctamente`);
      },
      error: (err) => {
        this.notify('error', this.extractError(err, `No se pudo ${activar ? 'habilitar' : 'deshabilitar'}`));
        console.error(err);
      }
    });
  }

  // -------- Exportar ----------
  exportarCSV() {
    if (!this.filtrados.length) { this.notify('info', 'No hay datos para exportar'); return; }

    const headers = ['ID', 'Descripción', 'Observaciones', 'Estado', 'Creado', 'Actualizado'];
    const rows = this.filtrados.map(t => [
      t.idTipoGasto,
      this.safeCSV(t.descripcion ?? ''),
      this.safeCSV(t.observaciones ?? ''),
      t.estado === 1 ? 'Activo' : 'Inactivo',
      t.fechaCreacion ?? '',
      t.fechaActualizacion ?? ''
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipos_gasto_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private safeCSV(text: string) {
    const needsQuotes = /[",\n]/.test(text);
    const escaped = text.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
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

  private extractError(err: any, fallback: string): string {
    try { return err?.error?.error || err?.error?.message || err?.message || fallback; }
    catch { return fallback; }
  }
}
