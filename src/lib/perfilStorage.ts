import type { PerfilUsuario } from "./nutritionPlan";

const PERFIL_KEY_LEGACY = "tec_nutri_salud_perfil_v1";
const PERFILES_KEY = "tec_nutri_salud_perfiles_v1";

export const PERFILES_STORAGE_EVENT = "tec-nutri-salud-perfiles";

export const MAX_PERFILES = 8;

export type PerfilMiembro = PerfilUsuario & {
  id: string;
  creadoEn: string;
  /** ISO date YYYY-MM-DD; inicio del “día 1” del plan (fase 2.3). */
  fechaInicioPlan?: string | null;
};

/** Preferencias de mercado/plan activos por perfil (sync en `family_json`). */
export type ActivosModuloPrefs = {
  mercadoPorPerfil?: Record<string, string>;
  planPorPerfil?: Record<string, string>;
};

export type EstadoPerfiles = {
  perfiles: PerfilMiembro[];
  activoId: string;
  activosModulo?: ActivosModuloPrefs;
};

function emitPerfilesChanged() {
  try {
    window.dispatchEvent(new CustomEvent(PERFILES_STORAGE_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

/** Migra JSON antiguo (sin `nombre`) y sanea tipos. */
export function normalizePerfilParsed(raw: unknown): PerfilUsuario | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PerfilUsuario>;
  const estilo = o.estiloDieta;
  const estiloOk =
    estilo === "mediterranea" || estilo === "balanceada" || estilo === "keto" ? estilo : "keto";
  const nivel = o.nivelActividad;
  const nivelActividadOk =
    nivel === "sedentario" || nivel === "ligero" || nivel === "moderado" || nivel === "activo"
      ? nivel
      : undefined;
  let objetivosNutricion: PerfilUsuario["objetivosNutricion"];
  const rawObj = (o as { objetivosNutricion?: unknown }).objetivosNutricion;
  if (rawObj && typeof rawObj === "object") {
    const ob = rawObj as Record<string, unknown>;
    const pw = Number(ob.pesoObjetivoKg);
    const ritmo = ob.ritmo === "moderado" || ob.ritmo === "relajado" ? ob.ritmo : undefined;
    const okPeso = Number.isFinite(pw) && pw >= 35 && pw <= 300;
    if (okPeso || ritmo) {
      objetivosNutricion = {
        ...(okPeso ? { pesoObjetivoKg: Math.round(pw * 10) / 10 } : {}),
        ...(ritmo ? { ritmo } : {})
      };
    }
  }
  const sex = o.sexo;
  const sexoOk = sex === "m" || sex === "f" ? sex : "o";
  const edad = Math.min(120, Math.max(12, Math.round(Number(o.edad) || 32)));
  const pesoKg = Math.min(250, Math.max(30, Number(o.pesoKg) || 70));
  const tallaCm = Math.min(220, Math.max(120, Number(o.tallaCm) || 165));
  const nombre =
    typeof o.nombre === "string" ? o.nombre.trim().replace(/\s+/g, " ").slice(0, 80) : "";
  return {
    nombre,
    edad,
    pesoKg,
    tallaCm,
    sexo: sexoOk,
    enfermedades: typeof o.enfermedades === "string" ? o.enfermedades : "",
    alimentosEvitar: typeof o.alimentosEvitar === "string" ? o.alimentosEvitar : "",
    estiloDieta: estiloOk,
    ...(nivelActividadOk ? { nivelActividad: nivelActividadOk } : {}),
    ...(objetivosNutricion ? { objetivosNutricion } : {})
  };
}

function normalizeMiembro(raw: unknown): PerfilMiembro | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Partial<PerfilMiembro>;
  const base = normalizePerfilParsed(o);
  if (!base || typeof o.id !== "string" || !o.id) return null;
  const creadoEn = typeof o.creadoEn === "string" ? o.creadoEn : new Date().toISOString();
  const fip = o.fechaInicioPlan;
  const fechaInicioPlan =
    fip === null || fip === undefined
      ? null
      : typeof fip === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fip)
        ? fip
        : null;
  return { ...base, id: o.id, creadoEn, fechaInicioPlan: fechaInicioPlan ?? null };
}

function parseActivosModuloInline(raw: unknown): ActivosModuloPrefs | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as ActivosModuloPrefs;
  const mercado: Record<string, string> = {};
  const plan: Record<string, string> = {};
  if (o.mercadoPorPerfil && typeof o.mercadoPorPerfil === "object") {
    for (const [k, v] of Object.entries(o.mercadoPorPerfil)) {
      if (typeof k === "string" && typeof v === "string" && v.trim()) mercado[k] = v.trim();
    }
  }
  if (o.planPorPerfil && typeof o.planPorPerfil === "object") {
    for (const [k, v] of Object.entries(o.planPorPerfil)) {
      if (typeof k === "string" && typeof v === "string" && v.trim()) plan[k] = v.trim();
    }
  }
  if (!Object.keys(mercado).length && !Object.keys(plan).length) return undefined;
  return {
    ...(Object.keys(mercado).length ? { mercadoPorPerfil: mercado } : {}),
    ...(Object.keys(plan).length ? { planPorPerfil: plan } : {})
  };
}

