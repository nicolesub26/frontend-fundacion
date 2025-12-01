import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table/data-table.component';
import { HistorialCompraComponent } from '../historial-compra/historial-compra.component';


@Component({
  selector: 'app-historial',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent, HistorialCompraComponent],
  templateUrl: './historial.component.html',
  styleUrl: './historial.component.css'
})
export class HistorialComponent implements OnInit{
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

}
