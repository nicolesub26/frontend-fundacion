import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-from',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-from.component.html',
  styleUrl: './cliente-from.component.css'
})
export class ClienteFromComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  
}