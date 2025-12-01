import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Empleado, EmpleadoService } from '../../../../core/services/empleado.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-empleado-from',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './empleado-from.component.html',
  styleUrl: './empleado-from.component.css'
})
export class EmpleadoFromComponent {
}