/** Parsea estado multiperfil desde JSON ya deserializado (p. ej. `family_json` en Supabase). */
export function parseEstadoPerfilesFromUnknown(data: unknown): EstadoPerfiles | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Partial<EstadoPerfiles>;
  if (!Array.isArray(root.perfiles) || typeof root.activoId !== "string") return null;
  const perfiles = root.perfiles.map(normalizeMiembro).filter(Boolean) as PerfilMiembro[];
  if (!perfiles.length) return null;
  const activoOk = perfiles.some((p) => p.id === root.activoId) ? root.activoId : perfiles[0].id;
  const activosModulo = parseActivosModuloInline(root.activosModulo);
  return activosModulo ? { perfiles, activoId: activoOk, activosModulo } : { perfiles, activoId: activoOk };
}

function parseEstado(raw: string): EstadoPerfiles | null {
  try {
    return parseEstadoPerfilesFromUnknown(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Sustituye el estado local de perfiles por uno válido (sync nube). */
export function aplicarEstadoPerfilesRemoto(data: unknown): boolean {
  const e = parseEstadoPerfilesFromUnknown(data);
  if (!e) return false;
  writeEstado(e);
  return true;
}

/** Lectura sin efectos (prefs activos). */
export function readEstadoPerfilesForSync(): EstadoPerfiles | null {
  return readEstadoFromDisk();
}

/** Escritura directa del estado (prefs activos). */
export function writeEstadoPerfilesDirect(e: EstadoPerfiles): void {
  writeEstado(e);
}

export const ACTIVOS_PREFS_EVENT = "tec-nutri-salud-activos-prefs";

function emitActivosPrefsChanged() {
  try {
    window.dispatchEvent(new CustomEvent(ACTIVOS_PREFS_EVENT, { detail: {} }));
  } catch {
    /* ignore */
  }
}

function patchActivosModuloEnEstado(patch: Partial<ActivosModuloPrefs>): void {
  const e = readEstadoFromDisk();
  if (!e) return;
  const prev = e.activosModulo ?? {};
  const mercadoPorPerfil = { ...prev.mercadoPorPerfil, ...patch.mercadoPorPerfil };
  const planPorPerfil = { ...prev.planPorPerfil, ...patch.planPorPerfil };
  const activosModulo: ActivosModuloPrefs = {
    ...(Object.keys(mercadoPorPerfil).length ? { mercadoPorPerfil } : {}),
    ...(Object.keys(planPorPerfil).length ? { planPorPerfil } : {})
  };
  writeEstado({ ...e, activosModulo });
  emitActivosPrefsChanged();
}

/** Persiste id de mercado activo en `family_json` local (sync nube aparte). */
export function persistMercadoActivoEnFamily(perfilId: string, mercadoId: string | null): void {
  const e = readEstadoFromDisk();
  if (!e) return;
  const mercadoPorPerfil = { ...(e.activosModulo?.mercadoPorPerfil ?? {}) };
  if (mercadoId) mercadoPorPerfil[perfilId] = mercadoId;
  else delete mercadoPorPerfil[perfilId];
  patchActivosModuloEnEstado({ mercadoPorPerfil });
}

/** Persiste id de plan activo en `family_json` local (sync nube aparte). */
export function persistPlanActivoEnFamily(perfilId: string, planId: string | null): void {
  const e = readEstadoFromDisk();
  if (!e) return;
  const planPorPerfil = { ...(e.activosModulo?.planPorPerfil ?? {}) };
  if (planId) planPorPerfil[perfilId] = planId;
  else delete planPorPerfil[perfilId];
  patchActivosModuloEnEstado({ planPorPerfil });
}

function readEstadoFromDisk(): EstadoPerfiles | null {
  try {
    const raw = localStorage.getItem(PERFILES_KEY);
    if (raw) {
      const e = parseEstado(raw);
      if (e) return e;
    }
    const legacy = localStorage.getItem(PERFIL_KEY_LEGACY);
    if (!legacy) return null;
    const u = normalizePerfilParsed(JSON.parse(legacy));
    if (!u) return null;
    const id = crypto.randomUUID();
    const estado: EstadoPerfiles = {
      perfiles: [{ ...u, id, creadoEn: new Date().toISOString(), fechaInicioPlan: null }],
      activoId: id
    };
    localStorage.setItem(PERFILES_KEY, JSON.stringify(estado));
    localStorage.removeItem(PERFIL_KEY_LEGACY);
    emitPerfilesChanged();
    return estado;
  } catch {
    return null;
  }
}

function writeEstado(e: EstadoPerfiles) {
  localStorage.setItem(PERFILES_KEY, JSON.stringify(e));
  emitPerfilesChanged();
}

function nuevoMiembroDesdeUsuario(u: PerfilUsuario): PerfilMiembro {
  const n = normalizePerfilParsed(u) ?? u;
  return {
    ...n,
    id: crypto.randomUUID(),
    creadoEn: new Date().toISOString(),
    fechaInicioPlan: null
  };
}

export function stripToUsuario(m: PerfilMiembro): PerfilUsuario {
  const { id: _id, creadoEn: _c, fechaInicioPlan: _f, ...rest } = m;
  return rest;
}

export function loadEstadoPerfiles(): EstadoPerfiles | null {
  return readEstadoFromDisk();
}

export function getActivoPerfilId(): string | null {
  const e = readEstadoFromDisk();
  return e?.activoId ?? null;
}

export function listPerfilesMiembros(): PerfilMiembro[] {
  return readEstadoFromDisk()?.perfiles ?? [];
}

/** Primer id estable (para migrar mercados legacy sin perfilId). */
export function getPrimerPerfilId(): string | null {
  const e = readEstadoFromDisk();
  return e?.perfiles[0]?.id ?? null;
}

export function loadPerfilLocal(): PerfilUsuario | null {
  const e = readEstadoFromDisk();
  if (!e) return null;
  const m = e.perfiles.find((p) => p.id === e.activoId) ?? e.perfiles[0];
  return m ? stripToUsuario(m) : null;
}

/** Perfil activo con metadatos (id, fechas). */
export function loadPerfilMiembroActivo(): PerfilMiembro | null {
  const e = readEstadoFromDisk();
  if (!e) return null;
  return e.perfiles.find((p) => p.id === e.activoId) ?? e.perfiles[0] ?? null;
}

export function savePerfilLocal(p: PerfilUsuario) {
  const n = normalizePerfilParsed(p);
  if (!n) return;
  let e = readEstadoFromDisk();
  if (!e) {
    const m = nuevoMiembroDesdeUsuario(n);
    e = { perfiles: [m], activoId: m.id };
    writeEstado(e);
    return;
  }
  const estado = e;
  const idx = estado.perfiles.findIndex((x) => x.id === estado.activoId);
  if (idx === -1) {
    const m = nuevoMiembroDesdeUsuario(n);
    e = { perfiles: [...e.perfiles, m], activoId: m.id };
    writeEstado(e);
    return;
  }
  const prev = e.perfiles[idx];
  const merged: PerfilMiembro = {
    ...n,
    id: prev.id,
    creadoEn: prev.creadoEn,
    fechaInicioPlan: prev.fechaInicioPlan ?? null
  };
  const perfiles = [...e.perfiles];
  perfiles[idx] = merged;
  writeEstado({ ...e, perfiles });
}

export function saveFechaInicioPlanActivo(isoDate: string | null) {
  const e = readEstadoFromDisk();
  if (!e) return;
  const idx = e.perfiles.findIndex((x) => x.id === e.activoId);
  if (idx === -1) return;
  const perfiles = [...e.perfiles];
  const m = perfiles[idx];
  let f: string | null = m.fechaInicioPlan ?? null;
  if (isoDate === null || isoDate === "") f = null;
  else if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) f = isoDate;
  perfiles[idx] = { ...m, fechaInicioPlan: f };
  writeEstado({ ...e, perfiles });
}

export function perfilGuardadoEnDispositivo(): boolean {
  try {
    return Boolean(localStorage.getItem(PERFILES_KEY) || localStorage.getItem(PERFIL_KEY_LEGACY));
  } catch {
    return false;
  }
}

export function setActivoPerfilId(id: string): boolean {
  const e = readEstadoFromDisk();
  if (!e || !e.perfiles.some((p) => p.id === id)) return false;
  if (e.activoId === id) return true;
  writeEstado({ ...e, activoId: id });
  return true;
}

export function addPerfilMiembro(): PerfilMiembro | null {
  const e = readEstadoFromDisk();
  if (!e) return null;
  if (e.perfiles.length >= MAX_PERFILES) return null;
  const m = nuevoMiembroDesdeUsuario(
    normalizePerfilParsed({
      nombre: "",
      edad: 32,
      pesoKg: 72,
      tallaCm: 168,
      sexo: "f",
      enfermedades: "",
      alimentosEvitar: "",
      estiloDieta: "keto"
    })!
  );
  writeEstado({ perfiles: [...e.perfiles, m], activoId: m.id });
  return m;
}

export function removePerfilMiembro(id: string): boolean {
  const e = readEstadoFromDisk();
  if (!e || e.perfiles.length <= 1) return false;
  const next = e.perfiles.filter((p) => p.id !== id);
  if (next.length === e.perfiles.length) return false;
  let activoId = e.activoId;
  if (activoId === id) activoId = next[0].id;
  writeEstado({ perfiles: next, activoId });
  return true;
}
