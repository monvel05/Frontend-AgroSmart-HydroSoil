import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { AgroSmartService } from '../services/agrosmart.service';
import type {
  BitacoraSensor,
  DashboardData,
  DispositivoSeguridad,
  LecturaSensor,
  ProcesamientoIA,
  RutinaRiego,
  UsuarioAgroSmart,
} from '../models/agrosmart.models';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent],
})
export class HomePage implements OnInit {
  public readonly agroService = inject(AgroSmartService);
  private readonly router = inject(Router);

  usuario!: UsuarioAgroSmart;
  vistaActiva: 'dashboard' | 'riegos' | 'bitacoras' | 'circuitos' = 'dashboard';

  // Filtros globales
  filtroDispositivo = 'todos';
  filtroCultivo = 'todos';

  // Estado general cargado del backend
  dashboardData: DashboardData | null = null;
  circuitos: DispositivoSeguridad[] = [];
  lecturas: LecturaSensor[] = [];
  rutinas: RutinaRiego[] = [];
  bitacoras: BitacoraSensor[] = [];

  mensajeToast = '';

  // 1. Simulador de telemetría rápida (Dashboard)
  simDispositivoId = 'ESP32-CIRCUITO-01';
  simHumedad = 38.5;
  simPh = 6.3;
  simEc = 1.75;

  // 2. Formulario de Configuración de Riego Manual
  manualDispositivoId = 'ESP32-CIRCUITO-01';
  manualDuracionMin = 25;
  manualVolumenLitros = 280;
  manualNutrienteA = 40;
  manualNutrienteB = 25;
  manualEjecutarAhora = true;
  manualFechaProgramada = '2026-11-09T19:00:00';

  // 3. Optimización de Riego con IA (Modelo 2)
  iaDispositivoId = 'ESP32-CIRCUITO-01';
  iaHumedad = 36.0;
  iaPh = 6.4;
  iaEc = 1.8;
  ultimaEvaporacionPredicha: number | null = null;

  // 4. Bitácoras y Detección de Plagas (Modelo 1 - Minería de Texto)
  bitacoraDispositivoId = 'ESP32-CIRCUITO-02';
  bitacoraTextoRaw = '';
  previsualizacionIA: ProcesamientoIA | null = null;

  // 5. Gestión Multi-Circuito ESP32 + Código .ino
  nuevoCircuito = {
    dispositivo_id: 'ESP32-CIRCUITO-04',
    nombre_circuito: 'Circuito 4 — Pimiento Morrón (Invernadero C)',
    sector_id: 'Invernadero Hidropónico C1',
    tipo_cultivo: 'hidroponico',
    ip_asignada: '192.168.1.104',
    tipo: 'ESP32 + Sensores pH/EC/Humedad + Electroválvula Solenoide',
    area_cobertura_m2: 300,
  };

  codigoInoSeleccionado: {
    dispositivo_id: string;
    nombre_archivo: string;
    codigo_ino: string;
  } | null = null;

  ngOnInit(): void {
    this.usuario = this.agroService.getUsuarioActual();
    this.cargarDatos();
  }

  cambiarVista(vista: 'dashboard' | 'riegos' | 'bitacoras' | 'circuitos'): void {
    this.vistaActiva = vista;
  }

  cargarDatos(): void {
    this.agroService.getDashboard(this.filtroDispositivo, this.filtroCultivo).subscribe((data) => {
      this.dashboardData = data;
      this.circuitos = data.circuitos;
      this.lecturas = data.lecturas_recientes;
      this.rutinas = data.rutinas_recientes;
      this.bitacoras = data.bitacoras_recientes;
    });
  }

  mostrarNotificacion(texto: string): void {
    this.mensajeToast = texto;
    setTimeout(() => {
      if (this.mensajeToast === texto) {
        this.mensajeToast = '';
      }
    }, 4000);
  }

  obtenerCircuitoPorId(dispositivoId: string): DispositivoSeguridad | undefined {
    return this.circuitos.find((c) => c.dispositivo_id === dispositivoId);
  }

