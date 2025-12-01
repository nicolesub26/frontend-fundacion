import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { PageResponse, Donacion, DonacionService } from '../../../core/services/donacion.service';
import { TipoDonacion, TipoDonacionService } from '../../../core/services/tipo-donacion.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-donacion-reportes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
  templateUrl: './donacion-reportes.component.html',
  styleUrl: './donacion-reportes.component.css'
})
export class DonacionReportesComponent implements OnInit {

  tipos = signal<TipoDonacion[]>([]);
  data = signal<PageResponse<Donacion>>({content:[], totalElements:0, totalPages:1, number:0, size:10});
  isLoading = signal(false);
  errMsg = signal<string | null>(null);

  // KPIs simples sobre el page actual (puedes cambiarlos por agregados reales del backend)
  kpiTotal = signal(0);
  kpiActivas = signal(0);
  kpiInactivas = signal(0);

 private fb     = inject(FormBuilder);
  page = 0; size = 10; sort = 'fechaDonacion,desc';

  form = this.fb.group({
    idTipoDonacion: [null as unknown as number],
    estado: [null as 0 | 1 | null],
    desde: [''],
    hasta: ['']
  });

  constructor(
    private donacionSvc: DonacionService,
    private tipoSvc: TipoDonacionService
  ) {}

  ngOnInit(): void {
    this.tipoSvc.listar(1).subscribe({ next: l => this.tipos.set(l) });
    this.buscar();
  }

  private calcKpis(list: Donacion[]) {
    this.kpiTotal.set(list.length);
    this.kpiActivas.set(list.filter(d => d.estado===1).length);
    this.kpiInactivas.set(list.filter(d => d.estado===0).length);
  }

  buscar(page = 0) {
    this.isLoading.set(true);
    this.errMsg.set(null);
    this.page = page;

    const { estado, desde, hasta, idTipoDonacion } = this.form.value;

    this.donacionSvc.listarPage({
      estado: (estado===0 || estado===1) ? estado : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      page: this.page,
      size: this.size,
      sort: this.sort
    }).subscribe({
      next: p => {
        // filtro por tipo en cliente si lo pides (si no tienes filtro en backend)
        let content = p.content;
        if (idTipoDonacion) content = content.filter(d => d.idTipoDonacion === idTipoDonacion);
        this.data.set({...p, content});
        this.calcKpis(content);
      },
      error: e => this.errMsg.set(e?.error?.message ?? e?.message ?? 'Error'),
      complete: () => this.isLoading.set(false)
    });
  }

  limpiar() {
    this.form.reset({ idTipoDonacion: null, estado: null, desde: '', hasta: '' });
    this.buscar(0);
  }

  cambiarPagina(n: number) {
    if (n<0 || n>=this.data().totalPages) return;
    this.buscar(n);
  }
}
