import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators
} from '@angular/forms';
import Swal from 'sweetalert2';
import { Beneficiario, BeneficiarioService, CrearBeneficiarioDto } from '../../../core/services/beneficiario.service';
import { TipoBeneficiario, TipoBeneficiarioService } from '../../../core/services/tipo-beneficiario.service';

type ToastType = 'success' | 'error' | 'info';

@Component({
  selector: 'app-beneficiario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './beneficiario.component.html',
  styleUrls: ['./beneficiario.component.css']
})
export class BeneficiarioComponent implements OnInit {

  // --- UI State ---
  loading = false;
  modalOpen = false;
  editingId: number | null = null;

  // --- Data ---
  items: Beneficiario[] = [];
  tipos: TipoBeneficiario[] = [];

  // --- Filtros ---
  fEstado: '' | 0 | 1 = '';
  fTipo: number | '' = '';
  fQ = '';

  // --- Form ---
  form!: FormGroup;

  // --- Toast local (tu notify helper) ---
  toast: { show: boolean; type: ToastType; message: string } = {
    show: false, type: 'info', message: ''
  };

  // DI
  private fb = inject(FormBuilder);
  private beneficiarioSrv = inject(BeneficiarioService);
  private tipoSrv = inject(TipoBeneficiarioService);

  ngOnInit(): void {
    this.buildForm();
    this.cargarTipos();
    this.cargar();
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

  private buildForm() {
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\.\,\-]+$/;
    const ciPattern = /^[0-9]+(-[0-9A-Za-z]{1,3})?$/;
    const telPattern = /^[0-9]{7,15}$/;

    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(namePattern)]],
      apellido: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(namePattern)]],
      ci: [null, [Validators.minLength(7), Validators.maxLength(15), Validators.pattern(ciPattern)]],
      telefono: [null, [Validators.pattern(telPattern)]],
      direccion: [null, [Validators.maxLength(200)]],
      situacionSocioeconomica: [null, [Validators.maxLength(500)]],
      fechaRegistro: [new Date().toISOString().substring(0, 10)], // yyyy-MM-dd
      idTipoBeneficiario: [null, [Validators.required]],
    });
  }

  // -------- Data load ----------
  cargarTipos() {
    this.tipoSrv.listar(1).subscribe({
      next: (t) => (this.tipos = t),
      error: () => this.notify('error', 'No se pudieron cargar los tipos de beneficiario')
    });
  }

  // KPIs (para las tarjetitas del header)
  get kpiTotal()    { return this.items.length; }
  get kpiActivos()  { return this.items.filter(i => i.estado === 1).length; }
  get kpiInactivos(){ return this.items.filter(i => i.estado === 0).length; }
  
  cargar() {
    this.loading = true;
    this.beneficiarioSrv.listar({
      estado: this.fEstado === '' ? undefined : this.fEstado,
      tipo: this.fTipo === '' ? undefined : Number(this.fTipo),
      q: this.fQ?.trim() || undefined
    }).subscribe({
      next: (arr) => (this.items = arr),
      error: (e) => {
        console.error(e);
        this.notify('error', 'No se pudo cargar el listado');
      },
      complete: () => (this.loading = false)
    });
  }

  limpiarFiltros() {
    this.fEstado = '';
    this.fTipo = '';
    this.fQ = '';
    this.cargar();
  }

  // -------- Modal CRUD ----------
  openCrear() {
    this.editingId = null;
    this.form.reset({
      nombre: '',
      apellido: '',
      ci: null,
      telefono: null,
      direccion: null,
      situacionSocioeconomica: null,
      fechaRegistro: new Date().toISOString().substring(0, 10),
      idTipoBeneficiario: null
    });
    this.modalOpen = true;
  }

  openEditar(item: Beneficiario) {
    this.editingId = item.idBeneficiario;
    this.form.reset({
      nombre: item.nombre,
      apellido: item.apellido,
      ci: item.ci ?? null,
      telefono: item.telefono ?? null,
      direccion: item.direccion ?? null,
      situacionSocioeconomica: item.situacionSocioeconomica ?? null,
      fechaRegistro: (item.fechaRegistro ?? '').substring(0, 10),
      idTipoBeneficiario: item.idTipoBeneficiario
    });
    this.modalOpen = true;
  }

  cerrarModal() {
    this.modalOpen = false;
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify('error', 'Revisa los campos del formulario');
      return;
    }

    const payload: CrearBeneficiarioDto = {
      ...this.form.value,
      idTipoBeneficiario: Number(this.form.value.idTipoBeneficiario)
    };

    const accion = this.editingId ? 'Actualizar' : 'Crear';
    Swal.fire({
      title: `${accion} beneficiario`,
      text: `¿Deseas ${this.editingId ? 'actualizar' : 'crear'} este registro?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(res => {
      if (!res.isConfirmed) return;

      const obs = this.editingId
        ? this.beneficiarioSrv.actualizar(this.editingId, payload)
        : this.beneficiarioSrv.crear(payload);

      obs.subscribe({
        next: () => {
          this.notify('success', `Registro ${this.editingId ? 'actualizado' : 'creado'} correctamente`);
          this.modalOpen = false;
          this.cargar();
        },
        error: (e) => {
          console.error(e);
          Swal.fire('Error', 'Ocurrió un error al guardar', 'error');
        }
      });
    });
  }

  // -------- Estado (habilitar / deshabilitar) ----------
  toggleEstado(item: Beneficiario) {
    const activando = item.estado === 0;
    Swal.fire({
      title: `${activando ? 'Habilitar' : 'Deshabilitar'} beneficiario`,
      text: `¿Deseas ${activando ? 'habilitar' : 'deshabilitar'} a ${item.nombre} ${item.apellido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No'
    }).then(res => {
      if (!res.isConfirmed) return;

      const obs = activando
        ? this.beneficiarioSrv.habilitar(item.idBeneficiario)
        : this.beneficiarioSrv.deshabilitar(item.idBeneficiario);

      obs.subscribe({
        next: () => {
          this.notify('success', `Beneficiario ${activando ? 'habilitado' : 'deshabilitado'} correctamente`);
          this.cargar();
        },
        error: (e) => {
          console.error(e);
          Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
        }
      });
    });
  }

  trackById = (_: number, it: Beneficiario) => it.idBeneficiario;
}
