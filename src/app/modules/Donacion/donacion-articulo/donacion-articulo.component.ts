import { Component, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, forkJoin } from 'rxjs';
import { ArticuloService } from '../../../core/services/articulo.service';
import { DonacionArticuloService, CrearDonacionArticuloDto } from '../../../core/services/donacion-articulo.service';

type ArticuloLite = { 
  idArticulo?: number; 
  nombreArticulo: string; 
  descripcion?: string; 
  categoria?: { nombreCategoria?: string } | any 
};

type ArticuloEnLista = {
  articulo: ArticuloLite;
  cantidad: number;
  descripcion?: string;
  fechaVencimiento?: string;
  estadoArticulo: string;
};

@Component({
  selector: 'app-donacion-articulo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './donacion-articulo.component.html',
  styleUrl: './donacion-articulo.component.css'
})
export class DonacionArticuloComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private donacionId!: number;
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Búsqueda
  search$ = new Subject<string>();
  results = signal<ArticuloLite[]>([]);
  showDropdown = signal(false);
  selectedArticulo = signal<ArticuloLite | null>(null);

  // Lista de artículos agregados
  articulosAgregados = signal<ArticuloEnLista[]>([]);
  
  // UI
  isSubmitting = signal(false);
  okMsg = signal<string | null>(null);
  errMsg = signal<string | null>(null);

  // Form (para cada artículo individual)
  form = this.fb.group({
    cantidad: [1, [Validators.required, Validators.min(1), Validators.max(9999)]],
    descripcion: ['', [Validators.maxLength(300)]],
    fechaVencimiento: [null as string | null],
    estadoArticulo: ['NUEVO', [Validators.required]]
  });

  constructor(
    private route: ActivatedRoute,
    private svc: DonacionArticuloService,
    private articuloSvc: ArticuloService
  ) {}

  ngOnInit(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('idDonacion'));
    if (idParam) this.donacionId = idParam;

    // Configurar búsqueda
    this.search$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(term => {
          const q = term?.trim();
          if (q && q.length >= 2) return this.articuloSvc.buscarPorNombreContaining(q);
          return this.articuloSvc.obtenerDisponibles();
        })
      )
      .subscribe({
        next: list => {
          this.results.set((list ?? []).map(a => ({
            idArticulo: (a as any)?.idArticulo,
            nombreArticulo: (a as any)?.nombreArticulo,
            descripcion: (a as any)?.descripcion,
            categoria: (a as any)?.categoria
          })));
          this.showDropdown.set(true);
        },
        error: e => {
          this.errMsg.set(e?.error?.message ?? e?.message ?? 'Error cargando artículos');
          this.results.set([]);
          this.showDropdown.set(false);
        }
      });
  }

  onFocusSearch(input: HTMLInputElement) {
    if (!input.value) this.search$.next('');
    this.showDropdown.set(true);
  }

  onSearch(term: string) {
    this.search$.next(term);
  }

  pickArticulo(a: ArticuloLite) {
    this.selectedArticulo.set(a);
    this.showDropdown.set(false);
  }

  clearArticulo(input: HTMLInputElement) {
    input.value = '';
    this.selectedArticulo.set(null);
    this.results.set([]);
    this.showDropdown.set(false);
  }

  // Agregar artículo a la lista temporal
  agregarArticulo() {
    this.okMsg.set(null);
    this.errMsg.set(null);

    const articulo = this.selectedArticulo();
    if (!articulo || !articulo.idArticulo) {
      this.errMsg.set('Selecciona un artículo de la lista.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errMsg.set('Completa los campos correctamente.');
      return;
    }

    // Verificar si el artículo ya está en la lista
    const yaExiste = this.articulosAgregados().some(
      item => item.articulo.idArticulo === articulo.idArticulo
    );

    if (yaExiste) {
      this.errMsg.set('Este artículo ya está en la lista. Puedes editarlo o eliminarlo.');
      return;
    }

    // Agregar a la lista
    const nuevoArticulo: ArticuloEnLista = {
      articulo: articulo,
      cantidad: Number(this.form.value.cantidad),
      descripcion: this.form.value.descripcion || undefined,
      fechaVencimiento: this.form.value.fechaVencimiento || undefined,
      estadoArticulo: this.form.value.estadoArticulo as string
    };

    this.articulosAgregados.update(lista => [...lista, nuevoArticulo]);

    // Limpiar el formulario
    this.form.reset({
      cantidad: 1,
      descripcion: '',
      fechaVencimiento: null,
      estadoArticulo: 'NUEVO'
    });
    this.selectedArticulo.set(null);
    
    this.okMsg.set('Artículo agregado a la lista.');
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => this.okMsg.set(null), 3000);
  }

  // Eliminar artículo de la lista
  eliminarArticulo(index: number) {
    this.articulosAgregados.update(lista => 
      lista.filter((_, i) => i !== index)
    );
    this.okMsg.set('Artículo eliminado de la lista.');
    setTimeout(() => this.okMsg.set(null), 3000);
  }

  // Editar artículo (cargar en el formulario)
  editarArticulo(index: number) {
    const item = this.articulosAgregados()[index];
    
    // Cargar en el formulario
    this.selectedArticulo.set(item.articulo);
    this.form.patchValue({
      cantidad: item.cantidad,
      descripcion: item.descripcion || '',
      fechaVencimiento: item.fechaVencimiento || null,
      estadoArticulo: item.estadoArticulo
    });

    // Eliminar de la lista
    this.eliminarArticulo(index);
  }

  // Enviar todos los artículos
  enviarDonacion() {
    this.okMsg.set(null);
    this.errMsg.set(null);

    if (this.articulosAgregados().length === 0) {
      this.errMsg.set('Debes agregar al menos un artículo a la lista.');
      return;
    }

    this.isSubmitting.set(true);

    // Crear array de observables para enviar todos los artículos
    const requests = this.articulosAgregados().map(item => {
      const dto: CrearDonacionArticuloDto = {
        idDonacion: this.donacionId,
        idArticulo: item.articulo.idArticulo!,
        cantidad: item.cantidad,
        descripcion: item.descripcion,
        fechaVencimiento: item.fechaVencimiento,
        estadoArticulo: item.estadoArticulo as any
      };
      return this.svc.crear(dto);
    });

    // Enviar todas las peticiones en paralelo
    forkJoin(requests).subscribe({
      next: () => {
        this.okMsg.set(`✓ Donación completada exitosamente con ${this.articulosAgregados().length} artículo(s).`);
        this.articulosAgregados.set([]);
        this.isSubmitting.set(false);
        
        // Opcional: Redirigir después de 2 segundos
        setTimeout(() => {
          // this.router.navigate(['/donaciones', this.donacionId]);
        }, 2000);
      },
      error: e => {
        this.errMsg.set(e?.error?.message ?? e?.message ?? 'Error al guardar la donación');
        this.isSubmitting.set(false);
      }
    });
  }

  // Obtener texto del estado
  obtenerTextoEstado(estado: string): string {
    const estados: { [key: string]: string } = {
      'NUEVO': 'Nuevo',
      'USADO_BUENO': 'Usado - Bueno',
      'USADO_REGULAR': 'Usado - Regular',
      'REPARAR': 'A Reparar'
    };
    return estados[estado] || estado;
  }

  // Calcular total de unidades
  calcularTotalUnidades(): number {
    return this.articulosAgregados().reduce((sum, item) => sum + item.cantidad, 0);
  }

  // Obtener cantidad de artículos
  obtenerCantidadArticulos(): number {
    return this.articulosAgregados().length;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}