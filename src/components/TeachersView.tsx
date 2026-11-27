import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Docente, DocenteStats } from '../types/distributivo';
import {
  TEACHER_PALETTE,
  generateSiglas,
  getContrastTextColor,
} from '../data/initialDistributivo';

interface TeachersViewProps {
  docenteStats: DocenteStats[];
  onSaveDocente: (docente: Docente, isNew: boolean) => void;
  onDeleteDocente: (docenteId: string) => void;
  onInspectInMatrix: (docenteId: string) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({
  docenteStats,
  onSaveDocente,
  onDeleteDocente,
  onInspectInMatrix,
}) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingDocente, setEditingDocente] = useState<{
    docente: Docente;
    isNew: boolean;
  } | null>(null);

  const filtered = docenteStats.filter((ds) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      ds.docente.nombre.toLowerCase().includes(q) ||
      ds.docente.especialidad.toLowerCase().includes(q)
    );
  });

  const openNewModal = () => {
    const usedColors = new Set(docenteStats.map((d) => d.docente.color.toUpperCase()));
    const nextColor =
      TEACHER_PALETTE.find((c) => !usedColors.has(c.toUpperCase())) ??
      TEACHER_PALETTE[docenteStats.length % TEACHER_PALETTE.length];

    setEditingDocente({
      isNew: true,
      docente: {
        id: `doc-${Date.now()}`,
        nombre: '',
        siglas: '',
        especialidad: '',
        color: nextColor,
        horasObjetivo: 25,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocente) return;
    const trimmedName = editingDocente.docente.nombre.trim();
    if (!trimmedName) return;

    const finalDocente: Docente = {
      ...editingDocente.docente,
      nombre: trimmedName.toUpperCase(),
      siglas:
        editingDocente.docente.siglas.trim().toUpperCase() ||
        generateSiglas(trimmedName),
      especialidad: editingDocente.docente.especialidad.trim() || 'General',
      horasObjetivo: Math.max(1, Math.min(45, editingDocente.docente.horasObjetivo || 25)),
    };

    onSaveDocente(finalDocente, editingDocente.isNew);
    setEditingDocente(null);
  };

  const totalAssigned = docenteStats.reduce((acc, s) => acc + s.horasAsignadas, 0);
  const totalTarget = docenteStats.reduce((acc, s) => acc + s.docente.horasObjetivo, 0);

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-display font-bold text-slate-900">
            Nómina y Carga Horaria Docente
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {docenteStats.length} docentes registrados · {totalAssigned}h asignadas de {totalTarget}h meta institucional
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar docente o área..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md w-56 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={openNewModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo docente
          </button>
        </div>
      </div>

      {/* Teachers Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-display">
                <th className="text-left px-4 py-3 font-semibold w-8" />
                <th className="text-left px-3 py-3 font-semibold">Docente</th>
                <th className="text-left px-3 py-3 font-semibold">Especialidad</th>
                <th className="text-left px-3 py-3 font-semibold">Tutoría</th>
                <th className="text-right px-3 py-3 font-semibold">Asignadas</th>
                <th className="text-right px-3 py-3 font-semibold">Meta</th>
                <th className="text-left px-4 py-3 font-semibold w-48">Balance</th>
                <th className="text-left px-3 py-3 font-semibold">Estado</th>
                <th className="text-right px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No hay docentes que coincidan con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((ds) => {
                  const isExpanded = expandedId === ds.docente.id;
                  const fg = getContrastTextColor(ds.docente.color);
                  const ratio = Math.min(
                    100,
                    Math.round((ds.horasAsignadas / Math.max(1, ds.docente.horasObjetivo)) * 100)
                  );

                  const statusLabel =
                    ds.estado === 'optimo'
                      ? 'Óptimo'
                      : ds.estado === 'sobrecarga'
                      ? `Sobrecarga (+${ds.diferencia}h)`
                      : ds.estado === 'subcarga'
                      ? `Subcarga (${ds.diferencia}h)`
                      : 'Sin carga';

                  const statusTextColor =
                    ds.estado === 'optimo'
                      ? 'text-emerald-700'
                      : ds.estado === 'sobrecarga'
                      ? 'text-red-700'
                      : ds.estado === 'subcarga'
                      ? 'text-amber-700'
                      : 'text-slate-500';

                  const barColor =
                    ds.estado === 'optimo'
                      ? 'bg-emerald-600'
                      : ds.estado === 'sobrecarga'
                      ? 'bg-red-600'
                      : 'bg-amber-500';

                  return (
                    <React.Fragment key={ds.docente.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : ds.docente.id)
                            }
                            aria-label={isExpanded ? 'Contraer detalle' : 'Expandir detalle'}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-7 h-7 rounded-sm flex items-center justify-center font-mono font-bold text-[11px] border border-black/10 shrink-0"
                              style={{
                                backgroundColor: ds.docente.color,
                                color: fg,
                              }}
                            >
                              {ds.docente.siglas}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : ds.docente.id)
                              }
                              className="font-semibold text-slate-900 text-left hover:underline"
                            >
                              {ds.docente.nombre}
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-2.5 text-slate-600">
                          {ds.docente.especialidad}
                        </td>

                        <td className="px-3 py-2.5 text-slate-700">
                          {ds.tutorDe.length > 0
                            ? ds.tutorDe.map((c) => `${c.grado} ${c.paralelo}`).join(', ')
                            : '—'}
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-slate-900">
                          {ds.horasAsignadas}h
                        </td>

                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-600">
                          {ds.docente.horasObjetivo}h
                        </td>

                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${barColor}`}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <span className="font-mono tabular-nums text-[11px] text-slate-500 w-9 text-right">
                              {ratio}%
                            </span>
                          </div>
                        </td>

                        <td className={`px-3 py-2.5 font-semibold whitespace-nowrap ${statusTextColor}`}>
                          {statusLabel}
                        </td>

                        <td className="px-4 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onInspectInMatrix(ds.docente.id)}
                              title="Resaltar en la matriz"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingDocente({ docente: { ...ds.docente }, isNew: false })
                              }
                              title="Editar docente"
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteDocente(ds.docente.id)}
                              title="Eliminar docente"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="px-10 py-3">
                            {ds.detalles.length === 0 ? (
                              <p className="text-xs text-slate-500">
                                Este docente aún no tiene asignaturas asignadas en la matriz.
                              </p>
                            ) : (
                              <div>
                                <p className="text-[11px] font-semibold text-slate-600 mb-2">
                                  Desglose de asignaturas asignadas ({ds.detalles.length} paralelos-asignatura · {ds.horasAsignadas}h totales):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                                  {ds.detalles.map((det, idx) => (
                                    <div
                                      key={`${det.asignaturaId}-${det.cursoId}-${idx}`}
                                      className="flex items-center justify-between py-1 border-b border-slate-200/70 text-xs"
                                    >
                                      <span className="text-slate-700 truncate">
                                        {det.asignaturaNombre} ·{' '}
                                        <span className="text-slate-500">{det.cursoEtiqueta}</span>
                                      </span>
                                      <span className="font-mono tabular-nums font-semibold text-slate-900 ml-2 shrink-0">
                                        {det.horas}h
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Teacher Modal */}
      {editingDocente && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setEditingDocente(null)}
        >
          <form
            onSubmit={handleSubmit}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-display font-bold text-slate-900">
                {editingDocente.isNew ? 'Registrar nuevo docente' : 'Editar docente'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingDocente(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre completo con título
                </label>
                <input
                  type="text"
                  required
                  value={editingDocente.docente.nombre}
                  onChange={(e) =>
                    setEditingDocente({
                      ...editingDocente,
                      docente: {
                        ...editingDocente.docente,
                        nombre: e.target.value,
                        siglas: editingDocente.isNew
                          ? generateSiglas(e.target.value)
                          : editingDocente.docente.siglas,
                      },
                    })
                  }
                  placeholder="Ej: MSC. MARÍA FERNANDA LÓPEZ"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Siglas (2-3 letras)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={editingDocente.docente.siglas}
                    onChange={(e) =>
                      setEditingDocente({
                        ...editingDocente,
                        docente: {
                          ...editingDocente.docente,
                          siglas: e.target.value.toUpperCase(),
                        },
                      })
                    }
                    placeholder="ML"
                    className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meta de horas semanales
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={editingDocente.docente.horasObjetivo}
                    onChange={(e) =>
                      setEditingDocente({
                        ...editingDocente,
                        docente: {
                          ...editingDocente.docente,
                          horasObjetivo: Number(e.target.value) || 25,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Especialidad / Área
                </label>
                <input
                  type="text"
                  value={editingDocente.docente.especialidad}
                  onChange={(e) =>
                    setEditingDocente({
                      ...editingDocente,
                      docente: {
                        ...editingDocente.docente,
                        especialidad: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: Matemática / Física"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Color identificador en la plantilla
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {TEACHER_PALETTE.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        setEditingDocente({
                          ...editingDocente,
                          docente: { ...editingDocente.docente, color: hex },
                        })
                      }
                      className={`w-7 h-7 rounded-md border transition-transform ${
                        editingDocente.docente.color.toUpperCase() === hex.toUpperCase()
                          ? 'border-slate-950 scale-110 ring-2 ring-slate-900/20'
                          : 'border-black/15 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                      aria-label={`Seleccionar color ${hex}`}
                    />
                  ))}
                  <input
                    type="color"
                    value={editingDocente.docente.color}
                    onChange={(e) =>
                      setEditingDocente({
                        ...editingDocente,
                        docente: { ...editingDocente.docente, color: e.target.value },
                      })
                    }
                    aria-label="Color personalizado"
                    className="w-7 h-7 rounded cursor-pointer border border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingDocente(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
              >
                {editingDocente.isNew ? 'Agregar docente' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
