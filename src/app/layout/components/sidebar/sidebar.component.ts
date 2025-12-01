// sidebar.component.ts
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Menu, AuthService } from '../../service/auth.service';
import { Subscription } from 'rxjs';
import { SidebarService } from '../../service/sidebar.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  menus: Menu[] = [];
  isSmallScreen = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public sidebarService: SidebarService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Suscribirse a los cambios en los menús
    const menuSub = this.authService.getCurrentMenus().subscribe(menus => {
      this.menus = menus.filter(menu => menu.estado === 1);
    });
    this.subscriptions.push(menuSub);

    // Detectar tamaño de pantalla inicial
    this.checkScreenSize();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 768;
  }

  getSidebarClasses(): string {
    const isOpen = this.sidebarService.isOpen;
    let classes = '';
    
    if (isOpen) {
      classes += 'w-64 ';
    } else {
      classes += 'w-0 ';
    }
    
    return classes;
  }

  onMenuItemClick() {
    // En pantallas pequeñas, cerrar sidebar al hacer clic en un menú
    if (this.isSmallScreen) {
      this.sidebarService.close();
    }
  }

  // Método para cerrar sidebar al hacer clic fuera (solo en móviles)
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (this.isSmallScreen && this.sidebarService.isOpen) {
      const sidebar = document.querySelector('aside');
      const target = event.target as HTMLElement;
      
      // Si el clic no fue en el sidebar ni en el botón hamburguesa, cerrar
      if (sidebar && !sidebar.contains(target) && !target.closest('button[data-sidebar-toggle]')) {
        this.sidebarService.close();
      }
    }
  }
}