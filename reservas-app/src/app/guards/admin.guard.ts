import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const usuario = this.authService.getUsuario();

    // 🚫 Si no hay usuario o no es admin, lo redirige
    if (!usuario || usuario.rol !== 'admin') {
      alert('🚫 Acceso denegado. Solo los administradores pueden ingresar.');
      this.router.navigate(['/']);
      return false;
    }

    return true; // ✅ Es admin, puede acceder
  }
}
