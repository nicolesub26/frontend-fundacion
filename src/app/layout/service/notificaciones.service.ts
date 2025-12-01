import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  
  constructor() {}

  showSuccess(message: string, title: string = '¡Éxito!'): void {
    this.showSweetAlert(message, 'success', title);
  }

  showError(message: string, title: string = '¡Error!'): void {
    this.showSweetAlert(message, 'error', title);
  }

  showWarning(message: string, title: string = '¡Advertencia!'): void {
    this.showSweetAlert(message, 'warning', title);
  }

  showInfo(message: string, title: string = 'Información'): void {
    this.showSweetAlert(message, 'info', title);
  }

  // Método para confirmaciones (retorna Promise)
  showConfirm(message: string, title: string = '¿Estás seguro?'): Promise<boolean> {
    return new Promise((resolve) => {
      this.showConfirmAlert(message, title, resolve);
    });
  }

  private showSweetAlert(message: string, type: 'success' | 'error' | 'warning' | 'info', title: string): void {
    // Crear el overlay
    const overlay = document.createElement('div');
    overlay.className = 'swal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      zIndex: '9999',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'swal-fade-in 0.3s ease-out'
    });

    // Crear la alerta
    const alert = document.createElement('div');
    alert.className = 'swal-alert';
    Object.assign(alert.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 75px rgba(0, 0, 0, 0.2)',
      animation: 'swal-scale-in 0.3s ease-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      overflow: 'hidden'
    });

    // Crear el header con icono
    const header = document.createElement('div');
    header.style.padding = '32px 24px 24px 24px';
    
    const icon = this.createIcon(type);
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    Object.assign(titleElement.style, {
      margin: '16px 0 8px 0',
      fontSize: '24px',
      fontWeight: '600',
      color: '#2d3748'
    });

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    Object.assign(messageElement.style, {
      margin: '0',
      fontSize: '16px',
      color: '#718096',
      lineHeight: '1.5'
    });

    header.appendChild(icon);
    header.appendChild(titleElement);
    header.appendChild(messageElement);

    // Crear el footer con botón
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '24px',
      borderTop: '1px solid #e2e8f0'
    });

    const button = document.createElement('button');
    button.textContent = 'OK';
    Object.assign(button.style, {
      backgroundColor: this.getButtonColor(type),
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 32px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '80px'
    });

    button.onmouseover = () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    };

    button.onmouseout = () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = 'none';
    };

    button.onclick = () => {
      this.closeAlert(overlay);
    };

    footer.appendChild(button);
    alert.appendChild(header);
    alert.appendChild(footer);
    overlay.appendChild(alert);

    // Agregar estilos CSS
    this.addStyles();

    // Cerrar al hacer clic en el overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.closeAlert(overlay);
      }
    };

    // Cerrar con ESC
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAlert(overlay);
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);

    document.body.appendChild(overlay);

    // Auto cerrar después de 5 segundos (excepto errores)
    if (type !== 'error') {
      setTimeout(() => {
        if (overlay.parentNode) {
          this.closeAlert(overlay);
        }
      }, 5000);
    }
  }

  private showConfirmAlert(message: string, title: string, resolve: (result: boolean) => void): void {
    // Crear el overlay
    const overlay = document.createElement('div');
    overlay.className = 'swal-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      zIndex: '9999',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      animation: 'swal-fade-in 0.3s ease-out'
    });

    // Crear la alerta
    const alert = document.createElement('div');
    alert.className = 'swal-alert';
    Object.assign(alert.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '0',
      maxWidth: '400px',
      width: '90%',
      boxShadow: '0 20px 75px rgba(0, 0, 0, 0.2)',
      animation: 'swal-scale-in 0.3s ease-out',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center',
      overflow: 'hidden'
    });

    // Crear el header con icono
    const header = document.createElement('div');
    header.style.padding = '32px 24px 24px 24px';
    
    const icon = this.createIcon('warning');
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    Object.assign(titleElement.style, {
      margin: '16px 0 8px 0',
      fontSize: '24px',
      fontWeight: '600',
      color: '#2d3748'
    });

    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    Object.assign(messageElement.style, {
      margin: '0',
      fontSize: '16px',
      color: '#718096',
      lineHeight: '1.5'
    });

    header.appendChild(icon);
    header.appendChild(titleElement);
    header.appendChild(messageElement);

    // Crear el footer con botones
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      padding: '24px',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      gap: '12px',
      justifyContent: 'center'
    });

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancelar';
    Object.assign(cancelButton.style, {
      backgroundColor: '#e2e8f0',
      color: '#4a5568',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '80px'
    });

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirmar';
    Object.assign(confirmButton.style, {
      backgroundColor: '#e53e3e',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '80px'
    });

    // Efectos hover
    cancelButton.onmouseover = () => {
      cancelButton.style.backgroundColor = '#cbd5e0';
    };
    cancelButton.onmouseout = () => {
      cancelButton.style.backgroundColor = '#e2e8f0';
    };

    confirmButton.onmouseover = () => {
      confirmButton.style.backgroundColor = '#c53030';
      confirmButton.style.transform = 'translateY(-2px)';
      confirmButton.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)';
    };
    confirmButton.onmouseout = () => {
      confirmButton.style.backgroundColor = '#e53e3e';
      confirmButton.style.transform = 'translateY(0)';
      confirmButton.style.boxShadow = 'none';
    };

    cancelButton.onclick = () => {
      this.closeAlert(overlay);
      resolve(false);
    };

    confirmButton.onclick = () => {
      this.closeAlert(overlay);
      resolve(true);
    };

    footer.appendChild(cancelButton);
    footer.appendChild(confirmButton);
    alert.appendChild(header);
    alert.appendChild(footer);
    overlay.appendChild(alert);

    // Agregar estilos CSS
    this.addStyles();

    // Cerrar al hacer clic en el overlay
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        this.closeAlert(overlay);
        resolve(false);
      }
    };

    // Cerrar con ESC
    const escListener = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.closeAlert(overlay);
        resolve(false);
        document.removeEventListener('keydown', escListener);
      }
    };
    document.addEventListener('keydown', escListener);

    document.body.appendChild(overlay);
  }

  private createIcon(type: 'success' | 'error' | 'warning' | 'info'): HTMLElement {
    const iconContainer = document.createElement('div');
    Object.assign(iconContainer.style, {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      color: 'white',
      backgroundColor: this.getIconColor(type)
    });

    const icon = document.createElement('div');
    icon.innerHTML = this.getIconSvg(type);
    iconContainer.appendChild(icon);

    return iconContainer;
  }

  private getIconSvg(type: string): string {
    const svgs = {
      success: `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      `,
      error: `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      `,
      warning: `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <path d="M12 9v4"/>
          <circle cx="12" cy="17" r="1" fill="white"/>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
      `,
      info: `
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <circle cx="12" cy="8" r="1" fill="white"/>
        </svg>
      `
    };
    return svgs[type as keyof typeof svgs] || svgs.info;
  }

  private getIconColor(type: string): string {
    const colors = {
      success: '#48bb78',
      error: '#f56565',
      warning: '#ed8936',
      info: '#4299e1'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getButtonColor(type: string): string {
    const colors = {
      success: '#48bb78',
      error: '#f56565',
      warning: '#ed8936',
      info: '#4299e1'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private closeAlert(overlay: HTMLElement): void {
    overlay.style.animation = 'swal-fade-out 0.2s ease-in';
    const alert = overlay.querySelector('.swal-alert') as HTMLElement;
    if (alert) {
      alert.style.animation = 'swal-scale-out 0.2s ease-in';
    }
    
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 200);
  }

  private addStyles(): void {
    // Evitar agregar estilos múltiples veces
    if (document.getElementById('swal-styles')) {
      return;
    }

    const style = document.createElement('style');
    style.id = 'swal-styles';
    style.textContent = `
      @keyframes swal-fade-in {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      
      @keyframes swal-fade-out {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      
      @keyframes swal-scale-in {
        from {
          transform: scale(0.7);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
      
      @keyframes swal-scale-out {
        from {
          transform: scale(1);
          opacity: 1;
        }
        to {
          transform: scale(0.7);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}