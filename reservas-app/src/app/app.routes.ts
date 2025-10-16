import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ReservasComponent } from './reservas/reservas.component';
import { AdminReservasComponent } from './admin-reservas/admin-reservas.component';
import { RegistroComponent } from './registro/registro.component';
import { AdminGuard } from './guards/admin.guard'; // ✅ Importa el guard

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { path: 'reservas', component: ReservasComponent },
  {
    path: 'admin-reservas',
    component: AdminReservasComponent,
    canActivate: [AdminGuard] // 🔒 Solo admins pueden ingresar
  }
];
