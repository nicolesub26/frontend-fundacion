import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import Swal from 'sweetalert2';

import {
  Donante, DonanteService,
  CrearDonanteDto, ActualizarDonanteDto
} from '../../../core/services/donante.service';
import { TipoDonante, TipoDonanteService } from '../../../core/services/tipo-donante.service';

type ToastType = 'success'|'error'|'info';

@Component({
  selector: 'app-donante',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './donante.component.html',
  styleUrls: ['./donante.component.css']
})
export class DonanteComponent implements OnInit {
  // --- data ---
  donantes: Donante[] = [];
  tipos: TipoDonante[] = [];

  // --- ui state ---
  loading = false;
  saving  = false;
  showModal = false;
  modalTitle = 'Nuevo Donante';
  selectedId: number | null = null;

  // --- filtros ---
  search = '';
  filtroEstado: '' | '1' | '0' = '';
  filtroTipo: '' | number = '';

  // --- form ---
  form!: FormGroup;

  // --- toast ligero (opcional) ---
  toast = { show: false, type: 'success' as ToastType, message: '' };

  constructor(
    private fb: FormBuilder,
    private donanteSrv: DonanteService,
    private tipoSrv: TipoDonanteService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.cargarTipos();
    this.cargarDonantes();
  }

  private buildForm() {
    const nombreApeRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.\,\-]+$/;
    const ciRegex = /^[0-9]+(-[0-9A-Za-z]{1,3})?$/;
    const telRegex = /^[0-9]{7,15}$/;

