// ============================================================================
// MODELOS DE DATOS TYPESCRIPT — ALINEADOS AL DIAGRAMA DE MONGODB
// ============================================================================

export interface UsuarioAgroSmart {
  _id: string;
  agricultor_id: string;
  nombre: string;
  email: string;
  rol: string;
  unidad_produccion: string;
}

// 1. Colección: bitacoras_sensores
export interface ProcesamientoIA {
  categoria: string;
  clasificado: boolean;
  nivel_urgencia: 'Baja' | 'Media' | 'Alta' | 'Crítica' | string;
  palabras_clave: string[];
  plaga_detectada: string;
}

export interface BitacoraSensor {
  _id: string;
  agricultor_id: string;
  dispositivo_id?: string;
  sector_id?: string;
  fecha_registro: string;
  procesamiento_ia: ProcesamientoIA;
  texto_raw: string;
}

// 2. Colección: dispositivos_seguridad (Circuitos ESP32)
export interface SeguridadDispositivo {
  intentos_no_autorizados: number;
  ip_asignada: string;
  token_autenticacion: string;
  ultimo_acceso_autorizado: string;
}

export interface DispositivoSeguridad {
  _id: string;
  dispositivo_id: string;
  nombre_circuito?: string;
  sector_id?: string;
  tipo_cultivo?: 'rodado' | 'hidroponico' | string;
  estado_actual: string;
  valvula_abierta?: boolean;
  area_cobertura_m2?: number;
  seguridad: SeguridadDispositivo;
  tipo: string;
}

// 3. Colección: lecturas_sensores
export interface LecturasDetalle {
  electroconductividad: number;
  evaporacion_predicha: number;
  humedad_suelo: number;
  ph: number;
}

export interface UbicacionSensor {
  coordenadas: number[];
  sector: string;
}

export interface LecturaSensor {
  _id: string;
  dispositivo_id: string;
  lecturas: LecturasDetalle;
  timestamp: string;
  tipo_cultivo: 'rodado' | 'hidroponico' | string;
  ubicacion: UbicacionSensor;
}

// 4. Colección: rutinas_riego
export interface MezclaFertirriego {
  nutriente_a: number;
  nutriente_b: number;
}

export interface ParametrosOptimizados {
  duracion_minutos: number;
  mezcla_fertirriego: MezclaFertirriego;
  volumen_agua_litros: number;
}

export interface RutinaRiego {
  _id: string;
  algoritmo_utilizado: string;
  estado: 'Programado' | 'En Curso' | 'Manual Activo' | 'Completado' | 'Cancelado' | string;
  fecha_programada: string;
  parametros_optimizados: ParametrosOptimizados;
  sector_id: string;
  dispositivo_id?: string;
  tipo_cultivo?: string;
  modo?: 'automatico_ia' | 'manual' | string;
}

export interface EstadoModelosIA {
  plague_model_loaded: boolean;
  plague_model_path: string;
  plague_engine: string;
  irrigation_model_loaded: boolean;
  irrigation_model_path: string;
  irrigation_engine: string;
}

export interface DashboardData {
  resumen: {
    total_circuitos: number;
    valvulas_abiertas: number;
    total_lecturas: number;
    rutinas_activas: number;
    alertas_plagas_activas: number;
    intentos_no_autorizados_totales: number;
  };
  ultima_lectura: LecturaSensor | null;
  lecturas_recientes: LecturaSensor[];
  circuitos: DispositivoSeguridad[];
  rutinas_recientes: RutinaRiego[];
  bitacoras_recientes: BitacoraSensor[];
  estado_ia: EstadoModelosIA;
  database_status: string;
}
