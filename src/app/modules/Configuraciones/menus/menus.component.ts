import { Component, OnInit } from '@angular/core';
import { Menu } from '../../../layout/service/auth.service';
import { MenuService } from '../../../core/services/menu.service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menus',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {

  menus: Menu[] = [];
  menuForm!: FormGroup;

  showModal = false;
  modalTitle = '';
  isEditing = false;
  selectedIdMenu: number | null = null;

  constructor(
    private menuService: MenuService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMenus();
  }

  initForm() {
    this.menuForm = this.fb.group({
      nombre: ['', Validators.required],
      direccion: ['', Validators.required],
      estado: [1, Validators.required]   // ACTIVO = 1, INACTIVO = 0
    });
  }

  loadMenus() {
    this.menuService.getAllMenus().subscribe({
      next: (data) => this.menus = data,
      error: (err) => console.error(err)
    });
  }

  // Abrir modal para crear
  openCreateModal() {
    this.menuForm.reset({ estado: 1 });
    this.modalTitle = "Crear menú";
    this.isEditing = false;
    this.selectedIdMenu = null;
    this.showModal = true;
  }

  // Abrir modal para editar
  openEditModal(menu: Menu) {
    this.selectedIdMenu = menu.idMenu;
    this.isEditing = true;
    this.modalTitle = "Editar menú";

    this.menuForm.patchValue({
      nombre: menu.nombre,
      direccion: menu.direccion,
      estado: menu.estado
    });

    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  submitForm() {
    if (this.menuForm.invalid) return;

    const formData = this.menuForm.value as Menu;

    if (this.isEditing && this.selectedIdMenu !== null) {
      this.updateMenu(this.selectedIdMenu, formData);
    } else {
      this.createMenu(formData);
    }
  }

  createMenu(menu: Menu) {
    this.menuService.createMenu(menu).subscribe({
      next: () => {
        this.loadMenus();
        this.closeModal();
      },
      error: (err) => console.error(err)
    });
  }

  updateMenu(idMenu: number, menu: Menu) {
    this.menuService.updateMenu(idMenu, menu).subscribe({
      next: () => {
        this.loadMenus();
        this.closeModal();
      },
      error: (err) => console.error(err)
    });
  }

  deleteMenu(idMenu: number) {
    if (!confirm("¿Deseas eliminar este menú?")) return;

    this.menuService.deleteMenu(idMenu).subscribe({
      next: () => this.loadMenus(),
      error: (err) => console.error(err)
    });
  }
}
