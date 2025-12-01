// sidebar.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isOpenSubject = new BehaviorSubject<boolean>(this.getInitialState());
  public isOpen$ = this.isOpenSubject.asObservable();

  constructor() {
    // Escuchar cambios en el tamaño de pantalla
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
  }

  private getInitialState(): boolean {
    // Abierto por defecto en pantallas grandes (md y superiores)
    return window.innerWidth >= 768;
  }

  private handleResize(): void {
    const isLargeScreen = window.innerWidth >= 768;
    
    // En pantallas grandes, mantener abierto por defecto
    // En pantallas pequeñas, cerrar automáticamente
    if (isLargeScreen && !this.isOpenSubject.value) {
      this.isOpenSubject.next(true);
    } else if (!isLargeScreen && this.isOpenSubject.value) {
      this.isOpenSubject.next(false);
    }
  }

  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  open(): void {
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}