import { Link } from "react-router-dom";
import type { PasoRecorridoNum } from "../lib/recorrido";
import { PASOS_RECORRIDO_PRINCIPAL } from "../lib/recorrido";
import { perfilGuardadoEnDispositivo } from "../lib/perfilStorage";
import { getMercadoActivoParaPlan } from "../lib/mercadoHistorial";
import { getActivoPerfilId, } from "../lib/perfilStorage";
import { getSnapshotActivoId } from "../lib/cronogramaHistorial";

type Props = {
  pasoActual: PasoRecorridoNum;
  /** Título principal visible bajo la franja de recorrido (ej. «Mi plan alimenticio») */
  titulo: string;
  /** Una línea de contexto; evitar repetir el mismo párrafo largo en cada pantalla */
  subtitulo?: string;
};

const pillBase =
  "inline-flex items-center gap-1.5 justify-center rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 sm:text-sm";

function completadoPaso(paso: PasoRecorridoNum): boolean {
  if (paso === 1) return perfilGuardadoEnDispositivo();
  if (paso === 2) return Boolean(getMercadoActivoParaPlan());
  if (paso === 3) return Boolean(getSnapshotActivoId(getActivoPerfilId()));
  return false;
}

export function StepHeader({ pasoActual, titulo, subtitulo }: Props) {
  return (
    <header className="space-y-4">
      <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-cyan-50/90 px-4 py-4 shadow-md shadow-teal-900/5 backdrop-blur-sm sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-800">
          Paso {pasoActual} de 3
        </p>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label="Pasos del recorrido principal">
          {PASOS_RECORRIDO_PRINCIPAL.map((p) => {
            const active = p.paso === pasoActual;
            const done = !active && completadoPaso(p.paso);
            return (
              <Link
                key={p.paso}
                to={p.to}
                className={`${pillBase} ${
                  active
                    ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-glow-sm ring-2 ring-emerald-400/35"
                    : done
                    ? "border border-emerald-300/90 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-emerald-100"
                    : "border border-emerald-200/90 bg-white/90 text-emerald-900 shadow-sm hover:border-teal-300 hover:bg-white hover:shadow"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {done && <span className="text-emerald-600 text-[11px]">✓</span>}
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-teal-950 sm:text-3xl">{titulo}</h1>
        {subtitulo ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitulo}</p> : null}
      </div>
    </header>
  );
}
