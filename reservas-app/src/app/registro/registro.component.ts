import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  nombre = '';
  correo = '';
  password = '';
  mensaje = '';
  exito = false;

  constructor(private http: HttpClient, private router: Router) {}

  registrar() {
    if (!this.nombre || !this.correo || !this.password) {
      this.mensaje = '⚠️ Todos los campos son obligatorios.';
      this.exito = false;
      return;
    }

    const nuevoUsuario = {
      nombre: this.nombre,
      correo: this.correo,
      password: this.password
    };

    this.http.post('http://localhost:3000/registrar', nuevoUsuario).subscribe({
      next: (res: any) => {
        this.mensaje = '✅ Usuario registrado con éxito.';
        this.exito = true;
        setTimeout(() => this.router.navigate(['/']), 1500);
      },
      error: (err) => {
        console.error('❌ Error al registrar:', err);
        this.mensaje = err.error?.error || '❌ Error al registrar usuario.';
        this.exito = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/']);
  }
}
