import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { MARCA_APP } from "../lib/brand";
import { PASO_ASISTENTE, PASOS_RECORRIDO_PRINCIPAL, RUTA_MI_ESPACIO } from "../lib/recorrido";
import { SelectorPerfilHeader } from "./SelectorPerfilHeader";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
    isActive
      ? "bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-glow-sm ring-1 ring-white/25"
      : "text-slate-700 hover:bg-white/80 hover:text-teal-900 hover:shadow-sm"
  }`;

const btnSalirClass =
  "rounded-xl border border-slate-200/90 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-teal-200 hover:bg-white hover:shadow";

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, isConfigured } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/75 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-white/65">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `min-w-0 shrink font-display text-base font-bold leading-tight tracking-tight transition sm:text-lg ${
                  isActive ? "text-gradient-brand" : "text-gradient-brand opacity-[0.92] hover:opacity-100"
                }`
              }
            >
              {MARCA_APP}
            </NavLink>
            <SelectorPerfilHeader />
          </div>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {user ? (
                <button type="button" onClick={() => void signOut()} className={btnSalirClass}>
                  Salir
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-md shadow-glow-sm ring-1 ring-white/20 transition hover:brightness-110 active:scale-[0.98] motion-reduce:active:scale-100"
                >
                  Ingresar
                </NavLink>
              )}
            </div>

            <nav className="hidden flex-wrap items-center justify-end gap-0.5 md:flex lg:gap-1">
              <NavLink to={RUTA_MI_ESPACIO} className={linkClass} title="Resumen del recorrido y accesos">
                Resumen
              </NavLink>
              {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
                <NavLink key={p.to} to={p.to} className={linkClass} title={p.descripcionBanner}>
                  {p.navDesktop}
                </NavLink>
              ))}
              <NavLink to="/belleza" className={linkClass}>
                Belleza
              </NavLink>
              <NavLink to={PASO_ASISTENTE.to} className={linkClass}>
                {PASO_ASISTENTE.navDesktop}
              </NavLink>
              {user ? (
                <button type="button" onClick={() => void signOut()} className={btnSalirClass}>
                  Salir
                </button>
              ) : (
                <NavLink to="/login" className={linkClass}>
                  Ingresar
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 pb-28 sm:px-4 sm:py-8 md:pb-10">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="mx-auto max-w-lg rounded-t-2xl border border-white/50 border-b-0 bg-white/85 shadow-dock backdrop-blur-xl">
          <div className="flex justify-between gap-0.5 overflow-x-auto px-1.5 pt-2 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `${linkClass({ isActive })} min-w-[3rem] shrink-0 px-1.5 py-2 text-center text-[10px] leading-tight`
              }
            >
              Inicio
            </NavLink>
            <NavLink
              to={RUTA_MI_ESPACIO}
              className={({ isActive }) =>
                `${linkClass({ isActive })} min-w-[3rem] shrink-0 px-1.5 py-2 text-center text-[10px] leading-tight`
              }
            >
              Resumen
            </NavLink>
            {PASOS_RECORRIDO_PRINCIPAL.map((p) => (
              <NavLink
                key={p.to}
                to={p.to}
                className={({ isActive }) =>
                  `${linkClass({ isActive })} min-w-[3rem] shrink-0 px-1.5 py-2 text-center text-[10px] leading-tight`
                }
              >
                {p.navCorto}
              </NavLink>
            ))}
            <NavLink
              to={PASO_ASISTENTE.to}
              className={({ isActive }) =>
                `${linkClass({ isActive })} min-w-[3rem] shrink-0 px-1.5 py-2 text-center text-[10px] leading-tight`
              }
            >
              {PASO_ASISTENTE.navCorto}
            </NavLink>
          </div>
          {!isConfigured && (
            <div className="border-t border-teal-100/60 px-2 pb-2 pt-1 text-center">
              <span className="text-[10px] text-amber-800">
                Cuenta en la nube opcional ·{" "}
                <NavLink to="/login" className="font-semibold underline decoration-teal-600/50">
                  configurar
                </NavLink>
              </span>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
