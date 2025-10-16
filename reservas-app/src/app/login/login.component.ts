import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  nombre = '';
  mensaje = '';
  modoRegistro = false;
  rol = 'usuario'; // 👤 Por defecto es usuario
  codigoAdmin = ''; // 🔒 Código secreto para admin

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  // 🔄 Alternar entre Login y Registro
  toggleModo() {
    this.modoRegistro = !this.modoRegistro;
    this.mensaje = '';
    this.email = '';
    this.password = '';
    this.nombre = '';
    this.rol = 'usuario';
    this.codigoAdmin = '';
  }

  // 🔐 Iniciar sesión
  login() {
    if (!this.email || !this.password) {
      this.mensaje = 'Por favor completa todos los campos.';
      return;
    }

    this.http.post('http://localhost:3000/login', {
      correo: this.email.trim().toLowerCase(),
      password: this.password
    }).subscribe({
      next: (res: any) => {
        alert(`✅ Bienvenido ${res.usuario.nombre}`);
        this.authService.setUsuario(res.usuario);
        // 🔍 Redirige según el rol
        if (res.usuario.rol === 'admin') {
          this.router.navigate(['/admin-reservas']);
        } else {
          this.router.navigate(['/reservas']);
        }
      },
      error: (err) => {
        console.error('❌ Error en login:', err);
        this.mensaje = err.error?.error || 'Correo o contraseña incorrectos.';
      }
    });
  }

  // 🧍 Registrar nuevo usuario o admin
  registrar() {
    if (!this.nombre || !this.email || !this.password) {
      this.mensaje = 'Todos los campos son obligatorios.';
      return;
    }

    this.http.post('http://localhost:3000/registrar', {
      nombre: this.nombre.trim(),
      correo: this.email.trim().toLowerCase(),
      password: this.password,
      rol: this.rol,
      codigoAdmin: this.codigoAdmin // 👈 agregado
    }).subscribe({
      next: () => {
        alert('✅ Registro exitoso. Ahora puedes iniciar sesión.');
        this.toggleModo();
      },
      error: (err) => {
        console.error('❌ Error en registro:', err);
        this.mensaje = err.error?.error || 'El correo ya está registrado.';
      }
    });
  }
}
