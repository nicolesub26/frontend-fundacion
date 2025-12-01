// layout.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

import { CommonModule } from '@angular/common';
import { SidebarService } from '../../service/sidebar.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, CommonModule],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit {
  isSmallScreen = false;

  constructor(public sidebarService: SidebarService) {}

  ngOnInit() {
    this.checkScreenSize();
    // Inicializar el estado del sidebar basado en el tamaño de pantalla
    this.initializeSidebarState();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
    this.handleResponsiveBehavior();
  }

  private checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
  }

  private initializeSidebarState() {
    // En pantallas grandes, abrir por defecto
    // En pantallas pequeñas, cerrar por defecto
    if (!this.isSmallScreen && !this.sidebarService.isOpen) {
      this.sidebarService.open();
    } else if (this.isSmallScreen && this.sidebarService.isOpen) {
      this.sidebarService.close();
    }
  }

  private handleResponsiveBehavior() {
    // Cuando cambia el tamaño de pantalla, ajustar el sidebar
    if (this.isSmallScreen) {
      // En pantallas pequeñas, cerrar si está abierto
      if (this.sidebarService.isOpen) {
        this.sidebarService.close();
      }
    } else {
      // En pantallas grandes, abrir si está cerrado
      if (!this.sidebarService.isOpen) {
        this.sidebarService.open();
      }
    }
  }
}