import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AgroSmartService } from '../services/agrosmart.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
})
export class LoginPage {
  private readonly agroService = inject(AgroSmartService);
  private readonly router = inject(Router);

  email = 'admin@agrosmart.mx';
  password = 'admin123';
  cargando = false;
  mensajeError = '';

  iniciarSesion(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.mensajeError = 'Por favor ingresa tu correo y contraseña.';
      return;
    }
    this.cargando = true;
    this.mensajeError = '';

    this.agroService.login(this.email, this.password).subscribe({
      next: () => {
        this.cargando = false;
        this.router.navigateByUrl('/home');
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible iniciar sesión. Verifica tus credenciales.';
      },
    });
  }

  accesoRapido(tipo: 'admin' | 'campo'): void {
    if (tipo === 'admin') {
      this.email = 'admin@agrosmart.mx';
      this.password = 'admin123';
    } else {
      this.email = 'campo@agrosmart.mx';
      this.password = 'campo123';
    }
    this.iniciarSesion();
  }
}
