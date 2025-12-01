import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrModule, ToastrService } from 'ngx-toastr';

// Importamos SweetAlert
import Swal from 'sweetalert2';

@Component({
  selector: 'app-nueva-venta',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './nueva-venta.component.html',
  styleUrl: './nueva-venta.component.css'
})
export class NuevaVentaComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
      
}
