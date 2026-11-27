import {
  Asignatura,
  CursoParalelo,
  CursoStats,
  DistributivoData,
  Docente,
  DocenteCargaDetalle,
  DocenteStats,
  ValidationIssue,
} from '../types/distributivo';

export const cellKey = (asignaturaId: string, cursoId: string) =>
  `${asignaturaId}::${cursoId}`;

/**
 * Computes WCAG-compliant text color (#0F172A or #FFFFFF) for any hex background.
 */
export function getContrastTextColor(hexColor: string): '#0F172A' | '#FFFFFF' {
  const clean = hexColor.replace('#', '');
  if (clean.length !== 6) return '#0F172A';
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.36 ? '#0F172A' : '#FFFFFF';
}

export function generateSiglas(nombre: string): string {
  const cleaned = nombre
    .replace(/^(MSC\.?|LIC\.?|ING\.?|DR\.?|DRA\.?|ABG\.?|MGS\.?)\s+/i, '')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'DC';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export const TEACHER_PALETTE = [
  '#FACC15', // Amarillo
  '#EA580C', // Naranja
  '#1E3A8A', // Azul Marino
  '#C4B5FD', // Lila
  '#84CC16', // Verde Lima
  '#DC2626', // Rojo
  '#22D3EE', // Cian
  '#2563EB', // Azul Rey
  '#D946EF', // Fucsia
  '#10B981', // Esmeralda
  '#F59E0B', // Ámbar
  '#0EA5E9', // Celeste
  '#EC4899', // Rosa
  '#6366F1', // Índigo
  '#14B8A6', // Turquesa
];

const initialCursos: CursoParalelo[] = [
  {
    id: 'oct-a',
    nivel: 'BÁSICA',
    grado: 'OCTAVO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't1',
    coordinador: '',
  },
  {
    id: 'nov-a',
    nivel: 'BÁSICA',
    grado: 'NOVENO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't2',
    coordinador: '',
  },
  {
    id: 'dec-a',
    nivel: 'BÁSICA',
    grado: 'DÉCIMO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't3',
    coordinador: '',
  },
  {
    id: '1ro-a',
    nivel: 'BGU - CIENCIAS',
    grado: 'PRIMERO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't4',
    coordinador: '',
  },
  {
    id: '1ro-b',
    nivel: 'BGU - CIENCIAS',
    grado: 'PRIMERO',
    jornada: 'NOCTURNA',
    paralelo: 'B',
    horasObjetivo: 25,
    tutorId: 't5',
    coordinador: '',
  },
  {
    id: '2do-a',
    nivel: 'BGU - CIENCIAS',
    grado: 'SEGUNDO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't6',
    coordinador: '',
  },
  {
    id: '2do-b',
    nivel: 'BGU - CIENCIAS',
    grado: 'SEGUNDO',
    jornada: 'NOCTURNA',
    paralelo: 'B',
    horasObjetivo: 25,
    tutorId: 't7',
    coordinador: '',
  },
  {
    id: '3ro-a',
    nivel: 'BGU - CIENCIAS',
    grado: 'TERCERO',
    jornada: 'NOCTURNA',
    paralelo: 'A',
    horasObjetivo: 25,
    tutorId: 't8',
    coordinador: '',
  },
  {
    id: '3ro-b',
    nivel: 'BGU - CIENCIAS',
    grado: 'TERCERO',
    jornada: 'NOCTURNA',
    paralelo: 'B',
    horasObjetivo: 25,
    tutorId: 't9',
    coordinador: '',
  },
];

const initialAsignaturas: Asignatura[] = [
  { id: 'lengua', area: 'LENGUA Y LITERATURA', areaColor: '#FED7AA', nombre: 'LENGUA Y LITERATURA' },
  { id: 'matematica', area: 'MATEMÁTICA', areaColor: '#FEF08A', nombre: 'MATEMÁTICA' },
  { id: 'cie-nat', area: 'CIENCIAS NATURALES', areaColor: '#BBF7D0', nombre: 'CIE. NATURALES' },
  { id: 'fisica', area: 'CIENCIAS NATURALES', areaColor: '#BBF7D0', nombre: 'FÍSICA' },
  { id: 'quimica', area: 'CIENCIAS NATURALES', areaColor: '#BBF7D0', nombre: 'QUÍMICA' },
  { id: 'biologia', area: 'CIENCIAS NATURALES', areaColor: '#BBF7D0', nombre: 'BIOLOGÍA' },
  { id: 'est-soc', area: 'CIENCIAS SOCIALES', areaColor: '#FDE68A', nombre: 'EST. SOCIALES' },
  { id: 'historia', area: 'CIENCIAS SOCIALES', areaColor: '#FDE68A', nombre: 'HISTORIA' },
  { id: 'filosofia', area: 'CIENCIAS SOCIALES', areaColor: '#FDE68A', nombre: 'FILOSOFÍA' },
  { id: 'ciudadania', area: 'CIENCIAS SOCIALES', areaColor: '#FDE68A', nombre: 'ED. CIUDADANÍA' },
  { id: 'eca', area: 'ED. CULT. ARTÍSTICA', areaColor: '#E2E8F0', nombre: 'ED. CULT. ARTÍSTICA' },
  { id: 'ed-fisica', area: 'EDUCACIÓN FÍSICA', areaColor: '#BAE6FD', nombre: 'ED. FÍSICA' },
  { id: 'ingles', area: 'LENGUA EXTRANJERA', areaColor: '#FBCFE8', nombre: 'INGLÉS' },
  { id: 'acomp', area: 'ACOMPAÑAMIENTO PEDAGÓGICO', areaColor: '#E5E7EB', nombre: 'ACOMPAÑAMIENTO AULA' },
  { id: 'emp-gestion', area: 'INTERDISCIPLINAR', areaColor: '#DDD6FE', nombre: 'EMP. Y GESTIÓN' },
];

const initialDocentes: Docente[] = [
  { id: 't1', nombre: 'MSC. NELSON VILLA', siglas: 'NV', especialidad: 'Matemática / Emprendimiento', color: '#FACC15', horasObjetivo: 25 },
  { id: 't2', nombre: 'LIC. ROSANA VILLAMARIN', siglas: 'RV', especialidad: 'Ciencias Naturales / Básica', color: '#EA580C', horasObjetivo: 25 },
  { id: 't3', nombre: 'LIC. XIMENA TUALOMBO', siglas: 'XT', especialidad: 'Lengua y Literatura / Historia', color: '#1E3A8A', horasObjetivo: 25 },
  { id: 't4', nombre: 'MSC. JANETH CUJI', siglas: 'JC', especialidad: 'Ciencias Sociales / Filosofía', color: '#C4B5FD', horasObjetivo: 25 },
  { id: 't5', nombre: 'LIC. SANDRA VILLACÍS', siglas: 'SV', especialidad: 'Inglés / Estudios Sociales', color: '#84CC16', horasObjetivo: 25 },
  { id: 't6', nombre: 'LIC. ALEXANDER JAMI', siglas: 'AJ', especialidad: 'Matemática / Física', color: '#DC2626', horasObjetivo: 25 },
  { id: 't7', nombre: 'MSC. JENIFFER VARGAS', siglas: 'JV', especialidad: 'Química / Biología / Física', color: '#22D3EE', horasObjetivo: 25 },
  { id: 't8', nombre: 'MSC. JAVIER ESCOBAR', siglas: 'JE', especialidad: 'Lengua / Matemática', color: '#2563EB', horasObjetivo: 25 },
  { id: 't9', nombre: 'MSC. ALEXANDER CARDENAS', siglas: 'AC', especialidad: 'Educación Física', color: '#D946EF', horasObjetivo: 25 },
];

// Exact matrix mapping derived from DISTRIBUTIVO_3eaf199f.pdf
const initialAsignaciones: Record<string, { horas: number; docenteId: string | null }> = {
  // LENGUA Y LITERATURA
  'lengua::oct-a': { horas: 5, docenteId: 't8' },
  'lengua::nov-a': { horas: 5, docenteId: 't8' },
  'lengua::dec-a': { horas: 5, docenteId: 't8' },
  'lengua::1ro-a': { horas: 3, docenteId: 't3' },
  'lengua::1ro-b': { horas: 3, docenteId: 't3' },
  'lengua::2do-a': { horas: 3, docenteId: 't3' },
  'lengua::2do-b': { horas: 3, docenteId: 't3' },
  'lengua::3ro-a': { horas: 4, docenteId: 't8' },
  'lengua::3ro-b': { horas: 4, docenteId: 't8' },

  // MATEMÁTICA
  'matematica::oct-a': { horas: 5, docenteId: 't1' },
  'matematica::nov-a': { horas: 5, docenteId: 't1' },
  'matematica::dec-a': { horas: 5, docenteId: 't1' },
  'matematica::1ro-a': { horas: 4, docenteId: 't1' },
  'matematica::1ro-b': { horas: 4, docenteId: 't1' },
  'matematica::2do-a': { horas: 4, docenteId: 't6' },
  'matematica::2do-b': { horas: 4, docenteId: 't6' },
  'matematica::3ro-a': { horas: 5, docenteId: 't8' },
  'matematica::3ro-b': { horas: 5, docenteId: 't8' },

  // CIE. NATURALES (Básica)
  'cie-nat::oct-a': { horas: 4, docenteId: 't2' },
  'cie-nat::nov-a': { horas: 4, docenteId: 't2' },
  'cie-nat::dec-a': { horas: 4, docenteId: 't2' },

  // FÍSICA (BGU)
  'fisica::1ro-a': { horas: 2, docenteId: 't7' },
  'fisica::1ro-b': { horas: 2, docenteId: 't7' },
  'fisica::2do-a': { horas: 2, docenteId: 't7' },
  'fisica::2do-b': { horas: 2, docenteId: 't7' },
  'fisica::3ro-a': { horas: 3, docenteId: 't6' },
  'fisica::3ro-b': { horas: 3, docenteId: 't6' },

  // QUÍMICA (BGU)
  'quimica::1ro-a': { horas: 2, docenteId: 't7' },
  'quimica::1ro-b': { horas: 2, docenteId: 't7' },
  'quimica::2do-a': { horas: 2, docenteId: 't7' },
  'quimica::2do-b': { horas: 2, docenteId: 't7' },
  'quimica::3ro-a': { horas: 3, docenteId: 't7' },
  'quimica::3ro-b': { horas: 3, docenteId: 't7' },

  // BIOLOGÍA (BGU)
  'biologia::1ro-a': { horas: 2, docenteId: 't7' },
  'biologia::1ro-b': { horas: 2, docenteId: 't7' },
  'biologia::2do-a': { horas: 2, docenteId: 't7' },
  'biologia::2do-b': { horas: 2, docenteId: 't7' },
  'biologia::3ro-a': { horas: 3, docenteId: 't7' },
  'biologia::3ro-b': { horas: 3, docenteId: 't7' },

  // EST. SOCIALES (Básica)
  'est-soc::oct-a': { horas: 4, docenteId: 't5' },
  'est-soc::nov-a': { horas: 4, docenteId: 't5' },
  'est-soc::dec-a': { horas: 4, docenteId: 't5' },

  // HISTORIA (BGU)
  'historia::1ro-a': { horas: 2, docenteId: 't4' },
  'historia::1ro-b': { horas: 2, docenteId: 't4' },
  'historia::2do-a': { horas: 2, docenteId: 't5' },
  'historia::2do-b': { horas: 2, docenteId: 't5' },
  'historia::3ro-a': { horas: 2, docenteId: 't3' },
  'historia::3ro-b': { horas: 2, docenteId: 't3' },

  // FILOSOFÍA (1ro y 2do BGU)
  'filosofia::1ro-a': { horas: 2, docenteId: 't4' },
  'filosofia::1ro-b': { horas: 2, docenteId: 't4' },
  'filosofia::2do-a': { horas: 2, docenteId: 't4' },
  'filosofia::2do-b': { horas: 2, docenteId: 't4' },

  // ED. CIUDADANÍA (1ro y 2do BGU)
  'ciudadania::1ro-a': { horas: 2, docenteId: 't4' },
  'ciudadania::1ro-b': { horas: 2, docenteId: 't4' },
  'ciudadania::2do-a': { horas: 2, docenteId: 't4' },
  'ciudadania::2do-b': { horas: 2, docenteId: 't4' },

  // ED. CULT. ARTÍSTICA
  'eca::oct-a': { horas: 1, docenteId: 't1' },
  'eca::nov-a': { horas: 1, docenteId: 't6' },
  'eca::dec-a': { horas: 1, docenteId: 't6' },
  'eca::1ro-a': { horas: 1, docenteId: 't6' },
  'eca::1ro-b': { horas: 1, docenteId: 't5' },
  'eca::2do-a': { horas: 1, docenteId: 't5' },
  'eca::2do-b': { horas: 1, docenteId: 't5' },

  // ED. FÍSICA
  'ed-fisica::oct-a': { horas: 2, docenteId: 't9' },
  'ed-fisica::nov-a': { horas: 2, docenteId: 't9' },
  'ed-fisica::dec-a': { horas: 2, docenteId: 't9' },
  'ed-fisica::1ro-a': { horas: 1, docenteId: 't9' },
  'ed-fisica::1ro-b': { horas: 1, docenteId: 't9' },
  'ed-fisica::2do-a': { horas: 1, docenteId: 't9' },
  'ed-fisica::2do-b': { horas: 1, docenteId: 't9' },
  'ed-fisica::3ro-a': { horas: 1, docenteId: 't1' },
  'ed-fisica::3ro-b': { horas: 1, docenteId: 't1' },

  // INGLÉS
  'ingles::oct-a': { horas: 3, docenteId: 't5' },
  'ingles::nov-a': { horas: 3, docenteId: 't5' },
  'ingles::dec-a': { horas: 3, docenteId: 't5' },
  'ingles::1ro-a': { horas: 2, docenteId: 't5' },
  'ingles::1ro-b': { horas: 2, docenteId: 't5' },
  'ingles::2do-a': { horas: 2, docenteId: 't5' },
  'ingles::2do-b': { horas: 2, docenteId: 't5' },
  'ingles::3ro-a': { horas: 2, docenteId: 't5' },
  'ingles::3ro-b': { horas: 2, docenteId: 't5' },

  // ACOMPAÑAMIENTO AULA
  'acomp::oct-a': { horas: 1, docenteId: 't1' },
  'acomp::nov-a': { horas: 1, docenteId: 't1' },
  'acomp::dec-a': { horas: 1, docenteId: 't1' },
  'acomp::1ro-a': { horas: 1, docenteId: 't3' },
  'acomp::1ro-b': { horas: 1, docenteId: 't5' },
  'acomp::2do-a': { horas: 1, docenteId: 't5' },
  'acomp::2do-b': { horas: 1, docenteId: 't6' },
  'acomp::3ro-a': { horas: 1, docenteId: 't6' },
  'acomp::3ro-b': { horas: 1, docenteId: 't7' },

  // EMP. Y GESTIÓN
  'emp-gestion::1ro-a': { horas: 1, docenteId: 't1' },
  'emp-gestion::1ro-b': { horas: 1, docenteId: 't1' },
  'emp-gestion::2do-a': { horas: 1, docenteId: 't1' },
  'emp-gestion::2do-b': { horas: 1, docenteId: 't1' },
  'emp-gestion::3ro-a': { horas: 1, docenteId: 't1' },
  'emp-gestion::3ro-b': { horas: 1, docenteId: 't1' },
};

export const INITIAL_DISTRIBUTIVO: DistributivoData = {
  institucion: {
    titulo: 'PLANTILLA DOCENTE',
    subtitulo: 'UE2A · Oferta EPJA Nocturna (Básica Superior y BGU Ciencias)',
    periodoLectivo: '2026 - 2027',
  },
  cursos: initialCursos,
  asignaturas: initialAsignaturas,
  docentes: initialDocentes,
  asignaciones: initialAsignaciones,
  autoridades: [
    { id: 'a1', nombre: 'MSc. Javier Escobar', cargo: 'Subinspector UE2A' },
    { id: 'a2', nombre: 'Lic. Ximena Tualombo', cargo: 'Coordinadora EPJA' },
    { id: 'a3', nombre: 'Msc. Olga Alvear', cargo: 'Vicerrectora (e) UE2A' },
  ],
};

export function createCloneOfInitial(): DistributivoData {
  return JSON.parse(JSON.stringify(INITIAL_DISTRIBUTIVO));
}

export function computeDocenteStats(data: DistributivoData): DocenteStats[] {
  const cursoMap = new Map<string, CursoParalelo>(data.cursos.map((c) => [c.id, c]));
  const asigMap = new Map<string, Asignatura>(data.asignaturas.map((a) => [a.id, a]));

  return data.docentes.map((docente) => {
    const detalles: DocenteCargaDetalle[] = [];
    let horasAsignadas = 0;

    for (const [key, celda] of Object.entries(data.asignaciones)) {
      if (celda.docenteId === docente.id && celda.horas > 0) {
        const [asigId, cursoId] = key.split('::');
        const asig = asigMap.get(asigId);
        const curso = cursoMap.get(cursoId);
        if (asig && curso) {
          horasAsignadas += celda.horas;
          detalles.push({
            asignaturaId: asig.id,
            asignaturaNombre: asig.nombre,
            area: asig.area,
            cursoId: curso.id,
            cursoEtiqueta: `${curso.grado} ${curso.paralelo}`,
            horas: celda.horas,
          });
        }
      }
    }

    const diferencia = horasAsignadas - docente.horasObjetivo;
    let estado: DocenteStats['estado'] = 'optimo';
    if (horasAsignadas === 0) {
      estado = 'sin_asignar';
    } else if (diferencia > 0) {
      estado = 'sobrecarga';
    } else if (diferencia < 0) {
      estado = 'subcarga';
    }

    const tutorDe = data.cursos.filter((c) => c.tutorId === docente.id);

    return {
      docente,
      horasAsignadas,
      diferencia,
      estado,
      tutorDe,
      detalles,
    };
  });
}

export function computeCursoStats(data: DistributivoData): CursoStats[] {
  return data.cursos.map((curso) => {
    let horasClase = 0;
    let horasDocente = 0;

    for (const asig of data.asignaturas) {
      const celda = data.asignaciones[cellKey(asig.id, curso.id)];
      if (celda && celda.horas > 0) {
        horasClase += celda.horas;
        if (celda.docenteId && data.docentes.some((d) => d.id === celda.docenteId)) {
          horasDocente += celda.horas;
        }
      }
    }

    return {
      curso,
      horasClase,
      horasDocente,
      horasSinDocente: horasClase - horasDocente,
      diferenciaObjetivo: horasClase - curso.horasObjetivo,
    };
  });
}

export function validateDistributivo(data: DistributivoData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const docenteStats = computeDocenteStats(data);
  const cursoStats = computeCursoStats(data);
  const asigMap = new Map(data.asignaturas.map((a) => [a.id, a]));
  const cursoMap = new Map(data.cursos.map((c) => [c.id, c]));

  // 1. Check unassigned hours
  for (const [key, celda] of Object.entries(data.asignaciones)) {
    if (celda.horas > 0 && (!celda.docenteId || !data.docentes.some((d) => d.id === celda.docenteId))) {
      const [asigId, cursoId] = key.split('::');
      const asig = asigMap.get(asigId);
      const curso = cursoMap.get(cursoId);
      if (asig && curso) {
        issues.push({
          id: `unassigned-${key}`,
          severidad: 'error',
          categoria: 'sin_docente',
          titulo: `Horas sin docente en ${asig.nombre}`,
          detalle: `${curso.grado} "${curso.paralelo}" tiene ${celda.horas}h asignadas a la malla sin docente responsable.`,
          targetView: 'matriz',
          asignaturaId: asig.id,
          cursoId: curso.id,
        });
      }
    }
  }

  // 2. Check course totals vs target
  for (const cs of cursoStats) {
    if (cs.diferenciaObjetivo !== 0) {
      issues.push({
        id: `curso-target-${cs.curso.id}`,
        severidad: 'warning',
        categoria: 'horas_curso',
        titulo: `Malla desajustada en ${cs.curso.grado} "${cs.curso.paralelo}"`,
        detalle: `Suma ${cs.horasClase}h de clase frente a un objetivo de ${cs.curso.horasObjetivo}h (${cs.diferenciaObjetivo > 0 ? '+' : ''}${cs.diferenciaObjetivo}h).`,
        targetView: 'matriz',
        cursoId: cs.curso.id,
      });
    }
    if (!cs.curso.tutorId || !data.docentes.some((d) => d.id === cs.curso.tutorId)) {
      issues.push({
        id: `curso-tutor-${cs.curso.id}`,
        severidad: 'warning',
        categoria: 'sin_tutor',
        titulo: `Curso sin tutor asignado`,
        detalle: `${cs.curso.grado} "${cs.curso.paralelo}" (${cs.curso.jornada}) no tiene un docente tutor designado.`,
        targetView: 'matriz',
        cursoId: cs.curso.id,
      });
    }
  }

  // 3. Check teacher workload vs target
  for (const ds of docenteStats) {
    if (ds.estado === 'sobrecarga') {
      issues.push({
        id: `doc-over-${ds.docente.id}`,
        severidad: 'error',
        categoria: 'carga_docente',
        titulo: `Sobrecarga horaria: ${ds.docente.nombre}`,
        detalle: `Tiene ${ds.horasAsignadas}h asignadas frente a una meta de ${ds.docente.horasObjetivo}h (+${ds.diferencia}h de exceso).`,
        targetView: 'docentes',
        docenteId: ds.docente.id,
      });
    } else if (ds.estado === 'subcarga') {
      issues.push({
        id: `doc-under-${ds.docente.id}`,
        severidad: 'warning',
        categoria: 'carga_docente',
        titulo: `Carga incompleta: ${ds.docente.nombre}`,
        detalle: `Tiene ${ds.horasAsignadas}h asignadas frente a una meta de ${ds.docente.horasObjetivo}h (${ds.diferencia}h faltantes).`,
        targetView: 'docentes',
        docenteId: ds.docente.id,
      });
    } else if (ds.estado === 'sin_asignar') {
      issues.push({
        id: `doc-empty-${ds.docente.id}`,
        severidad: 'warning',
        categoria: 'carga_docente',
        titulo: `Docente sin carga: ${ds.docente.nombre}`,
        detalle: `No posee ninguna hora asignada en la matriz actual.`,
        targetView: 'docentes',
        docenteId: ds.docente.id,
      });
    }
  }

  return issues;
}
