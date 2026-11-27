import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import {
  Asignatura,
  Autoridad,
  CursoParalelo,
  InstitucionInfo,
} from '../types/distributivo';

interface CursoModalProps {
  curso: CursoParalelo | null;
  isNew: boolean;
  onSave: (curso: CursoParalelo, isNew: boolean) => void;
  onDelete?: (cursoId: string) => void;
  onClose: () => void;
}

export const CursoModal: React.FC<CursoModalProps> = ({
  curso,
  isNew,
  onSave,
  onDelete,
  onClose,
}) => {
  const [form, setForm] = useState<CursoParalelo>(
    curso ?? {
      id: `cur-${Date.now()}`,
      nivel: 'BGU - CIENCIAS',
      grado: 'PRIMERO',
      jornada: 'NOCTURNA',
      paralelo: 'C',
      horasObjetivo: 25,
      tutorId: null,
      coordinador: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grado.trim() || !form.paralelo.trim()) return;
    onSave(
      {
        ...form,
        nivel: form.nivel.trim().toUpperCase(),
        grado: form.grado.trim().toUpperCase(),
        jornada: form.jornada.trim().toUpperCase(),
        paralelo: form.paralelo.trim().toUpperCase(),
        horasObjetivo: Math.max(1, form.horasObjetivo || 25),
      },
      isNew
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-slate-900">
            {isNew ? 'Agregar paralelo' : `Configurar ${form.grado} "${form.paralelo}"`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nivel educativo
            </label>
            <input
              type="text"
              required
              value={form.nivel}
              onChange={(e) => setForm({ ...form, nivel: e.target.value })}
              placeholder="Ej: BÁSICA o BGU - CIENCIAS"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grado / Curso
              </label>
              <input
                type="text"
                required
                value={form.grado}
                onChange={(e) => setForm({ ...form, grado: e.target.value })}
                placeholder="Ej: PRIMERO"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Paralelo
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={form.paralelo}
                onChange={(e) => setForm({ ...form, paralelo: e.target.value })}
                placeholder="Ej: A"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jornada
              </label>
              <input
                type="text"
                required
                value={form.jornada}
                onChange={(e) => setForm({ ...form, jornada: e.target.value })}
                placeholder="Ej: NOCTURNA"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Horas semanales meta
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={form.horasObjetivo}
                onChange={(e) =>
                  setForm({ ...form, horasObjetivo: Number(e.target.value) || 25 })
                }
                className="w-full px-3 py-2 text-xs font-mono tabular-nums border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar paralelo
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface AsignaturaModalProps {
  asignatura: Asignatura | null;
  isNew: boolean;
  onSave: (asig: Asignatura, isNew: boolean) => void;
  onDelete?: (asigId: string) => void;
  onClose: () => void;
}

const AREA_COLORS = [
  '#FED7AA',
  '#FEF08A',
  '#BBF7D0',
  '#FDE68A',
  '#BAE6FD',
  '#FBCFE8',
  '#DDD6FE',
  '#E2E8F0',
];

export const AsignaturaModal: React.FC<AsignaturaModalProps> = ({
  asignatura,
  isNew,
  onSave,
  onDelete,
  onClose,
}) => {
  const [form, setForm] = useState<Asignatura>(
    asignatura ?? {
      id: `asig-${Date.now()}`,
      area: 'INTERDISCIPLINAR',
      areaColor: '#DDD6FE',
      nombre: '',
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.area.trim()) return;
    onSave(
      {
        ...form,
        area: form.area.trim().toUpperCase(),
        nombre: form.nombre.trim().toUpperCase(),
      },
      isNew
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-slate-900">
            {isNew ? 'Agregar asignatura' : `Editar ${form.nombre}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Área académica
            </label>
            <input
              type="text"
              required
              value={form.area}
              onChange={(e) => setForm({ ...form, area: e.target.value })}
              placeholder="Ej: CIENCIAS NATURALES"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la asignatura
            </label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: INFORMÁTICA APLICADA"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Color suave del área
            </label>
            <div className="flex flex-wrap gap-2">
              {AREA_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setForm({ ...form, areaColor: hex })}
                  className={`w-7 h-7 rounded-md border ${
                    form.areaColor === hex
                      ? 'border-slate-900 ring-2 ring-slate-900/20 scale-110'
                      : 'border-black/15'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isNew && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(form.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar asignatura
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
            >
              Guardar
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

interface InstitucionModalProps {
  institucion: InstitucionInfo;
  autoridades: Autoridad[];
  onSave: (institucion: InstitucionInfo, autoridades: Autoridad[]) => void;
  onClose: () => void;
}

export const InstitucionModal: React.FC<InstitucionModalProps> = ({
  institucion,
  autoridades,
  onSave,
  onClose,
}) => {
  const [info, setInfo] = useState<InstitucionInfo>({ ...institucion });
  const [auths, setAuths] = useState<Autoridad[]>(
    autoridades.map((a) => ({ ...a }))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(info, auths);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-display font-bold text-slate-900">
            Datos institucionales y firmas de legalización
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título del documento
              </label>
              <input
                type="text"
                value={info.titulo}
                onChange={(e) => setInfo({ ...info, titulo: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Año lectivo
              </label>
              <input
                type="text"
                value={info.periodoLectivo}
                onChange={(e) =>
                  setInfo({ ...info, periodoLectivo: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Subtítulo / Institución
            </label>
            <input
              type="text"
              value={info.subtitulo}
              onChange={(e) => setInfo({ ...info, subtitulo: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-md"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs font-semibold text-slate-800 mb-2.5">
              Autoridades firmantes al pie de página
            </div>
            <div className="space-y-3">
              {auths.map((aut, idx) => (
                <div key={aut.id} className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={aut.nombre}
                    onChange={(e) => {
                      const next = [...auths];
                      next[idx] = { ...aut, nombre: e.target.value };
                      setAuths(next);
                    }}
                    placeholder="Nombre de autoridad"
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                  <input
                    type="text"
                    value={aut.cargo}
                    onChange={(e) => {
                      const next = [...auths];
                      next[idx] = { ...aut, cargo: e.target.value };
                      setAuths(next);
                    }}
                    placeholder="Cargo"
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md"
          >
            Guardar configuración
          </button>
        </div>
      </form>
    </div>
  );
};
