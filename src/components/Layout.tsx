import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-xl px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-leaf-700 text-white shadow" : "text-slate-700 hover:bg-leaf-100"
  }`;

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut, isConfigured } = useAuth();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-40 border-b border-leaf-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="font-display text-lg font-bold text-leaf-900">
            TEC Nutri Salud
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/keto-mercado" className={linkClass}>
              Mercado keto
            </NavLink>
            <NavLink to="/belleza" className={linkClass}>
              Belleza
            </NavLink>
            <NavLink to="/mi-plan" className={linkClass}>
              Mi plan
            </NavLink>
            <NavLink to="/cronograma" className={linkClass}>
              Cronograma
            </NavLink>
            <NavLink to="/agente" className={linkClass}>
              Asistente
            </NavLink>
            {user ? (
              <button
                type="button"
                onClick={() => void signOut()}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Salir
              </button>
            ) : (
              <NavLink to="/login" className={linkClass}>
                Entrar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-leaf-100 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg justify-center gap-0.5 overflow-x-auto px-1">
          <NavLink
            to="/"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/keto-mercado"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            Keto
          </NavLink>
          <NavLink
            to="/belleza"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            Tips
          </NavLink>
          <NavLink
            to="/mi-plan"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            Plan
          </NavLink>
          <NavLink
            to="/cronograma"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            Crono
          </NavLink>
          <NavLink
            to="/agente"
            className={({ isActive }) => `${linkClass({ isActive })} min-w-[3.25rem] shrink-0 px-2 py-2 text-center text-[11px]`}
          >
            IA
          </NavLink>
        </div>
        {!user && (
          <div className="mt-1 text-center">
            <NavLink to="/login" className="text-xs text-leaf-700 underline">
              Cuenta
            </NavLink>
            {!isConfigured && (
              <span className="ml-2 text-[10px] text-amber-700">Supabase opcional</span>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
