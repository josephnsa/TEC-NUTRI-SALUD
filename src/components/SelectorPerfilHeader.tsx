import { useEffect, useState } from "react";
import {
  PERFILES_STORAGE_EVENT,
  getActivoPerfilId,
  listPerfilesMiembros,
  setActivoPerfilId
} from "../lib/perfilStorage";

/**
 * Selector compacto de perfil activo (multiperfil local).
 * Oculto si aún no hay colección guardada en disco.
 */
export function SelectorPerfilHeader() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(PERFILES_STORAGE_EVENT, bump);
    return () => window.removeEventListener(PERFILES_STORAGE_EVENT, bump);
  }, []);

  const miembros = listPerfilesMiembros();
  const activo = getActivoPerfilId();
  if (!miembros.length) return null;

  const label = (nombre: string, i: number) => (nombre.trim() ? nombre.trim() : `Persona ${i + 1}`);

  return (
    <div className="min-w-0 max-w-[9.5rem] flex-1 sm:max-w-xs">
      <label className="sr-only" htmlFor="selector-perfil-global">
        Perfil activo
      </label>
      <select
        id="selector-perfil-global"
        className="w-full truncate rounded-xl border border-emerald-200/80 bg-white/90 px-2 py-1.5 text-xs font-medium text-teal-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        value={activo ?? miembros[0]?.id ?? ""}
        onChange={(e) => {
          if (setActivoPerfilId(e.target.value)) {
            setTick((t) => t + 1);
          }
        }}
      >
        {miembros.map((m, i) => (
          <option key={m.id} value={m.id}>
            {label(m.nombre, i)}
          </option>
        ))}
      </select>
    </div>
  );
}
