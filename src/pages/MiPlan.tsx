import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { DecimalField, IntField } from "../components/NumericInputs";
import { useAuth } from "../context/AuthContext";
import {
  contarCompradosMercado,
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
            Cada persona tiene su mercado y lista keto. Usa el selector de la barra superior o este menú para cambiar de perfil.
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

      <section className="ui-card">
        <h2 className="ui-section-title">Resumen orientativo</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {resumen.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 via-white/95 to-cyan-50/50 p-5 shadow-md shadow-teal-900/5 backdrop-blur-sm">
        <h2 className="font-display text-lg font-semibold text-teal-950">Paso 3 · Cronograma</h2>
        <p className="mt-2 text-sm text-slate-600">
          Genera el menú por días usando plantillas o recetas con IA (Gemini), visualiza en lista o
          calendario, guarda planes con nombre y consulta el historial de semanas anteriores.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/cronograma" className="ui-btn-primary">
            Ir a generar cronograma →
          </Link>
          <Link to={RUTA_MI_ESPACIO} className="ui-btn-secondary">
            Ver resumen →
          </Link>
        </div>
      </section>
    </div>
  );
}
