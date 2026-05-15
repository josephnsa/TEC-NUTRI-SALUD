import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { DecimalField, IntField } from "../components/NumericInputs";
import { useAuth } from "../context/AuthContext";
import {
  calcularTdeePerfil,
  contarCompradosMercado,
  presupuestoKcalOrientativoDiario,
  resumenNutricional,
  type PerfilUsuario
} from "../lib/nutritionPlan";
import {
  PERFILES_STORAGE_EVENT,
  MAX_PERFILES,
  addPerfilMiembro,
  getActivoPerfilId,
  listPerfilesMiembros,
  loadEstadoPerfiles,
  loadPerfilLocal,
  loadPerfilMiembroActivo,
  perfilGuardadoEnDispositivo,
  removePerfilMiembro,
  saveFechaInicioPlanActivo,
  savePerfilLocal,
  setActivoPerfilId,
  stripToUsuario
} from "../lib/perfilStorage";
import { fetchAndApplyFamilyRemote, fetchProfileRemote, upsertProfileRemote } from "../lib/profileRemote";
import { pullCloudSnapshots } from "../lib/snapshotsRemote";
import { getMercadoActivoParaPlan, getMercadoRealizado, purgeMercadoDePerfil } from "../lib/mercadoHistorial";
import { purgeSnapshotsDePerfil } from "../lib/cronogramaHistorial";
import { RUTA_MI_ESPACIO } from "../lib/recorrido";

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

