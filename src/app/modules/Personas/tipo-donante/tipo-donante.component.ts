import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TipoDonanteService, TipoDonante, CrearTipoDonanteDto, ActualizarTipoDonanteDto } from '../../../core/services/tipo-donante.service';

type EstadoFiltro = 'all' | 1 | 0;

@Component({
  selector: 'app-tipo-donante',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tipo-donante.component.html',
  styleUrls: ['./tipo-donante.component.css']
})
export class TipoDonanteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(TipoDonanteService);

  // Data
  tipos: TipoDonante[] = [];
  filtrados: TipoDonante[] = [];
  loading = false;

  // Filtros (texto y estado)
  search = '';
  estadoFiltro: EstadoFiltro = 'all';

  // Contadores (sobre la data cargada)
  total = 0;
  activos = 0;
  inactivos = 0;

  // Form (crear/editar)
  form!: FormGroup;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  showModal = false;

  // Toast básico
  toast: { show: boolean; type: 'success'|'error'|'info'; message: string } = { show: false, type: 'info', message: '' };

  ngOnInit(): void {
    this.initForm();
    this.cargar(); // carga inicial (todos)
  }

  private initForm() {
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      caracteristicas: ['', [Validators.maxLength(200)]],
      beneficios: ['', [Validators.maxLength(100)]],
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
        this.notify('error', 'No se pudo cargar la lista de tipos de donante');
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
    // Al cambiar estado, volvemos a consultar al backend con ?estado=
    if (value === 'all') {
      this.estadoFiltro = 'all';
      this.cargar(); // todos
    } else {
      const v = Number(value) as 0 | 1;
      this.estadoFiltro = v;
      this.cargar(v); // solo ese estado
    }
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
      t.descripcion?.toLowerCase().includes(term) ||
      (t.caracteristicas ?? '').toLowerCase().includes(term) ||
      (t.beneficios ?? '').toLowerCase().includes(term)
    );
  }

  trackById = (_: number, item: TipoDonante) => item.idTipoDonante;

  // -------- Crear / Editar ----------
  abrirNuevo() {
    this.formMode = 'create';
    this.editingId = null;
    this.form.reset({ descripcion: '', caracteristicas: '', beneficios: '', estado: 1 });
    this.showModal = true;
  }

  abrirEditar(item: TipoDonante) {
    this.formMode = 'edit';
    this.editingId = item.idTipoDonante;
    this.form.reset({
      descripcion: item.descripcion,
      caracteristicas: item.caracteristicas ?? '',
      beneficios: item.beneficios ?? '',
      estado: item.estado
    });
    this.showModal = true;
  }

  cerrarModal() { this.showModal = false; }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payload: CrearTipoDonanteDto | ActualizarTipoDonanteDto = {
      descripcion: this.form.value.descripcion.trim(),
      caracteristicas: this.form.value.caracteristicas?.trim() || undefined,
      beneficios: this.form.value.beneficios?.trim() || undefined,
      estado: this.form.value.estado
    };

    if (this.formMode === 'create') {
      this.service.crear(payload as CrearTipoDonanteDto).subscribe({
        next: (nuevo) => {
          // Si hay filtro por estado activo/inactivo y no coincide, recargar desde backend
          const debeRecargar = (this.estadoFiltro !== 'all') && (nuevo.estado !== this.estadoFiltro);
          if (debeRecargar) this.cargar(this.estadoFiltro as 0 | 1);
          else {
            this.tipos.unshift(nuevo);
            this.aplicarFiltros();
            this.computeCounters();
          }
          this.notify('success', 'Tipo de donante creado correctamente');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo crear el tipo de donante'));
          console.error(err);
        }
      });
    } else if (this.formMode === 'edit' && this.editingId != null) {
      this.service.actualizar(this.editingId, payload as ActualizarTipoDonanteDto).subscribe({
        next: (upd) => {
          const idx = this.tipos.findIndex(t => t.idTipoDonante === upd.idTipoDonante);
          if (idx > -1) this.tipos[idx] = upd;
          else this.tipos.unshift(upd);
          this.aplicarFiltros();
          this.computeCounters();
          this.notify('success', 'Tipo de donante actualizado');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo actualizar'));
          console.error(err);
        }
      });
    }
  }

  // -------- Estado (PATCH + refresco) ----------
  toggleEstado(item: TipoDonante) {
    const activar = item.estado === 0;
    const ok = confirm(`¿Seguro que deseas ${activar ? 'habilitar' : 'deshabilitar'} este tipo de donante?`);
    if (!ok) return;

    const req$ = activar
      ? this.service.habilitarYObtener(item.idTipoDonante)
      : this.service.deshabilitarYObtener(item.idTipoDonante);

    req$.subscribe({
      next: (res) => {
        // Si tenemos filtro por estado y cambió, recargamos desde backend
        const filtroEspecifico = this.estadoFiltro !== 'all';
        const yaNoCoincide = filtroEspecifico && res.estado !== this.estadoFiltro;
        if (yaNoCoincide) this.cargar(this.estadoFiltro as 0 | 1);
        else {
          const idx = this.tipos.findIndex(t => t.idTipoDonante === res.idTipoDonante);
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

    const headers = ['ID', 'Descripción', 'Características', 'Beneficios', 'Estado', 'Creado', 'Actualizado'];
    const rows = this.filtrados.map(t => [
      t.idTipoDonante,
      this.safeCSV(t.descripcion),
      this.safeCSV(t.caracteristicas ?? ''),
      this.safeCSV(t.beneficios ?? ''),
      t.estado === 1 ? 'Activo' : 'Inactivo',
      t.fechaCreacion ?? '',
      t.fechaActualizacion ?? ''
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipos_donante_${new Date().toISOString().slice(0,10)}.csv`;
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
