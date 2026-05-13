import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { MARCA_APP } from "../lib/brand";
import { PASO_ASISTENTE, PASOS_RECORRIDO_PRINCIPAL, RUTA_MI_ESPACIO } from "../lib/recorrido";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-leaf-700 text-white shadow" : "text-slate-700 hover:bg-leaf-100"
  }`;

const btnSalirClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50";

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, isConfigured } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-leaf-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
          <NavLink
            to="/"
            className="min-w-0 shrink font-display text-base font-bold leading-tight text-leaf-900 sm:text-lg"
          >
            {MARCA_APP}
          </NavLink>

          <div className="flex min-w-0 items-center justify-end gap-2">
            <div className="flex shrink-0 items-center gap-2 md:hidden">
              {user ? (
                <button type="button" onClick={() => void signOut()} className={btnSalirClass}>
                  Salir
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="rounded-xl bg-leaf-700 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-leaf-900"
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-5 pb-28 sm:px-4 sm:py-6 md:pb-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-leaf-100 bg-white/98 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-between gap-0.5 overflow-x-auto px-1 pt-1.5 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
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
          <div className="pb-1.5 pt-0.5 text-center">
            <span className="text-[10px] text-amber-800">
              Cuenta en la nube opcional ·{" "}
              <NavLink to="/login" className="font-semibold underline">
                configurar
              </NavLink>
            </span>
          </div>
        )}
      </nav>
    </div>
  );
}
