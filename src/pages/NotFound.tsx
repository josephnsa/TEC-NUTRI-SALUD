import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-2">
        <p className="font-mono text-6xl font-bold text-teal-200">404</p>
        <h1 className="font-display text-2xl font-bold text-teal-950">Página no encontrada</h1>
        <p className="max-w-sm text-sm text-slate-600">
          La ruta que buscas no existe. Usa la navegación de arriba o vuelve al inicio.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/" className="ui-btn-primary px-5 py-2.5">
          Ir al inicio
        </Link>
        <Link to="/cronograma" className="ui-btn-secondary px-5 py-2.5">
          Mi cronograma
        </Link>
      </div>
    </div>
  );
}
