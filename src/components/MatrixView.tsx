import React, { useMemo, useState } from 'react';
import {
  BookPlus,
  Check,
  Eraser,
  Filter,
  FolderPlus,
  MousePointerClick,
  Paintbrush,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  Asignatura,
  CellDisplayMode,
  CursoParalelo,
  DistributivoData,
  Docente,
  DocenteStats,
} from '../types/distributivo';
import {
  cellKey,
  computeCursoStats,
  getContrastTextColor,
} from '../data/initialDistributivo';

interface MatrixViewProps {
  data: DistributivoData;
  docenteStats: DocenteStats[];
  highlightedDocenteId: string | null;
  onHighlightDocente: (id: string | null) => void;
  onUpdateCell: (asignaturaId: string, cursoId: string, horas: number, docenteId: string | null) => void;
  onAssignDocenteToGrade: (asignaturaId: string, grado: string, nivel: string, docenteId: string | null) => void;
  onUpdateTutor: (cursoId: string, tutorId: string | null) => void;
  onUpdateCoordinador: (cursoId: string, coordinador: string) => void;
  onOpenAddCurso: () => void;
  onEditCurso: (curso: CursoParalelo) => void;
  onOpenAddAsignatura: () => void;
  onEditAsignatura: (asig: Asignatura) => void;
}

interface GroupSpan<T> {
  label: string;
  span: number;
  items: T[];
}

function buildConsecutiveGroups<T>(items: T[], getKey: (item: T) => string): GroupSpan<T>[] {
  const groups: GroupSpan<T>[] = [];
  for (const item of items) {
    const label = getKey(item);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.span += 1;
      last.items.push(item);
    } else {
      groups.push({ label, span: 1, items: [item] });
    }
  }
  return groups;
}

