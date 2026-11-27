import React, { useMemo } from 'react';
import { Pencil, Printer } from 'lucide-react';
import { CursoParalelo, DistributivoData, Docente } from '../types/distributivo';
import {
  cellKey,
  computeCursoStats,
  getContrastTextColor,
} from '../data/initialDistributivo';

interface PrintPreviewViewProps {
  data: DistributivoData;
  onEditInstitucion: () => void;
}

function groupConsecutive<T>(items: T[], getKey: (item: T) => string) {
  const groups: { label: string; span: number }[] = [];
  for (const item of items) {
    const label = getKey(item);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.span += 1;
    } else {
      groups.push({ label, span: 1 });
    }
  }
  return groups;
}

export const PrintPreviewView: React.FC<PrintPreviewViewProps> = ({
  data,
  onEditInstitucion,
}) => {
  const docenteMap = useMemo(
    () => new Map<string, Docente>(data.docentes.map((d) => [d.id, d])),
    [data.docentes]
  );

  const cursoStatsMap = useMemo(() => {
    const stats = computeCursoStats(data);
    return new Map(stats.map((s) => [s.curso.id, s]));
  }, [data]);

  const nivelGroups = useMemo(
    () => groupConsecutive(data.cursos, (c) => c.nivel),
    [data.cursos]
  );

  const gradoGroups = useMemo(
    () => groupConsecutive(data.cursos, (c) => `${c.nivel}::${c.grado}`),
    [data.cursos]
  );

  const areaRowSpans = useMemo(() => {
    const spans = new Map<string, number>();
    let i = 0;
    while (i < data.asignaturas.length) {
      const area = data.asignaturas[i].area;
      let count = 1;
      while (i + count < data.asignaturas.length && data.asignaturas[i + count].area === area) {
        count += 1;
      }
      spans.set(data.asignaturas[i].id, count);
      for (let j = 1; j < count; j++) {
        spans.set(data.asignaturas[i + j].id, 0);
      }
      i += count;
    }
    return spans;
  }, [data.asignaturas]);

  return (
    <div className="space-y-4">
      {/* Screen-only Action Bar */}
      <div className="no-print bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-bold text-slate-900">
            Vista Oficial de Impresión ({data.institucion.titulo})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Formato horizontal listo para imprimir o guardar como PDF institucional con firmas de legalización.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEditInstitucion}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar encabezados y firmas
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Printable Official Sheet */}
      <div className="print-only-container bg-white border border-slate-300 rounded-lg p-6 overflow-x-auto">
        <div className="min-w-[960px]">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 text-center">
              <h1 className="text-lg font-display font-extrabold tracking-wide text-black uppercase">
                {data.institucion.titulo}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {data.institucion.subtitulo} · Año Lectivo {data.institucion.periodoLectivo}
              </p>
            </div>
            <div className="flex items-end gap-4 border border-black/20 px-3 py-1.5 bg-slate-50 shrink-0">
              <div className="text-center">
                <div className="text-[9px] font-semibold text-slate-600 uppercase">
                  N° Paralelos
                </div>
                <div className="text-sm font-mono font-bold text-black tabular-nums">
                  {data.cursos.length}
                </div>
              </div>
              <div className="w-px h-7 bg-slate-300" />
              <div className="text-center">
                <div className="text-[9px] font-semibold text-slate-600 uppercase">
                  N° Docentes
                </div>
                <div className="text-sm font-mono font-bold text-black tabular-nums">
                  {data.docentes.length}
                </div>
              </div>
            </div>
          </div>

          <table className="w-full border-collapse border-2 border-black text-[11px]">
            <thead>
              <tr>
                <th
                  rowSpan={4}
                  className="border border-black bg-white text-black font-bold text-left px-2 py-1 w-36"
                />
                <th
                  rowSpan={4}
                  className="border border-black bg-white text-black font-bold text-left px-2 py-1 w-40"
                />
                {nivelGroups.map((g, idx) => (
                  <th
                    key={`p-niv-${idx}`}
                    colSpan={g.span}
                    className="border border-black bg-[#D9EAD3] text-black font-bold text-center px-2 py-1 uppercase"
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {gradoGroups.map((g, idx) => (
                  <th
                    key={`p-grad-${idx}`}
                    colSpan={g.span}
                    className="border border-black bg-[#E9EDF4] text-black font-bold text-center px-1 py-0.5 text-[10px] uppercase"
                  >
                    {g.label.split('::')[1] ?? g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {data.cursos.map((c) => (
                  <th
                    key={`p-jor-${c.id}`}
                    className="border border-black bg-white text-black font-semibold text-center px-1 py-0.5 text-[9px] uppercase"
                  >
                    {c.jornada}
                  </th>
                ))}
              </tr>
              <tr>
                {data.cursos.map((c) => (
                  <th
                    key={`p-par-${c.id}`}
                    className="border border-black bg-white text-black font-bold text-center px-1 py-0.5 text-[10px]"
                  >
                    {c.paralelo}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.asignaturas.map((asig) => {
                const span = areaRowSpans.get(asig.id) ?? 0;
                return (
                  <tr key={`p-row-${asig.id}`}>
                    {span > 0 && (
                      <td
                        rowSpan={span}
                        className="border border-black px-2 py-1 font-semibold text-[10px] text-black align-middle"
                        style={{ backgroundColor: asig.areaColor }}
                      >
                        {asig.area}
                      </td>
                    )}
                    <td
                      className="border border-black px-2 py-0.5 font-medium text-[10px] text-black"
                      style={{ backgroundColor: asig.areaColor }}
                    >
                      {asig.nombre}
                    </td>
                    {data.cursos.map((curso: CursoParalelo) => {
                      const celda = data.asignaciones[cellKey(asig.id, curso.id)];
                      const horas = celda?.horas ?? 0;
                      const doc = celda?.docenteId ? docenteMap.get(celda.docenteId) : null;
                      const bg = horas > 0 && doc ? doc.color : horas > 0 ? '#FEF3C7' : '#FFFFFF';
                      const fg = horas > 0 && doc ? getContrastTextColor(doc.color) : '#000000';

                      return (
                        <td
                          key={`p-cell-${asig.id}-${curso.id}`}
                          className="border border-black text-center font-mono tabular-nums font-bold px-1 py-0.5"
                          style={{ backgroundColor: bg, color: fg }}
                        >
                          {horas > 0 ? horas : ''}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* HORAS CLASE */}
              <tr>
                <td className="border-t-2 border-black" />
                <td className="border border-black border-t-2 px-2 py-1 text-right font-bold text-black">
                  HORAS CLASE
                </td>
                {data.cursos.map((c) => (
                  <td
                    key={`p-hc-${c.id}`}
                    className="border border-black border-t-2 text-center font-mono tabular-nums font-bold px-1 py-1 text-black"
                  >
                    {cursoStatsMap.get(c.id)?.horasClase ?? 0}
                  </td>
                ))}
              </tr>

              {/* HORAS DOCENTE */}
              <tr>
                <td />
                <td className="border border-black px-2 py-1 text-right font-bold text-black">
                  HORAS DOCENTE
                </td>
                {data.cursos.map((c) => (
                  <td
                    key={`p-hd-${c.id}`}
                    className="border border-black text-center font-mono tabular-nums font-bold px-1 py-1 text-black"
                  >
                    {cursoStatsMap.get(c.id)?.horasDocente ?? 0}
                  </td>
                ))}
              </tr>

              {/* TUTORES (vertical text matching the PDF!) */}
              <tr>
                <td />
                <td className="border border-black px-2 py-2 text-right font-bold text-black align-middle">
                  TUTORES
                </td>
                {data.cursos.map((c) => {
                  const tutor = c.tutorId ? docenteMap.get(c.tutorId) : null;
                  const bg = tutor ? tutor.color : '#FFFFFF';
                  const fg = tutor ? getContrastTextColor(tutor.color) : '#000000';
                  return (
                    <td
                      key={`p-tut-${c.id}`}
                      className="border border-black p-1 text-center align-middle h-32"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      <div className="writing-vertical mx-auto text-[10px] font-bold tracking-tight whitespace-nowrap">
                        {tutor ? tutor.nombre : 'SIN TUTOR'}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* COORDINADORES */}
              <tr>
                <td />
                <td className="border border-black px-2 py-1.5 text-right font-bold text-black">
                  COORDINADORES
                </td>
                {data.cursos.map((c) => (
                  <td
                    key={`p-coord-${c.id}`}
                    className="border border-black px-1 py-1 text-center text-[9px] text-black"
                  >
                    {c.coordinador}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>

          {/* Legend of Docente Colors */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px]">
            <span className="font-bold text-slate-700">LEYENDA DOCENTES:</span>
            {data.docentes.map((d) => (
              <span key={`leg-${d.id}`} className="inline-flex items-center gap-1.5 text-slate-800">
                <span
                  className="w-3 h-3 border border-black/30 inline-block"
                  style={{ backgroundColor: d.color }}
                />
                <span>{d.nombre}</span>
              </span>
            ))}
          </div>

          {/* Official Signatories */}
          <div className="mt-12 grid grid-cols-3 gap-10 px-8">
            {data.autoridades.map((aut) => (
              <div key={aut.id} className="text-center">
                <div className="border-t border-black pt-1.5 text-xs font-semibold text-black">
                  {aut.nombre}
                </div>
                <div className="text-[11px] text-slate-700">{aut.cargo}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
