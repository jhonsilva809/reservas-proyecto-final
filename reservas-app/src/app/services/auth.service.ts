import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioKey = 'usuarioLogueado';

  // 🔹 Guarda los datos del usuario en localStorage
  setUsuario(usuario: any) {
    localStorage.setItem(this.usuarioKey, JSON.stringify(usuario));
  }

  // 🔹 Obtiene los datos del usuario logueado
  getUsuario() {
    const data = localStorage.getItem(this.usuarioKey);
    return data ? JSON.parse(data) : null;
  }

  // 🔹 Cierra sesión y elimina el usuario guardado
  logout() {
    localStorage.removeItem(this.usuarioKey);
  }
}
