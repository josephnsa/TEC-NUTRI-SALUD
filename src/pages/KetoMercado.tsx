import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { useAuth } from "../context/AuthContext";
import {
  generarListaKeto,
  loadListaLocal,
  saveListaLocal,
  type ListaItem
} from "../lib/ketoMercado";
import {
  anotarMercado,
  contarComprados,
  descargarRespaldoMercadoJson,
  eliminarMercadoRealizado,
  getMercadoActivoParaPlan,
  getMercadoRealizado,
  guardarMercadoRealizado,
  importarRespaldoMercadoJson,
  listarMercadosRealizados,
  renombrarMercado,
  setMercadoActivoParaPlan,
  type MercadoSnapshot
} from "../lib/mercadoHistorial";
import { PERFILES_STORAGE_EVENT } from "../lib/perfilStorage";
import { deleteMercadoSnapshotRemote, pushMercadoSnapshotRemote } from "../lib/snapshotsRemote";

export function KetoMercado() {
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const [dias, setDias] = useState(7);
  const [personas, setPersonas] = useState(2);
  const [items, setItems] = useState<ListaItem[]>(() => generarListaKeto(7, 2));
  const [historial, setHistorial] = useState<MercadoSnapshot[]>(() => listarMercadosRealizados());
  const [activoId, setActivoId] = useState<string | null>(() => getMercadoActivoParaPlan());
  const [msg, setMsg] = useState<string | null>(null);
  const inputRespaldoRef = useRef<HTMLInputElement>(null);
  /** id del mercado cuyo nombre/nota se está editando en línea */
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editNota, setEditNota] = useState("");
  const [extraNombre, setExtraNombre] = useState("");
  const [extraCant, setExtraCant] = useState(1);
  const [extraUni, setExtraUni] = useState("g");

  const refreshHistorial = useCallback(() => {
    setHistorial(listarMercadosRealizados());
    setActivoId(getMercadoActivoParaPlan());
  }, []);

  useEffect(() => {
    const saved = loadListaLocal();
    if (saved?.items?.length) {
      setDias(saved.dias);
      setPersonas(saved.personas);
      setItems(saved.items);
    }
    refreshHistorial();
  }, [refreshHistorial]);

  useEffect(() => {
    const onPerfil = () => {
      const saved = loadListaLocal();
      if (saved?.items?.length) {
        setDias(saved.dias);
        setPersonas(saved.personas);
        setItems(saved.items);
      } else {
        setDias(7);
        setPersonas(2);
        setItems(generarListaKeto(7, 2));
      }
      refreshHistorial();
    };
    window.addEventListener(PERFILES_STORAGE_EVENT, onPerfil);
    return () => window.removeEventListener(PERFILES_STORAGE_EVENT, onPerfil);
  }, [refreshHistorial]);

  const persist = useCallback(
    (next: ListaItem[], d: number, p: number) => {
      setItems(next);
      saveListaLocal({ dias: d, personas: p, items: next, updatedAt: new Date().toISOString() });
    },
    []
  );

  const regenerar = () => {
    const next = generarListaKeto(dias, personas);
    persist(next, dias, personas);
    setMsg(null);
  };

  const toggle = (id: string) => {
    const next = items.map((it) => (it.id === id ? { ...it, comprado: !it.comprado } : it));
    persist(next, dias, personas);
  };

  const marcarTodosComprados = () => {
    const next = items.map((it) => ({ ...it, comprado: true }));
    persist(next, dias, personas);
    setMsg(null);
  };

  const desmarcarTodosComprados = () => {
    const next = items.map((it) => ({ ...it, comprado: false }));
    persist(next, dias, personas);
    setMsg(null);
  };

  const todosComprados = useMemo(() => items.length > 0 && items.every((i) => i.comprado), [items]);
  const ningunoComprado = useMemo(() => items.length > 0 && items.every((i) => !i.comprado), [items]);

  const guardarMercado = () => {
    void (async () => {
      const n = contarComprados(items);
      const snap = guardarMercadoRealizado(dias, personas, items);
      refreshHistorial();
      let nube = "";
      if (user?.id && isConfigured) {
        const r = await pushMercadoSnapshotRemote(user.id, snap);
        if (!r.ok) nube = ` Nube: no copiado (${r.error}).`;
      }
      if (n === 0) {
        setMsg(
          `Guardado. Abriendo cronograma… (marca comprados para priorizar ingredientes).${nube}`
        );
      } else {
        setMsg(`Guardado. Abriendo cronograma…${nube}`);
      }
      navigate("/cronograma", { state: { desdeMercado: true } });
    })();
  };

  const activar = (id: string) => {
    setMercadoActivoParaPlan(id);
    refreshHistorial();
    setMsg("Mercado activo para el plan.");
  };

  const borrar = (id: string) => {
    if (!window.confirm("¿Eliminar este mercado del historial?")) return;
    const prev = getMercadoRealizado(id);
    eliminarMercadoRealizado(id);
    if (editandoId === id) setEditandoId(null);
    refreshHistorial();
    setMsg("Entrada eliminada del historial.");
    if (user?.id && isConfigured && prev) {
      void (async () => {
        const r = await deleteMercadoSnapshotRemote(user.id, prev.perfilId, prev.id);
        if (!r.ok) {
          setMsg(`Entrada borrada aquí; la copia en la nube no se pudo quitar (${r.error}).`);
        }
      })();
    }
  };

  const abrirEdicion = (h: MercadoSnapshot) => {
    setEditandoId(h.id);
    setEditNombre(h.nombre ?? "");
    setEditNota(h.nota ?? "");
  };

  const guardarEdicion = (id: string) => {
    renombrarMercado(id, editNombre);
    anotarMercado(id, editNota);
    refreshHistorial();
    setEditandoId(null);
  };

  const onImportarRespaldo = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result ?? "");
      const r = importarRespaldoMercadoJson(texto);
      if (r.ok) {
        refreshHistorial();
        setMsg(`Importado: ${r.fusionados} mercado(s).`);
      } else {
        setMsg(r.error);
      }
    };
    reader.onerror = () => {
      setMsg("No se pudo leer el archivo.");
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const agregarItemManual = () => {
    const nome = extraNombre.trim();
    if (nome.length < 2) {
      setMsg("Escribe al menos 2 caracteres para el ítem extra.");
      return;
    }
    const id = `manual-${crypto.randomUUID()}`;
    const cant = Math.max(0.5, Number(extraCant) || 1);
    const nuevo: ListaItem = {
      id,
      nombre: nome,
      nombreCustom: nome,
      unidad: extraUni,
      basePorPersonaDia: 0,
      categoria: "extras",
      cantidad,
      comprado: false,
      origen: "manual"
    };
    persist([...items, nuevo], dias, personas);
    setExtraNombre("");
    setMsg("Ítem extra añadido a la lista.");
  };

  const grupos = useMemo(() => {
    const m = new Map<string, ListaItem[]>();
    items.forEach((it) => {
      const arr = m.get(it.categoria) ?? [];
      arr.push(it);
      m.set(it.categoria, arr);
    });
    return m;
  }, [items]);

  const labels: Record<string, string> = {
    proteina: "Proteínas",
    grasa: "Grasas saludables",
    verdura: "Verduras",
    lacteo: "Lácteos",
    extras: "Extras"
  };

  return (
    <div className="space-y-8">
      <StepHeader pasoActual={2} titulo="Mercado dieta keto" />

      <p className="rounded-xl border border-amber-200/80 bg-amber-50/85 px-4 py-3 text-xs text-amber-950 shadow-sm backdrop-blur-sm">
        Antes completa{" "}
        <Link
          className="font-semibold text-amber-950 underline decoration-amber-600/50 hover:decoration-amber-800"
          to="/mi-plan"
        >
          Mis datos
        </Link>
        .
      </p>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={guardarMercado} className="ui-btn-primary">
          Guardar mercado realizado
        </button>
        <Link to="/cronograma" className="ui-btn-secondary inline-flex items-center justify-center">
          Ver cronograma
        </Link>
      </div>
      {msg && (
        <p className="rounded-xl border border-teal-200/80 bg-teal-50/90 px-3 py-2 text-sm text-teal-900 shadow-sm backdrop-blur-sm">
          {msg}
        </p>
      )}

      <div className="ui-card grid gap-4 md:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-teal-950">Días de compra</span>
          <input
            type="number"
            min={1}
            max={30}
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-teal-950">Personas</span>
          <input
            type="number"
            min={1}
            max={12}
            className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            value={personas}
            onChange={(e) => setPersonas(Number(e.target.value))}
          />
        </label>
        <div className="flex items-end">
          <button type="button" onClick={regenerar} className="ui-btn-primary w-full">
            Generar / actualizar lista
          </button>
        </div>
      </div>

      <div className="ui-card-muted flex flex-wrap items-center gap-2 px-4 py-3">
        <span className="text-sm font-medium text-teal-900">Selección rápida:</span>
        <button
          type="button"
          onClick={marcarTodosComprados}
          disabled={todosComprados}
          className="ui-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compré todo de una vez
        </button>
        <button
          type="button"
          onClick={desmarcarTodosComprados}
          disabled={ningunoComprado}
          className="ui-btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Desmarcar todo
        </button>
      </div>

      <div className="ui-card space-y-3">
        <p className="text-sm font-semibold text-teal-950">Ítems extra en la despensa</p>
        <p className="text-xs text-slate-600">
          Añade alimentos fuera de la lista generada para que el cronograma y las recetas IA los tengan en cuenta.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="min-w-[8rem] flex-1 text-xs">
            <span className="font-medium text-teal-950">Nombre</span>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              value={extraNombre}
              onChange={(e) => setExtraNombre(e.target.value)}
              placeholder='Ej. Yogurt griego, pesto…'
              maxLength={80}
            />
          </label>
          <label className="w-24 text-xs">
            <span className="font-medium text-teal-950">Cant.</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-2 py-2 text-sm shadow-sm"
              value={extraCant}
              onChange={(e) => setExtraCant(Number(e.target.value))}
            />
          </label>
          <label className="min-w-[7rem] text-xs">
            <span className="font-medium text-teal-950">Unidad</span>
            <select
              className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-2 py-2 text-sm shadow-sm"
              value={extraUni}
              onChange={(e) => setExtraUni(e.target.value)}
            >
              <option value="g">g</option>
              <option value="ml">ml</option>
              <option value="unidades">unidades</option>
            </select>
          </label>
          <button type="button" className="ui-btn-secondary px-4 py-2 text-sm whitespace-nowrap" onClick={agregarItemManual}>
            Agregar ítem
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-emerald-300/70 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur-sm">
        <p className="font-medium text-teal-950">Respaldo (JSON)</p>
        <p className="mt-1 text-xs text-slate-600">Descarga o importa para fusionar entre dispositivos.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => descargarRespaldoMercadoJson()}
            className="ui-btn-secondary px-3 py-1.5 text-xs"
          >
            Descargar JSON
          </button>
          <button
            type="button"
            onClick={() => inputRespaldoRef.current?.click()}
            className="ui-btn-violet px-3 py-1.5 text-xs"
          >
            Importar JSON
          </button>
          <input
            ref={inputRespaldoRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImportarRespaldo}
          />
        </div>
      </div>

      {historial.length > 0 && (
        <section className="ui-card">
          <h2 className="ui-section-title">Mis compras guardadas</h2>
          <ul className="mt-3 space-y-3">
            {historial.map((h) => {
              const comprados = contarComprados(h.items);
              const fecha = new Date(h.createdAt).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
              const esActivo = h.id === activoId;
              const editando = editandoId === h.id;
              return (
                <li
                  key={h.id}
                  className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur-sm transition ${
                    esActivo
                      ? "border-emerald-300/90 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 shadow-sm"
                      : "border-white/80 bg-white/80 shadow-sm"
                  }`}
                >
                  {/* Cabecera del mercado */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      {h.nombre ? (
                        <p className="font-semibold text-teal-950">{h.nombre}</p>
                      ) : null}
                      <p className={h.nombre ? "text-xs text-slate-500" : "font-medium text-slate-900"}>
                        {fecha} · {h.dias} días, {h.personas} pers. · {comprados} comprados
                      </p>
                      {h.nota && !editando && (
                        <p className="mt-0.5 text-xs text-amber-800">{h.nota}</p>
                      )}
                      {esActivo && (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800">
                          ✓ Activo para plan
                        </span>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 flex-wrap gap-2">
                      {!esActivo && (
                        <button
                          type="button"
                          className="ui-btn-secondary px-2 py-1 text-xs"
                          onClick={() => activar(h.id)}
                        >
                          Usar para plan
                        </button>
                      )}
                      <button
                        type="button"
                        className="ui-btn-secondary px-2 py-1 text-xs"
                        onClick={() => (editando ? setEditandoId(null) : abrirEdicion(h))}
                      >
                        {editando ? "Cancelar" : "Editar"}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-red-200/90 bg-white/90 px-2 py-1 text-xs text-red-700 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                        onClick={() => borrar(h.id)}
                      >
                        Borrar
                      </button>
                    </div>
                  </div>

                  {/* Formulario de edición inline */}
                  {editando && (
                    <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                      <label className="block text-xs font-medium text-teal-900">
                        Nombre (ej. "Semana 19 mayo")
                        <input
                          type="text"
                          maxLength={60}
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          placeholder="Nombre amigable opcional"
                          className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </label>
                      <label className="block text-xs font-medium text-teal-900">
                        Nota (opcional)
                        <input
                          type="text"
                          maxLength={120}
                          value={editNota}
                          onChange={(e) => setEditNota(e.target.value)}
                          placeholder='Ej. "Solo verdurería"'
                          className="mt-1 w-full rounded-xl border border-emerald-200/80 bg-white/90 px-3 py-1.5 text-sm text-slate-900 shadow-sm backdrop-blur-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      </label>
                      <button
                        type="button"
                        className="ui-btn-primary px-4 py-1.5 text-xs"
                        onClick={() => guardarEdicion(h.id)}
                      >
                        Guardar cambios
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <div className="space-y-8">
        {Array.from(grupos.entries()).map(([cat, list]) => (
          <section key={cat}>
            <h2 className="ui-section-title mb-2 text-gradient-brand">{labels[cat] ?? cat}</h2>
            <ul className="space-y-2">
              {list.map((it) => (
                <li
                  key={it.id}
                  className={`flex items-start gap-3 rounded-2xl border px-3 py-3 shadow-sm backdrop-blur-sm transition motion-safe:hover:shadow-md ${
                    it.comprado
                      ? "border-emerald-200/90 bg-gradient-to-br from-emerald-50/80 to-white/90"
                      : "border-white/80 bg-white/95"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={it.comprado}
                    onChange={() => toggle(it.id)}
                    className="mt-1 h-5 w-5 rounded border-emerald-300 text-teal-600 focus:ring-teal-500/30"
                    aria-label={`Marcar ${it.nombre}`}
                  />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${it.comprado ? "text-slate-500 line-through" : "text-slate-900"}`}
                      >
                        {it.nombreCustom?.trim() ? it.nombreCustom : it.nombre}
                      </p>
                      {it.origen === "manual" ? (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-900">
                          Extra
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-600">
                      {it.cantidad} {it.unidad}
                    </p>
                    {it.nota && <p className="mt-1 text-xs text-amber-800">{it.nota}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