    this.form = this.fb.group({
      nombre:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(nombreApeRegex)]],
      apellido:      ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(nombreApeRegex)]],
      ci:            ['', [Validators.minLength(7), Validators.maxLength(15), Validators.pattern(ciRegex)]],
      email:         ['', [Validators.email, Validators.maxLength(150)]],
      telefono:      ['', [Validators.pattern(telRegex)]],
      direccion:     ['', [Validators.maxLength(200)]],
      fechaRegistro: [''], // opcional (backend coloca hoy si está vacío)
      idTipoDonante: [null, [Validators.required]]
    });
  }

  // -------- Helpers ----------
  isInvalid(control: string) {
    const c = this.form.get(control);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  private notify(type: ToastType, message: string) {
    this.toast = { show: true, type, message };
    setTimeout(() => (this.toast.show = false), 2500);
  }

  private errMsg(err: any): string {
    return err?.error?.message || err?.message || 'Ocurrió un error';
  }

  // -------- Cargar data ----------
  cargarTipos() {
    // solo activos para selector
    this.tipoSrv.listar(1).subscribe({
      next: (ts) => (this.tipos = ts),
      error: (e) => this.notify('error', this.errMsg(e))
    });
  }

  cargarDonantes() {
    this.loading = true;
    const estado = this.filtroEstado === '' ? undefined : (Number(this.filtroEstado) as 0 | 1);
    this.donanteSrv.listar(estado).subscribe({
      next: (rows) => (this.donantes = rows),
      error: (e) => this.notify('error', this.errMsg(e)),
      complete: () => (this.loading = false)
    });
  }

  // -------- Filtrado local (search + tipo) ----------
  get rows(): Donante[] {
    const s = (this.search || '').toLowerCase().trim();
    return (this.donantes || []).filter(r => {
      const okTipo = this.filtroTipo === '' ? true : r.tipoDonanteId === this.filtroTipo;
      const okSearch =
        !s ||
        (r.nombre + ' ' + r.apellido).toLowerCase().includes(s) ||
        (r.ci || '').toLowerCase().includes(s) ||
        (r.email || '').toLowerCase().includes(s) ||
        (r.telefono || '').toLowerCase().includes(s);
      return okTipo && okSearch;
    });
  }

  // -------- Estadísticas ----------
  get total() { return this.donantes.length; }
  get activos() { return this.donantes.filter(d => d.estado === 1).length; }
  get inactivos() { return this.donantes.filter(d => d.estado === 0).length; }
  get cantTipos() { return this.tipos.length; }

  // -------- Modal ----------
  abrirNuevo() {
    this.modalTitle = 'Nuevo Donante';
    this.selectedId = null;
    this.form.reset();
    this.showModal = true;
  }

  abrirEditar(row: Donante) {
    this.modalTitle = 'Editar Donante';
    this.selectedId = row.idDonante;
    this.form.patchValue({
      nombre: row.nombre,
      apellido: row.apellido,
      ci: row.ci || '',
      email: row.email || '',
      telefono: row.telefono || '',
      direccion: row.direccion || '',
      fechaRegistro: row.fechaRegistro || '',
      idTipoDonante: row.tipoDonanteId
    });
    this.showModal = true;
  }

  cerrarModal() {
    this.showModal = false;
    this.saving = false;
  }

  // -------- Submit ----------
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify('error', 'Revisa los campos del formulario.');
      return;
    }

    const payload: CrearDonanteDto = {
      nombre: this.form.value.nombre?.trim(),
      apellido: this.form.value.apellido?.trim(),
      idTipoDonante: this.form.value.idTipoDonante,
      ci: this.form.value.ci?.trim() || undefined,
      email: this.form.value.email?.trim() || undefined,
      telefono: this.form.value.telefono?.trim() || undefined,
      direccion: this.form.value.direccion?.trim() || undefined,
      fechaRegistro: this.form.value.fechaRegistro || undefined
    };

    this.saving = true;

    const req$ = this.selectedId == null
      ? this.donanteSrv.crear(payload)
      : this.donanteSrv.actualizar(this.selectedId, payload as ActualizarDonanteDto);

    req$.subscribe({
      next: () => {
        this.notify('success', this.selectedId == null ? 'Donante creado' : 'Donante actualizado');
        this.cerrarModal();
        this.cargarDonantes();
      },
      error: (e) => {
        this.saving = false;
        Swal.fire({ icon: 'error', title: 'Error', text: this.errMsg(e) });
      }
    });
  }

  // -------- Estado (habilitar/deshabilitar) ----------
  toggleEstado(row: Donante) {
    const activar = row.estado === 0;
    const action = activar ? 'habilitar' : 'deshabilitar';

    Swal.fire({
      icon: 'question',
      title: `¿Deseas ${action} este donante?`,
      text: `${row.nombre} ${row.apellido}`,
      showCancelButton: true,
      confirmButtonText: `Sí, ${action}`,
      cancelButtonText: 'Cancelar'
    }).then(res => {
      if (!res.isConfirmed) return;

      const req$ = activar
        ? this.donanteSrv.habilitar(row.idDonante)
        : this.donanteSrv.deshabilitar(row.idDonante);

      req$.subscribe({
        next: () => {
          this.notify('success', `Donante ${activar ? 'habilitado' : 'deshabilitado'}.`);
          this.cargarDonantes();
        },
        error: (e) => Swal.fire({ icon: 'error', title: 'Error', text: this.errMsg(e) })
      });
    });
  }

  // -------- Export simple CSV ----------
  exportarCSV() {
    const header = ['ID','Nombre','Apellido','CI','Email','Teléfono','Tipo','Registro','Estado'];
    const lines = this.rows.map(r => [
      r.idDonante,
      r.nombre,
      r.apellido,
      r.ci ?? '',
      r.email ?? '',
      r.telefono ?? '',
      r.tipoDonanteDescripcion ?? r.tipoDonanteId ?? '',
      r.fechaRegistro ?? '',
      r.estado === 1 ? 'Activo' : 'Inactivo'
    ].map(v => `"${String(v).replaceAll('"','""')}"`).join(','));

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'donantes.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // -------- helpers UI ----------
  estadoBadgeClasses(e: number) {
    return e === 1
      ? 'bg-green-100 text-green-700 ring-1 ring-green-200'
      : 'bg-red-100 text-red-700 ring-1 ring-red-200';
  }

  trackById(_i: number, r: Donante) { return r.idDonante; }
}
