import React, { useMemo } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Scale,
  XCircle,
} from 'lucide-react';
import {
  CursoStats,
  DistributivoData,
  DocenteStats,
  ValidationIssue,
  ViewMode,
} from '../types/distributivo';
import { cellKey, getContrastTextColor } from '../data/initialDistributivo';

interface ValidationViewProps {
  data: DistributivoData;
  docenteStats: DocenteStats[];
  cursoStats: CursoStats[];
  issues: ValidationIssue[];
  onNavigate: (view: ViewMode, highlightDocenteId?: string | null) => void;
  onAutoBalance: () => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  data,
  docenteStats,
  cursoStats,
  issues,
  onNavigate,
  onAutoBalance,
}) => {
  const totalHorasClase = cursoStats.reduce((s, c) => s + c.horasClase, 0);
  const totalHorasDocente = cursoStats.reduce((s, c) => s + c.horasDocente, 0);
  const horasSinAsignar = totalHorasClase - totalHorasDocente;

  const areaBreakdown = useMemo(() => {
    const map = new Map<string, { area: string; color: string; horas: number; asignadas: number }>();
    for (const asig of data.asignaturas) {
      if (!map.has(asig.area)) {
        map.set(asig.area, {
          area: asig.area,
          color: asig.areaColor,
          horas: 0,
          asignadas: 0,
        });
      }
      const entry = map.get(asig.area)!;
      for (const curso of data.cursos) {
        const celda = data.asignaciones[cellKey(asig.id, curso.id)];
        if (celda && celda.horas > 0) {
          entry.horas += celda.horas;
          if (celda.docenteId) {
            entry.asignadas += celda.horas;
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.horas - a.horas);
  }, [data]);

  const errorsCount = issues.filter((i) => i.severidad === 'error').length;
  const warningsCount = issues.filter((i) => i.severidad === 'warning').length;

  return (
    <div className="space-y-6">
      {/* Top KPI Strip (clean single-elevation cells with hairline dividers) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Paralelos activos</div>
          <div className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-1">
            {data.cursos.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {data.docentes.length} docentes en plantilla
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500">Total horas clase</div>
          <div className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-1">
            {totalHorasClase}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {totalHorasDocente}h cubiertas por docentes
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500">Horas sin docente</div>
          <div
            className={`text-2xl font-display font-bold tabular-nums mt-1 ${
              horasSinAsignar > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {horasSinAsignar}h
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {horasSinAsignar === 0 ? 'Cobertura al 100%' : 'Requiere asignación'}
          </div>
        </div>

        <div className="p-4">
          <div className="text-xs text-slate-500">Observaciones detectadas</div>
          <div className="text-2xl font-display font-bold text-slate-900 tabular-nums mt-1">
            {issues.length}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {errorsCount} críticas · {warningsCount} advertencias
          </div>
        </div>
      </div>

      {/* Two-Column Diagnostic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Actionable Observations */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-display font-bold text-slate-900">
                Auditoría de Distributivo
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Validación automática de metas horarias, tutorías y cobertura de malla.
              </p>
            </div>
            <button
              type="button"
              onClick={onAutoBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Scale className="w-3.5 h-3.5" />
              Balancear carga equitativa
            </button>
          </div>

          {issues.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-sm font-display font-bold text-slate-900">
                Distributivo completamente equilibrado
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Todas las asignaturas tienen docente asignado, los paralelos cumplen su carga horaria y todos los docentes están dentro de su meta semanal.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 max-h-[540px] overflow-y-auto">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="px-5 py-3.5 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {issue.severidad === 'error' ? (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900">
                        {issue.titulo}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {issue.detalle}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(issue.targetView, issue.docenteId ?? null)
                    }
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-950 whitespace-nowrap shrink-0 py-1 px-2 rounded hover:bg-slate-100"
                  >
                    Revisar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Teacher Balance Bars + Area Distribution */}
        <div className="lg:col-span-5 space-y-6">
          {/* Teacher Workload Distribution */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-bold text-slate-900 mb-1">
              Comparativa de carga docente
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Horas asignadas frente a la meta semanal de cada docente.
            </p>
            <div className="space-y-3">
              {docenteStats.map((ds) => {
                const maxScale = Math.max(
                  35,
                  ...docenteStats.map((s) => Math.max(s.horasAsignadas, s.docente.horasObjetivo))
                );
                const widthPct = Math.round((ds.horasAsignadas / maxScale) * 100);
                const targetPct = Math.round((ds.docente.horasObjetivo / maxScale) * 100);
                const fg = getContrastTextColor(ds.docente.color);

                return (
                  <div key={ds.docente.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onNavigate('matriz', ds.docente.id)}
                        className="flex items-center gap-2 font-medium text-slate-800 hover:underline truncate"
                      >
                        <span
                          className="w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-mono font-bold shrink-0"
                          style={{ backgroundColor: ds.docente.color, color: fg }}
                        >
                          {ds.docente.siglas}
                        </span>
                        <span className="truncate">{ds.docente.nombre}</span>
                      </button>
                      <span
                        className={`font-mono tabular-nums font-semibold shrink-0 ml-2 ${
                          ds.estado === 'sobrecarga'
                            ? 'text-red-700'
                            : ds.estado === 'subcarga'
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {ds.horasAsignadas} / {ds.docente.horasObjetivo}h
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-slate-100 rounded-xs overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${widthPct}%`,
                          backgroundColor: ds.docente.color,
                        }}
                      />
                      <div
                        title={`Meta: ${ds.docente.horasObjetivo}h`}
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70"
                        style={{ left: `${targetPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Area Distribution */}
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <h3 className="text-sm font-display font-bold text-slate-900 mb-3">
              Distribución por área académica
            </h3>
            <div className="divide-y divide-slate-100">
              {areaBreakdown.map((item) => (
                <div
                  key={item.area}
                  className="py-2 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-xs border border-black/10 shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-slate-800 font-medium truncate">
                      {item.area}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                    {item.asignadas}/{item.horas}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
