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
      setMsg(
        "Mercado guardado. Abriendo tu cronograma… (marca comprados la próxima vez para priorizar mejor ingredientes)."
      );
    } else {
      setMsg("Mercado guardado. Abriendo tu cronograma…");
    }
    navigate("/cronograma", { state: { desdeMercado: true } });
  };

  const activar = (id: string) => {
    setMercadoActivoParaPlan(id);
    refreshHistorial();
    setMsg("Este mercado quedó activo para el cronograma.");
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
        setMsg(`Respaldo importado: ${r.fusionados} mercado(s) fusionados con tu historial local.`);
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
    <div className="space-y-6">
      <StepHeader
        pasoActual={2}
        titulo="Mercado dieta keto"
        subtitulo="Genera la lista, compra y marca lo que trajiste. Guardar te lleva al cronograma (paso 3) con la despensa enlazada."
      />

      <p className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
        ¿Primera vez? Completa antes{" "}
        <Link className="font-semibold text-amber-900 underline" to="/mi-plan">
          paso 1 · Mis datos
        </Link>{" "}
        para que el menú respete tu perfil.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={guardarMercado}
          className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-teal-950"
        >
          Guardar mercado realizado
        </button>
        <Link
          to="/cronograma"
          className="inline-flex items-center rounded-xl border border-leaf-300 bg-white px-4 py-2 text-sm font-semibold text-leaf-900 hover:bg-leaf-50"
        >
          Ver cronograma
        </Link>
      </div>
      {msg && <p className="text-sm text-slate-700">{msg}</p>}

      <div className="grid gap-4 rounded-2xl border border-leaf-100 bg-white p-4 shadow-sm md:grid-cols-3">
        <label className="text-sm">
          <span className="font-medium text-slate-800">Días de compra</span>
          <input
            type="number"
            min={1}
            max={30}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          <span className="font-medium text-slate-800">Personas</span>
          <input
            type="number"
            min={1}
            max={12}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={personas}
            onChange={(e) => setPersonas(Number(e.target.value))}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={regenerar}
            className="w-full rounded-xl bg-leaf-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-leaf-900"
          >
            Generar / actualizar lista
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Selección rápida:</span>
        <button
          type="button"
          onClick={marcarTodosComprados}
          disabled={todosComprados}
          className="rounded-xl bg-leaf-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compré todo de una vez
        </button>
        <button
          type="button"
          onClick={desmarcarTodosComprados}
          disabled={ningunoComprado}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Desmarcar todo
        </button>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-700">
        <p className="font-medium text-slate-900">Respaldo del historial</p>
        <p className="mt-1 text-xs text-slate-600">
          Descarga un JSON con tus mercados guardados o importa uno para fusionarlo (por ejemplo, otro dispositivo).
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => descargarRespaldoMercadoJson()}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50"
          >
            Descargar JSON
          </button>
          <button
            type="button"
            onClick={() => inputRespaldoRef.current?.click()}
            className="rounded-xl border border-leaf-300 bg-leaf-50 px-3 py-1.5 text-xs font-semibold text-leaf-900 hover:bg-leaf-100"
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
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-leaf-900">Historial de mercados</h2>
          <ul className="mt-3 space-y-2">
            {historial.map((h) => {
              const comprados = contarComprados(h.items);
              const fecha = new Date(h.createdAt).toLocaleString("es");
              const esActivo = h.id === activoId;
              return (
                <li
                  key={h.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm ${
                    esActivo ? "border-leaf-400 bg-leaf-50" : "border-slate-100"
                  }`}
                >
                  <div>
                    <span className="font-medium text-slate-900">{fecha}</span>
                    <span className="text-slate-600">
                      {" "}
                      · {h.dias} días, {h.personas} pers. · {comprados} comprados
                    </span>
                    {esActivo && <span className="ml-2 text-xs font-semibold text-leaf-800">(activo para plan)</span>}
                  </div>
                  <div className="flex gap-2">
                    {!esActivo && (
                      <button
                        type="button"
                        className="rounded-lg border border-leaf-200 px-2 py-1 text-xs font-semibold text-leaf-800 hover:bg-leaf-50"
                        onClick={() => activar(h.id)}
                      >
                        Usar para plan
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
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

      <div className="space-y-6">
        {Array.from(grupos.entries()).map(([cat, list]) => (
          <section key={cat}>
            <h2 className="mb-2 font-display text-lg font-semibold text-leaf-800">{labels[cat] ?? cat}</h2>
            <ul className="space-y-2">
              {list.map((it) => (
                <li
                  key={it.id}
                  className={`flex items-start gap-3 rounded-2xl border px-3 py-3 ${
                    it.comprado ? "border-leaf-200 bg-leaf-50/60" : "border-slate-100 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={it.comprado}
                    onChange={() => toggle(it.id)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-leaf-700"
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
