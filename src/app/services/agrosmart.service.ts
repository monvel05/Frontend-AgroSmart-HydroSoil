import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type {
  BitacoraSensor,
  DashboardData,
  DispositivoSeguridad,
  LecturaSensor,
  ProcesamientoIA,
  RutinaRiego,
  UsuarioAgroSmart,
} from '../models/agrosmart.models';

@Injectable({
  providedIn: 'root',
})
export class AgroSmartService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  public backendConnected = true;

  // Datos de respaldo local en caso de que el servidor FastAPI no esté encendido aún
  private fallbackCircuitos: DispositivoSeguridad[] = [
    {
      _id: 'disp_001',
      dispositivo_id: 'ESP32-CIRCUITO-01',
      nombre_circuito: 'Circuito 1 — Guayaba y Maíz (Riego Rodado)',
      sector_id: 'Sector Norte - Parcela A1',
      tipo_cultivo: 'rodado',
      estado_actual: 'Activo',
      valvula_abierta: false,
      area_cobertura_m2: 450,
      tipo: 'ESP32 + Sensores pH/EC/Humedad + Electroválvula 1"',
      seguridad: {
        intentos_no_autorizados: 0,
        ip_asignada: '192.168.1.101',
        token_autenticacion: 'ags_tok_9f8e7d6c5b4a3f2e1d0c',
        ultimo_acceso_autorizado: '2026-11-09T10:45:00',
      },
    },
    {
      _id: 'disp_002',
      dispositivo_id: 'ESP32-CIRCUITO-02',
      nombre_circuito: 'Circuito 2 — Fresa y Jitomate NFT (Hidropónico)',
      sector_id: 'Invernadero Hidropónico B2',
      tipo_cultivo: 'hidroponico',
      estado_actual: 'En Riego',
      valvula_abierta: true,
      area_cobertura_m2: 220,
      tipo: 'ESP32 + Bombas Dosificadoras A/B + Sonda EC/pH',
      seguridad: {
        intentos_no_autorizados: 1,
        ip_asignada: '192.168.1.102',
        token_autenticacion: 'ags_tok_4a5b6c7d8e9f0a1b2c3d',
        ultimo_acceso_autorizado: '2026-11-09T10:48:30',
      },
    },
    {
      _id: 'disp_003',
      dispositivo_id: 'ESP32-CIRCUITO-03',
      nombre_circuito: 'Circuito 3 — Hortalizas de Hoja (Cama Sustrato)',
      sector_id: 'Sector Sur - Parcela C1',
      tipo_cultivo: 'rodado',
      estado_actual: 'Alerta Seguridad',
      valvula_abierta: false,
      area_cobertura_m2: 320,
      tipo: 'ESP32 + Nodo LoRa/WiFi + Válvula Solenoide',
      seguridad: {
        intentos_no_autorizados: 4,
        ip_asignada: '192.168.1.103',
        token_autenticacion: 'ags_tok_7c8d9e0f1a2b3c4d5e6f',
        ultimo_acceso_autorizado: '2026-11-09T09:15:10',
      },
    },
  ];

  private fallbackLecturas: LecturaSensor[] = [
    {
      _id: 'lec_001',
      dispositivo_id: 'ESP32-CIRCUITO-01',
      timestamp: '2026-11-09T10:45:00',
      tipo_cultivo: 'rodado',
      lecturas: {
        electroconductividad: 1.65,
        evaporacion_predicha: 4.2,
        humedad_suelo: 41.5,
        ph: 6.4,
      },
      ubicacion: {
        coordenadas: [21.8469, -102.7188],
        sector: 'Sector Norte - Parcela A1',
      },
    },
    {
      _id: 'lec_002',
      dispositivo_id: 'ESP32-CIRCUITO-02',
      timestamp: '2026-11-09T10:48:00',
      tipo_cultivo: 'hidroponico',
      lecturas: {
        electroconductividad: 2.35,
        evaporacion_predicha: 2.8,
        humedad_suelo: 78.2,
        ph: 5.8,
      },
      ubicacion: {
        coordenadas: [21.8475, -102.7195],
        sector: 'Invernadero Hidropónico B2',
      },
    },
    {
      _id: 'lec_003',
      dispositivo_id: 'ESP32-CIRCUITO-03',
      timestamp: '2026-11-09T10:40:00',
      tipo_cultivo: 'rodado',
      lecturas: {
        electroconductividad: 1.85,
        evaporacion_predicha: 5.1,
        humedad_suelo: 29.4,
        ph: 6.9,
      },
      ubicacion: {
        coordenadas: [21.8452, -102.7172],
        sector: 'Sector Sur - Parcela C1',
      },
    },
  ];

  private fallbackRutinas: RutinaRiego[] = [
    {
      _id: 'rut_001',
      dispositivo_id: 'ESP32-CIRCUITO-01',
      sector_id: 'Sector Norte - Parcela A1',
      tipo_cultivo: 'rodado',
      modo: 'automatico_ia',
      algoritmo_utilizado: 'Algoritmo Genético + Red Neuronal Evaporación',
      estado: 'Programado',
      fecha_programada: '2026-11-09T18:30:00',
      parametros_optimizados: {
        duracion_minutos: 35,
        volumen_agua_litros: 420.5,
        mezcla_fertirriego: { nutriente_a: 45, nutriente_b: 30 },
      },
    },
    {
      _id: 'rut_002',
      dispositivo_id: 'ESP32-CIRCUITO-02',
      sector_id: 'Invernadero Hidropónico B2',
      tipo_cultivo: 'hidroponico',
      modo: 'automatico_ia',
      algoritmo_utilizado: 'Búsqueda Heurística A* + Red Neuronal Sustrato',
      estado: 'En Curso',
      fecha_programada: '2026-11-09T10:30:00',
      parametros_optimizados: {
        duracion_minutos: 18,
        volumen_agua_litros: 145.0,
        mezcla_fertirriego: { nutriente_a: 80, nutriente_b: 65 },
      },
    },
    {
      _id: 'rut_003',
      dispositivo_id: 'ESP32-CIRCUITO-03',
      sector_id: 'Sector Sur - Parcela C1',
      tipo_cultivo: 'rodado',
      modo: 'manual',
      algoritmo_utilizado: 'Configuración Manual de Operador',
      estado: 'Completado',
      fecha_programada: '2026-11-09T06:30:00',
      parametros_optimizados: {
        duracion_minutos: 25,
        volumen_agua_litros: 310.0,
        mezcla_fertirriego: { nutriente_a: 25, nutriente_b: 20 },
      },
    },
  ];

  private fallbackBitacoras: BitacoraSensor[] = [
    {
      _id: 'bit_001',
      agricultor_id: 'AGR-UTC-01',
      dispositivo_id: 'ESP32-CIRCUITO-02',
      sector_id: 'Invernadero Hidropónico B2',
      fecha_registro: '2026-11-09T09:30:00',
      texto_raw:
        'Se observan colonias de mosca blanca en el envés de las hojas de jitomate hidropónico de la línea 3, con ligero amarillamiento y melaza pegajosa.',
      procesamiento_ia: {
        categoria: 'Alerta Fitosanitaria - Plaga',
        clasificado: true,
        nivel_urgencia: 'Alta',
        palabras_clave: ['mosca blanca', 'envés', 'amarillamiento', 'melaza', 'jitomate'],
        plaga_detectada: 'Mosca Blanca (Bemisia tabaci)',
      },
    },
    {
      _id: 'bit_002',
      agricultor_id: 'AGR-UTC-02',
      dispositivo_id: 'ESP32-CIRCUITO-03',
      sector_id: 'Sector Sur - Parcela C1',
      fecha_registro: '2026-11-09T08:15:00',
      texto_raw:
        'Presencia de araña roja y pequeñas telarañas en los brotes tiernos del sector sur debido a las altas temperaturas y baja humedad de ayer.',
      procesamiento_ia: {
        categoria: 'Alerta Fitosanitaria - Ácaros',
        clasificado: true,
        nivel_urgencia: 'Crítica',
        palabras_clave: ['araña roja', 'telarañas', 'brotes tiernos', 'baja humedad'],
        plaga_detectada: 'Araña Roja (Tetranychus urticae)',
      },
    },
    {
      _id: 'bit_003',
      agricultor_id: 'AGR-UTC-01',
      dispositivo_id: 'ESP32-CIRCUITO-01',
      sector_id: 'Sector Norte - Parcela A1',
      fecha_registro: '2026-11-08T17:40:00',
      texto_raw:
        'Revisión rutinaria del circuito 1 de riego rodado. Las plantas presentan vigor saludable, follaje verde oscuro y sin rastro de insectos ni hongos.',
      procesamiento_ia: {
        categoria: 'Monitoreo Preventivo - Sin Plaga',
        clasificado: true,
        nivel_urgencia: 'Baja',
        palabras_clave: ['revisión rutinaria', 'vigor saludable', 'follaje verde', 'sin rastro'],
        plaga_detectada: 'Ninguna (Cultivo Sano)',
      },
    },
  ];

  // ==========================================================================
  // AUTENTICACIÓN
  // ==========================================================================
  getUsuarioActual(): UsuarioAgroSmart {
    const raw = localStorage.getItem('agrosmart_user');
    if (raw) {
      try {
        return JSON.parse(raw) as UsuarioAgroSmart;
      } catch {
        // Ignorar JSON corrupto
      }
    }
    return {
      _id: 'usr_001',
      agricultor_id: 'AGR-UTC-01',
      nombre: 'Ing. Monserrat Valdivia',
      email: 'admin@agrosmart.mx',
      rol: 'Administradora de Riego e IA',
      unidad_produccion: 'Rancho Experimental UTC - Calvillo',
    };
  }

  login(email: string, password: string): Observable<{ access_token: string; usuario: UsuarioAgroSmart }> {
    return this.http
      .post<{ access_token: string; usuario: UsuarioAgroSmart }>(`${this.apiUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((res) => {
          this.backendConnected = true;
          localStorage.setItem('agrosmart_token', res.access_token);
          localStorage.setItem('agrosmart_user', JSON.stringify(res.usuario));
        }),
        catchError(() => {
          this.backendConnected = false;
          const demoUser: UsuarioAgroSmart = {
            _id: 'usr_001',
            agricultor_id: email.includes('campo') ? 'AGR-UTC-02' : 'AGR-UTC-01',
            nombre: email.includes('campo') ? 'Carlos Mendoza' : 'Ing. Monserrat Valdivia',
            email,
            rol: email.includes('campo') ? 'Operador de Campo y Fitosanidad' : 'Administradora de Riego e IA',
            unidad_produccion: 'Rancho Experimental UTC - Calvillo',
          };
          localStorage.setItem('agrosmart_token', 'jwt_local_demo');
          localStorage.setItem('agrosmart_user', JSON.stringify(demoUser));
          return of({ access_token: 'jwt_local_demo', usuario: demoUser });
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('agrosmart_token');
    localStorage.removeItem('agrosmart_user');
  }

  // ==========================================================================
  // DASHBOARD & SEED
  // ==========================================================================
  getDashboard(dispositivoId = 'todos', tipoCultivo = 'todos'): Observable<DashboardData> {
    const params: Record<string, string> = {};
    if (dispositivoId && dispositivoId !== 'todos') params['dispositivo_id'] = dispositivoId;
    if (tipoCultivo && tipoCultivo !== 'todos') params['tipo_cultivo'] = tipoCultivo;

    return this.http.get<DashboardData>(`${this.apiUrl}/dashboard`, { params }).pipe(
      tap(() => (this.backendConnected = true)),
      catchError(() => {
        this.backendConnected = false;
        return of(this.buildFallbackDashboard(dispositivoId, tipoCultivo));
      }),
    );
  }

  restaurarSeed(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/seed`, {}).pipe(
      catchError(() => of({ mensaje: 'Datos de demostración restaurados localmente.' })),
    );
  }

  // ==========================================================================
  // LECTURAS DE SENSORES
  // ==========================================================================
  simularLectura(payload: {
    dispositivo_id: string;
    sector_id: string;
    tipo_cultivo: string;
    humedad_suelo: number;
    ph: number;
    electroconductividad: number;
  }): Observable<LecturaSensor> {
    return this.http.post<LecturaSensor>(`${this.apiUrl}/lecturas/simular`, payload).pipe(
      catchError(() => {
        const evap = Number((3.2 + (65 - payload.humedad_suelo) * 0.05 + payload.electroconductividad * 0.2).toFixed(2));
        const nueva: LecturaSensor = {
          _id: `lec_${Date.now()}`,
          dispositivo_id: payload.dispositivo_id,
          timestamp: new Date().toISOString().slice(0, 19),
          tipo_cultivo: payload.tipo_cultivo,
          lecturas: {
            humedad_suelo: payload.humedad_suelo,
            ph: payload.ph,
            electroconductividad: payload.electroconductividad,
            evaporacion_predicha: evap,
          },
          ubicacion: {
            coordenadas: [21.8469, -102.7188],
            sector: payload.sector_id,
          },
        };
        this.fallbackLecturas.unshift(nueva);
        return of(nueva);
      }),
    );
  }

  // ==========================================================================
  // RUTINAS DE RIEGO (MANUALES Y OPTIMIZADAS POR IA)
  // ==========================================================================
  crearRiegoManual(payload: {
    dispositivo_id: string;
    sector_id: string;
    tipo_cultivo: string;
    duracion_minutos: number;
    volumen_agua_litros: number;
    nutriente_a: number;
    nutriente_b: number;
    ejecutar_ahora: boolean;
    fecha_programada?: string;
  }): Observable<RutinaRiego> {
    return this.http.post<RutinaRiego>(`${this.apiUrl}/rutinas/manual`, payload).pipe(
      catchError(() => {
        const nueva: RutinaRiego = {
          _id: `rut_${Date.now()}`,
          dispositivo_id: payload.dispositivo_id,
          sector_id: payload.sector_id,
          tipo_cultivo: payload.tipo_cultivo,
          modo: 'manual',
          algoritmo_utilizado: 'Configuración Manual de Operador',
          estado: payload.ejecutar_ahora ? 'Manual Activo' : 'Programado',
          fecha_programada: payload.fecha_programada || new Date().toISOString().slice(0, 19),
          parametros_optimizados: {
            duracion_minutos: payload.duracion_minutos,
            volumen_agua_litros: payload.volumen_agua_litros,
            mezcla_fertirriego: {
              nutriente_a: payload.nutriente_a,
              nutriente_b: payload.nutriente_b,
            },
          },
        };
        this.fallbackRutinas.unshift(nueva);
        if (payload.ejecutar_ahora) {
          const c = this.fallbackCircuitos.find((x) => x.dispositivo_id === payload.dispositivo_id);
          if (c) {
            c.valvula_abierta = true;
            c.estado_actual = 'En Riego Manual';
          }
        }
        return of(nueva);
      }),
    );
  }

  optimizarRiegoConIA(payload: {
    dispositivo_id: string;
    sector_id: string;
    tipo_cultivo: string;
    humedad_suelo?: number;
    ph?: number;
    electroconductividad?: number;
  }): Observable<{ rutina: RutinaRiego; evaporacion_predicha: number }> {
    return this.http
      .post<{ rutina: RutinaRiego; evaporacion_predicha: number }>(`${this.apiUrl}/rutinas/optimizar-ia`, payload)
      .pipe(
        catchError(() => {
          const esHidro = payload.tipo_cultivo === 'hidroponico';
          const hum = payload.humedad_suelo ?? (esHidro ? 72 : 38);
          const duracion = esHidro ? 16 : 32;
          const litros = esHidro ? 135.0 : 385.0;
          const nueva: RutinaRiego = {
            _id: `rut_${Date.now()}`,
            dispositivo_id: payload.dispositivo_id,
            sector_id: payload.sector_id,
            tipo_cultivo: payload.tipo_cultivo,
            modo: 'automatico_ia',
            algoritmo_utilizado: esHidro
              ? 'Búsqueda Heurística A* + Red Neuronal Sustrato'
              : 'Algoritmo Genético + Red Neuronal Evaporación',
            estado: 'Programado',
            fecha_programada: new Date().toISOString().slice(0, 19),
            parametros_optimizados: {
              duracion_minutos: duracion,
              volumen_agua_litros: litros,
              mezcla_fertirriego: {
                nutriente_a: esHidro ? 75 : 42,
                nutriente_b: esHidro ? 60 : 28,
              },
            },
          };
          this.fallbackRutinas.unshift(nueva);
          return of({ rutina: nueva, evaporacion_predicha: Number((3.5 + (65 - hum) * 0.04).toFixed(2)) });
        }),
      );
  }

  cambiarEstadoRutina(rutinaId: string, estado: string): Observable<RutinaRiego> {
    return this.http
      .patch<RutinaRiego>(`${this.apiUrl}/rutinas/${rutinaId}/estado`, null, {
        params: { estado },
      })
      .pipe(
        catchError(() => {
          const r = this.fallbackRutinas.find((x) => x._id === rutinaId);
          if (r) r.estado = estado;
          return of(r as RutinaRiego);
        }),
      );
  }

  // ==========================================================================
  // BITÁCORAS DE CAMPO Y DETECCIÓN DE PLAGAS (MINERÍA DE TEXTO)
  // ==========================================================================
  previsualizarAnalisisPlaga(textoRaw: string): Observable<ProcesamientoIA> {
    return this.http.post<ProcesamientoIA>(`${this.apiUrl}/ia/analizar-texto`, { texto_raw: textoRaw }).pipe(
      catchError(() => of(this.analizarTextoLocal(textoRaw))),
    );
  }

  crearBitacora(payload: {
    agricultor_id: string;
    texto_raw: string;
    sector_id: string;
    dispositivo_id: string;
  }): Observable<BitacoraSensor> {
    return this.http.post<BitacoraSensor>(`${this.apiUrl}/bitacoras`, payload).pipe(
      catchError(() => {
        const nueva: BitacoraSensor = {
          _id: `bit_${Date.now()}`,
          agricultor_id: payload.agricultor_id,
          dispositivo_id: payload.dispositivo_id,
          sector_id: payload.sector_id,
          fecha_registro: new Date().toISOString().slice(0, 19),
          texto_raw: payload.texto_raw,
          procesamiento_ia: this.analizarTextoLocal(payload.texto_raw),
        };
        this.fallbackBitacoras.unshift(nueva);
        return of(nueva);
      }),
    );
  }

  // ==========================================================================
  // CIRCUITOS IoT (ESP32) Y SEGURIDAD INFORMÁTICA
  // ==========================================================================
  agregarCircuito(payload: {
    dispositivo_id: string;
    nombre_circuito: string;
    sector_id: string;
    tipo_cultivo: string;
    ip_asignada: string;
    tipo: string;
    area_cobertura_m2: number;
  }): Observable<DispositivoSeguridad> {
    return this.http.post<DispositivoSeguridad>(`${this.apiUrl}/circuitos`, payload).pipe(
      catchError(() => {
        const nuevo: DispositivoSeguridad = {
          _id: `disp_${Date.now()}`,
          dispositivo_id: payload.dispositivo_id.toUpperCase(),
          nombre_circuito: payload.nombre_circuito,
          sector_id: payload.sector_id,
          tipo_cultivo: payload.tipo_cultivo,
          estado_actual: 'Activo',
          valvula_abierta: false,
          area_cobertura_m2: payload.area_cobertura_m2,
          tipo: payload.tipo,
          seguridad: {
            intentos_no_autorizados: 0,
            ip_asignada: payload.ip_asignada,
            token_autenticacion: `ags_tok_${Math.random().toString(16).slice(2, 18)}`,
            ultimo_acceso_autorizado: new Date().toISOString().slice(0, 19),
          },
        };
        this.fallbackCircuitos.push(nuevo);
        return of(nuevo);
      }),
    );
  }

  controlarValvula(
    dispositivoId: string,
    abrirValvula: boolean,
    duracionMinutos = 20,
    volumenLitros = 180,
  ): Observable<DispositivoSeguridad> {
    return this.http
      .post<DispositivoSeguridad>(`${this.apiUrl}/circuitos/${dispositivoId}/valvula`, {
        abrir_valvula: abrirValvula,
        duracion_minutos: duracionMinutos,
        volumen_agua_litros: volumenLitros,
        nutriente_a: 30,
        nutriente_b: 20,
      })
      .pipe(
        catchError(() => {
          const c = this.fallbackCircuitos.find((x) => x.dispositivo_id === dispositivoId);
          if (c) {
            c.valvula_abierta = abrirValvula;
            c.estado_actual = abrirValvula ? 'En Riego Manual' : 'Activo';
          }
          return of(c as DispositivoSeguridad);
        }),
      );
  }

  rotarTokenCircuito(dispositivoId: string): Observable<DispositivoSeguridad> {
    return this.http.post<DispositivoSeguridad>(`${this.apiUrl}/circuitos/${dispositivoId}/rotar-token`, {}).pipe(
      catchError(() => {
        const c = this.fallbackCircuitos.find((x) => x.dispositivo_id === dispositivoId);
        if (c) {
          c.seguridad.token_autenticacion = `ags_tok_${Math.random().toString(16).slice(2, 18)}`;
          c.seguridad.intentos_no_autorizados = 0;
          c.estado_actual = 'Activo';
        }
        return of(c as DispositivoSeguridad);
      }),
    );
  }

  simularIntruso(dispositivoId: string): Observable<DispositivoSeguridad> {
    return this.http.post<DispositivoSeguridad>(`${this.apiUrl}/circuitos/${dispositivoId}/simular-intruso`, {}).pipe(
      catchError(() => {
        const c = this.fallbackCircuitos.find((x) => x.dispositivo_id === dispositivoId);
        if (c) {
          c.seguridad.intentos_no_autorizados += 1;
          if (c.seguridad.intentos_no_autorizados >= 3) {
            c.estado_actual = 'Alerta Seguridad';
          }
        }
        return of(c as DispositivoSeguridad);
      }),
    );
  }

  obtenerCodigoIno(
    dispositivoId: string,
  ): Observable<{ dispositivo_id: string; nombre_archivo: string; codigo_ino: string }> {
    return this.http
      .get<{
        dispositivo_id: string;
        nombre_archivo: string;
        codigo_ino: string;
      }>(`${this.apiUrl}/circuitos/${dispositivoId}/codigo-ino`)
      .pipe(
        catchError(() => {
          const c = this.fallbackCircuitos.find((x) => x.dispositivo_id === dispositivoId);
          const token = c?.seguridad.token_autenticacion || 'ags_tok_demo';
          const sector = c?.sector_id || 'Sector Principal';
          const cultivo = c?.tipo_cultivo || 'rodado';
          return of({
            dispositivo_id: dispositivoId,
            nombre_archivo: `${dispositivoId.toLowerCase()}.ino`,
            codigo_ino: `// Sketch Arduino ESP32 para ${dispositivoId} (${sector})\nconst char* DISPOSITIVO_ID = "${dispositivoId}";\nconst char* TOKEN_AUTENTICACION = "${token}";\nconst char* TIPO_CULTIVO = "${cultivo}";\n// Configura WIFI_SSID y BACKEND_BASE_URL antes de subir a tu placa ESP32.`,
          });
        }),
      );
  }

  private analizarTextoLocal(textoRaw: string): ProcesamientoIA {
    const t = textoRaw.toLowerCase();
    if (t.includes('mosca blanca') || t.includes('melaza')) {
      return {
        categoria: 'Alerta Fitosanitaria - Insecto Chupador',
        clasificado: true,
        nivel_urgencia: 'Alta',
        palabras_clave: ['mosca blanca', 'envés', 'hojas', 'control fitosanitario'],
        plaga_detectada: 'Mosca Blanca (Bemisia tabaci)',
      };
    }
    if (t.includes('araña roja') || t.includes('telaraña') || t.includes('ácaro')) {
      return {
        categoria: 'Alerta Fitosanitaria - Ácaros',
        clasificado: true,
        nivel_urgencia: 'Crítica',
        palabras_clave: ['araña roja', 'telarañas', 'baja humedad', 'brotes'],
        plaga_detectada: 'Araña Roja (Tetranychus urticae)',
      };
    }
    if (t.includes('pulgón') || t.includes('pulgon') || t.includes('trips') || t.includes('gusano')) {
      return {
        categoria: 'Alerta Fitosanitaria - Plaga Detectada',
        clasificado: true,
        nivel_urgencia: 'Alta',
        palabras_clave: ['plaga', 'insecto', 'follaje', 'revisión urgente'],
        plaga_detectada: 'Pulgón / Trips / Gusano Fitófago',
      };
    }
    return {
      categoria: 'Monitoreo Preventivo - Sin Plaga',
      clasificado: true,
      nivel_urgencia: 'Baja',
      palabras_clave: ['monitoreo', 'cultivo sano', 'vigor', 'sin anomalías'],
      plaga_detectada: 'Ninguna (Cultivo Sano)',
    };
  }

  private buildFallbackDashboard(dispositivoId: string, tipoCultivo: string): DashboardData {
    let lecs = [...this.fallbackLecturas];
    if (dispositivoId !== 'todos') lecs = lecs.filter((l) => l.dispositivo_id === dispositivoId);
    if (tipoCultivo !== 'todos') lecs = lecs.filter((l) => l.tipo_cultivo === tipoCultivo);

    return {
      resumen: {
        total_circuitos: this.fallbackCircuitos.length,
        valvulas_abiertas: this.fallbackCircuitos.filter((c) => c.valvula_abierta).length,
        total_lecturas: this.fallbackLecturas.length,
        rutinas_activas: this.fallbackRutinas.filter((r) => ['Programado', 'En Curso', 'Manual Activo'].includes(r.estado))
          .length,
        alertas_plagas_activas: this.fallbackBitacoras.filter((b) =>
          ['Alta', 'Crítica'].includes(b.procesamiento_ia.nivel_urgencia),
        ).length,
        intentos_no_autorizados_totales: this.fallbackCircuitos.reduce(
          (acc, c) => acc + c.seguridad.intentos_no_autorizados,
          0,
        ),
      },
      ultima_lectura: lecs[0] || this.fallbackLecturas[0] || null,
      lecturas_recientes: lecs,
      circuitos: this.fallbackCircuitos,
      rutinas_recientes: this.fallbackRutinas,
      bitacoras_recientes: this.fallbackBitacoras,
      estado_ia: {
        plague_model_loaded: false,
        plague_model_path: 'ai_models/modelo_plagas_nlp.joblib',
        plague_engine: 'Motor NLP Léxico Agrícola (Listo para conectar .joblib de Colab)',
        irrigation_model_loaded: false,
        irrigation_model_path: 'ai_models/modelo_prevision_riego.joblib',
        irrigation_engine: 'Algoritmo Genético + Red Neuronal Heurística (Listo para conectar .joblib de Colab)',
      },
      database_status: 'Modo Demo Local (Inicia FastAPI en puerto 8000 para sincronizar BD)',
    };
  }
}
