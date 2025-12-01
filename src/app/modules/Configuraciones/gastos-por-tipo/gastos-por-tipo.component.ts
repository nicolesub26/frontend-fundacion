
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { GastoFundacionService, GastoFundacion, GastoDetalle } from '../../../core/services/gasto-fundacion.service';
import { TipoGastoService, TipoGasto } from '../../../core/services/tipo-gasto.service';
import { EmpleadoService, Empleado } from '../../../core/services/empleado.service';
import Swal from 'sweetalert2';

type EstadoOpt = 0 | 1 | null;

@Component({
  selector: 'app-gastos-por-tipo',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gastos-por-tipo.component.html',
  styleUrl: './gastos-por-tipo.component.css'
})
export class GastosPorTipoComponent {


   private fb = inject(FormBuilder);
  private gastosSrv = inject(GastoFundacionService);
  private tipoSrv = inject(TipoGastoService);
  private empSrv = inject(EmpleadoService);

  // datos
  tipos = signal<TipoGasto[]>([]);
  empleados = signal<Empleado[]>([]);
  gastos = signal<GastoFundacion[]>([]);
  loading = signal(false);

  // paginación (client-side)
  page = signal(1);
  pageSize = signal(10);

  // filtros del API + texto (cliente)
  filtroForm = this.fb.group({
    desde: [''],
    hasta: [''],
    idTipoGasto: [null as number | null],
    idEmpleado: [null as number | null],
    estado: [null as EstadoOpt],
    texto: [''] // filtra por descripción/comprobante en cliente
  });

  // modal detalle
  detalleOpen = signal(false);
  detalleCab = signal<GastoFundacion | null>(null);
  detalleLin = signal<GastoDetalle[]>([]);

  // listado filtrado en cliente (por "texto")
  listFiltrada = computed(() => {
    const texto = (this.filtroForm.value.texto || '').toLowerCase().trim();
    const arr = this.gastos();
    if (!texto) return arr;
    return arr.filter(g =>
      (g.descripcion || '').toLowerCase().includes(texto) ||
      (g.comprobante || '').toLowerCase().includes(texto)
    );
  });

  // slice de paginación
  pageCount = computed(() => Math.max(1, Math.ceil(this.listFiltrada().length / this.pageSize())));
  pageData = computed(() => {
    const p = this.page();
    const ps = this.pageSize();
    const start = (p - 1) * ps;
    return this.listFiltrada().slice(start, start + ps);
  });

  totalListado = computed(() => {
    // si tu API devuelve monto en cabecera, sumamos; si no, calculas cuando abras detalle
    return this.listFiltrada()
      .map(g => Number(g.monto ?? 0))
      .reduce((a, b) => a + b, 0);
  });

  constructor() {
    // combos
    this.tipoSrv.listar(1).subscribe(r => this.tipos.set((r as any)?.data ?? r));
    this.empSrv.getEmpleadosActivos().subscribe(r => this.empleados.set((r as any)?.data ?? r));

    // fechas por defecto: este mes
    const hoy = new Date();
    const y = hoy.getFullYear(), m = hoy.getMonth();
    const ini = new Date(y, m, 1).toISOString().slice(0, 10);
    const fin = new Date(y, m + 1, 0).toISOString().slice(0, 10);
    this.filtroForm.patchValue({ desde: ini, hasta: fin });

    this.buscar();
  }

