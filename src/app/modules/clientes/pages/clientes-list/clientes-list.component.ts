import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DataTableComponent } from '../../../../shared/components/data-table/data-table/data-table.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [CommonModule, DataTableComponent, FormsModule],
  templateUrl: './clientes-list.component.html',
  styleUrls: ['./clientes-list.component.css']
})
export class ClientesListComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  
}