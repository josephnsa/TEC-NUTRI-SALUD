/** Separa ingredientes y pasos del texto de receta generado por IA. */
export function parseRecetaDetalle(receta: string): { ingredientes: string; pasos: string } {
  const r = receta.trim();
  if (!r) return { ingredientes: "", pasos: "" };

  const pasosMatch = /·\s*Pasos\s*:\s*/i.exec(r);
  if (pasosMatch && pasosMatch.index != null) {
    const antes = r.slice(0, pasosMatch.index).trim();
    const pasos = r.slice(pasosMatch.index + pasosMatch[0].length).trim();
    const ingredientes = antes.replace(/^Ingredientes\s*\([^)]*\)\s*:\s*/i, "").trim();
    return { ingredientes, pasos };
  }

  const soloIng = /^Ingredientes\s*\([^)]*\)\s*:\s*/i.exec(r);
  if (soloIng) {
    return { ingredientes: r.slice(soloIng[0].length).trim(), pasos: "" };
  }

  return { ingredientes: r, pasos: "" };
}