  // Llamada al API con filtros soportados
  buscar() {
    const { desde, hasta, idTipoGasto, idEmpleado, estado } = this.filtroForm.getRawValue();
    this.loading.set(true);
    this.gastosSrv.listar({
      desde: desde || undefined,
      hasta: hasta || undefined,
      idTipoGasto: idTipoGasto ?? undefined,
      idEmpleado: idEmpleado ?? undefined,
      estado: (estado === 0 || estado === 1) ? estado : undefined
    }).subscribe({
      next: (data) => {
        this.gastos.set((data as any)?.data ?? data);
        this.page.set(1);
      },
      error: (err) => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error al listar', text: err?.error?.mensaje || err?.message || 'No se pudo obtener la lista.' });
      },
      complete: () => this.loading.set(false)
    });
  }

  limpiarFiltros() {
    this.filtroForm.reset({ desde: '', hasta: '', idTipoGasto: null, idEmpleado: null, estado: null, texto: '' });
    this.buscar();
  }

  // cambiar página
  goTo(p: number) {
    const max = this.pageCount();
    this.page.set(Math.min(Math.max(1, p), max));
  }

  // ---------- Detalle ----------
  verDetalle(g: GastoFundacion) {
    this.detalleCab.set(null);
    this.detalleLin.set([]);
    this.detalleOpen.set(true);

    // Cabecera
    this.gastosSrv.obtenerPorId(Number(g.idGasto)).subscribe({
      next: (cab) => this.detalleCab.set(cab),
      error: (err) => Swal.fire({ icon: 'error', title: 'No se pudo cargar el gasto', text: err?.error?.mensaje || err?.message })
    });

    // Líneas
    this.gastosSrv.listarDetalles(Number(g.idGasto)).subscribe({
      next: (lin) => this.detalleLin.set(lin),
      error: (err) => Swal.fire({ icon: 'warning', title: 'No se pudo cargar el detalle', text: err?.error?.mensaje || err?.message })
    });
  }

  cerrarDetalle() {
    this.detalleOpen.set(false);
    this.detalleCab.set(null);
    this.detalleLin.set([]);
  }
  onPageSizeChange(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  this.pageSize.set(value);
  this.goTo(1);
}


  // ============= Imprimir =============
  imprimirGasto(g: GastoFundacion) {
    // Garantiza cabecera + líneas cargadas antes de imprimir
    const doPrint = (cab: GastoFundacion, lin: GastoDetalle[]) => {
      const total = lin.reduce((a, d) => a + Number(d.cantidadComprada) * Number(d.precioUnitario), 0);
      const win = window.open('', '_blank', 'width=900,height=700');
      if (!win) return;

      win.document.write(`
        <html>
          <head>
            <title>Gasto #${cab.idGasto}</title>
            <style>
              body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;}
              h1{margin:0 0 6px 0}
              .muted{color:#555}
              table{width:100%;border-collapse:collapse;margin-top:16px}
              th,td{border:1px solid #e5e7eb;padding:8px;font-size:14px}
              th{background:#f3f4f6;text-align:left}
              .right{text-align:right}
              .total{font-weight:700;font-size:16px}
              .badge{padding:2px 8px;border-radius:999px;background:#eef2ff}
            </style>
          </head>
          <body>
            <h1>Gasto #${cab.idGasto}</h1>
            <div class="muted">Fecha: ${cab.fechaGasto ?? ''} • Tipo: ${cab.tipoGasto?.idTipoGasto ?? cab.tipoGasto?.idTipoGasto ?? ''} • Empleado: ${cab.empleado?.id ?? cab.empleado?.id ?? ''}</div>
            <p>${cab.descripcion ?? ''}</p>
            <table>
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Descripción</th>
                  <th class="right">Cant.</th>
                  <th class="right">Precio</th>
                  <th class="right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${lin.map(d => `
                  <tr>
                    <td>${d.articulo?.idArticulo ?? ''}</td>
                    <td>${d.descripcion ?? ''}</td>
                    <td class="right">${Number(d.cantidadComprada).toFixed(2)}</td>
                    <td class="right">${Number(d.precioUnitario).toFixed(2)}</td>
                    <td class="right">${(Number(d.cantidadComprada) * Number(d.precioUnitario)).toFixed(2)}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="4" class="right total">TOTAL</td>
                  <td class="right total">${total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <script>window.print(); setTimeout(()=>window.close(), 300);</script>
          </body>
        </html>
      `);
      win.document.close();
    };

    // Si ya está abierto el detalle del mismo gasto, usa eso; si no, carga y luego imprime
    if (this.detalleCab()?.idGasto === g.idGasto && this.detalleLin().length) {
      doPrint(this.detalleCab()!, this.detalleLin());
    } else {
      // carga rápida
      let cabLoaded: GastoFundacion | null = null;
      this.gastosSrv.obtenerPorId(Number(g.idGasto)).subscribe({
        next: cab => {
          cabLoaded = cab;
          this.gastosSrv.listarDetalles(Number(g.idGasto)).subscribe({
            next: lin => doPrint(cab!, lin),
            error: (err) => Swal.fire({ icon: 'error', title: 'Detalle no disponible', text: err?.error?.mensaje || err?.message })
          });
        },
        error: (err) => Swal.fire({ icon: 'error', title: 'Gasto no disponible', text: err?.error?.mensaje || err?.message })
      });
    }
  }

  imprimirListado() {
    const rows = this.listFiltrada();
    const total = rows.reduce((a, g) => a + Number(g.monto ?? 0), 0);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const filtros = this.filtroForm.getRawValue();

    win.document.write(`
      <html>
        <head>
          <title>Listado de Gastos</title>
          <style>
            body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;}
            h1{margin:0 0 6px 0}
            .muted{color:#555}
            table{width:100%;border-collapse:collapse;margin-top:16px}
            th,td{border:1px solid #e5e7eb;padding:8px;font-size:14px}
            th{background:#f3f4f6;text-align:left}
            .right{text-align:right}
            .total{font-weight:700;font-size:16px}
          </style>
        </head>
        <body>
          <h1>Gastos (listado)</h1>
          <div class="muted">
            Filtros:
            ${filtros.desde || '—'} → ${filtros.hasta || '—'}
            • Tipo: ${filtros.idTipoGasto ?? 'Todos'}
            • Empleado: ${filtros.idEmpleado ?? 'Todos'}
            • Estado: ${filtros.estado ?? 'Todos'}
            ${filtros.texto ? `• Texto: "${filtros.texto}"` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Comprobante</th>
                <th>Tipo</th>
                <th>Empleado</th>
                <th class="right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(g => `
                <tr>
                  <td>${g.idGasto ?? ''}</td>
                  <td>${g.fechaGasto ?? ''}</td>
                  <td>${g.descripcion ?? ''}</td>
                  <td>${g.comprobante ?? ''}</td>
                  <td>${(g as any).tipoGasto?.descripcion ?? g.tipoGasto?.idTipoGasto ?? ''}</td>
                  <td>${(g as any).empleado?.nombre ?? g.empleado?.id ?? ''}</td>
                  <td class="right">${Number(g.monto ?? 0).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="6" class="right total">TOTAL</td>
                <td class="right total">${total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <script>window.print(); setTimeout(()=>window.close(), 300);</script>
        </body>
      </html>
    `);
    win.document.close();
  }

}
