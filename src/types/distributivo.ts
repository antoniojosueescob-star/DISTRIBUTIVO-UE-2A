export type ViewMode = 'matriz' | 'docentes' | 'validacion' | 'imprimir';

export type CellDisplayMode = 'horas' | 'iniciales' | 'docente';

export interface CursoParalelo {
  id: string;
  nivel: string; // e.g. "BÁSICA" | "BGU - CIENCIAS"
  grado: string; // e.g. "OCTAVO" | "NOVENO" | "DÉCIMO" | "PRIMERO" | "SEGUNDO" | "TERCERO"
  jornada: string; // e.g. "NOCTURNA"
  paralelo: string; // e.g. "A" | "B"
  horasObjetivo: number; // e.g. 25
  tutorId: string | null;
  coordinador: string;
}

export interface Asignatura {
  id: string;
  area: string;
  areaColor: string;
  nombre: string;
}

export interface Docente {
  id: string;
  nombre: string;
  siglas: string;
  especialidad: string;
  color: string;
  horasObjetivo: number;
}

export interface CeldaAsignacion {
  horas: number;
  docenteId: string | null;
}

export interface Autoridad {
  id: string;
  nombre: string;
  cargo: string;
}

export interface InstitucionInfo {
  titulo: string;
  subtitulo: string;
  periodoLectivo: string;
}

export interface DistributivoData {
  institucion: InstitucionInfo;
  cursos: CursoParalelo[];
  asignaturas: Asignatura[];
  docentes: Docente[];
  asignaciones: Record<string, CeldaAsignacion>;
  autoridades: Autoridad[];
}

export interface DocenteCargaDetalle {
  asignaturaId: string;
  asignaturaNombre: string;
  area: string;
  cursoId: string;
  cursoEtiqueta: string;
  horas: number;
}

export interface DocenteStats {
  docente: Docente;
  horasAsignadas: number;
  diferencia: number;
  estado: 'optimo' | 'subcarga' | 'sobrecarga' | 'sin_asignar';
  tutorDe: CursoParalelo[];
  detalles: DocenteCargaDetalle[];
}

export interface CursoStats {
  curso: CursoParalelo;
  horasClase: number;
  horasDocente: number;
  horasSinDocente: number;
  diferenciaObjetivo: number;
}

export interface ValidationIssue {
  id: string;
  severidad: 'error' | 'warning';
  categoria: 'sin_docente' | 'carga_docente' | 'horas_curso' | 'sin_tutor';
  titulo: string;
  detalle: string;
  targetView: ViewMode;
  docenteId?: string;
  cursoId?: string;
  asignaturaId?: string;
}
