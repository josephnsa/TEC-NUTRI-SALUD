/** Pantalla breve mientras se procesa el retorno de Google/OAuth (evita flash 404). */
export function AuthCallback() {
  return (
    <div className="ui-card mx-auto max-w-md py-12 text-center text-sm text-slate-600">
      <p className="font-medium text-teal-950">Completando acceso…</p>
      <p className="mt-2 text-xs">Un momento, estamos conectando tu cuenta.</p>
    </div>
  );
}
