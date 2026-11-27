import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  Download,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Undo2,
  Upload,
} from 'lucide-react';
import {
  Asignatura,
  Autoridad,
  CursoParalelo,
  DistributivoData,
  Docente,
  InstitucionInfo,
  ViewMode,
} from './types/distributivo';
import {
  cellKey,
  computeCursoStats,
  computeDocenteStats,
  createCloneOfInitial,
  validateDistributivo,
} from './data/initialDistributivo';
import {
  exportDistributivoCSV,
  exportDistributivoJSON,
  validateImportedData,
} from './utils/exportUtils';
import { MatrixView } from './components/MatrixView';
import { TeachersView } from './components/TeachersView';
import { ValidationView } from './components/ValidationView';
import { PrintPreviewView } from './components/PrintPreviewView';
import {
  AsignaturaModal,
  CursoModal,
  InstitucionModal,
} from './components/StructureModal';

const STORAGE_KEY = 'distributivo_docente_ue2a_v1';

function loadInitialData(): DistributivoData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (validateImportedData(parsed)) {
        return parsed;
      }
    }
  } catch {
    // fallback to PDF base template
  }
  return createCloneOfInitial();
}

export default function App() {
  const [data, setData] = useState<DistributivoData>(loadInitialData);
  const [history, setHistory] = useState<DistributivoData[]>([]);
  const [activeView, setActiveView] = useState<ViewMode>('matriz');
  const [highlightedDocenteId, setHighlightedDocenteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [cursoModalState, setCursoModalState] = useState<{
    curso: CursoParalelo | null;
    isNew: boolean;
  } | null>(null);

  const [asigModalState, setAsigModalState] = useState<{
    asig: Asignatura | null;
    isNew: boolean;
  } | null>(null);

  const [showInstitucionModal, setShowInstitucionModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }, [data]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const commitChange = (updater: (prev: DistributivoData) => DistributivoData) => {
    setData((prev) => {
      setHistory((h) => [...h.slice(-19), prev]);
      return updater(prev);
    });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setData(previous);
    setToast('Cambio deshecho');
  };

  const docenteStats = useMemo(() => computeDocenteStats(data), [data]);
  const cursoStats = useMemo(() => computeCursoStats(data), [data]);
  const issues = useMemo(() => validateDistributivo(data), [data]);

  const totalHorasClase = useMemo(
    () => cursoStats.reduce((sum, c) => sum + c.horasClase, 0),
    [cursoStats]
  );

  const handleUpdateCell = (
    asignaturaId: string,
    cursoId: string,
    horas: number,
    docenteId: string | null
  ) => {
    commitChange((prev) => {
      const nextAsignaciones = { ...prev.asignaciones };
      const key = cellKey(asignaturaId, cursoId);
      if (horas <= 0) {
        delete nextAsignaciones[key];
      } else {
        nextAsignaciones[key] = { horas, docenteId };
      }
      return { ...prev, asignaciones: nextAsignaciones };
    });
  };

  const handleAssignDocenteToGrade = (
    asignaturaId: string,
    grado: string,
    nivel: string,
    docenteId: string | null
  ) => {
    commitChange((prev) => {
      const nextAsignaciones = { ...prev.asignaciones };
      const matchingCursos = prev.cursos.filter(
        (c) => c.grado === grado && c.nivel === nivel
      );
      for (const curso of matchingCursos) {
        const key = cellKey(asignaturaId, curso.id);
        const existing = nextAsignaciones[key];
        if (existing && existing.horas > 0) {
          nextAsignaciones[key] = { ...existing, docenteId };
        }
      }
      return { ...prev, asignaciones: nextAsignaciones };
    });
    setToast(`Docente aplicado a todos los paralelos de ${grado}`);
  };

  const handleUpdateTutor = (cursoId: string, tutorId: string | null) => {
    commitChange((prev) => ({
      ...prev,
      cursos: prev.cursos.map((c) =>
        c.id === cursoId ? { ...c, tutorId } : c
      ),
    }));
  };

  const handleUpdateCoordinador = (cursoId: string, coordinador: string) => {
    setData((prev) => ({
      ...prev,
      cursos: prev.cursos.map((c) =>
        c.id === cursoId ? { ...c, coordinador } : c
      ),
    }));
  };

  const handleSaveDocente = (docente: Docente, isNew: boolean) => {
    commitChange((prev) => ({
      ...prev,
      docentes: isNew
        ? [...prev.docentes, docente]
        : prev.docentes.map((d) => (d.id === docente.id ? docente : d)),
    }));
    setToast(isNew ? `Docente ${docente.nombre} agregado` : `Docente actualizado`);
  };

  const handleDeleteDocente = (docenteId: string) => {
    commitChange((prev) => {
      const nextAsig: typeof prev.asignaciones = {};
      for (const [k, v] of Object.entries(prev.asignaciones)) {
        nextAsig[k] = v.docenteId === docenteId ? { ...v, docenteId: null } : v;
      }
      return {
        ...prev,
        docentes: prev.docentes.filter((d) => d.id !== docenteId),
        cursos: prev.cursos.map((c) =>
          c.tutorId === docenteId ? { ...c, tutorId: null } : c
        ),
        asignaciones: nextAsig,
      };
    });
    if (highlightedDocenteId === docenteId) {
      setHighlightedDocenteId(null);
    }
    setToast('Docente eliminado de la plantilla');
  };

  const handleSaveCurso = (curso: CursoParalelo, isNew: boolean) => {
    commitChange((prev) => ({
      ...prev,
      cursos: isNew
        ? [...prev.cursos, curso]
        : prev.cursos.map((c) => (c.id === curso.id ? curso : c)),
    }));
    setCursoModalState(null);
    setToast(isNew ? `Paralelo ${curso.grado} ${curso.paralelo} agregado` : 'Paralelo actualizado');
  };

  const handleDeleteCurso = (cursoId: string) => {
    commitChange((prev) => {
      const nextAsig = { ...prev.asignaciones };
      for (const key of Object.keys(nextAsig)) {
        if (key.endsWith(`::${cursoId}`)) {
          delete nextAsig[key];
        }
      }
      return {
        ...prev,
        cursos: prev.cursos.filter((c) => c.id !== cursoId),
        asignaciones: nextAsig,
      };
    });
    setCursoModalState(null);
    setToast('Paralelo eliminado');
  };

  const handleSaveAsignatura = (asig: Asignatura, isNew: boolean) => {
    commitChange((prev) => ({
      ...prev,
      asignaturas: isNew
        ? [...prev.asignaturas, asig]
        : prev.asignaturas.map((a) => (a.id === asig.id ? asig : a)),
    }));
    setAsigModalState(null);
    setToast(isNew ? `Asignatura ${asig.nombre} agregada` : 'Asignatura actualizada');
  };

  const handleDeleteAsignatura = (asigId: string) => {
    commitChange((prev) => {
      const nextAsig = { ...prev.asignaciones };
      for (const key of Object.keys(nextAsig)) {
        if (key.startsWith(`${asigId}::`)) {
          delete nextAsig[key];
        }
      }
      return {
        ...prev,
        asignaturas: prev.asignaturas.filter((a) => a.id !== asigId),
        asignaciones: nextAsig,
      };
    });
    setAsigModalState(null);
    setToast('Asignatura eliminada');
  };

  const handleSaveInstitucion = (
    institucion: InstitucionInfo,
    autoridades: Autoridad[]
  ) => {
    commitChange((prev) => ({ ...prev, institucion, autoridades }));
    setShowInstitucionModal(false);
    setToast('Datos institucionales actualizados');
  };

  const handleAutoBalance = () => {
    if (data.docentes.length === 0) return;

    commitChange((prev) => {
      const nextAsig = { ...prev.asignaciones };
      const asigMap = new Map(prev.asignaturas.map((a) => [a.id, a]));

      // Compute current hours per teacher
      const teacherHours = new Map<string, number>();
      const teacherTargets = new Map<string, number>();
      for (const d of prev.docentes) {
        teacherHours.set(d.id, 0);
        teacherTargets.set(d.id, d.horasObjetivo);
      }

      const activeCells: { key: string; horas: number; docenteId: string | null; area: string }[] = [];

      for (const [k, cell] of Object.entries(nextAsig)) {
        if (cell.horas > 0) {
          const [asigId] = k.split('::');
          const area = asigMap.get(asigId)?.area ?? '';
          activeCells.push({ key: k, horas: cell.horas, docenteId: cell.docenteId, area });
          if (cell.docenteId && teacherHours.has(cell.docenteId)) {
            teacherHours.set(cell.docenteId, (teacherHours.get(cell.docenteId) ?? 0) + cell.horas);
          }
        }
      }

      // First assign unassigned cells to teacher with largest remaining capacity
      for (const cell of activeCells) {
        if (!cell.docenteId || !teacherHours.has(cell.docenteId)) {
          const sorted = [...prev.docentes].sort(
            (a, b) =>
              (teacherTargets.get(b.id)! - teacherHours.get(b.id)!) -
              (teacherTargets.get(a.id)! - teacherHours.get(a.id)!)
          );
          const pick = sorted[0];
          if (pick) {
            nextAsig[cell.key] = { horas: cell.horas, docenteId: pick.id };
            cell.docenteId = pick.id;
            teacherHours.set(pick.id, (teacherHours.get(pick.id) ?? 0) + cell.horas);
          }
        }
      }

      // Iteratively move smallest excess cells from overloaded teachers to underloaded teachers
      for (let step = 0; step < 60; step++) {
        const overloaded = prev.docentes
          .filter((d) => teacherHours.get(d.id)! > teacherTargets.get(d.id)!)
          .sort(
            (a, b) =>
              (teacherHours.get(b.id)! - teacherTargets.get(b.id)!) -
              (teacherHours.get(a.id)! - teacherTargets.get(a.id)!)
          );
        const underloaded = prev.docentes
          .filter((d) => teacherHours.get(d.id)! < teacherTargets.get(d.id)!)
          .sort(
            (a, b) =>
              (teacherTargets.get(b.id)! - teacherHours.get(b.id)!) -
              (teacherTargets.get(a.id)! - teacherHours.get(a.id)!)
          );

        if (overloaded.length === 0 || underloaded.length === 0) break;

        const donor = overloaded[0];
        const donorExcess = teacherHours.get(donor.id)! - teacherTargets.get(donor.id)!;
        const receiver = underloaded[0];
        const receiverNeed = teacherTargets.get(receiver.id)! - teacherHours.get(receiver.id)!;

        // Find a cell owned by donor whose hours <= Math.max(donorExcess, receiverNeed)
        const donorCells = activeCells
          .filter((c) => c.docenteId === donor.id)
          .sort((a, b) => a.horas - b.horas);

        const candidate =
          donorCells.find((c) => c.horas <= receiverNeed && c.horas <= donorExcess) ??
          donorCells.find((c) => c.horas <= receiverNeed + 1) ??
          donorCells[0];

        if (!candidate) break;

        // Move candidate from donor to receiver only if it strictly improves global imbalance
        const beforeDiff =
          Math.abs(teacherHours.get(donor.id)! - teacherTargets.get(donor.id)!) +
          Math.abs(teacherHours.get(receiver.id)! - teacherTargets.get(receiver.id)!);

        const afterDonor = teacherHours.get(donor.id)! - candidate.horas;
        const afterReceiver = teacherHours.get(receiver.id)! + candidate.horas;
        const afterDiff =
          Math.abs(afterDonor - teacherTargets.get(donor.id)!) +
          Math.abs(afterReceiver - teacherTargets.get(receiver.id)!);

        if (afterDiff >= beforeDiff) break;

        candidate.docenteId = receiver.id;
        nextAsig[candidate.key] = { horas: candidate.horas, docenteId: receiver.id };
        teacherHours.set(donor.id, afterDonor);
        teacherHours.set(receiver.id, afterReceiver);
      }

      return { ...prev, asignaciones: nextAsig };
    });

    setToast('Carga horaria balanceada automáticamente (puedes deshacer si deseas)');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (validateImportedData(parsed)) {
          commitChange(() => parsed);
          setToast('Distributivo importado correctamente');
        } else {
          setToast('El archivo JSON no tiene el formato de distributivo esperado');
        }
      } catch {
        setToast('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetToBase = () => {
    commitChange(() => createCloneOfInitial());
    setHighlightedDocenteId(null);
    setConfirmReset(false);
    setToast('Plantilla base restaurada según el documento PDF original');
  };

  const handleNavigate = (view: ViewMode, docId?: string | null) => {
    setActiveView(view);
    if (docId !== undefined) {
      setHighlightedDocenteId(docId);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8, single-line controls */}
      <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveView('matriz')}
            className="text-base font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
          >
            Distributivo Docente
          </button>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav className="flex items-center gap-6 overflow-x-auto">
            {(
              [
                { id: 'matriz', label: 'Matriz' },
                { id: 'docentes', label: 'Docentes' },
                {
                  id: 'validacion',
                  label: issues.length > 0 ? `Validación (${issues.length})` : 'Validación',
                },
                { id: 'imprimir', label: 'Imprimir' },
              ] as const
            ).map((tab) => {
              const active = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveView(tab.id)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'border-slate-900 text-slate-900 font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 primary CTA */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => exportDistributivoCSV(data)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar Excel / CSV
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Workspace Context & Utilities Bar */}
      <div className="no-print bg-white border-b border-slate-200">
        <div className="max-w-[1600px] mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">
              {data.institucion.titulo}
            </span>
            <span aria-hidden="true">·</span>
            <span>{data.institucion.subtitulo}</span>
            <span aria-hidden="true">·</span>
            <span>Año Lectivo {data.institucion.periodoLectivo}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-800 font-medium">
              {data.cursos.length} paralelos · {data.docentes.length} docentes · {totalHorasClase}h
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Deshacer
            </button>

            <button
              type="button"
              onClick={() => setShowInstitucionModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap shrink-0"
            >
              <Building2 className="w-3.5 h-3.5" />
              Firmas y encabezado
            </button>

            <button
              type="button"
              onClick={() => exportDistributivoJSON(data)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Guardar JSON
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJSON}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setActiveView('imprimir')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              PDF
            </button>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restaurar PDF base
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5">
        {activeView === 'matriz' && (
          <MatrixView
            data={data}
            docenteStats={docenteStats}
            highlightedDocenteId={highlightedDocenteId}
            onHighlightDocente={setHighlightedDocenteId}
            onUpdateCell={handleUpdateCell}
            onAssignDocenteToGrade={handleAssignDocenteToGrade}
            onUpdateTutor={handleUpdateTutor}
            onUpdateCoordinador={handleUpdateCoordinador}
            onOpenAddCurso={() => setCursoModalState({ curso: null, isNew: true })}
            onEditCurso={(curso) => setCursoModalState({ curso, isNew: false })}
            onOpenAddAsignatura={() => setAsigModalState({ asig: null, isNew: true })}
            onEditAsignatura={(asig) => setAsigModalState({ asig, isNew: false })}
          />
        )}

        {activeView === 'docentes' && (
          <TeachersView
            docenteStats={docenteStats}
            onSaveDocente={handleSaveDocente}
            onDeleteDocente={handleDeleteDocente}
            onInspectInMatrix={(docId) => handleNavigate('matriz', docId)}
          />
        )}

        {activeView === 'validacion' && (
          <ValidationView
            data={data}
            docenteStats={docenteStats}
            cursoStats={cursoStats}
            issues={issues}
            onNavigate={handleNavigate}
            onAutoBalance={handleAutoBalance}
          />
        )}

        {activeView === 'imprimir' && (
          <PrintPreviewView
            data={data}
            onEditInstitucion={() => setShowInstitucionModal(true)}
          />
        )}
      </main>

      {/* Modals */}
      {cursoModalState && (
        <CursoModal
          curso={cursoModalState.curso}
          isNew={cursoModalState.isNew}
          onSave={handleSaveCurso}
          onDelete={handleDeleteCurso}
          onClose={() => setCursoModalState(null)}
        />
      )}

      {asigModalState && (
        <AsignaturaModal
          asignatura={asigModalState.asig}
          isNew={asigModalState.isNew}
          onSave={handleSaveAsignatura}
          onDelete={handleDeleteAsignatura}
          onClose={() => setAsigModalState(null)}
        />
      )}

      {showInstitucionModal && (
        <InstitucionModal
          institucion={data.institucion}
          autoridades={data.autoridades}
          onSave={handleSaveInstitucion}
          onClose={() => setShowInstitucionModal(false)}
        />
      )}

      {confirmReset && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setConfirmReset(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-xl w-full max-w-sm p-5 shadow-xl space-y-4"
          >
            <div>
              <h3 className="text-base font-display font-bold text-slate-900">
                Restaurar plantilla original
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Se restablecerán los 9 paralelos, 9 docentes, asignaturas y cargas horarias tal como figuran en el PDF base. Podrás deshacer este cambio si lo necesitas.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetToBase}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Restaurar plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
