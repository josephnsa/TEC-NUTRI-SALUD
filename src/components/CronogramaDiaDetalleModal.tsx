import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  sumarMacrosComidaDia,
  sumarMacrosPlatoSlot,
  youtubeBusquedaPlato,
  type PerfilUsuario,
  type PlatoReceta
} from "../lib/nutritionPlan";
import { RecipeVideoEmbedSafe } from "./RecipeVideoEmbed";
import type { DiaPlanConFecha } from "../lib/cronogramaHistorial";
import {
  ETIQUETAS_PROGRESO_DIA,
  MEDIA_SLOT_LABEL,
  SLOTS_ORDEN_MEDIA,
  addDiaMedia,
  getDiaAdjuntosRecord,
  removeDiaMedia,
  setDiaMediaRemotePath,
  updateDiaMeta,
  updateDiaProgress,
  type DiaAdjuntosRecord,
  type MediaSlot,
  type SeguimientoPlanDia
} from "../lib/diaAdjuntosIDB";
import { eliminarEvidenciaRemota, subirEvidenciaBlob } from "../lib/mediaRemoteStorage";
import { useAuth } from "../context/AuthContext";

type MacrosSlot = ReturnType<typeof sumarMacrosPlatoSlot>;

function CopyButton({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copiar = () => {
    void navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar receta"
      className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-semibold transition ${
        copiado
          ? "border-emerald-300/80 bg-emerald-50 text-emerald-800"
          : "border-slate-200/80 bg-white/90 text-slate-500 hover:border-teal-300 hover:text-teal-800"
      }`}
    >
      {copiado ? "¡Copiado!" : "Copiar"}
    </button>
  );
}

function MacrosPorComidaDistribuidos({
  etiquetaPrincipal,
  totales,
  textoExtra
}: {
  etiquetaPrincipal: string;
  totales: MacrosSlot;
  textoExtra?: string | null;
}) {
  const { kcal, proteinG, fatG, carbG, fiberG } = totales;
  const muestra =
    kcal > 0 || proteinG > 0 || fatG > 0 || carbG > 0 || fiberG > 0;
  if (!muestra) return null;

  const chip =
    "motion-safe:transition motion-safe:hover:shadow-md flex min-w-[4.75rem] flex-1 flex-col items-center justify-center rounded-xl border px-2.5 py-2 text-teal-950 shadow-sm backdrop-blur-sm sm:min-w-[5rem]";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">{etiquetaPrincipal}</p>
        {textoExtra ? <p className="text-[10px] font-medium tabular-nums text-slate-500">{textoExtra}</p> : null}
      </div>
      <div className="motion-safe:animate-fade-up flex flex-wrap gap-2">
        {kcal > 0 ? (
          <div
            className={`${chip} border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/40`}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900/85">Calorías</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-amber-950">~{Math.round(kcal)}</span>
            <span className="text-[9px] text-amber-800/90">kcal</span>
          </div>
        ) : null}
        {proteinG > 0 ? (
          <div className={`${chip} border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40`}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-sky-900/85">Proteína</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-sky-950">{proteinG.toFixed(1)}</span>
            <span className="text-[9px] text-sky-800/90">g</span>
          </div>
        ) : null}
        {fatG > 0 ? (
          <div className={`${chip} border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30`}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-violet-900/85">Grasa</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-violet-950">{fatG.toFixed(1)}</span>
            <span className="text-[9px] text-violet-800/90">g</span>
          </div>
        ) : null}
        {carbG > 0 ? (
          <div className={`${chip} border-emerald-300/85 bg-gradient-to-br from-emerald-50 via-white to-teal-50/35`}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-900/85">Carbos</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-emerald-950">{carbG.toFixed(1)}</span>
            <span className="text-[9px] text-emerald-800/90">g</span>
          </div>
        ) : null}
        {fiberG > 0 ? (
          <div className={`${chip} border-lime-200/90 bg-gradient-to-br from-lime-50/90 via-white to-green-50/25`}>
            <span className="text-[9px] font-bold uppercase tracking-wider text-lime-900/85">Fibra</span>
            <span className="font-mono text-[15px] font-bold tabular-nums text-lime-950">{fiberG.toFixed(1)}</span>
            <span className="text-[9px] text-lime-800/90">g</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EtiquetaPorciones(plato: PlatoReceta): string | null {
  const p =
    typeof plato.porciones === "number" && Number.isFinite(plato.porciones) ? Math.round(plato.porciones) : 1;
  if (p <= 1) return "1 porción (orientativo)";
  return `${p} porciones (orientativo)`;
}

type TabId = "plan" | "registro" | "progreso";

type Props = {
  open: boolean;
  onClose: () => void;
  dia: DiaPlanConFecha | null;
  /** Si se pasan todos los días del plan se activan los botones ◀ ▶ de navegación. */
  dias?: DiaPlanConFecha[];
  onNavDia?: (dia: DiaPlanConFecha) => void;
  perfilId: string | null;
  perfil: PerfilUsuario;
  /** Referencia orientativa para comparar suma del día (~kcal IA). */
  presupuestoKcalDiario?: number | null;
};

export function CronogramaDiaDetalleModal({
  open,
  onClose,
  dia,
  dias,
  onNavDia,
  perfilId,
  perfil,
  presupuestoKcalDiario = null
}: Props) {
  const { user, isConfigured } = useAuth();
  const [tab, setTab] = useState<TabId>("plan");
  const [record, setRecord] = useState<DiaAdjuntosRecord | null>(null);
  const [cargando, setCargando] = useState(false);
  const [notaDraft, setNotaDraft] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  /** Solo si falló la copia en la cuenta (las fotos siguen en el dispositivo). */
  const [avisoCopiaCuenta, setAvisoCopiaCuenta] = useState<string | null>(null);

  const fechaIso = dia?.fecha ?? null;

  const diaIdx = dias && dia ? dias.findIndex((d) => d.dia === dia.dia) : -1;
  const diaAnterior = diaIdx > 0 && dias ? dias[diaIdx - 1]! : null;
  const diaSiguiente = diaIdx >= 0 && dias && diaIdx < dias.length - 1 ? dias[diaIdx + 1]! : null;

  const recargar = useCallback(async () => {
    if (!perfilId || !fechaIso) {
      setRecord(null);
      return;
    }
    setCargando(true);
    const r = await getDiaAdjuntosRecord(perfilId, fechaIso);
    setRecord(r);
    setCargando(false);
  }, [perfilId, fechaIso]);

  useEffect(() => {
    if (!open) return;
    void recargar();
    setTab("plan");
    setAvisoCopiaCuenta(null);
  }, [open, recargar]);

  useEffect(() => {
    if (record) setNotaDraft(record.nota);
  }, [record?.nota, fechaIso]);

  const [urlsPorId, setUrlsPorId] = useState<Record<string, string>>({});
  const [gridUrlsPorId, setGridUrlsPorId] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!record?.medias?.length) {
      setUrlsPorId({});
      setGridUrlsPorId({});
      return;
    }
    const full: Record<string, string> = {};
    const grid: Record<string, string> = {};
    for (const m of record.medias) {
      full[m.id] = URL.createObjectURL(m.blob);
      if (m.kind === "image") {
        grid[m.id] = m.thumbBlob ? URL.createObjectURL(m.thumbBlob) : full[m.id];
      } else {
        grid[m.id] = full[m.id];
      }
    }
    setUrlsPorId(full);
    setGridUrlsPorId(grid);
    return () => {
      const seen = new Set<string>();
      for (const u of Object.values(full)) {
        if (!seen.has(u)) {
          seen.add(u);
          URL.revokeObjectURL(u);
        }
      }
      for (const u of Object.values(grid)) {
        if (!seen.has(u)) {
          seen.add(u);
          URL.revokeObjectURL(u);
        }
      }
    };
  }, [record?.medias]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxUrl) {
          setLightboxUrl(null);
        } else {
          onClose();
        }
      }
      if (!lightboxUrl && onNavDia) {
        if (e.key === "ArrowLeft" && diaAnterior) onNavDia(diaAnterior);
        if (e.key === "ArrowRight" && diaSiguiente) onNavDia(diaSiguiente);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, lightboxUrl, onClose, onNavDia, diaAnterior, diaSiguiente]);

  if (!open || !dia || !fechaIso) return null;

  const totalDia = sumarMacrosComidaDia(dia.comidas);
  const hayMacrosIa =
    totalDia.kcal > 0 ||
    totalDia.proteinG > 0 ||
    totalDia.fatG > 0 ||
    totalDia.carbG > 0 ||
    totalDia.fiberG > 0;
  const deltaPresupuesto =
    presupuestoKcalDiario != null && hayMacrosIa ? presupuestoKcalDiario - totalDia.kcal : null;

  const progress = record?.progress ?? ETIQUETAS_PROGRESO_DIA.map(() => false);
  const seguimiento = record?.seguimientoPlan ?? null;

  const toggleProgress = async (idx: number) => {
    if (!perfilId) return;
    const next = [...progress];
    next[idx] = !next[idx];
    await updateDiaProgress(perfilId, fechaIso, next);
    await recargar();
  };

  const onFiles = async (files: FileList | null, soloImagen: boolean, slot: MediaSlot) => {
    if (!perfilId || !fechaIso || !files?.length) return;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (soloImagen && !f.type.startsWith("image/")) continue;
      if (!soloImagen && !f.type.startsWith("video/")) continue;
      const newId = await addDiaMedia(perfilId, fechaIso, f, slot);
      if (newId && user?.id && isConfigured) {
        const mime = f.type || (f.name.toLowerCase().endsWith(".mp4") ? "video/mp4" : "image/jpeg");
        const path = await subirEvidenciaBlob(user.id, perfilId, fechaIso, slot, newId, f, mime);
        if (path) {
          await setDiaMediaRemotePath(perfilId, fechaIso, newId, path);
          setAvisoCopiaCuenta(null);
        } else {
          setAvisoCopiaCuenta(
            "No se pudo guardar la copia en tu cuenta (sigue en este dispositivo). Revisa la conexión o el tamaño del archivo."
          );
        }
      }
    }
    await recargar();
  };

  const quitarMedia = async (mediaId: string) => {
    if (!perfilId || !fechaIso) return;
    const recActual = await getDiaAdjuntosRecord(perfilId, fechaIso);
    const mediaAEliminar = recActual?.medias.find((m) => m.id === mediaId);
    if (mediaAEliminar?.remotePath && user?.id && isConfigured) {
      await eliminarEvidenciaRemota(mediaAEliminar.remotePath);
    }
    await removeDiaMedia(perfilId, fechaIso, mediaId);
    await recargar();
  };

  const guardarNota = async () => {
    if (!perfilId) return;
    await updateDiaMeta(perfilId, fechaIso, { nota: notaDraft });
    await recargar();
  };

  const setSeguimiento = async (v: SeguimientoPlanDia | null) => {
    if (!perfilId) return;
    await updateDiaMeta(perfilId, fechaIso, { seguimientoPlan: v });
    await recargar();
  };

  const tabBtn = (id: TabId, label: string) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={
        tab === id
          ? "flex-1 rounded-lg bg-teal-600 px-2 py-2 text-xs font-semibold text-white shadow-sm"
          : "flex-1 rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-emerald-50"
      }
    >
      {label}
    </button>
  );

  return (
    <>
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          role="presentation"
          onClick={() => setLightboxUrl(null)}
        >
          <img
            src={lightboxUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-slate-800 shadow"
            onClick={() => setLightboxUrl(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cronograma-dia-titulo"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-emerald-200/80 bg-white shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-emerald-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-2">
              {onNavDia && diaAnterior && (
                <button
                  type="button"
                  aria-label="Día anterior"
                  onClick={() => onNavDia(diaAnterior)}
                  className="rounded-lg border border-slate-200/80 bg-white/90 px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-800"
                >
                  ◀
                </button>
              )}
              <h2 id="cronograma-dia-titulo" className="min-w-0 truncate font-display text-base font-semibold text-teal-950">
                Día {dia.dia} · {dia.fecha}
              </h2>
              {onNavDia && diaSiguiente && (
                <button
                  type="button"
                  aria-label="Día siguiente"
                  onClick={() => onNavDia(diaSiguiente)}
                  className="rounded-lg border border-slate-200/80 bg-white/90 px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-800"
                >
                  ▶
                </button>
              )}
            </div>
            <button type="button" className="ui-btn-ghost-violet shrink-0 px-2 py-1 text-sm" onClick={onClose}>
              Cerrar
            </button>
          </div>

          <div className="flex shrink-0 gap-1 border-b border-emerald-100 bg-emerald-50/40 p-2">
            {tabBtn("plan", "Plan")}
            {tabBtn("registro", "Tu registro")}
            {tabBtn("progreso", "Progreso")}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {tab === "plan" && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Ideas de receta <span className="font-medium text-slate-700">(orientativo, no clínico)</span>. Los números de IA
                  son aproximados.
                </p>
                {hayMacrosIa ? (
                  <div className="rounded-xl border border-teal-200/85 bg-gradient-to-br from-teal-50/90 via-white to-emerald-50/50 p-4 text-xs text-teal-950 shadow-md backdrop-blur-sm">
                    <p className="font-display font-semibold text-sm text-teal-950">Aportes estimados · día completo</p>
                    <MacrosPorComidaDistribuidos
                      etiquetaPrincipal="Macros del día (~suma tres comidas)"
                      totales={totalDia}
                    />
                    {presupuestoKcalDiario != null ? (
                      <p className="mt-2 border-t border-teal-100/80 pt-2 text-[11px] text-teal-900">
                        Referencia por perfil (~{Math.round(presupuestoKcalDiario)} kcal/día):{" "}
                        {deltaPresupuesto != null ? (
                          <>
                            {deltaPresupuesto >= 0 ? (
                              <span>aprox. {Math.round(deltaPresupuesto)} kcal por debajo.</span>
                            ) : (
                              <span>aprox. {Math.round(-deltaPresupuesto)} kcal por encima.</span>
                            )}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {(["desayuno", "almuerzo", "cena"] as const).map((slot) => {
                  const c = dia.comidas[slot];
                  const tituloSlot =
                    slot === "desayuno" ? "Desayuno" : slot === "almuerzo" ? "Almuerzo" : "Cena";
                  const m = sumarMacrosPlatoSlot(c);
                  const busquedaHref = youtubeBusquedaPlato(c.titulo, c.videoQuery, perfil.estiloDieta);
                  const muestraMacros =
                    m.kcal > 0 || m.proteinG > 0 || m.fatG > 0 || m.carbG > 0 || m.fiberG > 0;
                  const porTxt = EtiquetaPorciones(c);
                  return (
                    <div
                      key={slot}
                      className="overflow-hidden rounded-2xl border border-emerald-200/85 bg-white/95 p-4 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-emerald-100/90 pb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{tituloSlot}</p>
                        <span className="rounded-full bg-emerald-100/90 px-2 py-0.5 text-[10px] font-medium text-teal-900">
                          {porTxt ?? "1 porción"}
                        </span>
                      </div>
                      <div className="mt-3 flex items-start justify-between gap-2">
                        <p className="font-display text-base font-semibold leading-snug text-slate-900">{c.titulo}</p>
                        <CopyButton texto={`${c.titulo}\n\n${c.receta}`} />
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{c.receta}</p>
                      {muestraMacros ? (
                        <MacrosPorComidaDistribuidos
                          etiquetaPrincipal="Desglose aproximado (IA)"
                          totales={m}
                        />
                      ) : (
                        <p className="mt-2 rounded-lg bg-slate-50/95 px-2 py-1.5 text-[11px] text-slate-500">
                          Esta receta no trae números de macros; enfócate en las cantidades en el texto.
                        </p>
                      )}
                      <div className="mt-4 border-t border-emerald-50 pt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-800">Video cocina</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          Preferimos YouTube embebido (privacidad: youtube-nocookie) cuando encontramos coincidencias.
                        </p>
                        {c.youtubeVideoId ? (
                          <div className="motion-safe:animate-fade-up mt-3 space-y-3">
                            <RecipeVideoEmbedSafe videoId={c.youtubeVideoId} title={c.titulo} />
                            <a
                              className="ui-video-link inline-flex items-center gap-2 text-[11px] font-semibold text-teal-900"
                              href={busquedaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Abrir otros resultados en YouTube
                            </a>
                          </div>
                        ) : (
                          <>
                            <a
                              href={busquedaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="motion-safe:hover:border-teal-400/70 motion-safe:hover:shadow-md mt-3 flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-300/80 bg-gradient-to-br from-teal-50 via-white to-violet-50/35 px-5 text-center text-teal-900 shadow-inner transition motion-safe:duration-150"
                            >
            <span className="text-4xl motion-safe:animate-pulse motion-reduce:animate-none">▶</span>
                              <span className="text-sm font-semibold">Ver vídeos de esta receta en YouTube</span>
                              <span className="text-[11px] text-teal-800/85">
                                No encontramos ID confiable para incrustado en la app · abrir resultados relacionados con tu lista
                              </span>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "registro" && (
              <div className="space-y-5">
                <p className="text-xs text-slate-600">
                  Fotos o vídeos por comida. Son tu registro; no sustituyen el video sugerido de la receta.
                </p>
                {isConfigured && user && (
                  <p className="text-xs text-teal-800">
                    También se guardan en tu cuenta de forma automática (además de en este dispositivo).
                  </p>
                )}
                {isConfigured && !user && (
                  <p className="text-xs text-slate-600">
                    <Link to="/login" className="font-semibold text-teal-900 underline decoration-teal-400/70">
                      Inicia sesión
                    </Link>{" "}
                    para guardar una copia en tu cuenta además de en este dispositivo.
                  </p>
                )}
                {avisoCopiaCuenta && (
                  <p className="rounded-lg border border-amber-200/90 bg-amber-50/95 px-3 py-2 text-xs text-amber-950">
                    {avisoCopiaCuenta}
                  </p>
                )}
                {SLOTS_ORDEN_MEDIA.map((slot) => {
                  const items = record?.medias.filter((m) => m.slot === slot) ?? [];
                  return (
                    <div
                      key={slot}
                      className="rounded-xl border border-emerald-100/90 bg-gradient-to-b from-white to-emerald-50/30 p-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-teal-900">
                        {MEDIA_SLOT_LABEL[slot]}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Galería (desktop + móvil) */}
                        <label className="ui-btn-secondary inline-block cursor-pointer px-2 py-1.5 text-[11px]">
                          Foto de galería
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => {
                              void onFiles(e.target.files, true, slot);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        {/* Cámara directa (principalmente móvil) */}
                        <label className="ui-btn-secondary inline-block cursor-pointer px-2 py-1.5 text-[11px]">
                          Tomar foto
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="sr-only"
                            onChange={(e) => {
                              void onFiles(e.target.files, true, slot);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <label className="ui-btn-secondary inline-block cursor-pointer px-2 py-1.5 text-[11px]">
                          Vídeo
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            className="sr-only"
                            onChange={(e) => {
                              void onFiles(e.target.files, false, slot);
                              e.target.value = "";
                            }}
                          />
                        </label>
                      </div>
                      {items.length > 0 && (
                        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {items.map((m) => {
                            const urlFull = urlsPorId[m.id];
                            const urlGrid = gridUrlsPorId[m.id];
                            if (!urlFull || !urlGrid) return null;
                            return (
                              <li
                                key={m.id}
                                className="relative overflow-hidden rounded-lg border border-emerald-100 bg-white"
                              >
                                {m.kind === "image" ? (
                                  <button
                                    type="button"
                                    className="block w-full"
                                    onClick={() => setLightboxUrl(urlFull)}
                                    title="Ver en grande"
                                  >
                                    <img src={urlGrid} alt="" className="h-24 w-full object-cover" />
                                  </button>
                                ) : (
                                  <video src={urlFull} className="h-24 w-full object-cover" controls playsInline />
                                )}
                                <button
                                  type="button"
                                  className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-red-700 shadow"
                                  onClick={() => void quitarMedia(m.id)}
                                >
                                  Quitar
                                </button>
                                {m.remotePath ? (
                                  <span className="absolute bottom-1 left-1 rounded bg-teal-900/85 px-1 py-0.5 text-[9px] font-medium text-white">
                                    En cuenta
                                  </span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {tab === "progreso" && (
              <div className="space-y-5">
                <div className="rounded-xl border border-slate-200/90 bg-slate-50/50 p-3">
                  <p className="text-sm font-semibold text-teal-950">¿Seguiste el plan de comidas?</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Para tu seguimiento personal; no sustituye consejo médico.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(
                      [
                        { v: "si" as const, l: "Sí" },
                        { v: "parcial" as const, l: "Parcial" },
                        { v: "no" as const, l: "No" },
                        { v: null, l: "Sin marcar" }
                      ] as const
                    ).map(({ v, l }) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => void setSeguimiento(v)}
                        className={
                          seguimiento === v
                            ? "ui-btn-primary px-3 py-1.5 text-xs"
                            : "ui-btn-secondary px-3 py-1.5 text-xs"
                        }
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-violet-200/70 bg-violet-50/40 p-3">
                  <p className="text-sm font-semibold text-teal-950">Checklist del día</p>
                  {cargando && <p className="mt-2 text-xs text-slate-500">Cargando…</p>}
                  <ul className="mt-2 space-y-2">
                    {ETIQUETAS_PROGRESO_DIA.map((label, idx) => (
                      <li key={label}>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-800">
                          <input
                            type="checkbox"
                            className="mt-1 rounded border-emerald-300 text-teal-600 focus:ring-teal-500"
                            checked={Boolean(progress[idx])}
                            onChange={() => void toggleProgress(idx)}
                          />
                          <span>{label}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-emerald-100/90 bg-white/80 p-3">
                  <label className="block text-sm font-semibold text-teal-950" htmlFor="dia-nota">
                    Nota del día
                  </label>
                  <textarea
                    id="dia-nota"
                    rows={4}
                    maxLength={2000}
                    className="mt-2 w-full rounded-lg border border-emerald-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Cómo te sentiste, sustituciones, etc."
                    value={notaDraft}
                    onChange={(e) => setNotaDraft(e.target.value)}
                    onBlur={() => void guardarNota()}
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{notaDraft.length}/2000</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
