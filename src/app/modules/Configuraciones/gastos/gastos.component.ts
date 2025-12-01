import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormArray, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Articulo } from '../../../core/models/categoria.model';
import { ArticuloService } from '../../../core/services/articulo.service';
import { EmpleadoService, Empleado } from '../../../core/services/empleado.service';
import { GastoFundacionService, GastoDetalle, GastoFundacion } from '../../../core/services/gasto-fundacion.service';
import { TipoGastoService, TipoGasto } from '../../../core/services/tipo-gasto.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs/operators';

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

  articulos  = signal<Articulo[]>([]);
  tiposGasto = signal<TipoGasto[]>([]);
  empleados  = signal<Empleado[]>([]);

  // Form maestro + detalle (cabecera + líneas)
  form = this.fb.group({
    fechaGasto: [new Date().toISOString().slice(0,10), Validators.required],
    tipoGastoId: [null as number | null, Validators.required],
    empleadoId:  [null as number | null, Validators.required],
    descripcion: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    comprobante: [''],
    detalles: this.fb.array<FormGroup>([])
  });

  get detalles(): FormArray<FormGroup> {
    return this.form.get('detalles') as FormArray<FormGroup>;
  }

  totales = signal({ subtotal: 0, total: 0 });

  constructor() {
    // cargar combos (si tu API envía {data: [...]}, usa resp.data)
    this.articuloSrv.obtenerActivos().subscribe(a => this.articulos.set((a as any)?.data ?? a));
    this.tipoGastoSrv.listar(1).subscribe(t => this.tiposGasto.set((t as any)?.data ?? t));
    this.empleadoSrv.getEmpleadosActivos().subscribe(e => this.empleados.set((e as any)?.data ?? e));

    // inicia con 1 línea
    this.addDetalle();
    this.form.valueChanges.subscribe(() => this.recalcular());
    this.recalcular();
  }

  // ---------- detalle ----------
  addDetalle(init?: Partial<{ articuloId: number; descripcion: string; cantidad: number; precio: number; unidad: string; proveedor: string }>) {
    const g = this.fb.group({
      articuloId: [init?.articuloId ?? null, Validators.required],
      // descripción de DETALLE opcional para no bloquear el form
      descripcion: [init?.descripcion ?? '', [Validators.maxLength(200)]],
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
    const cant = Number(g.get('cantidad')?.value || 0);
    const precio = Number(g.get('precio')?.value || 0);
    return cant * precio;
  }

  private recalcular() {
    let sub = 0;
    for (let i = 0; i < this.detalles.length; i++) sub += this.filaSubtotal(i);
    this.totales.set({ subtotal: sub, total: sub });
  }

  limpiar() {
    this.form.reset({
      fechaGasto: new Date().toISOString().slice(0,10),
      tipoGastoId: null,
      empleadoId: null,
      descripcion: '',
      comprobante: ''
    });
    this.detalles.clear();
    this.addDetalle();
    this.recalcular();
  }

  private validarDetalles(): string[] {
    const errores: string[] = [];
    this.detalles.controls.forEach((g, i) => {
      const art = g.get('articuloId')?.value;
      const cant = Number(g.get('cantidad')?.value || 0);
      const precio = Number(g.get('precio')?.value || 0);
      if (!art) errores.push(`Línea ${i + 1}: selecciona un artículo.`);
      if (cant < 1) errores.push(`Línea ${i + 1}: cantidad debe ser ≥ 1.`);
      if (precio < 0.01) errores.push(`Línea ${i + 1}: precio debe ser ≥ 0.01.`);
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
      Swal.fire({
        icon: 'error',
        title: 'Corregí estos puntos',
        html: `<ul style="text-align:left">${errs.map(e => `<li>${e}</li>`).join('')}</ul>`
      });
      return;
    }

    const v = this.form.getRawValue();

    // Mapeo EXACTO que espera el back: detalles dentro del body del POST
    const detalles: GastoDetalle[] = this.detalles.controls.map(g => ({
      articulo: { idArticulo: Number(g.get('articuloId')!.value) },
      cantidadComprada: Number(g.get('cantidad')!.value),
      precioUnitario: Number(g.get('precio')!.value),
      descripcion: (g.get('descripcion')!.value || '').trim() || undefined,
      unidadMedida: (g.get('unidad')!.value || '').trim() || undefined,
      proveedor: (g.get('proveedor')!.value || '').trim() || undefined
    }));

    const payload: GastoFundacion = {
      fechaGasto: v.fechaGasto!,
      descripcion: (v.descripcion || '').trim(),
      comprobante: (v.comprobante || '').trim() || undefined,
      tipoGasto: { idTipoGasto: Number(v.tipoGastoId) },
      empleado:  { id: Number(v.empleadoId) },
      // estado: opcional; el back lo maneja. monto lo calcula con los detalles
      detalles
    };

    // Debug: verifica en consola que 'detalles' NO esté vacío
    console.log('Payload a enviar /api/gastos =>', payload);

    this.loading.set(true);
    this.gastosSrv.crear(payload)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (resp) => {
          Swal.fire({
            icon: 'success',
            title: 'Gasto guardado',
            text: `ID ${resp?.idGasto ?? ''} — Total ${this.totales().total.toFixed(2)}`
          }).then(() => this.limpiar());
        },
        error: (err) => {
          const status = err?.status;
          const msg =
            err?.error?.message ||
            err?.error?.mensaje ||
            (Array.isArray(err?.error?.errors) ? err.error.errors.join('\n') : '') ||
            err?.error?.error ||
            err?.message || 'No se pudo guardar el gasto.';
          Swal.fire({
            icon: 'error',
            title: status ? `Error ${status}` : 'Error',
            html: `<pre style="white-space:pre-wrap;text-align:left">${msg}</pre>`
          });
        }
      });
  }
}
