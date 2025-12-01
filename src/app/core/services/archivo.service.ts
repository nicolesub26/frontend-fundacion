// services/archivo.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArchivoService {
  private apiUrl = 'http://localhost:9090/api/archivos';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Obtener URL completa de la imagen
  getImageUrl(nombreArchivo: string): string {
    if (!nombreArchivo) return '';
    return `${this.apiUrl}/${nombreArchivo}`;
  }

  // Descargar archivo como blob
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${nombreArchivo}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }

  // Verificar si una imagen existe
  verificarImagen(nombreArchivo: string): Observable<boolean> {
    return new Observable(observer => {
      const img = new Image();
      img.onload = () => {
        observer.next(true);
        observer.complete();
      };
      img.onerror = () => {
        observer.next(false);
        observer.complete();
      };
      img.src = this.getImageUrl(nombreArchivo);
    });
  }

  // Validar archivo antes de subir
  validarArchivo(archivo: File): { valido: boolean; mensaje?: string } {
    // Tipos de archivo permitidos
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Tamaño máximo: 5MB
    const tamañoMaximo = 5 * 1024 * 1024;

    if (!tiposPermitidos.includes(archivo.type)) {
      return {
        valido: false,
        mensaje: 'Solo se permiten archivos de imagen (JPEG, PNG, WebP)'
      };
    }

    if (archivo.size > tamañoMaximo) {
      return {
        valido: false,
        mensaje: 'El archivo no puede superar los 5MB'
      };
    }

    return { valido: true };
  }

  // Redimensionar imagen antes de subir (opcional)
  redimensionarImagen(file: File, maxWidth: number = 800, maxHeight: number = 600, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob y luego a File
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(resizedFile);
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error al procesar archivo';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status) {
        errorMessage = `Error ${error.status}: ${error.statusText}`;
      }
    }
    
    console.error('Error en ArchivoService:', error);
    return throwError(() => new Error(errorMessage));
  }
}