  // ==========================================================================
  // ACCIONES DASHBOARD Y TELEMETRÍA
  // ==========================================================================
  registrarLecturaSimulada(): void {
    const c = this.obtenerCircuitoPorId(this.simDispositivoId) || this.circuitos[0];
    this.agroService
      .simularLectura({
        dispositivo_id: c?.dispositivo_id || 'ESP32-CIRCUITO-01',
        sector_id: c?.sector_id || 'Sector Norte - Parcela A1',
        tipo_cultivo: c?.tipo_cultivo || 'rodado',
        humedad_suelo: Number(this.simHumedad),
        ph: Number(this.simPh),
        electroconductividad: Number(this.simEc),
      })
      .subscribe((lec) => {
        this.mostrarNotificacion(
          `Lectura registrada en ${lec.dispositivo_id}. Evaporación IA: ${lec.lecturas.evaporacion_predicha} mm/día`,
        );
        this.cargarDatos();
      });
  }

  restaurarDatosPrueba(): void {
    this.agroService.restaurarSeed().subscribe((res) => {
      this.mostrarNotificacion(res.mensaje);
      this.cargarDatos();
    });
  }

  // ==========================================================================
  // ACCIONES RIEGOS MANUALES Y OPTIMIZACIÓN IA
  // ==========================================================================
  guardarRiegoManual(): void {
    const c = this.obtenerCircuitoPorId(this.manualDispositivoId) || this.circuitos[0];
    this.agroService
      .crearRiegoManual({
        dispositivo_id: this.manualDispositivoId,
        sector_id: c?.sector_id || 'Sector Norte - Parcela A1',
        tipo_cultivo: c?.tipo_cultivo || 'rodado',
        duracion_minutos: Number(this.manualDuracionMin),
        volumen_agua_litros: Number(this.manualVolumenLitros),
        nutriente_a: Number(this.manualNutrienteA),
        nutriente_b: Number(this.manualNutrienteB),
        ejecutar_ahora: this.manualEjecutarAhora,
        fecha_programada: this.manualFechaProgramada,
      })
      .subscribe((rutina) => {
        this.mostrarNotificacion(
          this.manualEjecutarAhora
            ? `Riego manual iniciado en ${rutina.dispositivo_id} (${rutina.parametros_optimizados.duracion_minutos} min). Electroválvula ABIERTA.`
            : `Riego manual programado para ${rutina.sector_id}.`,
        );
        this.cargarDatos();
      });
  }

  ejecutarOptimizacionIA(): void {
    const c = this.obtenerCircuitoPorId(this.iaDispositivoId) || this.circuitos[0];
    this.agroService
      .optimizarRiegoConIA({
        dispositivo_id: this.iaDispositivoId,
        sector_id: c?.sector_id || 'Sector Norte - Parcela A1',
        tipo_cultivo: c?.tipo_cultivo || 'rodado',
        humedad_suelo: Number(this.iaHumedad),
        ph: Number(this.iaPh),
        electroconductividad: Number(this.iaEc),
      })
      .subscribe((res) => {
        this.ultimaEvaporacionPredicha = res.evaporacion_predicha;
        this.mostrarNotificacion(
          `IA generó rutina óptima (${res.rutina.parametros_optimizados.duracion_minutos} min / ${res.rutina.parametros_optimizados.volumen_agua_litros} L) para ${res.rutina.sector_id}.`,
        );
        this.cargarDatos();
      });
  }

  actualizarEstadoRutina(rutina: RutinaRiego, nuevoEstado: string): void {
    this.agroService.cambiarEstadoRutina(rutina._id, nuevoEstado).subscribe(() => {
      this.mostrarNotificacion(`Rutina actualizada a estado: ${nuevoEstado}`);
      this.cargarDatos();
    });
  }

  // ==========================================================================
  // ACCIONES BITÁCORAS Y DETECCIÓN DE PLAGAS (MINERÍA DE TEXTO)
  // ==========================================================================
  cargarEjemploBitacora(tipo: 'mosca' | 'arana' | 'sano'): void {
    if (tipo === 'mosca') {
      this.bitacoraTextoRaw =
        'Se detectan colonias de mosca blanca en el envés de las hojas de jitomate con presencia de melaza y amarillamiento foliar.';
    } else if (tipo === 'arana') {
      this.bitacoraTextoRaw =
        'Alerta urgente: presencia de araña roja y finas telarañas en los brotes jóvenes por baja humedad ambiental.';
    } else {
      this.bitacoraTextoRaw =
        'Inspección matutina sin anomalías. Cultivo con vigor saludable, hojas limpias y humedad uniforme en el sustrato.';
    }
    this.analizarBitacoraEnVivo();
  }

