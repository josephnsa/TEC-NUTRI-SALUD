/**
 * Utilidades para exportar datos como PDF mediante la ventana de impresión del navegador.
 * Sin dependencias externas; el usuario imprime/guarda como PDF desde el diálogo del navegador.
 */
import type { ListaItem } from "./ketoMercado";
import { labelDieta, CATEGORIA_LABELS, type ComidaDia, type DiaPlan, type PlatoReceta } from "./nutritionPlan";
import { imagenUrlParaPlato } from "./platoImagen";
import { parseRecetaDetalle } from "./recetaTexto";

const ESTILOS_BASE = `
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a202c; margin: 0; padding: 20px; }
  h1 { font-size: 20px; font-weight: 700; color: #065f46; margin-bottom: 4px; }
  h2 { font-size: 15px; font-weight: 600; color: #047857; margin: 18px 0 6px; border-bottom: 1.5px solid #d1fae5; padding-bottom: 4px; }
  h3 { font-size: 13px; font-weight: 600; color: #1a202c; margin: 10px 0 3px; }
  .meta { font-size: 11px; color: #6b7280; margin-bottom: 16px; }
  table { border-collapse: collapse; width: 100%; margin-top: 6px; font-size: 12px; }
  th { background: #d1fae5; color: #065f46; font-weight: 600; text-align: left; padding: 6px 8px; border: 1px solid #a7f3d0; }
  td { padding: 5px 8px; border: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f0fdf4; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
  .badge-ok { background: #d1fae5; color: #065f46; }
  .badge-no { background: #f3f4f6; color: #6b7280; }
  .badge-ia { background: #ede9fe; color: #5b21b6; }
  .badge-cat { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
  .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  .day-card { margin-bottom: 16px; page-break-inside: avoid; }
  .meal-row { display: flex; gap: 6px; align-items: baseline; margin-bottom: 3px; }
  .meal-label { font-weight: 600; font-size: 11px; color: #047857; min-width: 80px; }
  .meal-title { font-size: 12px; }
  .meal-detail { font-size: 11px; color: #6b7280; margin-left: 86px; line-height: 1.5; }
  .meal-pasos { font-size: 11px; color: #374151; margin: 6px 0 0 86px; line-height: 1.55; }
  .meal-img { width: 120px; height: 90px; object-fit: cover; border-radius: 8px; border: 1px solid #d1fae5; float: right; margin: 0 0 8px 12px; }
  .meal-img-ph { width: 120px; height: 90px; border-radius: 8px; border: 1px dashed #a7f3d0; background: #f0fdf4; display: flex; align-items: center; justify-content: center; font-size: 28px; float: right; margin: 0 0 8px 12px; }
  .macros { font-size: 11px; color: #374151; background: #f0fdf4; border: 1px solid #d1fae5; border-radius: 4px; padding: 4px 8px; display: inline-block; margin-top: 4px; }
  @media print {
    body { padding: 0; }
    button { display: none; }
  }
`;

function abrirVentanaImpresion(html: string, titulo: string) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("No se pudo abrir la ventana de impresión. Permite ventanas emergentes para este sitio.");
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo}</title>
  <style>${ESTILOS_BASE}</style>
