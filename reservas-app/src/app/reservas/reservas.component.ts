import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.css']
})
export class ReservasComponent implements OnInit {
  usuario: any = null;

  currentStep = 1;
  selectedEventType = '';
  selectedProvider = '';
  selectedDate = '';
  email = '';
  minDate: string = new Date().toISOString().split('T')[0];

  eventTypes = [
  {
    name: 'Cumpleaños',
    icon: '🎂',
    image: 'http://imgfz.com/i/zPhtfT3.jpeg'
  },
  {
    name: 'Carnavales',
    icon: '🎭',
    image: 'http://imgfz.com/i/qlxRJzP.jpeg'
  },
  {
    name: 'Fiestas Privadas',
    icon: '🍾',
    image: 'http://imgfz.com/i/AucxZfr.jpeg'
  }
];


  providers = [
  {
    nombre: 'Proveedor A',
    imagen: 'http://imgfz.com/i/oBhWNmi.jpeg'
  },
  {
    nombre: 'Proveedor B',
    imagen: 'http://imgfz.com/i/P69Khs7.jpeg'
  },
  {
    nombre: 'Proveedor C',
    imagen: 'http://imgfz.com/i/Q3k8HRn.jpeg'
  }
];


  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // 🔹 Cargar usuario logueado
    this.usuario = this.authService.getUsuario();

    // Si no hay usuario, redirigir al login
    if (!this.usuario) {
      alert('⚠️ Debes iniciar sesión primero.');
      this.router.navigate(['/']);
    }
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  irAAdmin() {
    this.router.navigate(['/admin-reservas']);
  }

  selectEvent(event: any) {
    this.selectedEventType = event.name;
    this.currentStep = 2;
  }

  selectProvider(provider: string) {
    this.selectedProvider = provider;
  }

  confirm() {
    if (!this.selectedProvider || !this.selectedDate || !this.email) {
      alert('⚠️ Completa todos los campos antes de confirmar.');
      return;
    }

    const nuevaReserva = {
      nombre_cliente: this.email.split('@')[0],
      evento: this.selectedEventType,
      proveedor: this.selectedProvider,
      fecha: this.selectedDate,
      correo: this.email
    };

    fetch('http://localhost:3000/reservas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaReserva)
    })
      .then(res => res.json())
      .then(() => {
        alert('✅ Reserva guardada con éxito.');
        this.reset();
      })
      .catch(err => {
        console.error('❌ Error al guardar la reserva:', err);
        alert('❌ Error al guardar la reserva. Ver consola.');
      });
  }

  reset() {
    this.currentStep = 1;
    this.selectedEventType = '';
    this.selectedProvider = '';
    this.selectedDate = '';
    this.email = '';
  }
}
