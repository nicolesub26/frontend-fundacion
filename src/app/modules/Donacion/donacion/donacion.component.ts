import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DonacionService, CrearDonacionDto, ActualizarDonacionDto } from '../../../core/services/donacion.service';
import { Donante, DonanteService } from '../../../core/services/donante.service';
import { TipoDonacion, TipoDonacionService } from '../../../core/services/tipo-donacion.service';
import { EmpleadoService, Empleado } from '../../../core/services/empleado.service';

@Component({
  selector: 'app-donacion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './donacion.component.html',
  styleUrl: './donacion.component.css'
})
export class DonacionComponent implements OnInit {

  // UI state
  isSubmitting = signal(false);
  okMsg = signal<string | null>(null);
  errMsg = signal<string | null>(null);
  private fb = inject(FormBuilder);

  // Lists
  tipos = signal<TipoDonacion[]>([]);
  donantes = signal<Donante[]>([]);
  empleados = signal<Empleado[]>([]);

  // Edición
  idEdicion = signal<number | null>(null);

  // paso siguiente (solo para creación)
  nextStep = signal<'efectivo' | 'articulo'>('efectivo');

  form = this.fb.group({
    fechaDonacion: [new Date().toISOString().slice(0, 10), [Validators.required]],
    observaciones: ['', [Validators.maxLength(500)]],
    idDonante: [null as unknown as number, [Validators.required, Validators.min(1)]],
    idTipoDonacion: [null as unknown as number, [Validators.required]],
    idEmpleado: [null as unknown as number, [Validators.required]],
    estado: [1, [Validators.required, Validators.min(0), Validators.max(1)]]
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private donacionSvc: DonacionService,
    private tipoDonacionSvc: TipoDonacionService,
    private donanteSvc: DonanteService,
    private empleadoSvc: EmpleadoService
  ) { }

  ngOnInit(): void {
    // Cargar Tipos
    this.tipoDonacionSvc.listar(1).subscribe({
      next: list => {
        this.tipos.set(list);
        if (list.length && !this.form.value.idTipoDonacion && !this.idEdicion()) {
          this.form.patchValue({ idTipoDonacion: list[0].idTipoDonacion });
        }
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });

    // Cargar Donantes
    this.donanteSvc.listar(1).subscribe({
      next: list => {
        this.donantes.set(list);
        if (list.length && !this.form.value.idDonante && !this.idEdicion()) {
          this.form.patchValue({ idDonante: list[0].idDonante });
        }
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });

    // Cargar Empleados
    this.empleadoSvc.getEmpleadosActivos().subscribe({
      next: list => {
        this.empleados.set(list);
        if (list.length && !this.form.value.idEmpleado && !this.idEdicion()) {
          // Intentar seleccionar empleado ID 1 por defecto, o el primero
          const def = list.find(e => e.id === 1) || list[0];
          if (def) this.form.patchValue({ idEmpleado: def.id });
        }
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });

    // Verificar si es edición
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.idEdicion.set(Number(id));
        this.cargarDatosEdicion(Number(id));
      }
    });
  }

  cargarDatosEdicion(id: number) {
    this.donacionSvc.obtener(id).subscribe({
      next: d => {
        this.form.patchValue({
          fechaDonacion: d.fechaDonacion,
          observaciones: d.observaciones || '',
          idDonante: d.idDonante,
          idTipoDonacion: d.idTipoDonacion,
          idEmpleado: d.idEmpleado,
          estado: d.estado as 0 | 1
        });
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });
  }

  setNext(step: 'efectivo' | 'articulo') { this.nextStep.set(step); }

  submit() {
    this.okMsg.set(null); this.errMsg.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); this.errMsg.set('Revisa los campos.'); return; }

    const formVal = this.form.value;

    // Datos comunes
    const baseDto = {
      fechaDonacion: formVal.fechaDonacion!,
      observaciones: formVal.observaciones ?? undefined,
      idDonante: Number(formVal.idDonante),
      idTipoDonacion: Number(formVal.idTipoDonacion),
      idEmpleado: Number(formVal.idEmpleado),
      estado: Number(formVal.estado) as 0 | 1
    };

    this.isSubmitting.set(true);

    if (this.idEdicion()) {
      // ACTUALIZAR
      // Enviamos idDonante e idEmpleado explícitamente (ya están en baseDto)
      const updateDto: ActualizarDonacionDto = baseDto;

      this.donacionSvc.actualizar(this.idEdicion()!, updateDto).subscribe({
        next: d => {
          this.okMsg.set('Donación actualizada correctamente.');
          // Opcional: redirigir tras un tiempo o dejar ahí
        },
        error: err => this.errMsg.set(this.pickMessage(err)),
        complete: () => this.isSubmitting.set(false)
      });

    } else {
      // CREAR
      const createDto: CrearDonacionDto = baseDto;

      this.donacionSvc.crear(createDto).subscribe({
        next: d => {
          this.okMsg.set('Donación creada. Redirigiendo…');
          if (this.nextStep() === 'efectivo') this.router.navigate(['/donacionefec', d.idDonacion]);
          else this.router.navigate(['/donacionart', d.idDonacion]);
        },
        error: err => this.errMsg.set(this.pickMessage(err)),
        complete: () => this.isSubmitting.set(false)
      });
    }
  }

  nombreDonante(d: Donante): string { return `${d.nombre} ${d.apellido}`.trim(); }
  nombreEmpleado(e: Empleado): string { return `${e.nombre} ${e.apellido}`.trim(); }

  private pickMessage(err: any): string { return err?.error?.message ?? err?.message ?? 'Error inesperado.'; }
}
