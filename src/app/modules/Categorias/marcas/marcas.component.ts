import { Component, OnInit } from '@angular/core';
import { Marca, MarcaService } from '../../../core/services/marca.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table/data-table.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-marcas',
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './marcas.component.html',
  styleUrl: './marcas.component.css',
  standalone: true
})
export class MarcasComponent implements OnInit{
  marcas: Marca[] = [];
  mostrarModal = false;
  marcaEditando: Marca = {
    nombre: '', descripcion: '',
    id: 0
  };
  esNuevaMarca = false;
  mensaje: string = '';
  tipoMensaje: 'success' | 'error' | '' = '';
  editando: boolean = false;
  marcaEditandoId?: number;

  constructor(private marcaService: MarcaService) {}

  ngOnInit(): void {
    this.cargarMarcas();
  }

  
  cargarMarcas(): void {
    this.marcaService.listarMarcas().subscribe(
      (data) => this.marcas = data,
      (error) => this.mostrarMensaje('Error al cargar marcas', 'error')
    );
  }
  editarMarca(marca: Marca): void {
    this.marcaEditando = { ...marca };
    this.esNuevaMarca = false;
    this.mostrarModal = true;
  }

  crearMarca(): void {
    this.marcaEditando = { id:0,nombre: '', descripcion: '' };
    this.esNuevaMarca = true;
    this.mostrarModal = true;
  }




  cerrarModal(): void {
    this.mostrarModal = false;
  }


  guardarMarca(): void {
    if (this.editando) {
      this.marcaService.actualizarMarca(this.marcaEditandoId!, this.marcaEditando).subscribe(
        () => {
          this.mostrarMensaje('Marca actualizada correctamente', 'success');
          this.reiniciarFormulario();
          this.cargarMarcas();
        },
        () => this.mostrarMensaje('Error al actualizar marca', 'error')
      );
    } else {
      this.marcaService.crearMarca(this.marcaEditando).subscribe(
        () => {
          this.mostrarMensaje('Marca creada correctamente', 'success');
          this.reiniciarFormulario();
          this.cargarMarcas();
        },
        () => this.mostrarMensaje('Error al crear marca', 'error')
      );
    }
  }


  eliminarMarca(marca: Marca): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta marca?')) {
      this.marcaService.eliminarMarca(marca.id).subscribe(
        () => {
          this.mostrarMensaje('Marca eliminada correctamente', 'success');
          this.cargarMarcas();
        },
        () => this.mostrarMensaje('Error al eliminar marca', 'error')
      );
    }
  }

 reiniciarFormulario(): void {
    this.marcaEditando = {id: 0, nombre: '', descripcion:'' };
    this.editando = false;
    this.marcaEditandoId = undefined;
  }

  mostrarMensaje(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensaje = '';
      this.tipoMensaje = '';
    }, 3000);
  }
}