</head>
<body>
  ${html}
  <script>
    window.onload = function() {
      document.querySelectorAll('button').forEach(b => b.addEventListener('click', () => window.print()));
    };
  <\/script>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function labelCategoria(cat: string): string {
  return CATEGORIA_LABELS[cat] ?? cat;
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF: Lista de compras / mercado
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcionesMercadoPdf {
  items: ListaItem[];
  dias: number;
  personas: number;
  nombrePerfil?: string;
  estiloDieta?: string;
}

export function exportarMercadoPdf({ items, dias, personas, nombrePerfil, estiloDieta }: OpcionesMercadoPdf) {
  const fechaGen = new Date().toLocaleDateString("es", { dateStyle: "long" });
  const comprados = items.filter((i) => i.comprado).length;

  // Agrupar por categoría
  const grupos = new Map<string, ListaItem[]>();
  for (const it of items) {
    const g = grupos.get(it.categoria) ?? [];
    g.push(it);
    grupos.set(it.categoria, g);
  }

  let filas = "";
  grupos.forEach((lista, cat) => {
    filas += `<tr><td colspan="5" style="background:#ecfdf5;font-weight:600;color:#065f46;font-size:11px;padding:4px 8px">${labelCategoria(cat)}</td></tr>`;
    lista.forEach((it) => {
      const nombre = it.nombreCustom?.trim() || it.nombre;
      const origenBadge =
        it.origen === "ia"
          ? `<span class="badge badge-ia">IA</span>`
          : it.origen === "manual"
            ? `<span class="badge" style="background:#fef3c7;color:#92400e">Manual</span>`
            : "";
      const compradoBadge = it.comprado
        ? `<span class="badge badge-ok">✓ Comprado</span>`
        : `<span class="badge badge-no">Pendiente</span>`;
      const notaHtml = it.nota ? `<br><span style="font-size:10px;color:#9ca3af">${it.nota}</span>` : "";
      filas += `<tr>
        <td>${nombre}${notaHtml}</td>
        <td>${it.cantidad}</td>
        <td>${it.unidad}</td>
        <td>${compradoBadge}</td>
        <td>${origenBadge}</td>
      </tr>`;
    });
  });

  const html = `
    <h1>🛒 Lista de compras</h1>
    <div class="meta">
      ${nombrePerfil ? `<strong>${nombrePerfil}</strong> · ` : ""}
      Dieta: ${labelDieta(estiloDieta)} · ${dias} días · ${personas} persona${personas !== 1 ? "s" : ""} · ${comprados}/${items.length} ítems comprados
      <br>Generado el ${fechaGen} · TEC NutriSalud
    </div>
    <table>
      <thead>
        <tr>
          <th>Alimento</th>
          <th>Cantidad</th>
          <th>Unidad</th>
          <th>Estado</th>
          <th>Origen</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>
    <div style="margin-top:10px;font-size:12px">
      <strong>Progreso: ${comprados} de ${items.length} ítems comprados</strong>
    </div>
    <div class="footer">Lista generada automáticamente · TEC NutriSalud · ${fechaGen}</div>
    <div style="margin-top:12px;text-align:center">
      <button onclick="window.print()" style="padding:8px 20px;background:#065f46;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>
  `;

  abrirVentanaImpresion(html, `Lista de compras · ${nombrePerfil ?? "NutriSalud"}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF: Cronograma / menú semanal
// ─────────────────────────────────────────────────────────────────────────────

export interface OpcionesCronogramaPdf {
  diasPlan: DiaPlan[];
  nombrePlan?: string;
  nombrePerfil?: string;
  estiloDieta?: string;
  presupuestoKcal?: number | null;
  fechaInicio?: string | null;
}

function truncarTexto(txt: string, max: number): string {
  return txt.length > max ? txt.slice(0, max) + "…" : txt;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function exportarCronogramaPdf({
  diasPlan,
  nombrePlan,
  nombrePerfil,
  estiloDieta,
  presupuestoKcal,
  fechaInicio
}: OpcionesCronogramaPdf) {
  const fechaGen = new Date().toLocaleDateString("es", { dateStyle: "long" });

  const SLOTS: Array<{ key: keyof ComidaDia; label: string }> = [
    { key: "desayuno", label: "Desayuno" },
    { key: "almuerzo", label: "Almuerzo" },
    { key: "cena", label: "Cena" }
  ];

  async function renderSlot(label: string, plato: PlatoReceta): Promise<string> {
    const { ingredientes: ingredientesLineas, pasos } = parseRecetaDetalle(plato.receta);
    const imgUrl = await imagenUrlParaPlato(plato);
    const imgHtml = imgUrl
      ? `<img class="meal-img" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(plato.titulo)}" />`
      : `<div class="meal-img-ph" aria-hidden="true">🍽️</div>`;
    const macrosInline =
      plato.kcal_estimate != null
        ? `<span class="macros">${plato.kcal_estimate} kcal · P ${plato.protein_g ?? "?"}g · G ${plato.fat_g ?? "?"}g · C ${plato.carb_g ?? "?"}g</span>`
        : "";
    return `
      <div style="margin-bottom:12px;page-break-inside:avoid;overflow:hidden">
        ${imgHtml}
        <div class="meal-row">
          <span class="meal-label">${label}</span>
          <span class="meal-title"><strong>${escapeHtml(plato.titulo)}</strong></span>
        </div>
        ${
          ingredientesLineas
            ? `<div class="meal-detail"><strong>Ingredientes:</strong> ${escapeHtml(truncarTexto(ingredientesLineas, 520))}</div>`
            : ""
        }
        ${
          pasos
            ? `<div class="meal-pasos"><strong>Pasos:</strong> ${escapeHtml(truncarTexto(pasos, 680))}</div>`
            : ""
        }
        ${macrosInline ? `<div style="margin-left:86px;margin-top:6px;clear:both">${macrosInline}</div>` : ""}
      </div>`;
  }

  let diasHtml = "";
  for (let idx = 0; idx < diasPlan.length; idx++) {
    const dia = diasPlan[idx];
    let fechaDia = "";
    if (fechaInicio) {
      const f = new Date(fechaInicio);
      f.setDate(f.getDate() + idx);
      fechaDia = f.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "short" });
    }

    const slots = SLOTS.map((s) => dia.comidas[s.key]);
    const totalKcal = slots.reduce((sum, p) => sum + (p.kcal_estimate ?? 0), 0);
    const totalProt = slots.reduce((sum, p) => sum + (p.protein_g ?? 0), 0);
    const totalGrasa = slots.reduce((sum, p) => sum + (p.fat_g ?? 0), 0);
    const totalCarb = slots.reduce((sum, p) => sum + (p.carb_g ?? 0), 0);

    let comidasHtml = "";
    for (const s of SLOTS) {
      comidasHtml += await renderSlot(s.label, dia.comidas[s.key]);
    }

    const resumenKcal = totalKcal > 0 ? `${totalKcal} kcal · P ${Math.round(totalProt)}g · G ${Math.round(totalGrasa)}g · C ${Math.round(totalCarb)}g` : "";
    const metaKcal =
      presupuestoKcal && totalKcal > 0
        ? ` · ${Math.round((totalKcal / presupuestoKcal) * 100)}% del objetivo`
        : "";

    diasHtml += `
      <div class="day-card">
        <h2>Día ${dia.dia}${fechaDia ? ` · ${fechaDia}` : ""}</h2>
        ${resumenKcal ? `<div style="font-size:11px;color:#047857;margin-bottom:6px">${resumenKcal}${metaKcal}</div>` : ""}
        ${comidasHtml}
      </div>`;
  }

  const avgKcal =
    diasPlan.length > 0
      ? Math.round(
          diasPlan.reduce(
            (s, d) =>
              s +
              SLOTS.reduce((ss, sl) => ss + (d.comidas[sl.key].kcal_estimate ?? 0), 0),
            0
          ) / diasPlan.length
        )
      : 0;

  const html = `
    <h1>📅 ${nombrePlan ?? "Cronograma semanal"}</h1>
    <div class="meta">
      ${nombrePerfil ? `<strong>${nombrePerfil}</strong> · ` : ""}
      Dieta: ${labelDieta(estiloDieta)} · ${diasPlan.length} días
      ${presupuestoKcal ? ` · Objetivo: ${presupuestoKcal} kcal/día` : ""}
      ${avgKcal > 0 ? ` · Promedio plan: ${avgKcal} kcal/día` : ""}
      <br>Generado el ${fechaGen} · TEC NutriSalud
    </div>
    ${diasHtml}
    <div class="footer">Plan generado con TEC NutriSalud · ${fechaGen}</div>
    <div style="margin-top:12px;text-align:center">
      <button onclick="window.print()" style="padding:8px 20px;background:#065f46;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px">
        🖨️ Imprimir / Guardar como PDF
      </button>
    </div>
  `;

  abrirVentanaImpresion(html, `Cronograma · ${nombrePerfil ?? "NutriSalud"}`);
}
