import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.css'
})
export class DataTableComponent {
  @Input() columns: Array<{ field: string, header: string }> = [];
  @Input() data: any[] = [];
  @Input() actions: any;
  
  // Propiedades para la paginación
  currentPage: number = 1;
  itemsPerPage: number = 5;

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.data.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.data.length / this.itemsPerPage);
  }

  goToPage(page: number): void {
    this.currentPage = page;
  }
}
