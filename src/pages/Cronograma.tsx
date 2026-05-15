import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  contarCompradosMercado,
  generarCronograma,
  presupuestoKcalOrientativoDiario,
  resumenNutricional,
  sumarMacrosComidaDia,
  type DiaPlan,
  type ModoCronograma,
  type PerfilUsuario
} from "../lib/nutritionPlan";
import { StepHeader } from "../components/StepHeader";
import { IntField } from "../components/NumericInputs";
import {
  PERFILES_STORAGE_EVENT,
  loadEstadoPerfiles,
  loadPerfilLocal,
  savePerfilLocal,
  getActivoPerfilId,
  loadPerfilMiembroActivo
} from "../lib/perfilStorage";
import { etiquetaFechaDiaPlan, toYmdLocal } from "../lib/planFechas";
import { fetchAndApplyFamilyRemote, fetchProfileRemote, upsertProfileRemote } from "../lib/profileRemote";
import { deletePlanSnapshotRemote, pullCloudSnapshots, pushPlanSnapshotRemote } from "../lib/snapshotsRemote";
import {
  CRONOGRAMA_HISTORIAL_EVENT,
  adjuntarFechasADias,
  buscarDiaEnSnapshots,
  eliminarSnapshot,
  getSnapshotActivoId,
  guardarSnapshotCronograma,
  listarSnapshots,
  renombrarSnapshot,
  setSnapshotActivoId,
  stripFechaDia,
  type CronogramaSnapshot,
  type DiaPlanConFecha
} from "../lib/cronogramaHistorial";
import {
  ADJUNTOS_DIA_EVENT,
  listResumenAdjuntosMes,
  type ResumenAdjuntoDia
} from "../lib/diaAdjuntosIDB";
import { getMercadoActivoParaPlan, getMercadoRealizado, setMercadoActivoParaPlan } from "../lib/mercadoHistorial";
import { URL_GOOGLE_AI_STUDIO_API_KEY, agenteRecetasGratisDisponible, generarCronogramaIA } from "../lib/recipesGemini";
import { CronogramaDiaDetalleModal } from "../components/CronogramaDiaDetalleModal";

const defaultPerfil: PerfilUsuario = {
  nombre: "",
  edad: 32,
  pesoKg: 72,
  tallaCm: 168,
  sexo: "f",
  enfermedades: "",
  alimentosEvitar: "",
  estiloDieta: "keto"
};

const CLAVE_VARIEDAD_KEY = "tec_nutri_salud_clave_variedad_v1";

const DOW_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function celdasMes(year: number, monthIndex: number): (Date | null)[] {
  const first = new Date(year, monthIndex, 1);
  const last = new Date(year, monthIndex + 1, 0);
  const pad = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, monthIndex, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CopiarPlanBtn({ dias }: { dias: import("../lib/cronogramaHistorial").DiaPlanConFecha[] }) {
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    const lineas: string[] = [];
    for (const d of dias) {
      lineas.push(`── Día ${d.dia} (${d.fecha}) ──`);
      lineas.push(`Desayuno: ${d.comidas.desayuno.titulo}`);
      lineas.push(d.comidas.desayuno.receta.split("\n")[0] ?? "");
      lineas.push(`Almuerzo: ${d.comidas.almuerzo.titulo}`);
      lineas.push(d.comidas.almuerzo.receta.split("\n")[0] ?? "");
      lineas.push(`Cena: ${d.comidas.cena.titulo}`);
      lineas.push(d.comidas.cena.receta.split("\n")[0] ?? "");
      lineas.push("");
    }
    void navigator.clipboard.writeText(lineas.join("\n")).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    });
  };

  return (
    <button
      type="button"
      onClick={copiar}
      className={`ui-btn-secondary transition ${copiado ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}`}
    >
      {copiado ? "¡Plan copiado!" : "Copiar plan"}
    </button>
  );
}

