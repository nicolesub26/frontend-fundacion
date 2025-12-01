import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DonacionEfectivoService, CrearDonacionEfectivoDto } from '../../../core/services/donacion-efectivo.service';

@Component({
  selector: 'app-donacion-efectivo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './donacion-efectivo.component.html',
  styleUrl: './donacion-efectivo.component.css'
})
export class DonacionEfectivoComponent implements OnInit {

  private donacionId!: number; // interno, no visible
  isSubmitting = signal(false);
  okMsg = signal<string | null>(null);
  errMsg = signal<string | null>(null);
 private fb     = inject(FormBuilder);
  form = this.fb.group({
    monto: [null as unknown as number, [Validators.required, Validators.min(0.01)]],
    moneda: ['BOB', [Validators.required]],
    descripcionUso: ['',[Validators.maxLength(300)]],
    fechaRegistro: [new Date().toISOString().slice(0,10), [Validators.required]],
    estado: [1, [Validators.required]]
  });

  constructor(
    private route: ActivatedRoute,
    private svc: DonacionEfectivoService
  ) {}

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('idDonacion'));
    if (idParam) this.donacionId = idParam;
  }

  submit() {
    this.okMsg.set(null); this.errMsg.set(null);
    if (this.form.invalid) { this.form.markAllAsTouched(); this.errMsg.set('Completa los campos.'); return; }

    const dto: CrearDonacionEfectivoDto = {
      idDonacion: this.donacionId,
      monto: Number(this.form.value.monto),
      moneda: this.form.value.moneda as any,
      descripcionUso: this.form.value.descripcionUso ?? undefined,
      fechaRegistro: this.form.value.fechaRegistro!,
      estado: Number(this.form.value.estado) as 0|1
    };

    this.isSubmitting.set(true);
    this.svc.crear(dto).subscribe({
      next: () => this.okMsg.set('Donación en efectivo creada correctamente.'),
      error: e => this.errMsg.set(e?.error?.message ?? e?.message ?? 'Error'),
      complete: () => this.isSubmitting.set(false)
    });
  }
}
