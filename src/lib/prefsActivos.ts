import { getSnapshotActivoId, listarSnapshots, setSnapshotActivoId } from "./cronogramaHistorial";
import {
  activeMercadoStorageKey,
  getMercadoActivoParaPlan,
  getMercadoRealizado
} from "./mercadoHistorial";
import type { EstadoPerfiles } from "./perfilStorage";
import {
  getActivoPerfilId,
  loadEstadoPerfiles,
  readEstadoPerfilesForSync,
  writeEstadoPerfilesDirect
} from "./perfilStorage";

export { ACTIVOS_PREFS_EVENT } from "./perfilStorage";

/** Tras login/sync: aplica claves locales desde `activosModulo` si el snapshot existe. */
export function restaurarActivosLocalesDesdeEstado(estado?: EstadoPerfiles | null): void {
  const e = estado ?? loadEstadoPerfiles();
  if (!e?.activosModulo) return;

  for (const [perfilId, mercadoId] of Object.entries(e.activosModulo.mercadoPorPerfil ?? {})) {
    if (!getMercadoRealizado(mercadoId)) continue;
    try {
      localStorage.setItem(activeMercadoStorageKey(perfilId), mercadoId);
    } catch {
      /* ignore */
    }
  }

  for (const [perfilId, planId] of Object.entries(e.activosModulo.planPorPerfil ?? {})) {
    const existe = listarSnapshots(perfilId).some((s) => s.id === planId);
    if (!existe) continue;
    setSnapshotActivoId(perfilId, planId);
  }
}

/** Sincroniza `activosModulo` con lo que hay en localStorage (p. ej. tras pull de nube). */
export function capturarActivosLocalesEnEstado(): void {
  const e = readEstadoPerfilesForSync();
  if (!e) return;
  const mercadoPorPerfil: Record<string, string> = { ...(e.activosModulo?.mercadoPorPerfil ?? {}) };
  const planPorPerfil: Record<string, string> = { ...(e.activosModulo?.planPorPerfil ?? {}) };

  for (const m of e.perfiles) {
    try {
      const mid = localStorage.getItem(activeMercadoStorageKey(m.id));
      if (mid && getMercadoRealizado(mid)) mercadoPorPerfil[m.id] = mid;
    } catch {
      /* ignore */
    }
    const sid = getSnapshotActivoId(m.id);
    if (sid && listarSnapshots(m.id).some((s) => s.id === sid)) planPorPerfil[m.id] = sid;
  }

  const pid = getActivoPerfilId();
  if (pid) {
    const activoMercado = getMercadoActivoParaPlan();
    if (activoMercado && getMercadoRealizado(activoMercado)) mercadoPorPerfil[pid] = activoMercado;
  }

  writeEstadoPerfilesDirect({
    ...e,
    activosModulo: {
      ...(Object.keys(mercadoPorPerfil).length ? { mercadoPorPerfil } : {}),
      ...(Object.keys(planPorPerfil).length ? { planPorPerfil } : {})
    }
  });
}