export function Cronograma() {
  const { user, isConfigured } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const diaParam = searchParams.get("dia");
  const [perfil, setPerfil] = useState<PerfilUsuario>(defaultPerfil);
  const [diasCronograma, setDiasCronograma] = useState(7);
  const [modoCronograma, setModoCronograma] = useState<ModoCronograma>("mixto");
  const [claveVariedad, setClaveVariedad] = useState(() => {
    try {
      return localStorage.getItem(CLAVE_VARIEDAD_KEY) ?? `inicio-${Date.now()}`;
    } catch {
      return `inicio-${Date.now()}`;
    }
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [mercadoActivoId, setMercadoActivoId] = useState<string | null>(() => getMercadoActivoParaPlan());
  const [cronogramaIa, setCronogramaIa] = useState<DiaPlan[] | null>(null);
  const [vistaCronograma, setVistaCronograma] = useState<"plantillas" | "ia">("plantillas");
  const [iaCargando, setIaCargando] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const [iaProgreso, setIaProgreso] = useState<{ hecho: number; total: number; fase: "generando" | "enriqueciendo" } | null>(null);
  const [perfilContextoId, setPerfilContextoId] = useState<string | null>(null);
  const [layoutDias, setLayoutDias] = useState<"lista" | "calendario">("lista");
  const [mesCal, setMesCal] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [diaModalOpen, setDiaModalOpen] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState<DiaPlanConFecha | null>(null);
  const [historialTick, setHistorialTick] = useState(0);
  const [adjuntosTick, setAdjuntosTick] = useState(0);
  const [resumenAdjuntosMes, setResumenAdjuntosMes] = useState<Map<string, ResumenAdjuntoDia>>(() => new Map());
  const [thumbUrlsMes, setThumbUrlsMes] = useState<Record<string, string>>({});
  /** id del snapshot cuyo título se está editando */
  const [editSnapId, setEditSnapId] = useState<string | null>(null);
  const [editSnapTitulo, setEditSnapTitulo] = useState("");
  /** id del snapshot marcado como plan activo de la semana */
  const [snapActivoId, setSnapActivoId] = useState<string | null>(null);
  /** mostrar / ocultar el panel de planes guardados */
  const [historialAbierto, setHistorialAbierto] = useState(false);
  /** Evita sobreescribir el plan IA si el usuario ya regeneró en esta sesión de navegación */
  const iaYaRestoradaRef = useRef(false);

  const bootDesdeAlmacenamiento = useCallback(() => {
    const l = loadPerfilLocal();
    if (l) setPerfil(l);
    else setPerfil(defaultPerfil);
    setMercadoActivoId(getMercadoActivoParaPlan());
    const pid = getActivoPerfilId();
    setPerfilContextoId(pid);
    setSnapActivoId(getSnapshotActivoId(pid));
  }, []);

  useEffect(() => {
    bootDesdeAlmacenamiento();
    window.addEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
    return () => window.removeEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
  }, [bootDesdeAlmacenamiento]);

  // Restaura automáticamente el plan IA activo al montar o cambiar de perfil
  useEffect(() => {
    if (!snapActivoId || !perfilContextoId || iaYaRestoradaRef.current) return;
    const snap = listarSnapshots(perfilContextoId).find((s) => s.id === snapActivoId);
    if (snap?.fuente === "ia" && snap.diasPlan.length > 0) {
      setCronogramaIa(snap.diasPlan);
      setVistaCronograma("ia");
      setDiasCronograma(snap.dias);
      setModoCronograma(snap.modo);
      iaYaRestoradaRef.current = true;
    }
  }, [snapActivoId, perfilContextoId]);

  useEffect(() => {
    const onHist = () => {
      setHistorialTick((t) => t + 1);
      const pid = getActivoPerfilId();
      setSnapActivoId(getSnapshotActivoId(pid));
    };
    window.addEventListener(CRONOGRAMA_HISTORIAL_EVENT, onHist);
    return () => window.removeEventListener(CRONOGRAMA_HISTORIAL_EVENT, onHist);
  }, []);

  useEffect(() => {
    const onAdj = () => setAdjuntosTick((t) => t + 1);
    window.addEventListener(ADJUNTOS_DIA_EVENT, onAdj);
    return () => window.removeEventListener(ADJUNTOS_DIA_EVENT, onAdj);
  }, []);

  useEffect(() => {
    if (!user?.id || !isConfigured) return;
    setLoadingRemote(true);
    void (async () => {
      const remote = await fetchProfileRemote(user.id);
      if (remote) {
        setPerfil(remote);
        savePerfilLocal(remote);
      }
      await fetchAndApplyFamilyRemote(user.id);
      const pulled = await pullCloudSnapshots(user.id);
      if (!pulled.ok) {
        setStatus(`Aviso: no se pudo sincronizar mercados/planes desde la nube (${pulled.error}).`);
      }
      setLoadingRemote(false);
    })();
  }, [user?.id, isConfigured]);

  useEffect(() => {
    const sync = () => setMercadoActivoId(getMercadoActivoParaPlan());
    window.addEventListener("storage", sync);
    window.addEventListener(PERFILES_STORAGE_EVENT, sync);
    const id = window.setInterval(sync, 2000);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PERFILES_STORAGE_EVENT, sync);
      window.clearInterval(id);
    };
  }, []);

  const desdeMercado = Boolean((location.state as { desdeMercado?: boolean } | null)?.desdeMercado);

  useEffect(() => {
    if (!desdeMercado) return;
    const id = getMercadoActivoParaPlan();
    const snap = id ? getMercadoRealizado(id) : null;
    if (snap) {
      const d = Math.min(30, Math.max(3, Math.round(snap.dias)));
      setDiasCronograma(d);
      setModoCronograma("mixto");
    }
    setStatus("Menú alineado con el mercado guardado.");
  }, [desdeMercado, location.key]);

  const snapshotMercado = useMemo(() => {
    if (!mercadoActivoId) return null;
    return getMercadoRealizado(mercadoActivoId);
  }, [mercadoActivoId]);

  useEffect(() => {
    setCronogramaIa(null);
    setVistaCronograma("plantillas");
    setIaError(null);
  }, [diasCronograma, modoCronograma, mercadoActivoId, perfil.estiloDieta, perfilContextoId]);

  const itemsMercadoActivo = snapshotMercado?.items;
  const nComprados = contarCompradosMercado(itemsMercadoActivo);

  const cronograma = useMemo(() => {
    return generarCronograma(perfil, diasCronograma, {
      modo: modoCronograma,
      mercadoItems: itemsMercadoActivo,
      claveVariedad: `${claveVariedad}|${mercadoActivoId ?? "sin-mercado"}`
    });
  }, [perfil, diasCronograma, modoCronograma, itemsMercadoActivo, claveVariedad, mercadoActivoId]);

  const cronogramaMostrado =
    vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? cronogramaIa : cronograma;

  const resumen = useMemo(() => resumenNutricional(perfil), [perfil]);
  const presupuestoKcal = useMemo(() => presupuestoKcalOrientativoDiario(perfil), [perfil]);

  const fechaIniCron = loadPerfilMiembroActivo()?.fechaInicioPlan ?? null;

  const diasConFecha = useMemo(
    () =>
      adjuntarFechasADias(cronogramaMostrado, fechaIniCron, new Date().toISOString().slice(0, 10)),
    [cronogramaMostrado, fechaIniCron]
  );

  const porFecha = useMemo(() => {
    const m = new Map<string, DiaPlanConFecha>();
    for (const d of diasConFecha) m.set(d.fecha, d);
    return m;
  }, [diasConFecha]);

  const perfilIdActivo = perfilContextoId ?? getActivoPerfilId();
  const snapshotsRecientes = useMemo(
    () => listarSnapshots(perfilIdActivo).slice(0, 14),
    [perfilIdActivo, historialTick]
  );

  useEffect(() => {
    if (!perfilIdActivo) {
      setResumenAdjuntosMes(new Map());
      return;
    }
    let cancelled = false;
    void (async () => {
      const m = await listResumenAdjuntosMes(perfilIdActivo, mesCal.getFullYear(), mesCal.getMonth());
      if (!cancelled) setResumenAdjuntosMes(m);
    })();
    return () => {
      cancelled = true;
    };
  }, [perfilIdActivo, mesCal, adjuntosTick]);

  useEffect(() => {
    const next: Record<string, string> = {};
    resumenAdjuntosMes.forEach((r, fecha) => {
      if (r.thumbPreview) next[fecha] = URL.createObjectURL(r.thumbPreview);
    });
    setThumbUrlsMes(next);
    return () => {
      Object.values(next).forEach((u) => URL.revokeObjectURL(u));
    };
  }, [resumenAdjuntosMes]);

  useEffect(() => {
    if (!diaParam || !/^\d{4}-\d{2}-\d{2}$/.test(diaParam)) return;
    if (diaModalOpen && diaSeleccionado?.fecha === diaParam) return;
    const live = porFecha.get(diaParam);
    const fromSnap = live ?? buscarDiaEnSnapshots(perfilIdActivo, diaParam);
    if (!fromSnap) {
      if (perfilIdActivo) {
        setSearchParams(
          (prev) => {
            const n = new URLSearchParams(prev);
            n.delete("dia");
            return n;
          },
          { replace: true }
        );
        setDiaModalOpen(false);
        setDiaSeleccionado(null);
      }
      return;
    }
    const parts = diaParam.split("-").map(Number);
    const y = parts[0];
    const mo = parts[1];
    if (!Number.isFinite(y) || !Number.isFinite(mo)) return;
    setMesCal(new Date(y, mo - 1, 1));
    setLayoutDias("calendario");
    setDiaSeleccionado(fromSnap);
    setDiaModalOpen(true);
  }, [diaParam, porFecha, perfilIdActivo, diaModalOpen, diaSeleccionado?.fecha]);

  const guardarMenuEnHistorial = () => {
    void (async () => {
      const pid = perfilContextoId ?? getActivoPerfilId();
      if (!pid) {
        setStatus("No hay perfil activo.");
        return;
      }
      const snap = guardarSnapshotCronograma({
        perfilId: pid,
        fechaInicioPlan: fechaIniCron,
        dias: diasCronograma,
        modo: modoCronograma,
        fuente: vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? "ia" : "plantillas",
        mercadoActivoId,
        claveVariedad,
        diasPlan: cronogramaMostrado
      });
      const baseOk = snap ? "Menú guardado en historial (este dispositivo)." : "No se pudo guardar (almacenamiento lleno o privado).";
      if (!snap) {
        setStatus(baseOk);
        return;
      }
      let linea = baseOk;
      if (user?.id && isConfigured) {
        const pushed = await pushPlanSnapshotRemote(user.id, snap);
        if (!pushed.ok) linea += ` No copiado a la nube: ${pushed.error}`;
      }
      setStatus(linea);
      setHistorialTick((t) => t + 1);
      setSnapshotActivoId(pid, snap.id);
      setSnapActivoId(snap.id);
    })();
  };

  const borrarSnapshot = (s: CronogramaSnapshot) => {
    if (!window.confirm(`¿Eliminar el plan "${s.titulo ?? new Date(s.createdAt).toLocaleDateString("es")}"?`)) return;
    eliminarSnapshot(s.id);
    if (user?.id && isConfigured) {
      void deletePlanSnapshotRemote(user.id, s.perfilId, s.id).then((r) => {
        if (!r.ok) setStatus(`Plan borrado aquí; copia en nube sin eliminar (${r.error}).`);
      });
    }
    setHistorialTick((t) => t + 1);
  };

  const guardarTituloSnapshot = (id: string) => {
    renombrarSnapshot(id, editSnapTitulo);
    setEditSnapId(null);
    setHistorialTick((t) => t + 1);
  };

  const marcarPlanActivo = (id: string) => {
    const pid = perfilContextoId ?? getActivoPerfilId();
    setSnapshotActivoId(pid, id);
    setSnapActivoId(id);
  };

  const aplicarDesdeHistorial = (snapshotId: string) => {
    const pid = perfilContextoId ?? getActivoPerfilId();
    if (!pid) return;
    const s = listarSnapshots(pid).find((x) => x.id === snapshotId);
    if (!s) return;
    setDiasCronograma(s.dias);
    setModoCronograma(s.modo);
    setMercadoActivoParaPlan(s.mercadoActivoId);
    setMercadoActivoId(s.mercadoActivoId);
    if (s.claveVariedad) {
      setClaveVariedad(s.claveVariedad);
      try {
        localStorage.setItem(CLAVE_VARIEDAD_KEY, s.claveVariedad);
      } catch {
        /* ignore */
      }
    }
    if (s.fuente === "ia") {
      setCronogramaIa(s.diasPlan.map(stripFechaDia));
      setVistaCronograma("ia");
    } else {
      setCronogramaIa(null);
      setVistaCronograma("plantillas");
    }
    setStatus("Menú restaurado desde historial.");
  };

  const cerrarDetalleDia = () => {
    setDiaModalOpen(false);
    setDiaSeleccionado(null);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.delete("dia");
        return n;
      },
      { replace: true }
    );
  };

  const abrirDia = (d: DiaPlanConFecha) => {
    setDiaSeleccionado(d);
    setDiaModalOpen(true);
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("dia", d.fecha);
        return n;
      },
      { replace: true }
    );
  };

  const guardarPerfilRapido = async () => {
    setStatus(null);
    savePerfilLocal(perfil);
    if (user?.id && isConfigured) {
      const fam = loadEstadoPerfiles();
      const ok = await upsertProfileRemote(user.id, perfil, fam ? { family: fam } : undefined);
      setStatus(ok ? "Perfil guardado." : "Guardado local; revisa Supabase.");
    } else {
      setStatus("Perfil guardado en este dispositivo.");
    }
  };

  const nuevasCombinaciones = () => {
    const next = `var-${Date.now()}`;
    setClaveVariedad(next);
    try {
      localStorage.setItem(CLAVE_VARIEDAD_KEY, next);
    } catch {
      /* ignore */
    }
    setStatus("Sugerencias renovadas (plantillas).");
  };

  const alinearDiasConMercado = () => {
    if (!snapshotMercado) return;
    const d = Math.min(30, Math.max(3, Math.round(snapshotMercado.dias)));
    setDiasCronograma(d);
    setStatus(`Días alineados con el mercado (${d}).`);
  };

  const cargarRecetasIA = async () => {
    if (!agenteRecetasGratisDisponible()) {
      setIaError(`Clave en Google AI Studio (${URL_GOOGLE_AI_STUDIO_API_KEY}) → VITE_GEMINI_API_KEY y rebuild.`);
      return;
    }
    setIaCargando(true);
    setIaError(null);
    setStatus(null);
    setIaProgreso({ hecho: 0, total: diasCronograma, fase: "generando" });
    iaYaRestoradaRef.current = true;
    try {
      const plan = await generarCronogramaIA(
        perfil,
        diasCronograma,
        itemsMercadoActivo,
        modoCronograma,
        (hecho, total, fase) => setIaProgreso({ hecho, total, fase })
      );
      setCronogramaIa(plan);
      setVistaCronograma("ia");
      let estatusIa = `IA: ${plan.length} día(s). Macros y vídeo en el detalle; la lista del mercado (cantidades y comprados según modo) se envía al modelo.`;
      const pid = getActivoPerfilId();
      if (pid) {
        const iaSnap = guardarSnapshotCronograma({
          perfilId: pid,
          fechaInicioPlan: loadPerfilMiembroActivo()?.fechaInicioPlan ?? null,
          dias: diasCronograma,
          modo: modoCronograma,
          fuente: "ia",
          mercadoActivoId,
          claveVariedad,
          diasPlan: plan
        });
        setHistorialTick((t) => t + 1);
        if (iaSnap) {
          setSnapshotActivoId(pid, iaSnap.id);
          setSnapActivoId(iaSnap.id);
          if (user?.id && isConfigured) {
            const pushed = await pushPlanSnapshotRemote(user.id, iaSnap);
            if (!pushed.ok) estatusIa += ` No copiado a la nube: ${pushed.error}`;
          }
        }
      }
      setStatus(estatusIa);
    } catch (e) {
      setIaError(e instanceof Error ? e.message : "Error IA.");
    } finally {
      setIaCargando(false);
      setIaProgreso(null);
    }
  };

  const celdas = useMemo(
    () => celdasMes(mesCal.getFullYear(), mesCal.getMonth()),
    [mesCal]
  );

  const tituloMes = mesCal.toLocaleDateString("es", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">
      <CronogramaDiaDetalleModal
        open={diaModalOpen}
        onClose={cerrarDetalleDia}
        dia={diaSeleccionado}
        dias={diasConFecha.length > 1 ? diasConFecha : undefined}
        onNavDia={abrirDia}
        perfilId={perfilIdActivo}
        perfil={perfil}
        presupuestoKcalDiario={presupuestoKcal}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <StepHeader
            pasoActual={3}
            titulo="Cronograma · tu menú"
            subtitulo={loadingRemote ? "Sincronizando perfil…" : undefined}
          />
        </div>
        <Link
          to="/keto-mercado"
          className="ui-btn-secondary shrink-0 self-start text-center sm:mt-14"
        >
          Volver al mercado
        </Link>
      </div>

      {status && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          {status}
        </p>
      )}

      <section className="ui-card-muted text-sm text-slate-800">
        <p className="font-semibold text-teal-900">Mercado activo</p>
        {!mercadoActivoId ? (
          <p className="mt-2 text-slate-600">
            Sin mercado guardado.{" "}
            <Link
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              to="/keto-mercado"
            >
              Ir al mercado →
            </Link>
          </p>
        ) : snapshotMercado ? (
          <div className="mt-2 space-y-1">
            {snapshotMercado.nombre && (
              <p className="font-medium text-teal-950">{snapshotMercado.nombre}</p>
            )}
            <p className="text-slate-600">
              {new Date(snapshotMercado.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" })} ·{" "}
              {nComprados} comprados ·{" "}
              <Link
                className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
                to="/keto-mercado"
              >
                Editar lista
              </Link>
            </p>
            {snapshotMercado.nota && (
              <p className="text-xs text-amber-800">{snapshotMercado.nota}</p>
            )}
          </div>
        ) : null}
        {snapshotMercado && (
          <button
            type="button"
            className="ui-btn-secondary mt-3 px-3 py-1.5 text-xs"
            onClick={alinearDiasConMercado}
          >
            Alinear días con el mercado ({snapshotMercado.dias})
          </button>
        )}
      </section>

      <div className="ui-card">
        <h2 className="font-display text-sm font-semibold text-teal-950">Perfil rápido (estilo de dieta)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Para edad, peso y condiciones usa{" "}
          <Link
            to="/mi-plan"
            className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
          >
            Mi plan
          </Link>
          .
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="font-medium">Estilo</span>
            <select
              className="mt-1 block w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={perfil.estiloDieta}
              onChange={(e) => setPerfil({ ...perfil, estiloDieta: e.target.value as PerfilUsuario["estiloDieta"] })}
            >
              <option value="keto">Keto</option>
              <option value="mediterranea">Mediterránea</option>
              <option value="balanceada">Balanceada</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void guardarPerfilRapido()}
            className="ui-btn-primary px-3 py-2"
          >
            Guardar estilo
          </button>
        </div>
      </div>

      <div className="ui-card grid gap-4 md:grid-cols-2">
        <fieldset className="md:col-span-2 space-y-2 rounded-xl border border-emerald-100/80 bg-white/50 p-3 backdrop-blur-sm">
          <legend className="px-1 text-sm font-medium text-teal-900">Cronograma según</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "perfil"}
              onChange={() => setModoCronograma("perfil")}
            />
            Solo perfil
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "mercado"}
              onChange={() => setModoCronograma("mercado")}
            />
            Mercado activo
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="modoCronogramaPage"
              checked={modoCronograma === "mixto"}
              onChange={() => setModoCronograma("mixto")}
            />
            Mixto
          </label>
        </fieldset>
        <p className="md:col-span-2 rounded-xl border border-emerald-100/90 bg-teal-50/40 px-3 py-2 text-[11px] leading-snug text-teal-950">
          <strong>Mercado e IA:</strong> si tienes lista guardada, el agente recibe las <strong>cantidades de todos los ítems</strong> (y marca «comprado» donde prioriza). Para forzar sólo despensa marcada usa{" "}
          <strong>Mercado activo</strong>.
        </p>

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button type="button" onClick={nuevasCombinaciones} className="ui-btn-secondary">
            Nuevas combinaciones
          </button>
          <button
            type="button"
            disabled={iaCargando}
            onClick={() => void cargarRecetasIA()}
            className="ui-btn-violet"
          >
            {iaCargando ? "Agente…" : "Agente IA recetas (gratis)"}
          </button>
          {vistaCronograma === "ia" && cronogramaIa && (
            <button
              type="button"
              onClick={() => {
                setVistaCronograma("plantillas");
                setStatus("Vista plantillas.");
              }}
              className="ui-btn-ghost-violet"
            >
              Ver plantillas
            </button>
          )}
          <button type="button" onClick={guardarMenuEnHistorial} className="ui-btn-secondary">
            Guardar menú en historial
          </button>
          {diasConFecha.length > 0 && (
            <CopiarPlanBtn dias={diasConFecha} />
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span>Días</span>
            <IntField
              label="Días del cronograma"
              hideLabel
              value={diasCronograma}
              onCommit={setDiasCronograma}
              min={3}
              max={30}
              inputClassName="w-20 rounded-lg border border-emerald-200/90 bg-white/90 px-2 py-1 text-center text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
            />
          </div>
        </div>

        {perfilIdActivo && snapshotsRecientes.length > 0 && (
          <div className="md:col-span-2">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-xl border border-emerald-200/80 bg-white/90 px-4 py-2 text-sm font-medium text-teal-900 shadow-sm backdrop-blur-sm transition hover:bg-teal-50/80"
              onClick={() => setHistorialAbierto((v) => !v)}
            >
              <span>Planes guardados ({snapshotsRecientes.length})</span>
              <span className="text-slate-400">{historialAbierto ? "▲" : "▼"}</span>
            </button>

            {historialAbierto && (
              <ul className="mt-2 space-y-2">
                {snapshotsRecientes.map((s) => {
                  const esActivo = s.id === snapActivoId;
                  const editando = editSnapId === s.id;
                  const fechaCorta = new Date(s.createdAt).toLocaleString("es", {
                    dateStyle: "short",
                    timeStyle: "short"
                  });
                  return (
                    <li
                      key={s.id}
                      className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm transition ${
                        esActivo
                          ? "border-violet-300/90 bg-gradient-to-r from-violet-50/90 to-white/95 shadow-sm"
                          : "border-white/80 bg-white/80 shadow-sm"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {s.titulo ? (
                            <p className="font-semibold text-teal-950">{s.titulo}</p>
                          ) : null}
                          <p className={s.titulo ? "text-xs text-slate-500" : "font-medium text-slate-800"}>
                            {fechaCorta} · {s.fuente === "ia" ? "IA" : "Plantillas"} · {s.dias} días ·{" "}
                            {s.modo === "mercado" ? "mercado" : s.modo === "mixto" ? "mixto" : "perfil"}
                          </p>
                          {esActivo && (
                            <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                              ✓ Plan activo de la semana
                            </span>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 flex-wrap gap-1.5">
                          <button
                            type="button"
                            className="ui-btn-secondary px-2 py-1 text-xs"
                            onClick={() => aplicarDesdeHistorial(s.id)}
                          >
                            Restaurar
                          </button>
                          {!esActivo && (
                            <button
                              type="button"
                              className="ui-btn-secondary px-2 py-1 text-xs"
                              onClick={() => marcarPlanActivo(s.id)}
                            >
                              Marcar activo
                            </button>
                          )}
                          <button
                            type="button"
                            className="ui-btn-secondary px-2 py-1 text-xs"
                            onClick={() => {
                              if (editando) {
                                setEditSnapId(null);
                              } else {
                                setEditSnapId(s.id);
                                setEditSnapTitulo(s.titulo ?? "");
                              }
                            }}
                          >
                            {editando ? "Cancelar" : "Renombrar"}
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-red-200/90 bg-white/90 px-2 py-1 text-xs text-red-700 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                            onClick={() => borrarSnapshot(s)}
                          >
                            Borrar
                          </button>
                        </div>
                      </div>

                      {editando && (
                        <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                          <input
                            type="text"
                            maxLength={60}
                            value={editSnapTitulo}
                            onChange={(e) => setEditSnapTitulo(e.target.value)}
                            placeholder='Ej. "Semana 19 mayo"'
                            className="flex-1 rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            onKeyDown={(e) => e.key === "Enter" && guardarTituloSnapshot(s.id)}
                          />
                          <button
                            type="button"
                            className="ui-btn-primary px-3 py-1.5 text-xs"
                            onClick={() => guardarTituloSnapshot(s.id)}
                          >
                            Guardar
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {!agenteRecetasGratisDisponible() && (
          <p className="md:col-span-2 rounded-xl border border-violet-200/80 bg-violet-50/80 p-3 text-xs text-slate-700 shadow-sm backdrop-blur-sm">
            Gemini: clave en{" "}
            <a
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              href={URL_GOOGLE_AI_STUDIO_API_KEY}
              target="_blank"
              rel="noreferrer"
            >
              Google AI Studio
            </a>{" "}
            → <code className="rounded bg-white px-1">VITE_GEMINI_API_KEY</code> y rebuild. Misma clave en{" "}
            <Link
              className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700"
              to="/agente"
            >
              Asistente
            </Link>
            .
          </p>
        )}
        {iaCargando && iaProgreso && (
          <div className="md:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-violet-900">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
                {iaProgreso.fase === "enriqueciendo"
                  ? "Buscando vídeos de recetas…"
                  : iaProgreso.hecho === 0
                  ? "Iniciando generación…"
                  : `Generando días… ${iaProgreso.hecho} / ${iaProgreso.total}`}
              </span>
              <span className="tabular-nums text-violet-700">
                {Math.round((iaProgreso.hecho / iaProgreso.total) * 100)} %
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-500 transition-all duration-500"
                style={{ width: `${Math.max(4, Math.round((iaProgreso.hecho / iaProgreso.total) * 100))}%` }}
              />
            </div>
          </div>
        )}
        {iaError && (
          <div className="md:col-span-2 flex items-start justify-between gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2">
            <p className="text-sm text-red-700">{iaError}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-red-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              onClick={() => void cargarRecetasIA()}
            >
              Reintentar
            </button>
          </div>
        )}
      </div>

      <section className="ui-card">
        <h2 className="ui-section-title">Resumen orientativo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumen.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      {(() => {
        if (!diasConFecha.length) return null;
        const totalesDias = diasConFecha.map((d) => sumarMacrosComidaDia(d.comidas));
        const diasConKcal = totalesDias.filter((t) => t.kcal > 0);
        if (diasConKcal.length === 0) return null;
        const n = diasConKcal.length;
        const avg = diasConKcal.reduce(
          (acc, t) => ({
            kcal: acc.kcal + t.kcal,
            proteinG: acc.proteinG + t.proteinG,
            fatG: acc.fatG + t.fatG,
            carbG: acc.carbG + t.carbG,
            fiberG: acc.fiberG + t.fiberG
          }),
          { kcal: 0, proteinG: 0, fatG: 0, carbG: 0, fiberG: 0 }
        );
        const chip =
          "flex min-w-[4.5rem] flex-1 flex-col items-center justify-center rounded-xl border px-2.5 py-2 text-center shadow-sm backdrop-blur-sm";
        return (
          <section className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/70 via-white/95 to-fuchsia-50/30 p-4 shadow-md shadow-violet-900/5 backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-sm font-semibold text-violet-950">
                Macros IA · promedio diario
              </h2>
              <span className="text-[10px] font-medium text-slate-400">
                orientativo, {n} día{n !== 1 ? "s" : ""} con datos
              </span>
            </div>
            <div className="motion-safe:animate-fade-up mt-3 flex flex-wrap gap-2">
              <div className={`${chip} border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-amber-50/40`}>
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900/85">Calorías</span>
                <span className="font-mono text-base font-bold tabular-nums text-amber-950">~{Math.round(avg.kcal / n)}</span>
                <span className="text-[9px] text-amber-800/90">kcal/día</span>
              </div>
              {avg.proteinG > 0 && (
                <div className={`${chip} border-sky-200/90 bg-gradient-to-br from-sky-50 via-white to-cyan-50/40`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-sky-900/85">Proteína</span>
                  <span className="font-mono text-base font-bold tabular-nums text-sky-950">{(avg.proteinG / n).toFixed(0)}</span>
                  <span className="text-[9px] text-sky-800/90">g/día</span>
                </div>
              )}
              {avg.fatG > 0 && (
                <div className={`${chip} border-violet-200/90 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50/30`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-violet-900/85">Grasa</span>
                  <span className="font-mono text-base font-bold tabular-nums text-violet-950">{(avg.fatG / n).toFixed(0)}</span>
                  <span className="text-[9px] text-violet-800/90">g/día</span>
                </div>
              )}
              {avg.carbG > 0 && (
                <div className={`${chip} border-emerald-300/85 bg-gradient-to-br from-emerald-50 via-white to-teal-50/35`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-900/85">Carbos</span>
                  <span className="font-mono text-base font-bold tabular-nums text-emerald-950">{(avg.carbG / n).toFixed(0)}</span>
                  <span className="text-[9px] text-emerald-800/90">g/día</span>
                </div>
              )}
              {avg.fiberG > 0 && (
                <div className={`${chip} border-lime-200/90 bg-gradient-to-br from-lime-50/90 via-white to-green-50/25`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-lime-900/85">Fibra</span>
                  <span className="font-mono text-base font-bold tabular-nums text-lime-950">{(avg.fiberG / n).toFixed(0)}</span>
                  <span className="text-[9px] text-lime-800/90">g/día</span>
                </div>
              )}
            </div>
            <p className="mt-2 text-[10px] text-slate-400">
              Estimaciones orientativas generadas por IA · no sustituyen asesoría nutricional profesional.
            </p>
          </section>
        );
      })()}

      <section className="space-y-4" id="lista-cronograma">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="ui-section-title text-gradient-brand">Días y recetas</h2>
          {diasConFecha.length > 0 && (
            <div className="flex gap-2 rounded-xl border border-emerald-100 bg-white/70 p-1 text-sm">
              <button
                type="button"
                className={layoutDias === "lista" ? "ui-btn-primary px-3 py-1.5 text-xs" : "ui-btn-ghost-violet px-3 py-1.5 text-xs"}
                onClick={() => setLayoutDias("lista")}
              >
                Lista
              </button>
              <button
                type="button"
                className={
                  layoutDias === "calendario" ? "ui-btn-primary px-3 py-1.5 text-xs" : "ui-btn-ghost-violet px-3 py-1.5 text-xs"
                }
                onClick={() => setLayoutDias("calendario")}
              >
                Calendario
              </button>
            </div>
          )}
        </div>

        {diasConFecha.length === 0 && (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-teal-300/70 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 px-6 py-12 text-center shadow-sm">
            <span className="text-5xl">🥗</span>
            <div className="space-y-1">
              <p className="font-display text-lg font-semibold text-teal-950">Sin cronograma activo</p>
              <p className="max-w-sm text-sm text-slate-600">
                Sube hasta arriba y usa <strong>Generar con IA</strong> (con tu lista de mercado) o{" "}
                <strong>Generar plantilla</strong> para ver tu menú semanal aquí.
              </p>
            </div>
            <button
              type="button"
              className="ui-btn-primary px-5 py-2 text-sm"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Ir a generar cronograma ↑
            </button>
          </div>
        )}
        <p className="text-sm text-slate-600">
          {vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma ? (
            <>
              Vista <strong>IA</strong> (Gemini): desde el detalle del día ves <strong>aportes como tarjetas</strong>, número de porciones y{" "}
              <strong>YouTube integrado</strong> cuando aparece coincidencia; si no, un acceso destacado para abrir vídeos.
            </>
          ) : (
            <>
              Vista <strong>plantillas</strong>: toca un día en el calendario o &quot;Ver detalle&quot; en la lista; el enlace a
              YouTube está dentro del detalle. También puedes abrir un día con la URL{" "}
              <code className="rounded bg-slate-100 px-1 text-[11px]">?dia=AAAA-MM-DD</code>.
            </>
          )}
        </p>

        {layoutDias === "calendario" && (
          <div className="ui-card-muted space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="ui-btn-secondary px-2 py-1 text-xs"
                onClick={() => setMesCal((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
              >
                ← Mes
              </button>
              <p className="text-center text-sm font-semibold capitalize text-teal-950">{tituloMes}</p>
              <button
                type="button"
                className="ui-btn-secondary px-2 py-1 text-xs"
                onClick={() => setMesCal((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
              >
                Mes →
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-slate-500">
              {DOW_ES.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {celdas.map((cell, idx) => {
                if (!cell) return <div key={`e-${idx}`} className="min-h-[3.25rem]" />;
                const ymd = toYmdLocal(cell);
                const hit = porFecha.get(ymd);
                const adj = resumenAdjuntosMes.get(ymd);
                return (
                  <button
                    key={ymd}
                    type="button"
                    disabled={!hit}
                    onClick={() => hit && abrirDia(hit)}
                    className={`flex min-h-[4rem] flex-col items-center justify-center gap-0.5 rounded-lg border px-0.5 py-1 text-xs transition ${
                      hit
                        ? "border-teal-400/80 bg-teal-50/90 font-semibold text-teal-950 hover:bg-teal-100"
                        : "cursor-default border-transparent text-slate-400"
                    }`}
                  >
                    <span>{cell.getDate()}</span>
                    {hit && (
                      <>
                        <span className="text-[10px] font-normal text-slate-600">Día {hit.dia}</span>
                        <span
                          className="flex items-center gap-0.5 text-[8px] font-semibold leading-none text-teal-800"
                          title="Desayuno · Almuerzo · Cena (plan)"
                        >
                          <span>D</span>
                          <span className="font-normal text-slate-400">·</span>
                          <span>A</span>
                          <span className="font-normal text-slate-400">·</span>
                          <span>C</span>
                        </span>
                        {thumbUrlsMes[ymd] ? (
                          <span className="flex items-center gap-0.5" title="Tu registro (foto)">
                            <img
                              src={thumbUrlsMes[ymd]}
                              alt=""
                              className="h-6 w-6 rounded-md object-cover ring-1 ring-white/90 shadow-sm motion-safe:transition motion-safe:hover:ring-teal-300/80"
                            />
                            {adj && adj.nVideo > 0 ? (
                              <span className="text-[9px] font-normal" title="Vídeo propio">
                                ▶
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          adj &&
                          (adj.nImg > 0 || adj.nVideo > 0) && (
                            <span className="text-[9px] font-normal" title="Tu registro (fotos/vídeo)">
                              {adj.nImg > 0 ? "📷" : ""}
                              {adj.nVideo > 0 ? "▶" : ""}
                            </span>
                          )
                        )}
                        {adj?.tieneRegistroExtra && !adj.nImg && !adj.nVideo && (
                          <span className="text-[8px] font-normal text-violet-700" title="Progreso o nota">
                            ✓
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {layoutDias === "lista" && (
          <div className="space-y-4">
            {diasConFecha.map((d) => {
              const lblFecha = etiquetaFechaDiaPlan(fechaIniCron, d.dia);
              const totalDia = sumarMacrosComidaDia(d.comidas);
              const hayKcal = totalDia.kcal > 0;
              const hayVideo = (["desayuno", "almuerzo", "cena"] as const).some(
                (s) => d.comidas[s].youtubeVideoId
              );
              const esIA = vistaCronograma === "ia" && cronogramaIa?.length === diasCronograma;
              return (
                <div key={d.dia} className="ui-day-block">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-teal-900">
                        Día {d.dia}
                        {lblFecha && <span className="ml-2 font-normal text-slate-600">· {lblFecha}</span>}
                        <span className="ml-2 font-normal text-slate-500">({d.fecha})</span>
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {esIA && (
                          <span className="rounded-full bg-violet-100/90 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                            IA
                          </span>
                        )}
                        {hayKcal && (
                          <span className="rounded-full border border-amber-200/90 bg-amber-50/90 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-amber-900">
                            ~{Math.round(totalDia.kcal)} kcal
                          </span>
                        )}
                        {totalDia.proteinG > 0 && (
                          <span className="rounded-full border border-sky-200/90 bg-sky-50/90 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-sky-900">
                            P {totalDia.proteinG.toFixed(0)} g
                          </span>
                        )}
                        {totalDia.fatG > 0 && (
                          <span className="rounded-full border border-violet-200/90 bg-violet-50/90 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-violet-900">
                            G {totalDia.fatG.toFixed(0)} g
                          </span>
                        )}
                        {hayVideo && (
                          <span
                            className="rounded-full border border-teal-200/90 bg-teal-50/90 px-2 py-0.5 text-[10px] font-semibold text-teal-800"
                            title="Vídeo disponible en el detalle"
                          >
                            ▶ vídeo
                          </span>
                        )}
                      </div>
                    </div>
                    <button type="button" className="ui-btn-secondary shrink-0 px-3 py-1 text-xs" onClick={() => abrirDia(d)}>
                      Ver detalle del día
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {(["desayuno", "almuerzo", "cena"] as const).map((slot) => {
                      const c = d.comidas[slot];
                      const tituloSlot =
                        slot === "desayuno" ? "Desayuno" : slot === "almuerzo" ? "Almuerzo" : "Cena";
                      return (
                        <div key={slot} className="ui-meal-slot">
                          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{tituloSlot}</p>
                          <p className="mt-1 font-medium leading-snug text-slate-900">{c.titulo}</p>
                          <p className="mt-1 line-clamp-3 text-xs text-slate-500">{c.receta}</p>
                          {c.youtubeVideoId && (
                            <p className="mt-1.5 text-[10px] font-medium text-teal-700">▶ Ver receta en detalle</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
