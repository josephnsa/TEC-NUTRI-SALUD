function parseYmdLocal(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

export function toYmdLocal(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fecha civil del día N del plan (1 = fecha de inicio). */
export function etiquetaFechaDiaPlan(fechaInicioIso: string | null | undefined, dia: number): string | null {
  const base = parseYmdLocal(fechaInicioIso ?? "");
  if (!base) return null;
  const dt = new Date(base);
  dt.setDate(dt.getDate() + (dia - 1));
  return dt.toLocaleDateString("es", { day: "numeric", month: "short" });
}

/** ISO YYYY-MM-DD del día N (1 = inicio del plan). */
export function fechaIsoParaDiaN(fechaInicioIso: string, dia: number): string | null {
  const base = parseYmdLocal(fechaInicioIso);
  if (!base) return null;
  const dt = new Date(base);
  dt.setDate(dt.getDate() + (dia - 1));
  return toYmdLocal(dt);
}

/**
 * Fecha base para numerar días del cronograma: `fechaInicioPlan` del miembro o
 * `fallbackIso` (p. ej. hoy al guardar snapshot).
 */
export function fechaInicioEfectivaParaDias(
  fechaInicioPlan: string | null | undefined,
  fallbackIso?: string
): string {
  if (fechaInicioPlan && /^\d{4}-\d{2}-\d{2}$/.test(fechaInicioPlan)) return fechaInicioPlan;
  const fb = fallbackIso && /^\d{4}-\d{2}-\d{2}$/.test(fallbackIso) ? fallbackIso : new Date().toISOString().slice(0, 10);
  return fb;
}
