import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Proveedor, ProveedorService } from '../../../../core/services/proveedor.service';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table/data-table.component';

@Component({
  selector: 'app-historial-compra',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent],
  templateUrl: './historial-compra.component.html',
  styleUrl: './historial-compra.component.css'
})
export class HistorialCompraComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
}