export function MiPlan() {
  const { user, isConfigured } = useAuth();
  const [perfil, setPerfil] = useState<PerfilUsuario>(defaultPerfil);
  const [status, setStatus] = useState<string | null>(null);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [mercadoActivoId, setMercadoActivoId] = useState<string | null>(() => getMercadoActivoParaPlan());
  const [fechaInicioPlan, setFechaInicioPlan] = useState<string>("");

  const bootDesdeAlmacenamiento = useCallback(() => {
    const l = loadPerfilLocal();
    if (l) setPerfil(l);
    else setPerfil(defaultPerfil);
    const m = loadPerfilMiembroActivo();
    setFechaInicioPlan(m?.fechaInicioPlan ?? "");
    setMercadoActivoId(getMercadoActivoParaPlan());
  }, []);

  useEffect(() => {
    bootDesdeAlmacenamiento();
    window.addEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
    return () => window.removeEventListener(PERFILES_STORAGE_EVENT, bootDesdeAlmacenamiento);
  }, [bootDesdeAlmacenamiento]);

  useEffect(() => {
    if (!user?.id || !isConfigured) return;
    setLoadingRemote(true);
    void (async () => {
      const remote = await fetchProfileRemote(user.id);
      if (remote) {
        setPerfil(remote);
        savePerfilLocal(remote);
        const m = loadPerfilMiembroActivo();
        setFechaInicioPlan(m?.fechaInicioPlan ?? "");
      }
      await fetchAndApplyFamilyRemote(user.id);
      const pulled = await pullCloudSnapshots(user.id);
      if (!pulled.ok) setStatus(`Aviso: no se pudieron fusionar datos de mercado/planes desde la nube (${pulled.error}).`);
      const mAfter = loadPerfilMiembroActivo();
      setFechaInicioPlan(mAfter?.fechaInicioPlan ?? "");
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

  const snapshotMercado = useMemo(() => {
    if (!mercadoActivoId) return null;
    return getMercadoRealizado(mercadoActivoId);
  }, [mercadoActivoId]);

  const itemsMercadoActivo = snapshotMercado?.items;
  const nComprados = contarCompradosMercado(itemsMercadoActivo);

  const resumen = useMemo(() => resumenNutricional(perfil), [perfil]);

  const guardar = async () => {
    setStatus(null);
    savePerfilLocal(perfil);
    if (user?.id && isConfigured) {
      const fam = loadEstadoPerfiles();
      const ok = await upsertProfileRemote(user.id, perfil, fam ? { family: fam } : undefined);
      setStatus(ok ? "Guardado en la nube y en el dispositivo." : "Solo en el dispositivo; revisa Supabase.");
    } else {
      setStatus("Guardado en el dispositivo. Inicia sesión para sincronizar.");
    }
  };

  const miembros = listPerfilesMiembros();
  const activoId = getActivoPerfilId() ?? miembros[0]?.id ?? "";

  const onCambiarPerfilLista = (id: string) => {
    if (setActivoPerfilId(id)) bootDesdeAlmacenamiento();
  };

  const onAnadirPersona = () => {
    if (!perfilGuardadoEnDispositivo()) {
      setStatus("Guarda una vez con «Guardar perfil» antes de añadir otra persona.");
      return;
    }
    const m = addPerfilMiembro();
    if (!m) setStatus(`Máximo ${MAX_PERFILES} perfiles.`);
    else {
      setPerfil(stripToUsuario(m));
      setFechaInicioPlan(m.fechaInicioPlan ?? "");
      setMercadoActivoId(getMercadoActivoParaPlan());
      setStatus("Nuevo perfil activo. Completa sus datos y mercado.");
    }
  };

  const onEliminarPersonaActiva = () => {
    if (miembros.length <= 1) return;
    if (!window.confirm("¿Eliminar el perfil activo? Se borrarán sus mercados y planes de menú guardados.")) return;
    const id = activoId;
    if (removePerfilMiembro(id)) {
      purgeMercadoDePerfil(id);
      purgeSnapshotsDePerfil(id);
      bootDesdeAlmacenamiento();
      setStatus("Perfil eliminado.");
    }
  };

  const onFechaInicioChange = (v: string) => {
    setFechaInicioPlan(v);
    saveFechaInicioPlanActivo(v || null);
  };

  return (
    <div className="space-y-8">
      <StepHeader
        pasoActual={1}
        titulo="Mi plan alimenticio"
        subtitulo={loadingRemote ? "Sincronizando perfil…" : undefined}
      />

      {miembros.length > 0 && (
        <section className="ui-card space-y-3" aria-labelledby="familia-heading">
          <h2 id="familia-heading" className="ui-section-title">
            Familia (este dispositivo)
          </h2>
          <p className="text-xs text-slate-600">
            Cada persona tiene su mercado y su lista de compras. Usa el selector de la barra superior o este menú para cambiar de perfil.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="font-medium text-teal-950">Perfil a editar</span>
              <select
                className="mt-1 block min-w-[12rem] rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={activoId}
                onChange={(e) => onCambiarPerfilLista(e.target.value)}
              >
                {miembros.map((m, i) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre.trim() || `Persona ${i + 1}`}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="font-medium text-teal-950">Inicio del plan (opcional)</span>
              <input
                type="date"
                className="mt-1 block rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={fechaInicioPlan}
                onChange={(e) => onFechaInicioChange(e.target.value)}
              />
            </label>
            <button type="button" className="ui-btn-secondary" onClick={onAnadirPersona}>
              Añadir persona
            </button>
            {miembros.length > 1 && (
              <button type="button" className="ui-btn-secondary text-red-800 hover:border-red-200" onClick={onEliminarPersonaActiva}>
                Quitar perfil activo
              </button>
            )}
          </div>
        </section>
      )}

      <div className="ui-card-muted flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-slate-800">
        <span className="font-semibold text-teal-900">Mercado para el plan:</span>
        {!mercadoActivoId ? (
          <span className="text-teal-800">
            Sin activo ·{" "}
            <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to="/keto-mercado">
              paso 2 · Mercado
            </Link>
          </span>
        ) : (
          <span className="text-teal-800">
            {snapshotMercado?.nombre ? <strong className="text-teal-950">{snapshotMercado.nombre} · </strong> : null}
            {nComprados} comprados ·{" "}
            <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to="/keto-mercado">
              editar
            </Link>
            {" · "}
            <Link className="font-semibold text-teal-900 underline decoration-teal-500/50 hover:decoration-teal-700" to={RUTA_MI_ESPACIO}>
              ver resumen
            </Link>
          </span>
        )}
      </div>

      {(() => {
        const campos = [
          { ok: perfil.nombre.trim().length > 0, label: "Nombre" },
          { ok: perfil.edad >= 12 && perfil.edad <= 100, label: "Edad" },
          { ok: perfil.pesoKg >= 30, label: "Peso" },
          { ok: perfil.tallaCm >= 120, label: "Talla" },
          { ok: !!perfil.estiloDieta, label: "Estilo de plan" },
          { ok: perfil.enfermedades.trim().length > 0, label: "Condiciones" },
          { ok: perfil.alimentosEvitar.trim().length > 0, label: "Evitar" },
          { ok: !!perfil.nivelActividad, label: "Actividad" },
          { ok: !!perfil.objetivosNutricion?.pesoObjetivoKg, label: "Objetivo peso" }
        ];
        const llenos = campos.filter((c) => c.ok).length;
        const pct = Math.round((llenos / campos.length) * 100);
        const nivel =
          pct >= 89 ? { label: "Detallado", color: "bg-emerald-100 text-emerald-800 border-emerald-200" }
          : pct >= 55 ? { label: "Recomendado", color: "bg-teal-100 text-teal-800 border-teal-200" }
          : { label: "Básico", color: "bg-amber-100 text-amber-800 border-amber-200" };
        return (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm shadow-sm">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${nivel.color}`}>
              {nivel.label}
            </span>
            <div className="flex-1 min-w-[6rem]">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
            <span className="text-xs tabular-nums text-slate-500">{llenos}/{campos.length} campos</span>
            {pct < 89 && (
              <span className="text-xs text-slate-500">
                Falta: {campos.filter((c) => !c.ok).map((c) => c.label).join(", ")}
              </span>
            )}
          </div>
        );
      })()}

      {(() => {
        const campos = [
          { ok: perfil.nombre.trim().length > 0 },
          { ok: perfil.edad >= 12 },
          { ok: perfil.pesoKg >= 30 },
          { ok: perfil.tallaCm >= 120 },
          { ok: !!perfil.estiloDieta },
          { ok: perfil.enfermedades.trim().length > 0 },
          { ok: perfil.alimentosEvitar.trim().length > 0 },
          { ok: !!perfil.nivelActividad },
          { ok: !!perfil.objetivosNutricion?.pesoObjetivoKg }
        ];
        const pct = Math.round((campos.filter((c) => c.ok).length / campos.length) * 100);
        if (pct < 55) return null;
        return (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200/80 bg-gradient-to-r from-violet-50/80 to-fuchsia-50/60 px-4 py-3 text-sm shadow-sm">
            <span className="text-lg">✦</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-violet-900">Tu perfil está listo para generar con IA</p>
              <p className="text-xs text-violet-700/80 mt-0.5">
                {pct >= 89
                  ? "Perfil completo · la IA usará todos tus datos para personalizar tu mercado y menú."
                  : "Perfil recomendado · puedes completar más campos para resultados aún más precisos."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/keto-mercado" className="rounded-full border border-violet-300 bg-white/80 px-3 py-1 text-xs font-semibold text-violet-900 shadow-sm hover:bg-violet-50 transition-colors">
                Generar mercado →
              </Link>
              <Link to="/cronograma" className="rounded-full border border-teal-300 bg-white/80 px-3 py-1 text-xs font-semibold text-teal-900 shadow-sm hover:bg-teal-50 transition-colors">
                Generar menú →
              </Link>
            </div>
          </div>
        );
      })()}

      <div className="ui-card grid gap-4 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Nombre o apodo</span>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/25"
            value={perfil.nombre}
            onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value.slice(0, 80) })}
            placeholder="Ej.: Ana, Luis, Mamá…"
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <IntField
          label="Edad"
          value={perfil.edad}
          onCommit={(edad) => setPerfil({ ...perfil, edad })}
          min={12}
          max={100}
        />
        <DecimalField
          label="Peso (kg)"
          value={perfil.pesoKg}
          onCommit={(pesoKg) => setPerfil({ ...perfil, pesoKg })}
          min={30}
          max={250}
          fractionDigits={1}
        />
        <IntField
          label="Talla (cm)"
          value={perfil.tallaCm}
          onCommit={(tallaCm) => setPerfil({ ...perfil, tallaCm })}
          min={120}
          max={220}
        />
        <label className="text-sm">
          <span className="font-medium">Sexo (cálculo energético)</span>
          <select
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.sexo}
            onChange={(e) => setPerfil({ ...perfil, sexo: e.target.value as PerfilUsuario["sexo"] })}
          >
            <option value="f">Femenino</option>
            <option value="m">Masculino</option>
            <option value="o">Otro / prefiero no decir</option>
          </select>
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Enfermedades o condiciones (texto libre)</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            rows={2}
            value={perfil.enfermedades}
            onChange={(e) => setPerfil({ ...perfil, enfermedades: e.target.value })}
            placeholder="Ej.: diabetes tipo 2, hipertensión…"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Alimentos que no te gustan (separar con coma)</span>
          <input
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.alimentosEvitar}
            onChange={(e) => setPerfil({ ...perfil, alimentosEvitar: e.target.value })}
            placeholder="Ej.: pescado, cilantro"
          />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="font-medium">Estilo de plan</span>
          <select
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={perfil.estiloDieta}
            onChange={(e) => setPerfil({ ...perfil, estiloDieta: e.target.value as PerfilUsuario["estiloDieta"] })}
          >
            <option value="keto">Keto / muy bajo carbohidrato</option>
            <option value="mediterranea">Mediterránea</option>
            <option value="balanceada">Balanceada</option>
          </select>
        </label>

        <div className="md:col-span-2 rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-white/95 via-cyan-50/40 to-teal-50/30 p-4 motion-safe:shadow-[0_0_32px_-14px_rgba(6,182,212,0.35)]">
          <p className="font-medium text-teal-950">Actividad y meta de peso (orientativo)</p>
          <p className="mt-1 text-xs text-slate-600">
            No sustituye valoración médica. Los números sirven sólo como guía educativa en la app.
          </p>
          <label className="mt-3 block text-sm">
            <span className="font-medium">Nivel de actividad (gasto estimado)</span>
            <select
              className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={perfil.nivelActividad ?? "sedentario"}
              onChange={(e) =>
                setPerfil({
                  ...perfil,
                  nivelActividad: e.target.value as NonNullable<PerfilUsuario["nivelActividad"]>
                })
              }
            >
              <option value="sedentario">Mayormente sedentario · ~×1.35</option>
              <option value="ligero">Actividad ligera · ~×1.45</option>
              <option value="moderado">Actividad moderada · ~×1.55</option>
              <option value="activo">Activo · ~×1.65</option>
            </select>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="font-medium">Peso objetivo (kg, opcional)</span>
              <input
                type="number"
                min={35}
                max={300}
                step="0.1"
                placeholder="Ej. 68"
                className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={perfil.objetivosNutricion?.pesoObjetivoKg ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  const o = perfil.objetivosNutricion ?? {};
                  if (raw === "") {
                    const { pesoObjetivoKg: _p, ...rest } = o;
                    setPerfil({
                      ...perfil,
                      objetivosNutricion: Object.keys(rest).length ? rest : undefined
                    });
                    return;
                  }
                  const n = Number(raw);
                  if (!Number.isFinite(n)) return;
                  setPerfil({
                    ...perfil,
                    objetivosNutricion: { ...o, pesoObjetivoKg: n }
                  });
                }}
              />
            </label>
            <label className="text-sm">
              <span className="font-medium">Ritmo (si definiste objetivo)</span>
              <select
                className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                value={perfil.objetivosNutricion?.ritmo ?? "relajado"}
                onChange={(e) =>
                  setPerfil({
                    ...perfil,
                    objetivosNutricion: {
                      ...(perfil.objetivosNutricion ?? {}),
                      ritmo: e.target.value as "relajado" | "moderado"
                    }
                  })
                }
              >
                <option value="relajado">Relajado (cambios más graduales — referencia)</option>
                <option value="moderado">Moderado (mayor déficit/superávit de referencia)</option>
              </select>
            </label>
          </div>
        </div>

        {(() => {
          const objetivo = perfil.objetivosNutricion?.pesoObjetivoKg;
          if (!objetivo || !perfil.nivelActividad) return null;
          const tdee = calcularTdeePerfil(perfil);
          const kcalObj = presupuestoKcalOrientativoDiario(perfil);
          if (!kcalObj) return null;
          const deltaDiario = Math.abs(tdee - kcalObj);
          if (deltaDiario < 10) return null;
          const deltaKg = Math.abs(perfil.pesoKg - objetivo);
          if (deltaKg < 0.5) {
            return (
              <div className="md:col-span-2 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">¡Estás en tu peso objetivo!</span> Mantén el plan actual.
              </div>
            );
          }
          const pierde = perfil.pesoKg > objetivo;
          const kcalPorKg = 7700;
          const diasEstimados = Math.round((deltaKg * kcalPorKg) / deltaDiario);
          const semanasEstimadas = Math.round(diasEstimados / 7);
          const mesesEstimados = (diasEstimados / 30.5).toFixed(1);
          const ritmo = perfil.objetivosNutricion?.ritmo ?? "relajado";
          return (
            <div className="md:col-span-2 rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-cyan-50/60 via-white/95 to-teal-50/40 px-4 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-800">
                {pierde ? "📉 Proyección para bajar de peso" : "📈 Proyección para ganar peso"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-cyan-100 bg-white/70 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Diferencia</p>
                  <p className="mt-0.5 font-mono text-xl font-bold text-cyan-900">{deltaKg.toFixed(1)} kg</p>
                  <p className="text-[10px] text-slate-500">{pierde ? `de ${perfil.pesoKg} a ${objetivo}` : `de ${perfil.pesoKg} a ${objetivo}`} kg</p>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-white/70 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{pierde ? "Déficit diario" : "Superávit diario"}</p>
                  <p className="mt-0.5 font-mono text-xl font-bold text-teal-900">~{deltaDiario} kcal</p>
                  <p className="text-[10px] text-slate-500">ritmo {ritmo}</p>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-white/70 px-3 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tiempo estimado</p>
                  <p className="mt-0.5 font-mono text-xl font-bold text-emerald-900">~{semanasEstimadas} sem</p>
                  <p className="text-[10px] text-slate-500">({mesesEstimados} meses aprox.)</p>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                Estimación orientativa basada en ~7.700 kcal/kg · Días estimados: {diasEstimados} · No sustituye valoración médica.
              </p>
            </div>
          );
        })()}

        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void guardar()}
            className="ui-btn-primary"
          >
            Guardar perfil
          </button>
        </div>
        {status && <p className="md:col-span-2 text-sm font-medium text-teal-900">{status}</p>}
      </div>

      <section className="ui-card space-y-5">
        <h2 className="ui-section-title">Resumen orientativo</h2>

        {(() => {
          const imc = perfil.pesoKg / Math.pow(perfil.tallaCm / 100, 2);
          if (!Number.isFinite(imc) || imc < 5 || imc > 80) return null;
          const imcVal = parseFloat(imc.toFixed(1));

          type Zona = { desde: number; hasta: number; label: string; color: string; ring: string; bg: string };
          const zonas: Zona[] = [
            { desde: 0,    hasta: 18.5, label: "Bajo peso",  color: "text-sky-700",    ring: "border-sky-300",    bg: "bg-sky-500" },
            { desde: 18.5, hasta: 25,   label: "Normal",     color: "text-emerald-700",ring: "border-emerald-300",bg: "bg-emerald-500" },
            { desde: 25,   hasta: 30,   label: "Sobrepeso",  color: "text-amber-700",  ring: "border-amber-300",  bg: "bg-amber-500" },
            { desde: 30,   hasta: 100,  label: "Obesidad",   color: "text-red-700",    ring: "border-red-300",    bg: "bg-red-500" },
          ];
          const zona = zonas.find((z) => imcVal >= z.desde && imcVal < z.hasta) ?? zonas[3]!;

          // Posición de la marca en la barra IMC (rango 15–40)
          const IMC_MIN = 15, IMC_MAX = 40;
          const markerPct = Math.min(100, Math.max(0, Math.round(((imcVal - IMC_MIN) / (IMC_MAX - IMC_MIN)) * 100)));

          const tdee = calcularTdeePerfil(perfil);
          const kcalObj = presupuestoKcalOrientativoDiario(perfil);

          return (
            <div className="grid gap-3 sm:grid-cols-3">
              {/* IMC */}
              <div className={`rounded-2xl border ${zona.ring} bg-white/80 p-4 shadow-sm`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">IMC</p>
                <p className={`mt-1 font-mono text-2xl font-bold tabular-nums ${zona.color}`}>{imcVal}</p>
                <p className={`text-xs font-semibold ${zona.color}`}>{zona.label}</p>
                <div className="relative mt-3 h-2 w-full overflow-visible rounded-full bg-gradient-to-r from-sky-300 via-emerald-400 to-red-400">
                  <div
                    className="absolute top-1/2 h-3.5 w-1 -translate-y-1/2 rounded-full bg-slate-800 shadow"
                    style={{ left: `calc(${markerPct}% - 2px)` }}
                    title={`IMC ${imcVal}`}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[9px] text-slate-400">
                  <span>15</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                </div>
              </div>

              {/* TDEE */}
              <div className="rounded-2xl border border-amber-200/80 bg-white/80 p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TDEE estimado</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-amber-800">~{tdee}</p>
                <p className="text-xs text-slate-500">kcal/día (mantenimiento)</p>
                <p className="mt-2 text-[10px] leading-snug text-slate-400">
                  Según Mifflin-St Jeor + actividad autodeclarada. No diagnóstico.
                </p>
              </div>

              {/* Objetivo */}
              <div className={`rounded-2xl border bg-white/80 p-4 shadow-sm ${kcalObj != null ? "border-teal-200/80" : "border-slate-200/60"}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {kcalObj != null ? "Objetivo calórico" : "Peso objetivo"}
                </p>
                {kcalObj != null ? (
                  <>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-teal-800">~{kcalObj}</p>
                    <p className="text-xs text-slate-500">kcal/día</p>
                    <p className="mt-2 text-[10px] leading-snug text-slate-400">
                      {kcalObj < tdee ? `Déficit ~${tdee - kcalObj} kcal/día` : `Superávit ~${kcalObj - tdee} kcal/día`}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-400">—</p>
                    <p className="text-xs text-slate-500">Define un peso objetivo arriba</p>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        <div>
          <p className="text-xs font-semibold text-slate-600">Notas adicionales</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-600">
            {resumen.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/keto-mercado" className="ui-btn-secondary">
          Paso 2 · Mercado →
        </Link>
        <Link to="/cronograma" className="ui-btn-primary">
          Paso 3 · Cronograma →
        </Link>
      </div>
    </div>
  );
}
