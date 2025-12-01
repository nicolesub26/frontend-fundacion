import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Proveedor, ProveedorService } from '../../../../core/services/proveedor.service';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table/data-table.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-proveedor',
  imports: [CommonModule, FormsModule,ReactiveFormsModule, DataTableComponent],
  templateUrl: './proveedor.component.html',
  styleUrl: './proveedor.component.css'
})
export class ProveedorComponent {
  proveedores: Proveedor[] = [];
  proveedorForm: FormGroup;
  currentProveedor: Proveedor | null = null;
  showForm = false;
  loading = false;
  searchTerm = '';

  constructor(
    private proveedorService: ProveedorService,
    private fb: FormBuilder
  ) {
    this.proveedorForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadProveedores();
  }

  loadProveedores(): void {
    this.loading = true;
    this.proveedorService.getAllProveedores().subscribe({
      next: (data) => {
        this.proveedores = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Error al cargar proveedores', 'error');
      }
    });
  }

  search(): void {
    if (!this.searchTerm.trim()) {
      this.loadProveedores();
      return;
    }

    this.loading = true;
    this.proveedorService.searchProveedores(this.searchTerm).subscribe({
      next: (data) => {
        this.proveedores = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Error al buscar proveedores', 'error');
      }
    });
  }

  showAddForm(): void {
    this.currentProveedor = null;
    this.proveedorForm.reset();
    this.showForm = true;
  }

  showEditForm(proveedor: Proveedor): void {
    this.currentProveedor = proveedor;
    this.proveedorForm.patchValue(proveedor);
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.proveedorForm.reset();
  }

  saveProveedor(): void {
    if (this.proveedorForm.invalid) return;

    const proveedorData = this.proveedorForm.value;
    this.loading = true;

    const action$ = this.currentProveedor
      ? this.proveedorService.updateProveedor(this.currentProveedor.id, proveedorData)
      : this.proveedorService.createProveedor(proveedorData);

    action$.subscribe({
      next: () => {
        this.loadProveedores();
        this.showForm = false;
        this.proveedorForm.reset();
        this.loading = false;
        Swal.fire('Éxito', this.currentProveedor ? 'Proveedor actualizado' : 'Proveedor creado', 'success');
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'Error al guardar proveedor', 'error');
      }
    });
  }

  deleteProveedor(id: number): void {
    Swal.fire({
      title: '¿Eliminar proveedor?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.proveedorService.deleteProveedor(id).subscribe({
          next: () => {
            this.loadProveedores();
            this.loading = false;
            Swal.fire('Eliminado', 'Proveedor eliminado exitosamente', 'success');
          },
          error: () => {
            this.loading = false;
            Swal.fire('Error', 'Error al eliminar proveedor', 'error');
          }
        });
      }
    });
  }

}
