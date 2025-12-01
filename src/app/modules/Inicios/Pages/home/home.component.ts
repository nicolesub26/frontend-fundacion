import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  hero = {
    title: 'Fundación Manos Solidarias',
    subtitle: 'Doná ropa, alimentos o dinero. Toda ayuda cuenta y cambia vidas.',
    ctaPrimary: 'Donar ahora',
    ctaSecondary: 'Donar artículos',
    background: 'assets/imagenes/fondo.jpg',
    logo: 'assets/imagenes/images.png'
  };

  cards = [
    {
      title: 'Donaciones de Articulos',
      text: 'Recibimos ropa, alimentos, muebles, medicina y más.',
      btn: 'Cómo donar',
      img: 'assets/imagenes/Aticulo.jpg'
    },
    {
      title: 'Donaciones monetarias',
      text: 'Aporta de manera segura para nuestros programas de ayuda.',
      btn: 'Donar dinero',
      img: 'assets/imagenes/dinero.jpg'
    },
    {
      title: 'Voluntariado',
      text: 'Forma parte de nuestras actividades y ayuda con tu tiempo.',
      btn: 'Ser voluntario',
      img: 'assets/imagenes/Voluntario.jpg'
    },
    {
      title: 'Programas Activos',
      text: 'Educación, alimentación, rescate y más proyectos.',
      btn: 'Ver programas',
      img: 'assets/imagenes/actividad.jpg'
    }
  ];

  onCardAction(card: any) {
    alert(`Acción: ${card.btn}`);
  }
}