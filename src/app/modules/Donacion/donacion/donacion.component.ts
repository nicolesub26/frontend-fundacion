import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DonacionService, CrearDonacionDto } from '../../../core/services/donacion.service';
import { Donante, DonanteService } from '../../../core/services/donante.service';
import { TipoDonacion, TipoDonacionService } from '../../../core/services/tipo-donacion.service';


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
 private fb     = inject(FormBuilder);
  // Lists
  tipos = signal<TipoDonacion[]>([]);
  donantes = signal<Donante[]>([]);

  // paso siguiente
  nextStep = signal<'efectivo' | 'articulo'>('efectivo');

  // por ahora empleado fijo
  private readonly EMPLEADO_DEFAULT_ID = 1;

  form = this.fb.group({
    fechaDonacion: [new Date().toISOString().slice(0,10), [Validators.required]],
    observaciones: ['',[Validators.maxLength(500)]],
    idDonante: [null as unknown as number, [Validators.required, Validators.min(1)]],
    idTipoDonacion: [null as unknown as number, [Validators.required]],
    estado: [1, [Validators.required, Validators.min(0), Validators.max(1)]]
  });

  constructor(
    private router: Router,
    private donacionSvc: DonacionService,
    private tipoDonacionSvc: TipoDonacionService,
    private donanteSvc: DonanteService
  ) {}

  ngOnInit(): void {
    this.tipoDonacionSvc.listar(1).subscribe({
      next: list => {
        this.tipos.set(list);
        if (list.length && !this.form.value.idTipoDonacion) {
          this.form.patchValue({ idTipoDonacion: list[0].idTipoDonacion });
        }
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });

    this.donanteSvc.listar(1).subscribe({
      next: list => {
        this.donantes.set(list);
        if (list.length && !this.form.value.idDonante) {
          this.form.patchValue({ idDonante: list[0].idDonante });
        }
      },
      error: err => this.errMsg.set(this.pickMessage(err))
    });
  }

  setNext(step: 'efectivo' | 'articulo') { this.nextStep.set(step); }

  submit() {
    this.okMsg.set(null); this.errMsg.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); this.errMsg.set('Revisa los campos.'); return; }

    const dto: CrearDonacionDto = {
      fechaDonacion: this.form.value.fechaDonacion!,
      observaciones: this.form.value.observaciones ?? undefined,
      idDonante: Number(this.form.value.idDonante),
      idTipoDonacion: Number(this.form.value.idTipoDonacion),
      idEmpleado: this.EMPLEADO_DEFAULT_ID,
      estado: Number(this.form.value.estado) as 0|1
    };

    this.isSubmitting.set(true);
    this.donacionSvc.crear(dto).subscribe({
      next: d => {
        this.okMsg.set('Donación creada. Redirigiendo…');
        // navegar sin mostrar el ID en pantalla (va solo en la URL)
        if (this.nextStep() === 'efectivo') this.router.navigate(['/donacionefec', d.idDonacion]);
        else this.router.navigate(['/donacionart', d.idDonacion]);
      },
      error: err => this.errMsg.set(this.pickMessage(err)),
      complete: () => this.isSubmitting.set(false)
    });
  }

  nombreDonante(d: Donante): string { return `${d.nombre} ${d.apellido}`.trim(); }
  private pickMessage(err: any): string { return err?.error?.message ?? err?.message ?? 'Error inesperado.'; }
}