  analizarBitacoraEnVivo(): void {
    if (!this.bitacoraTextoRaw.trim()) return;
    this.agroService.previsualizarAnalisisPlaga(this.bitacoraTextoRaw).subscribe((res) => {
      this.previsualizacionIA = res;
    });
  }

  guardarBitacoraConIA(): void {
    if (!this.bitacoraTextoRaw.trim()) {
      this.mostrarNotificacion('Escribe una observación de campo para analizar con IA.');
      return;
    }
    const c = this.obtenerCircuitoPorId(this.bitacoraDispositivoId) || this.circuitos[0];
    this.agroService
      .crearBitacora({
        agricultor_id: this.usuario.agricultor_id,
        dispositivo_id: this.bitacoraDispositivoId,
        sector_id: c?.sector_id || 'Sector Norte - Parcela A1',
        texto_raw: this.bitacoraTextoRaw,
      })
      .subscribe((nueva) => {
        this.previsualizacionIA = nueva.procesamiento_ia;
        this.bitacoraTextoRaw = '';
        this.mostrarNotificacion(
          `Bitácora clasificada por IA: ${nueva.procesamiento_ia.plaga_detectada} (Urgencia ${nueva.procesamiento_ia.nivel_urgencia}).`,
        );
        this.cargarDatos();
      });
  }

  // ==========================================================================
  // ACCIONES CIRCUITOS ESP32 Y SEGURIDAD INFORMÁTICA
  // ==========================================================================
  toggleValvulaCircuito(circuito: DispositivoSeguridad): void {
    const nuevoEstado = !circuito.valvula_abierta;
    this.agroService.controlarValvula(circuito.dispositivo_id, nuevoEstado).subscribe(() => {
      this.mostrarNotificacion(
        `Electroválvula de ${circuito.dispositivo_id} ${nuevoEstado ? 'ABIERTA (Regando)' : 'CERRADA'}.`,
      );
      this.cargarDatos();
    });
  }

  registrarNuevoCircuito(): void {
    if (!this.nuevoCircuito.dispositivo_id.trim() || !this.nuevoCircuito.sector_id.trim()) {
      this.mostrarNotificacion('Completa el ID del ESP32 y el sector de riego.');
      return;
    }
    this.agroService.agregarCircuito(this.nuevoCircuito).subscribe((creado) => {
      this.mostrarNotificacion(
        `Nuevo circuito ${creado.dispositivo_id} registrado con Token: ${creado.seguridad.token_autenticacion}`,
      );
      const nextNum = this.circuitos.length + 2;
      this.nuevoCircuito.dispositivo_id = `ESP32-CIRCUITO-0${nextNum}`;
      this.cargarDatos();
    });
  }

  rotarToken(circuito: DispositivoSeguridad): void {
    this.agroService.rotarTokenCircuito(circuito.dispositivo_id).subscribe((act) => {
      this.mostrarNotificacion(
        `Token renovado para ${act.dispositivo_id} y alertas de intrusión reiniciadas a 0.`,
      );
      this.cargarDatos();
    });
  }

  simularIntentoNoAutorizado(circuito: DispositivoSeguridad): void {
    this.agroService.simularIntruso(circuito.dispositivo_id).subscribe((act) => {
      this.mostrarNotificacion(
        `Alerta Seguridad: Intento no autorizado bloqueado en ${act.dispositivo_id} (${act.seguridad.intentos_no_autorizados} intentos).`,
      );
      this.cargarDatos();
    });
  }

  verCodigoArduino(circuito: DispositivoSeguridad): void {
    this.agroService.obtenerCodigoIno(circuito.dispositivo_id).subscribe((res) => {
      this.codigoInoSeleccionado = res;
    });
  }

  copiarTexto(texto: string, etiqueta: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(texto);
    }
    this.mostrarNotificacion(`${etiqueta} copiado al portapapeles.`);
  }

  cerrarSesion(): void {
    this.agroService.logout();
    this.router.navigateByUrl('/login');
  }
}
