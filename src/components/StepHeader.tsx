import { Link } from "react-router-dom";
import type { PasoRecorridoNum } from "../lib/recorrido";
import { PASOS_RECORRIDO_PRINCIPAL } from "../lib/recorrido";

type Props = {
  pasoActual: PasoRecorridoNum;
  /** Título principal visible bajo la franja de recorrido (ej. «Mi plan alimenticio») */
  titulo: string;
  /** Una línea de contexto; evitar repetir el mismo párrafo largo en cada pantalla */
  subtitulo?: string;
};

const pillBase =
  "inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm";

export function StepHeader({ pasoActual, titulo, subtitulo }: Props) {
  return (
    <header className="space-y-4">
      <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-4 shadow-sm sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800">
          Recorrido guiado · paso {pasoActual} de 3
        </p>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Pasos del recorrido principal">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => {
            const active = p.paso === pasoActual;
            return (
              <Link
                key={p.paso}
                to={p.to}
                className={`${pillBase} ${
                  active
                    ? "bg-emerald-700 text-white shadow-md ring-2 ring-emerald-600/30"
                    : "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
                }`}
                aria-current={active ? "step" : undefined}
              >
                <span className="hidden sm:inline">{p.navDesktop}</span>
                <span className="sm:hidden">{p.navCorto}</span>
              </Link>
            );
          })}
        </nav>
        <p className="mt-3 text-xs leading-relaxed text-slate-600">
          {PASOS_RECORRIDO_PRINCIPAL.find((p) => p.paso === pasoActual)?.descripcionBanner}
        </p>
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-leaf-900 sm:text-3xl">{titulo}</h1>
        {subtitulo ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitulo}</p> : null}
      </div>
    </header>
  );
}
