import { Component, OnInit } from '@angular/core';
import { Menu, Role } from '../../../layout/service/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../../../shared/components/data-table/data-table/data-table.component';

import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioService } from '../../../core/services/usuario.service';

@Component({
  selector: 'app-roles-permisos',
  imports: [CommonModule,RouterModule,FormsModule, DataTableComponent],
  templateUrl: './roles-permisos.component.html',
  styleUrl: './roles-permisos.component.css'
})
export class RolesPermisosComponent implements OnInit {
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }
  

}
