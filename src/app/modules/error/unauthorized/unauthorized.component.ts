import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 class="text-6xl font-bold text-red-600 mb-4">403</h1>
      <p class="text-2xl text-gray-600 mb-8">Acceso No Autorizado</p>
      <p class="text-gray-500 mb-8">No tienes permisos para ver esta página.</p>
      <a routerLink="/" class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        Volver al Inicio
      </a>
    </div>
  `
})
export class UnauthorizedComponent { }
