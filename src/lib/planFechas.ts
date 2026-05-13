/** Fecha civil del día N del plan (1 = fecha de inicio). */
export function etiquetaFechaDiaPlan(fechaInicioIso: string | null | undefined, dia: number): string | null {
  if (!fechaInicioIso || !/^\d{4}-\d{2}-\d{2}$/.test(fechaInicioIso)) return null;
  const [y, m, d] = fechaInicioIso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;
  dt.setDate(dt.getDate() + (dia - 1));
  return dt.toLocaleDateString("es", { day: "numeric", month: "short" });
}
