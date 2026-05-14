import { supabase } from "./supabase";
import type { MercadoSnapshot } from "./mercadoHistorial";
import { fusionarMercadosRemotos } from "./mercadoHistorial";
import type { CronogramaSnapshot } from "./cronogramaHistorial";
import { fusionarPlanesRemotos } from "./cronogramaHistorial";

type MarketRow = {
  perfil_local_id: string;
  snapshot_local_id: string;
  payload: unknown;
  updated_at: string;
};

type PlanRow = {
  perfil_local_id: string;
  snapshot_local_id: string;
  payload: unknown;
  updated_at: string;
};

const ON_CONFLICT_MARKET = "user_id,perfil_local_id,snapshot_local_id";
const ON_CONFLICT_PLAN = "user_id,perfil_local_id,snapshot_local_id";

export type SnapshotPushResult =
  | { ok: true }
  | { ok: false; error: string };

export async function pushMercadoSnapshotRemote(userId: string, snap: MercadoSnapshot): Promise<SnapshotPushResult> {
  if (!supabase) return { ok: false, error: "Cliente Supabase no disponible." };
  const perfilId = snap.perfilId ?? "_";
  const now = new Date().toISOString();
  const payload = { ...snap, updatedAt: now };
  const { error } = await supabase.from("user_market_snapshots").upsert(
    {
      user_id: userId,
      perfil_local_id: perfilId,
      snapshot_local_id: snap.id,
      payload,
      updated_at: now
    },
    { onConflict: ON_CONFLICT_MARKET }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function pushPlanSnapshotRemote(userId: string, snap: CronogramaSnapshot): Promise<SnapshotPushResult> {
  if (!supabase) return { ok: false, error: "Cliente Supabase no disponible." };
  const now = new Date().toISOString();
  const payload = { ...snap, updatedAt: now };
  const { error } = await supabase.from("user_plan_snapshots").upsert(
    {
      user_id: userId,
      perfil_local_id: snap.perfilId,
      snapshot_local_id: snap.id,
      payload,
      updated_at: now
    },
    { onConflict: ON_CONFLICT_PLAN }
  );
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Descarga y fusiona snapshots remotos con localStorage (LWW por `updated_at`). */
export async function pullCloudSnapshots(userId: string): Promise<{
  mercados: number;
  planes: number;
  ok: boolean;
  error?: string;
}> {
  if (!supabase) return { mercados: 0, planes: 0, ok: false, error: "Supabase no configurado." };
  const [mRes, pRes] = await Promise.all([
    supabase.from("user_market_snapshots").select("payload, updated_at").eq("user_id", userId),
    supabase.from("user_plan_snapshots").select("payload, updated_at").eq("user_id", userId)
  ]);
  if (mRes.error || pRes.error) {
    const msg = mRes.error?.message ?? pRes.error?.message ?? "Error al leer la nube.";
    return { mercados: 0, planes: 0, ok: false, error: msg };
  }
  const mRows = (mRes.data ?? []) as MarketRow[];
  const pRows = (pRes.data ?? []) as PlanRow[];
  const mercados = fusionarMercadosRemotos(mRows.map((r) => ({ payload: r.payload, updated_at: r.updated_at })));
  const planes = fusionarPlanesRemotos(pRows.map((r) => ({ payload: r.payload, updated_at: r.updated_at })));
  return { mercados, planes, ok: true };
}
