import { DistributivoData } from '../types/distributivo';
import { cellKey, computeCursoStats, computeDocenteStats } from '../data/initialDistributivo';

function escapeCsv(val: string | number): string {
  const str = String(val ?? '');
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportDistributivoCSV(data: DistributivoData) {
  const docenteMap = new Map(data.docentes.map((d) => [d.id, d]));
  const cursoStats = computeCursoStats(data);
  const docenteStats = computeDocenteStats(data);

  const lines: string[] = [];

  lines.push(escapeCsv(data.institucion.titulo));
  lines.push(`${escapeCsv(data.institucion.subtitulo)};Periodo: ${escapeCsv(data.institucion.periodoLectivo)}`);
  lines.push('');

  // Matrix Header
  lines.push(['ÁREA', 'ASIGNATURA', ...data.cursos.map((c) => `${c.nivel} - ${c.grado} ${c.paralelo} (${c.jornada})`)].map(escapeCsv).join(';'));

  for (const asig of data.asignaturas) {
    const row: string[] = [asig.area, asig.nombre];
    for (const curso of data.cursos) {
      const celda = data.asignaciones[cellKey(asig.id, curso.id)];
      if (!celda || celda.horas === 0) {
        row.push('');
      } else {
        const doc = celda.docenteId ? docenteMap.get(celda.docenteId) : null;
        row.push(doc ? `${celda.horas}h (${doc.nombre})` : `${celda.horas}h (SIN DOCENTE)`);
      }
    }
    lines.push(row.map(escapeCsv).join(';'));
  }

  lines.push(['TOTAL', 'HORAS CLASE', ...cursoStats.map((cs) => cs.horasClase)].map(escapeCsv).join(';'));
  lines.push(['TOTAL', 'HORAS DOCENTE', ...cursoStats.map((cs) => cs.horasDocente)].map(escapeCsv).join(';'));
  lines.push([
    'GESTIÓN',
    'TUTORES',
    ...data.cursos.map((c) => {
      const doc = c.tutorId ? docenteMap.get(c.tutorId) : null;
      return doc ? doc.nombre : 'Sin asignar';
    }),
  ].map(escapeCsv).join(';'));

  lines.push('');
  lines.push('RESUMEN DE CARGA POR DOCENTE');
  lines.push(['DOCENTE', 'ESPECIALIDAD', 'HORAS ASIGNADAS', 'META', 'DIFERENCIA', 'TUTORÍA'].map(escapeCsv).join(';'));
  for (const ds of docenteStats) {
    lines.push([
      ds.docente.nombre,
      ds.docente.especialidad,
      ds.horasAsignadas,
      ds.docente.horasObjetivo,
      ds.diferencia,
      ds.tutorDe.map((c) => `${c.grado} ${c.paralelo}`).join(', ') || 'Ninguna',
    ].map(escapeCsv).join(';'));
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `distributivo_docente_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportDistributivoJSON(data: DistributivoData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `distributivo_docente_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function validateImportedData(raw: unknown): raw is DistributivoData {
  if (!raw || typeof raw !== 'object') return false;
  const obj = raw as Record<string, unknown>;
  return (
    typeof obj.institucion === 'object' &&
    Array.isArray(obj.cursos) &&
    Array.isArray(obj.asignaturas) &&
    Array.isArray(obj.docentes) &&
    typeof obj.asignaciones === 'object' &&
    Array.isArray(obj.autoridades)
  );
}
