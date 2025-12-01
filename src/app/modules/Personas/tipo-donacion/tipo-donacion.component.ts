import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { TipoDonacion, TipoDonacionService, CrearTipoDonacionDto } from '../../../core/services/tipo-donacion.service';

@Component({
  selector: 'app-tipo-donacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tipo-donacion.component.html',
  styleUrls: ['./tipo-donacion.component.css']
})
export class TipoDonacionComponent implements OnInit {

  // Data
  items = signal<TipoDonacion[]>([]);
  filtrados = signal<TipoDonacion[]>([]);
  cargando = signal<boolean>(false);
  error = signal<string | null>(null);

  // Filtros
  termino = signal<string>('');
  filtroEstado = signal<'todos' | 'activos' | 'inactivos'>('todos');
filtroEstadoNum = signal<-1 | 0 | 1>(-1);

  // Stats
  total = computed(() => this.items().length);
  activos = computed(() => this.items().filter(i => i.estado === 1).length);
  inactivos = computed(() => this.items().filter(i => i.estado === 0).length);

  // Modal
  showModal = signal<boolean>(false);
  editando = signal<boolean>(false);
  idEditando: number | null = null;

  // Form
    form!: FormGroup;                 // <- declarar sin inicializar

  

  constructor(
    private fb: FormBuilder,
    private tipoDonacionSrv: TipoDonacionService
  ) {
    // ✅ ahora sí, fb ya existe
    this.form = this.fb.group({
      descripcion: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    this.cargar();
  }

  // ---- Cargar y filtrar ----
  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.tipoDonacionSrv.listar()
      .subscribe({
        next: (res) => {
          this.items.set(res);
          this.aplicarFiltros();
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set('No se pudo cargar la lista.');
          console.error(err);
          this.cargando.set(false);
        }
      });
  }

aplicarFiltros(): void {
  const term = this.termino().toLowerCase().trim();
  const estado = this.filtroEstadoNum();

  let data = [...this.items()];

  if (estado === 0 || estado === 1) {
    data = data.filter(d => d.estado === estado);
  }
  if (term) {
    data = data.filter(d =>
      (d.descripcion ?? '').toLowerCase().includes(term) ||
      String(d.idTipoDonacion).includes(term)
    );
  }
  this.filtrados.set(data);
}

get descCtrl() {
  return this.form.controls['descripcion'];
}

  limpiarFiltros(): void {
    this.termino.set('');
    this.filtroEstado.set('todos');
    this.aplicarFiltros();
  }

  trackById = (_: number, item: TipoDonacion) => item.idTipoDonacion;

  // ---- CRUD ----
  abrirNuevo(): void {
    this.form.reset();
    this.editando.set(false);
    this.idEditando = null;
    this.showModal.set(true);
  }

  abrirEditar(item: TipoDonacion): void {
    this.editando.set(true);
    this.idEditando = item.idTipoDonacion;
    this.form.patchValue({ descripcion: item.descripcion });
    this.showModal.set(true);
  }

  cerrarModal(): void {
    this.showModal.set(false);
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: CrearTipoDonacionDto = {
      descripcion: this.form.value.descripcion!,
      estado: 1
    };

    if (!this.editando()) {
      this.tipoDonacionSrv.crear(payload).subscribe({
        next: (nuevo) => {
          this.items.set([nuevo, ...this.items()]);
          this.aplicarFiltros();
          this.cerrarModal();
        },
        error: (err) => console.error(err)
      });
    } else {
      const id = this.idEditando!;
      this.tipoDonacionSrv.actualizar(id, { descripcion: payload.descripcion }).subscribe({
        next: (upd) => {
          this.items.set(this.items().map(i => i.idTipoDonacion === id ? upd : i));
          this.aplicarFiltros();
          this.cerrarModal();
        },
        error: (err) => console.error(err)
      });
    }
  }

  toggleEstado(item: TipoDonacion): void {
    const accion = item.estado === 1 ? 'deshabilitar' : 'habilitar';
    const confirma = window.confirm(`¿Seguro que deseas ${accion} el tipo "${item.descripcion}"?`);
    if (!confirma) return;

    const req = item.estado === 1
      ? this.tipoDonacionSrv.deshabilitar(item.idTipoDonacion)
      : this.tipoDonacionSrv.habilitar(item.idTipoDonacion);

    req.subscribe({
      next: () => {
        // refrescar una sola fila (consultando por id)
        this.tipoDonacionSrv.obtenerPorId(item.idTipoDonacion).subscribe({
          next: (fresh) => {
            this.items.set(this.items().map(x => x.idTipoDonacion === fresh.idTipoDonacion ? fresh : x));
            this.aplicarFiltros();
          }
        });
      },
      error: (err) => console.error(err)
    });
  }

  // ---- Exportar CSV ----
  exportarCSV(): void {
    const rows = this.filtrados();
    const header = ['ID', 'Descripción', 'Estado', 'Fecha Creación', 'Fecha Actualización'];
    const csv = [
      header.join(','),
      ...rows.map(r => [
        r.idTipoDonacion,
        `"${(r.descripcion ?? '').replace(/"/g, '""')}"`,
        r.estado === 1 ? 'Activo' : 'Inactivo',
        r.fechaCreacion ?? '',
        r.fechaActualizacion ?? ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tipos-donacion.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

    onEstadoChange(v: -1 | 0 | 1) {
  this.filtroEstadoNum.set(v);
  this.aplicarFiltros();
}

}
