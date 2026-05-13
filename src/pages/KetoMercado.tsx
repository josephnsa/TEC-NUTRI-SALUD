import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import {
  generarListaKeto,
  loadListaLocal,
  saveListaLocal,
  type ListaItem
} from "../lib/ketoMercado";
import {
  contarComprados,
  descargarRespaldoMercadoJson,
  eliminarMercadoRealizado,
  getMercadoActivoParaPlan,
  guardarMercadoRealizado,
  importarRespaldoMercadoJson,
  listarMercadosRealizados,
  setMercadoActivoParaPlan,
  type MercadoSnapshot
} from "../lib/mercadoHistorial";

export function KetoMercado() {
  const navigate = useNavigate();
  const [dias, setDias] = useState(7);
  const [personas, setPersonas] = useState(2);
  const [items, setItems] = useState<ListaItem[]>(() => generarListaKeto(7, 2));
  const [historial, setHistorial] = useState<MercadoSnapshot[]>(() => listarMercadosRealizados());
  const [activoId, setActivoId] = useState<string | null>(() => getMercadoActivoParaPlan());
  const [msg, setMsg] = useState<string | null>(null);
  const inputRespaldoRef = useRef<HTMLInputElement>(null);

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
    const n = contarComprados(items);
    guardarMercadoRealizado(dias, personas, items);
    refreshHistorial();
    if (n === 0) {
      setMsg("Guardado. Abriendo cronograma… (marca comprados para priorizar ingredientes).");
    } else {
      setMsg("Guardado. Abriendo cronograma…");
    }
    navigate("/cronograma", { state: { desdeMercado: true } });
  };

  const activar = (id: string) => {
    setMercadoActivoParaPlan(id);
    refreshHistorial();
    setMsg("Mercado activo para el plan.");
  };

  const borrar = (id: string) => {
    eliminarMercadoRealizado(id);
    refreshHistorial();
    setMsg("Entrada eliminada del historial.");
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
          <h2 className="ui-section-title">Historial de mercados</h2>
          <ul className="mt-3 space-y-2">
            {historial.map((h) => {
              const comprados = contarComprados(h.items);
              const fecha = new Date(h.createdAt).toLocaleString("es");
              const esActivo = h.id === activoId;
              return (
                <li
                  key={h.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm backdrop-blur-sm transition motion-safe:hover:shadow ${
                    esActivo
                      ? "border-emerald-300/90 bg-gradient-to-r from-emerald-50/90 to-teal-50/50 shadow-sm"
                      : "border-white/80 bg-white/80 shadow-sm"
                  }`}
                >
                  <div>
                    <span className="font-medium text-slate-900">{fecha}</span>
                    <span className="text-slate-600">
                      {" "}
                      · {h.dias} días, {h.personas} pers. · {comprados} comprados
                    </span>
                    {esActivo && (
                      <span className="ml-2 text-xs font-semibold text-teal-800">(activo para plan)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
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
                      className="rounded-lg border border-red-200/90 bg-white/90 px-2 py-1 text-xs text-red-700 shadow-sm backdrop-blur-sm transition hover:bg-red-50"
                      onClick={() => borrar(h.id)}
                    >
                      Borrar
                    </button>
                  </div>
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
                    <p className={`font-medium ${it.comprado ? "text-slate-500 line-through" : "text-slate-900"}`}>
                      {it.nombre}
                    </p>
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
