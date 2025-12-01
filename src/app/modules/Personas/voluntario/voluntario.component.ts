import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EstadoBinario, Disponibilidad, VoluntarioService, Voluntario, VoluntarioStats, CrearVoluntarioDto, ActualizarVoluntarioDto } from '../../../core/services/voluntario.service';

type EstadoFiltro = 'all' | EstadoBinario;
type DispFiltro = 'all' | Disponibilidad;

@Component({
  selector: 'app-voluntarios',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './voluntario.component.html'
})
export class VoluntarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(VoluntarioService);

  // Data
  data: Voluntario[] = [];
  filtered: Voluntario[] = [];
  loading = false;

  // Stats
  stats: VoluntarioStats | null = null;

  // Filtros
  search = '';
  estadoFiltro: EstadoFiltro = 'all';
  dispFiltro: DispFiltro = 'all';

  // Form modal
  form!: FormGroup;
  formMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  showModal = false;
  crearUsuario = true; // login=email, pass=telefono

  // Toast
  toast = { show: false, type: <'success'|'error'|'info'> 'info', message: '' };

  ngOnInit(): void {
    this.initForm();
    this.cargar();
    this.cargarStats();
  }

  private initForm() {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      ci: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
      telefono: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],
      direccion: ['',[Validators.maxLength(200)]],
      especialidad: ['',[Validators.maxLength(100)]],
      disponibilidad: ['COMPLETA'],
      estado: [1]
    });
  }

  // ------------ Data ------------
  cargar(estado?: EstadoBinario) {
    this.loading = true;
    this.service.listar(estado).subscribe({
      next: (arr) => {
        console.log(arr)
        this.data = arr ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.notify('error', 'No se pudo cargar voluntarios');
        console.error(err);
      }
    });
  }

  cargarStats() {
   /* this.service.estadisticas().subscribe({
      next: (s) => (this.stats = s),
      error: () => (this.stats = null)
    });*/
  }

  // ------------ Filtros ------------
  onEstadoChange(val: string) {
    if (val === 'all') {
      this.estadoFiltro = 'all';
      this.cargar();
    } else {
      this.estadoFiltro = Number(val) as EstadoBinario;
      this.cargar(this.estadoFiltro);
    }
  }
  onDispChange(val: string) { this.dispFiltro = (val as DispFiltro); this.applyFilters(); }
  onSearchChange() { this.applyFilters(); }

  limpiarFiltros() {
    this.search = '';
    this.estadoFiltro = 'all';
    this.dispFiltro = 'all';
    this.cargar();
  }

  private applyFilters() {
    const term = this.search.trim().toLowerCase();
    this.filtered = this.data.filter(v => {
      const textOk =
        !term ||
        `${v.nombre} ${v.apellido}`.toLowerCase().includes(term) ||
        v.ci?.toLowerCase().includes(term) ||
        v.email?.toLowerCase().includes(term) ||
        v.telefono?.toLowerCase().includes(term) ||
        (v.especialidad ?? '').toLowerCase().includes(term);
      const dispOk = this.dispFiltro === 'all' || v.disponibilidad === this.dispFiltro;
      return textOk && dispOk;
    });
  }

  trackById = (_: number, item: Voluntario) => item.idVoluntario;

  // ------------ Modal ------------
  abrirNuevo() {
    this.formMode = 'create';
    this.editingId = null;
    this.crearUsuario = true;
    this.form.reset({
      nombre: '', apellido: '', ci: '', email: '', telefono: '',
      direccion: '', especialidad: '', disponibilidad: 'COMPLETA', estado: 1
    });
    this.showModal = true;
  }

  abrirEditar(item: Voluntario) {
    this.formMode = 'edit';
    this.editingId = item.idVoluntario;
    this.crearUsuario = false;
    this.form.reset({
      nombre: item.nombre, apellido: item.apellido, ci: item.ci, email: item.email,
      telefono: item.telefono, direccion: item.direccion ?? '', especialidad: item.especialidad ?? '',
      disponibilidad: item.disponibilidad ?? 'COMPLETA', estado: item.estado
    });
    this.showModal = true;
  }

  cerrarModal() { this.showModal = false; }

  guardar() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    const payloadBase = {
      nombre: this.form.value.nombre?.trim(),
      apellido: this.form.value.apellido?.trim(),
      ci: this.form.value.ci?.trim(),
      email: this.form.value.email?.trim(),
      telefono: this.form.value.telefono?.trim(),
      direccion: this.form.value.direccion?.trim() || null,
      especialidad: this.form.value.especialidad?.trim() || null,
      disponibilidad: this.form.value.disponibilidad as Disponibilidad,
      estado: this.form.value.estado as EstadoBinario,
    };

    if (this.formMode === 'create') {
      this.service.crear(payloadBase as CrearVoluntarioDto, this.crearUsuario).subscribe({
        next: (nuevo) => {
          const mustReload = (this.estadoFiltro !== 'all') && (nuevo.estado !== this.estadoFiltro);
          if (mustReload) this.cargar(this.estadoFiltro as EstadoBinario);
          else { this.data.unshift(nuevo); this.applyFilters(); }
          this.cargarStats();
          this.notify('success', 'Voluntario creado correctamente');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo crear el voluntario'));
          console.error(err);
        }
      });
    } else if (this.formMode === 'edit' && this.editingId != null) {
      this.service.actualizar(this.editingId, payloadBase as ActualizarVoluntarioDto).subscribe({
        next: (upd) => {
          const idx = this.data.findIndex(v => v.idVoluntario === upd.idVoluntario);
          if (idx > -1) this.data[idx] = upd; else this.data.unshift(upd);
          this.applyFilters();
          this.cargarStats();
          this.notify('success', 'Voluntario actualizado');
          this.cerrarModal();
        },
        error: (err) => {
          this.notify('error', this.extractError(err, 'No se pudo actualizar'));
          console.error(err);
        }
      });
    }
  }

  // ------------ Acciones ------------
  toggleEstado(item: Voluntario) {
    const activar = item.estado === 0;
    const ok = confirm(`¿Seguro que deseas ${activar ? 'activar' : 'desactivar'} a ${item.nombre}?`);
    if (!ok) return;

    this.service.cambiarEstado(item.idVoluntario, activar ? 1 : 0).subscribe({
      next: (res) => {
        const filtroEspecifico = this.estadoFiltro !== 'all';
        const yaNoCoincide = filtroEspecifico && res.estado !== this.estadoFiltro;
        if (yaNoCoincide) this.cargar(this.estadoFiltro as EstadoBinario);
        else {
          const idx = this.data.findIndex(v => v.idVoluntario === res.idVoluntario);
          if (idx > -1) this.data[idx] = res;
          this.applyFilters();
        }
        this.cargarStats();
        this.notify('success', activar ? 'Activado correctamente' : 'Desactivado correctamente');
      },
      error: (err) => {
        this.notify('error', this.extractError(err, 'No se pudo cambiar el estado'));
        console.error(err);
      }
    });
  }

  eliminar(item: Voluntario) {
    const ok = confirm(`¿Eliminar voluntario ${item.nombre} ${item.apellido}? Esta acción no se puede deshacer.`);
    if (!ok) return;
    this.service.eliminar(item.idVoluntario).subscribe({
      next: () => {
        this.data = this.data.filter(v => v.idVoluntario !== item.idVoluntario);
        this.applyFilters();
        this.cargarStats();
        this.notify('success', 'Eliminado correctamente');
      },
      error: (err) => {
        this.notify('error', this.extractError(err, 'No se pudo eliminar'));
        console.error(err);
      }
    });
  }

  // ------------ Exportar ------------
  exportarCSV() {
    if (!this.filtered.length) { this.notify('info', 'No hay datos para exportar'); return; }
    const headers = ['ID','Nombre','CI','Email','Teléfono','Disponibilidad','Estado','FechaRegistro'];
    const rows = this.filtered.map(v => [
      v.idVoluntario, `${v.nombre} ${v.apellido}`, v.ci, v.email, v.telefono,
      v.disponibilidad ?? '', v.estado === 1 ? 'Activo' : 'Inactivo', v.fechaRegistro ?? ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(x => this.safeCSV(String(x ?? ''))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `voluntarios_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
  private safeCSV(text: string) {
    const needsQuotes = /[",\n]/.test(text);
    const escaped = text.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  // ------------ Helpers ------------
  isInvalid(cn: string) {
    const c = this.form.get(cn); return !!c && c.invalid && (c.touched || c.dirty);
  }
  private notify(type: 'success'|'error'|'info', message: string) {
    this.toast = { show: true, type, message };
    setTimeout(() => (this.toast.show = false), 2500);
  }
  // voluntario.component.ts
private extractError(err: any, fallback: string): string {
  const e = err?.error;
  if (typeof e === 'string') return e;
  if (e?.error) return e.error;                     // { error: "..." }
  if (Array.isArray(e?.errors) && e.errors.length)  // Bean Validation list
    return e.errors[0].defaultMessage || e.errors[0].message || fallback;
  return err?.message || fallback;
}


}