export const MatrixView: React.FC<MatrixViewProps> = ({
  data,
  docenteStats,
  highlightedDocenteId,
  onHighlightDocente,
  onUpdateCell,
  onAssignDocenteToGrade,
  onUpdateTutor,
  onUpdateCoordinador,
  onOpenAddCurso,
  onEditCurso,
  onOpenAddAsignatura,
  onEditAsignatura,
}) => {
  const [interactionMode, setInteractionMode] = useState<'select' | 'brush'>('select');
  const [activeBrushDocenteId, setActiveBrushDocenteId] = useState<string | null>(
    data.docentes[0]?.id ?? null
  );
  const [displayMode, setDisplayMode] = useState<CellDisplayMode>('horas');
  const [nivelFilter, setNivelFilter] = useState<string>('TODOS');
  const [searchAsig, setSearchAsig] = useState('');
  const [editingCell, setEditingCell] = useState<{
    asignatura: Asignatura;
    curso: CursoParalelo;
  } | null>(null);

  const [draftHoras, setDraftHoras] = useState<number>(0);
  const [draftDocenteId, setDraftDocenteId] = useState<string | null>(null);

  const docenteMap = useMemo(
    () => new Map<string, Docente>(data.docentes.map((d) => [d.id, d])),
    [data.docentes]
  );

  const docenteStatsMap = useMemo(
    () => new Map<string, DocenteStats>(docenteStats.map((ds) => [ds.docente.id, ds])),
    [docenteStats]
  );

  const niveles = useMemo(() => {
    const unique = Array.from(new Set(data.cursos.map((c) => c.nivel)));
    return ['TODOS', ...unique];
  }, [data.cursos]);

  const visibleCursos = useMemo(() => {
    if (nivelFilter === 'TODOS') return data.cursos;
    return data.cursos.filter((c) => c.nivel === nivelFilter);
  }, [data.cursos, nivelFilter]);

  const visibleAsignaturas = useMemo(() => {
    const q = searchAsig.trim().toLowerCase();
    if (!q) return data.asignaturas;
    return data.asignaturas.filter(
      (a) => a.nombre.toLowerCase().includes(q) || a.area.toLowerCase().includes(q)
    );
  }, [data.asignaturas, searchAsig]);

  const nivelGroups = useMemo(
    () => buildConsecutiveGroups(visibleCursos, (c) => c.nivel),
    [visibleCursos]
  );

  const gradoGroups = useMemo(
    () => buildConsecutiveGroups(visibleCursos, (c) => `${c.nivel}::${c.grado}`),
    [visibleCursos]
  );

  const areaRowSpans = useMemo(() => {
    const spans = new Map<string, number>();
    let i = 0;
    while (i < visibleAsignaturas.length) {
      const area = visibleAsignaturas[i].area;
      let count = 1;
      while (i + count < visibleAsignaturas.length && visibleAsignaturas[i + count].area === area) {
        count += 1;
      }
      spans.set(visibleAsignaturas[i].id, count);
      for (let j = 1; j < count; j++) {
        spans.set(visibleAsignaturas[i + j].id, 0);
      }
      i += count;
    }
    return spans;
  }, [visibleAsignaturas]);

  const cursoStatsMap = useMemo(() => {
    const stats = computeCursoStats(data);
    return new Map(stats.map((s) => [s.curso.id, s]));
  }, [data]);

  const handleCellClick = (asig: Asignatura, curso: CursoParalelo) => {
    const key = cellKey(asig.id, curso.id);
    const current = data.asignaciones[key];

    if (interactionMode === 'brush') {
      // If cell already has 0 hours and brush is not eraser, assign 1 hour minimum so user can paint empty cells too
      const currentHoras = current?.horas ?? 0;
      if (activeBrushDocenteId === null) {
        // Eraser removes teacher assignment (keeps hours if > 0)
        onUpdateCell(asig.id, curso.id, currentHoras, null);
      } else {
        const nextHoras = currentHoras > 0 ? currentHoras : 1;
        onUpdateCell(asig.id, curso.id, nextHoras, activeBrushDocenteId);
      }
      return;
    }

    // Select mode: open modal/popover editor
    setDraftHoras(current?.horas ?? 0);
    setDraftDocenteId(current?.docenteId ?? null);
    setEditingCell({ asignatura: asig, curso });
  };

  const handleSaveModal = () => {
    if (!editingCell) return;
    onUpdateCell(
      editingCell.asignatura.id,
      editingCell.curso.id,
      Math.max(0, Math.min(20, draftHoras)),
      draftHoras > 0 ? draftDocenteId : null
    );
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      {/* Workspace Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Interaction Mode Segmented Switch */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            <button
              type="button"
              onClick={() => setInteractionMode('select')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                interactionMode === 'select'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              Editar celda
            </button>
            <button
              type="button"
              onClick={() => setInteractionMode('brush')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                interactionMode === 'brush'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Modo pincel
            </button>
          </div>

          {/* Nivel filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {niveles.map((nivel) => (
              <button
                key={nivel}
                type="button"
                onClick={() => setNivelFilter(nivel)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                  nivelFilter === nivel
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {nivel === 'TODOS' ? 'Todos los niveles' : nivel}
              </button>
            ))}
          </div>

          {/* Cell Display Mode */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Modo de visualización de celdas"
              value={displayMode}
              onChange={(e) => setDisplayMode(e.target.value as CellDisplayMode)}
              className="bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            >
              <option value="horas">Ver: Solo horas</option>
              <option value="iniciales">Ver: Horas + Siglas</option>
              <option value="docente">Ver: Horas + Apellido</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Subject */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchAsig}
              onChange={(e) => setSearchAsig(e.target.value)}
              placeholder="Buscar asignatura o área..."
              className="pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:bg-white"
            />
            {searchAsig && (
              <button
                type="button"
                onClick={() => setSearchAsig('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAddCurso}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Agregar paralelo
          </button>

          <button
            type="button"
            onClick={onOpenAddAsignatura}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <BookPlus className="w-3.5 h-3.5" />
            Agregar asignatura
          </button>
        </div>
      </div>

      {/* Interactive Teacher Palette / Brush Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3">
        <div className="flex items-center justify-between gap-4 mb-2.5">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">
              {interactionMode === 'brush'
                ? 'Selecciona un docente para pintar celdas en la matriz'
                : 'Plantilla de docentes · Haz clic en un docente para resaltarlo en la matriz'}
            </span>
            {highlightedDocenteId && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onHighlightDocente(null)}
                  className="text-blue-700 hover:underline font-medium"
                >
                  Quitar filtro de resaltado
                </button>
              </>
            )}
          </div>
          <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
            {data.docentes.length} docentes · {data.cursos.length} paralelos
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {docenteStats.map((ds) => {
            const isActiveBrush =
              interactionMode === 'brush' && activeBrushDocenteId === ds.docente.id;
            const isHighlighted = highlightedDocenteId === ds.docente.id;
            const textColor = getContrastTextColor(ds.docente.color);

            return (
              <button
                key={ds.docente.id}
                type="button"
                onClick={() => {
                  if (interactionMode === 'brush') {
                    setActiveBrushDocenteId(ds.docente.id);
                  } else {
                    onHighlightDocente(isHighlighted ? null : ds.docente.id);
                  }
                }}
                className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-xs transition-all whitespace-nowrap shrink-0 ${
                  isActiveBrush || isHighlighted
                    ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-50 font-semibold text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-xs flex items-center justify-center text-[10px] font-mono font-bold border border-black/10 shrink-0"
                  style={{ backgroundColor: ds.docente.color, color: textColor }}
                >
                  {ds.docente.siglas}
                </span>
                <span className="truncate max-w-[140px]">{ds.docente.nombre}</span>
                <span
                  className={`font-mono tabular-nums text-[11px] font-semibold ${
                    ds.estado === 'sobrecarga'
                      ? 'text-red-600'
                      : ds.estado === 'subcarga'
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {ds.horasAsignadas}/{ds.docente.horasObjetivo}h
                </span>
              </button>
            );
          })}

          {interactionMode === 'brush' && (
            <button
              type="button"
              onClick={() => setActiveBrushDocenteId(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs transition-all whitespace-nowrap shrink-0 ${
                activeBrushDocenteId === null
                  ? 'border-slate-900 ring-2 ring-slate-900/20 bg-slate-100 font-semibold text-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              Quitar docente
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Row 1: Nivel */}
              <tr className="bg-slate-900 text-white">
                <th
                  rowSpan={4}
                  className="border border-slate-300 bg-slate-100 text-slate-800 font-display font-bold text-left px-3 py-2 min-w-[145px] sticky left-0 z-20"
                >
                  ÁREA
                </th>
                <th
                  rowSpan={4}
                  className="border border-slate-300 bg-slate-100 text-slate-800 font-display font-bold text-left px-3 py-2 min-w-[165px] sticky left-[145px] z-20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                >
                  ASIGNATURA
                </th>
                {nivelGroups.map((group, idx) => (
                  <th
                    key={`${group.label}-${idx}`}
                    colSpan={group.span}
                    className="border border-slate-700 px-2 py-1.5 text-center font-display font-bold tracking-wide text-[11px]"
                  >
                    {group.label}
                  </th>
                ))}
                <th
                  rowSpan={4}
                  className="border border-slate-300 bg-slate-100 text-slate-800 font-display font-bold text-center px-2.5 py-2 min-w-[72px]"
                >
                  TOTAL
                </th>
              </tr>

              {/* Row 2: Grado */}
              <tr className="bg-slate-800 text-white">
                {gradoGroups.map((group, idx) => {
                  const gradoTitle = group.label.split('::')[1] ?? group.label;
                  return (
                    <th
                      key={`${group.label}-${idx}`}
                      colSpan={group.span}
                      className="border border-slate-700 px-2 py-1 text-center font-semibold text-[11px]"
                    >
                      {gradoTitle}
                    </th>
                  );
                })}
              </tr>

              {/* Row 3: Jornada */}
              <tr className="bg-slate-100 text-slate-700">
                {visibleCursos.map((curso) => (
                  <th
                    key={`jornada-${curso.id}`}
                    className="border border-slate-300 px-1.5 py-1 text-center font-medium text-[10px] tracking-wide"
                  >
                    {curso.jornada}
                  </th>
                ))}
              </tr>

              {/* Row 4: Paralelo + Edit button */}
              <tr className="bg-slate-50 text-slate-900">
                {visibleCursos.map((curso) => (
                  <th
                    key={`paralelo-${curso.id}`}
                    className="border border-slate-300 px-1.5 py-1.5 text-center font-display font-bold min-w-[76px] group relative"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{curso.paralelo}</span>
                      <button
                        type="button"
                        onClick={() => onEditCurso(curso)}
                        title={`Configurar ${curso.grado} ${curso.paralelo}`}
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-slate-400 hover:text-slate-800 rounded transition-opacity"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visibleAsignaturas.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleCursos.length + 3}
                    className="py-12 text-center text-slate-500"
                  >
                    No se encontraron asignaturas que coincidan con "{searchAsig}".
                  </td>
                </tr>
              ) : (
                visibleAsignaturas.map((asig) => {
                  const areaSpan = areaRowSpans.get(asig.id) ?? 0;
                  let rowTotal = 0;

                  return (
                    <tr key={asig.id} className="hover:bg-slate-50/70 transition-colors">
                      {areaSpan > 0 && (
                        <td
                          rowSpan={areaSpan}
                          className="border border-slate-300 px-3 py-2 font-semibold text-[11px] text-slate-900 align-middle sticky left-0 z-10"
                          style={{ backgroundColor: asig.areaColor }}
                        >
                          {asig.area}
                        </td>
                      )}

                      <td className="border border-slate-300 bg-white px-3 py-2 font-medium text-slate-800 sticky left-[145px] z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] group">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate">{asig.nombre}</span>
                          <button
                            type="button"
                            onClick={() => onEditAsignatura(asig)}
                            title={`Editar ${asig.nombre}`}
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-slate-400 hover:text-slate-800 rounded transition-opacity shrink-0"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {visibleCursos.map((curso) => {
                        const celda = data.asignaciones[cellKey(asig.id, curso.id)];
                        const horas = celda?.horas ?? 0;
                        const docente = celda?.docenteId
                          ? docenteMap.get(celda.docenteId) ?? null
                          : null;

                        if (horas > 0) rowTotal += horas;

                        const isDimmed =
                          highlightedDocenteId !== null &&
                          horas > 0 &&
                          docente?.id !== highlightedDocenteId;

                        const isHighlighted =
                          highlightedDocenteId !== null &&
                          horas > 0 &&
                          docente?.id === highlightedDocenteId;

                        // Active cell styling
                        let bg = '#ffffff';
                        let fg = '#94a3b8';
                        if (horas > 0 && docente) {
                          bg = docente.color;
                          fg = getContrastTextColor(docente.color);
                        } else if (horas > 0 && !docente) {
                          bg = '#FEF3C7';
                          fg = '#92400E';
                        }

                        const surname = docente
                          ? docente.nombre
                              .replace(/^(MSC\.?|LIC\.?|ING\.?|DR\.?)\s+/i, '')
                              .split(' ')
                              .slice(-1)[0]
                          : '';

                        return (
                          <td
                            key={`${asig.id}-${curso.id}`}
                            className="border border-slate-300 p-0 text-center align-middle"
                          >
                            <button
                              type="button"
                              onClick={() => handleCellClick(asig, curso)}
                              title={
                                horas > 0
                                  ? `${asig.nombre} · ${curso.grado} ${curso.paralelo}: ${horas}h — ${
                                      docente ? docente.nombre : 'Sin docente asignado'
                                    }`
                                  : `Clic para agregar horas a ${asig.nombre} en ${curso.grado} ${curso.paralelo}`
                              }
                              style={{
                                backgroundColor: horas > 0 ? bg : undefined,
                                color: horas > 0 ? fg : undefined,
                              }}
                              className={`w-full h-9 px-1 flex flex-col items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900 ${
                                horas === 0
                                  ? 'bg-slate-50/60 text-slate-300 hover:bg-slate-100 hover:text-slate-500'
                                  : 'hover:brightness-95'
                              } ${isDimmed ? 'opacity-20' : ''} ${
                                isHighlighted ? 'ring-2 ring-inset ring-slate-950 font-bold' : ''
                              } ${interactionMode === 'brush' ? 'cursor-crosshair' : 'cursor-pointer'}`}
                            >
                              {horas > 0 ? (
                                <>
                                  <span className="font-mono tabular-nums font-bold text-[13px] leading-none">
                                    {horas}
                                  </span>
                                  {displayMode === 'iniciales' && (
                                    <span className="text-[9px] font-semibold leading-tight opacity-90 mt-0.5">
                                      {docente ? docente.siglas : 'S/D'}
                                    </span>
                                  )}
                                  {displayMode === 'docente' && (
                                    <span className="text-[9px] font-semibold leading-tight opacity-90 mt-0.5 truncate max-w-[68px]">
                                      {docente ? surname : 'Sin doc.'}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[11px]">—</span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      <td className="border border-slate-300 bg-slate-50 px-2 py-1 text-center font-mono tabular-nums font-semibold text-slate-700">
                        {rowTotal > 0 ? `${rowTotal}h` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}

              {/* HORAS CLASE Row */}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-400">
                <td
                  colSpan={2}
                  className="border border-slate-300 bg-slate-100 px-3 py-2 text-right font-display tracking-wide sticky left-0 z-10"
                >
                  HORAS CLASE
                </td>
                {visibleCursos.map((curso) => {
                  const cs = cursoStatsMap.get(curso.id);
                  const horas = cs?.horasClase ?? 0;
                  const mismatch = cs && cs.diferenciaObjetivo !== 0;
                  return (
                    <td
                      key={`hc-${curso.id}`}
                      title={`Meta del curso: ${curso.horasObjetivo}h`}
                      className={`border border-slate-300 px-2 py-2 text-center font-mono tabular-nums ${
                        mismatch ? 'bg-amber-100 text-amber-900' : 'text-slate-900'
                      }`}
                    >
                      {horas}
                    </td>
                  );
                })}
                <td className="border border-slate-300 bg-slate-200 px-2 py-2 text-center font-mono tabular-nums">
                  {visibleCursos.reduce(
                    (acc, c) => acc + (cursoStatsMap.get(c.id)?.horasClase ?? 0),
                    0
                  )}
                  h
                </td>
              </tr>

              {/* HORAS DOCENTE Row */}
              <tr className="bg-white font-bold text-slate-900">
                <td
                  colSpan={2}
                  className="border border-slate-300 bg-slate-50 px-3 py-2 text-right font-display tracking-wide sticky left-0 z-10"
                >
                  HORAS DOCENTE
                </td>
                {visibleCursos.map((curso) => {
                  const cs = cursoStatsMap.get(curso.id);
                  const horasDoc = cs?.horasDocente ?? 0;
                  const sinDoc = cs?.horasSinDocente ?? 0;
                  return (
                    <td
                      key={`hd-${curso.id}`}
                      title={
                        sinDoc > 0
                          ? `Faltan ${sinDoc}h por asignar docente`
                          : 'Todas las horas cubiertas'
                      }
                      className={`border border-slate-300 px-2 py-2 text-center font-mono tabular-nums ${
                        sinDoc > 0 ? 'bg-red-50 text-red-700' : 'text-emerald-800'
                      }`}
                    >
                      {horasDoc}
                    </td>
                  );
                })}
                <td className="border border-slate-300 bg-slate-100 px-2 py-2 text-center font-mono tabular-nums">
                  {visibleCursos.reduce(
                    (acc, c) => acc + (cursoStatsMap.get(c.id)?.horasDocente ?? 0),
                    0
                  )}
                  h
                </td>
              </tr>

              {/* TUTORES Row */}
              <tr className="bg-slate-50">
                <td
                  colSpan={2}
                  className="border border-slate-300 bg-slate-100 px-3 py-3 text-right font-display font-bold text-slate-900 sticky left-0 z-10"
                >
                  TUTORES
                </td>
                {visibleCursos.map((curso) => {
                  const tutor = curso.tutorId ? docenteMap.get(curso.tutorId) : null;
                  const bg = tutor ? tutor.color : '#FFFFFF';
                  const fg = tutor ? getContrastTextColor(tutor.color) : '#64748B';
                  return (
                    <td
                      key={`tutor-${curso.id}`}
                      className="border border-slate-300 p-1 align-middle"
                      style={{ backgroundColor: bg }}
                    >
                      <select
                        aria-label={`Tutor de ${curso.grado} ${curso.paralelo}`}
                        value={curso.tutorId ?? ''}
                        onChange={(e) =>
                          onUpdateTutor(curso.id, e.target.value ? e.target.value : null)
                        }
                        style={{ color: fg }}
                        className="w-full bg-transparent text-[10px] font-semibold text-center focus:outline-none cursor-pointer py-1"
                      >
                        <option value="" className="text-slate-900 bg-white">
                          Sin tutor
                        </option>
                        {data.docentes.map((d) => (
                          <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                            {d.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                  );
                })}
                <td className="border border-slate-300 bg-slate-100 px-2 py-2 text-center text-[11px] text-slate-500 font-mono tabular-nums">
                  {visibleCursos.filter((c) => c.tutorId).length}/{visibleCursos.length}
                </td>
              </tr>

              {/* COORDINADORES Row */}
              <tr className="bg-white">
                <td
                  colSpan={2}
                  className="border border-slate-300 bg-slate-100 px-3 py-2 text-right font-display font-bold text-slate-900 sticky left-0 z-10"
                >
                  COORDINADORES
                </td>
                {visibleCursos.map((curso) => (
                  <td key={`coord-${curso.id}`} className="border border-slate-300 p-1">
                    <input
                      type="text"
                      value={curso.coordinador}
                      onChange={(e) => onUpdateCoordinador(curso.id, e.target.value)}
                      placeholder="—"
                      aria-label={`Coordinador para ${curso.grado} ${curso.paralelo}`}
                      className="w-full text-center text-[10px] text-slate-700 bg-transparent px-1 py-1 focus:bg-slate-50 focus:outline-none rounded"
                    />
                  </td>
                ))}
                <td className="border border-slate-300 bg-slate-50 px-2 py-2" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Inline Cell Editor Modal */}
      {editingCell && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setEditingCell(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">
                  {editingCell.asignatura.area} · {editingCell.curso.nivel}
                </p>
                <h3 className="text-base font-display font-bold text-slate-900 mt-0.5">
                  {editingCell.asignatura.nombre} — {editingCell.curso.grado} "{editingCell.curso.paralelo}"
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Hours Stepper */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Horas semanales asignadas
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDraftHoras((h) => Math.max(0, h - 1))}
                    className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={draftHoras}
                    onChange={(e) => setDraftHoras(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20 h-9 text-center font-mono tabular-nums font-bold text-base border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                  />
                  <button
                    type="button"
                    onClick={() => setDraftHoras((h) => Math.min(20, h + 1))}
                    className="w-9 h-9 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700"
                  >
                    +
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    {[0, 1, 2, 3, 4, 5].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDraftHoras(preset)}
                        className={`px-2 py-1 text-xs font-mono rounded border ${
                          draftHoras === preset
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Docente Selector */}
              {draftHoras > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Docente responsable
                  </label>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    <button
                      type="button"
                      onClick={() => setDraftDocenteId(null)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 ${
                        draftDocenteId === null ? 'bg-amber-50 font-semibold text-amber-900' : 'text-slate-600'
                      }`}
                    >
                      <span>Sin docente asignado (dejar pendiente)</span>
                      {draftDocenteId === null && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {data.docentes.map((doc) => {
                      const stats = docenteStatsMap.get(doc.id);
                      const isSelected = draftDocenteId === doc.id;
                      const fg = getContrastTextColor(doc.color);
                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setDraftDocenteId(doc.id)}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 hover:bg-slate-50 ${
                            isSelected ? 'bg-slate-100 font-semibold text-slate-900' : 'text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-5 h-5 rounded-xs flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                              style={{ backgroundColor: doc.color, color: fg }}
                            >
                              {doc.siglas}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate">{doc.nombre}</div>
                              <div className="text-[11px] text-slate-500 truncate">
                                {doc.especialidad}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono tabular-nums text-[11px] text-slate-600">
                              {stats?.horasAsignadas ?? 0}/{doc.horasObjetivo}h
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quick apply to all parallels of the same grade */}
              {draftHoras > 0 &&
                data.cursos.filter(
                  (c) =>
                    c.grado === editingCell.curso.grado && c.nivel === editingCell.curso.nivel
                ).length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateCell(
                        editingCell.asignatura.id,
                        editingCell.curso.id,
                        draftHoras,
                        draftDocenteId
                      );
                      onAssignDocenteToGrade(
                        editingCell.asignatura.id,
                        editingCell.curso.grado,
                        editingCell.curso.nivel,
                        draftDocenteId
                      );
                      setEditingCell(null);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Aplicar este docente a todos los paralelos de {editingCell.curso.grado}
                  </button>
                )}
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onUpdateCell(editingCell.asignatura.id, editingCell.curso.id, 0, null);
                  setEditingCell(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar celda
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                >
                  Guardar cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
