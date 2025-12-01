import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Articulo } from '../../../core/models/categoria.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { EmpleadoService, Empleado } from '../../../core/services/empleado.service';
import { GastoFundacionService, GastoDetalle, GastoFundacion } from '../../../core/services/gasto-fundacion.service';
import { TipoGastoService, TipoGasto } from '../../../core/services/tipo-gasto.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gastos.component.html'
})
export class GastosComponent {
  private fb = inject(FormBuilder);
  private gastosSrv = inject(GastoFundacionService);
  private articuloSrv = inject(ArticuloService);
  private tipoGastoSrv = inject(TipoGastoService);
  private empleadoSrv = inject(EmpleadoService);

  loading = signal(false);

  articulos = signal<Articulo[]>([]);
  tiposGasto = signal<TipoGasto[]>([]);
  empleados = signal<Empleado[]>([]);

  form = this.fb.group({
    fechaGasto: [new Date().toISOString().slice(0, 10), Validators.required],
    tipoGastoId: [null as number | null, Validators.required],
    empleadoId: [null as number | null, Validators.required],
    descripcion: ['', [Validators.required, (c: AbstractControl) => (c.value || '').trim().length < 5 ? { minlength: true } : null, Validators.maxLength(300)]],
    comprobante: [''],
    detalles: this.fb.array<FormGroup>([])
  });

  get detalles(): FormArray<FormGroup> {
    return this.form.get('detalles') as FormArray<FormGroup>;
  }

  totales = signal({ subtotal: 0, total: 0 });

  constructor() {
    this.articuloSrv.obtenerActivos().subscribe(a => this.articulos.set((a as any)?.data ?? a));
    this.tipoGastoSrv.listar(1).subscribe(t => this.tiposGasto.set((t as any)?.data ?? t));
    this.empleadoSrv.getEmpleadosActivos().subscribe(e => this.empleados.set((e as any)?.data ?? e));
    this.addDetalle();
    this.form.valueChanges.subscribe(() => this.recalcular());
    this.recalcular();
  }

  addDetalle(init?: Partial<{ articuloId: number; descripcion: string; cantidad: number; precio: number; unidad: string; proveedor: string }>) {
    const g = this.fb.group({
      articuloId: [init?.articuloId ?? null, Validators.required],
      descripcion: [init?.descripcion ?? '', [Validators.maxLength(200), Validators.minLength(3)]],
      cantidad: [init?.cantidad ?? 1, [Validators.required, Validators.min(1)]],
      precio: [init?.precio ?? 0.01, [Validators.required, Validators.min(0.01)]],
      unidad: [init?.unidad ?? ''],
      proveedor: [init?.proveedor ?? '']
    });
    this.detalles.push(g);
    this.recalcular();
  }

  removeDetalle(i: number) {
    this.detalles.removeAt(i);
    if (this.detalles.length === 0) this.addDetalle();
    this.recalcular();
  }

  filaSubtotal(i: number): number {
    const g = this.detalles.at(i);
    return Number(g.get('cantidad')?.value || 0) * Number(g.get('precio')?.value || 0);
  }

  private recalcular() {
    let sub = 0;
    for (let i = 0; i < this.detalles.length; i++) sub += this.filaSubtotal(i);
    this.totales.set({ subtotal: sub, total: sub });
  }

  limpiar() {
    this.form.reset({ fechaGasto: new Date().toISOString().slice(0, 10), tipoGastoId: null, empleadoId: null, descripcion: '', comprobante: '' });
    this.detalles.clear();
    this.addDetalle();
    this.recalcular();
  }

  private validarDetalles(): string[] {
    const errores: string[] = [];
    this.detalles.controls.forEach((g, i) => {
      if (!g.get('articuloId')?.value) errores.push(`Línea ${i + 1}: selecciona un artículo.`);
      if (Number(g.get('cantidad')?.value || 0) < 1) errores.push(`Línea ${i + 1}: cantidad debe ser ≥ 1.`);
      if (Number(g.get('precio')?.value || 0) < 0.01) errores.push(`Línea ${i + 1}: precio debe ser ≥ 0.01.`);
      const desc = (g.get('descripcion')?.value || '').trim();
      if (desc && desc.length < 3) errores.push(`Línea ${i + 1}: descripción debe tener al menos 3 caracteres.`);
    });
    return errores;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Revisá los campos en rojo.' });
      return;
    }
    if (this.detalles.length === 0) {
      Swal.fire({ icon: 'error', title: 'Sin detalles', text: 'Agrega al menos una línea.' });
      return;
    }
    const errs = this.validarDetalles();
    if (errs.length) {
      Swal.fire({ icon: 'error', title: 'Corregí estos puntos', html: `<ul style="text-align:left">${errs.map(e => `<li>${e}</li>`).join('')}</ul>` });
      return;
    }

    const v = this.form.getRawValue();

    // PASO 1: Crear gasto SIN detalles (backend tiene @JsonIgnore en detalles)
    const payload: GastoFundacion = {
      fechaGasto: v.fechaGasto!,
      descripcion: (v.descripcion || '').trim(),
      comprobante: (v.comprobante || '').trim() || undefined,
      tipoGasto: { idTipoGasto: Number(v.tipoGastoId) },
      empleado: { id: Number(v.empleadoId) },
      monto: this.totales().total
    };

    console.log('PASO 1: Creando gasto sin detalles:', payload);
    this.loading.set(true);

    this.gastosSrv.crear(payload).subscribe({
      next: (gasto) => {
        console.log('Gasto creado:', gasto);
        if (!gasto.idGasto) {
          Swal.fire({ icon: 'error', title: 'Error', text: 'No se obtuvo ID del gasto' });
          this.loading.set(false);
          return;
        }

        // PASO 2: Agregar detalles
        const detallesRequests = this.detalles.controls.map(g => this.gastosSrv.agregarDetalle(gasto.idGasto!, {
          articulo: { idArticulo: Number(g.get('articuloId')!.value) },
          cantidadComprada: Number(g.get('cantidad')!.value),
          precioUnitario: Number(g.get('precio')!.value),
          descripcion: (g.get('descripcion')!.value || '').trim(),
          unidadMedida: (g.get('unidad')!.value || '').trim() || undefined,
          proveedor: (g.get('proveedor')!.value || '').trim() || undefined,
          gasto: { idGasto: gasto.idGasto }
        }));

        forkJoin(detallesRequests).pipe(finalize(() => this.loading.set(false))).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Gasto guardado', text: `ID ${gasto.idGasto} — Total $${this.totales().total.toFixed(2)}` }).then(() => this.limpiar());
          },
          error: (err) => {
            console.error('Error al agregar detalles:', err);
            Swal.fire({ icon: 'warning', title: 'Gasto creado parcialmente', html: `El gasto se creó pero hubo un error con los detalles.<br>ID: ${gasto.idGasto}` });
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error al crear gasto:', err);
        let msg = err?.error?.message || err?.error?.mensaje || '';
        if (err?.error?.errors && Array.isArray(err.error.errors)) msg += '<br>' + err.error.errors.join('<br>');
        if (err?.error?.errores && typeof err.error.errores === 'object') msg += '<br>' + Object.values(err.error.errores).join('<br>');
        if (!msg) msg = JSON.stringify(err.error) || err.message || 'Error desconocido';
        Swal.fire({ icon: 'error', title: `Error ${err?.status || ''}`, html: `No se pudo guardar.<br><small>${msg}</small>` });
      }
    });
  }
}