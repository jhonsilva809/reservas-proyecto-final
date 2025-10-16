import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './admin-reservas.component.html',
  styleUrls: ['./admin-reservas.component.css']
})
export class AdminReservasComponent implements OnInit {
  reservas: any[] = [];
  reservaEditando: any = null;
  chart: any;

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.obtenerReservas();
  }

  obtenerReservas() {
    this.http.get<any[]>('http://localhost:3000/reservas').subscribe({
      next: (data) => {
        this.reservas = data;
        this.generarGrafico();
      },
      error: (err) => console.error('Error al cargar reservas', err)
    });
  }

  generarGrafico() {
    const eventos = this.reservas.map(r => r.evento);
    const conteo = eventos.reduce((acc: any, evento: string) => {
      acc[evento] = (acc[evento] || 0) + 1;
      return acc;
    }, {});

    const ctx = document.getElementById('reservasChart') as HTMLCanvasElement;
    if (this.chart) this.chart.destroy(); // evitar duplicado

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(conteo),
        datasets: [{
          label: 'Cantidad de reservas por evento',
          data: Object.values(conteo),
          backgroundColor: ['#4F46E5', '#22C55E', '#F59E0B']
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } }
      }
    });
  }

  editarReserva(r: any) {
    this.reservaEditando = { ...r };
  }

  guardarCambios() {
    if (!this.reservaEditando) return;
    this.http.put(`http://localhost:3000/reservas/${this.reservaEditando.id}`, this.reservaEditando)
      .subscribe(() => {
        alert('✅ Cambios guardados correctamente');
        this.reservaEditando = null;
        this.obtenerReservas();
      });
  }

  cancelarEdicion() {
    this.reservaEditando = null;
  }

  eliminarReserva(id: number) {
    if (confirm('¿Seguro que deseas eliminar esta reserva?')) {
      this.http.delete(`http://localhost:3000/reservas/${id}`).subscribe(() => {
        alert('🗑️ Reserva eliminada');
        this.obtenerReservas();
      });
    }
  }

  volver() {
    this.router.navigate(['/reservas']);
  }
}
