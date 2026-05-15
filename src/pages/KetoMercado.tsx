import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StepHeader } from "../components/StepHeader";
import { useAuth } from "../context/AuthContext";
import {
  generarListaBase,
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
import { PERFILES_STORAGE_EVENT, loadPerfilLocal } from "../lib/perfilStorage";
import { deleteMercadoSnapshotRemote, pushMercadoSnapshotRemote } from "../lib/snapshotsRemote";
import { URL_GOOGLE_AI_STUDIO_API_KEY, geminiMercadoDisponible, generarMercadoIA } from "../lib/mercadoIA";
import { exportarMercadoPdf } from "../lib/pdfExport";

export function KetoMercado() {
  const navigate = useNavigate();
  const { user, isConfigured } = useAuth();
  const [dias, setDias] = useState(7);
  const [personas, setPersonas] = useState(2);
  const [items, setItems] = useState<ListaItem[]>(() => {
    const p = loadPerfilLocal();
    return generarListaBase(7, 2, p?.estiloDieta);
  });
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
  const [soloPendientes, setSoloPendientes] = useState(false);
  /** id del ítem cuya cantidad se está editando inline */
  const [editCantId, setEditCantId] = useState<string | null>(null);
  const [editCantVal, setEditCantVal] = useState("");
  /** IA mercado */
  const [iaMercadoCargando, setIaMercadoCargando] = useState(false);
  const [iaMercadoError, setIaMercadoError] = useState<string | null>(null);
  const [copiadoLista, setCopiadoLista] = useState(false);

  const refreshHistorial = useCallback(() => {
    setHistorial(listarMercadosRealizados());
    setActivoId(getMercadoActivoParaPlan());
  }, []);

  const copiarListaTexto = useCallback(() => {
    const labelsCopy: Record<string, string> = {
      proteina: "Proteínas",
      grasa: "Grasas saludables",
      verdura: "Verduras",
      lacteo: "Lácteos",
      extras: "Extras"
    };
    const gruposLocal = new Map<string, typeof items>();
    items.forEach((it) => {
      const arr = gruposLocal.get(it.categoria) ?? [];
      arr.push(it);
      gruposLocal.set(it.categoria, arr);
    });

    const lineas: string[] = [
      `🛒 Lista de compras · ${dias} días · ${personas} persona${personas !== 1 ? "s" : ""}`,
      ""
    ];
    gruposLocal.forEach((list, cat) => {
      lineas.push(`── ${labelsCopy[cat] ?? cat} ──`);
      list.forEach((it) => {
        const nombre = it.nombreCustom?.trim() || it.nombre;
        const cantidad = `${it.cantidad} ${it.unidad}`;
        lineas.push(`${it.comprado ? "✓" : "□"} ${nombre} · ${cantidad}`);
      });
      lineas.push("");
    });
    const comprados = items.filter((i) => i.comprado).length;
    lineas.push(`Progreso: ${comprados}/${items.length} ítems`);
    lineas.push("Generado con TEC Nutri Salud 🌿");

    void navigator.clipboard.writeText(lineas.join("\n")).then(() => {
      setCopiadoLista(true);
      setTimeout(() => setCopiadoLista(false), 2500);
    });
  }, [items, dias, personas]);

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
        setItems(generarListaBase(7, 2, loadPerfilLocal()?.estiloDieta));
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
    const perfil = loadPerfilLocal();
    const next = generarListaBase(dias, personas, perfil?.estiloDieta);
    persist(next, dias, personas);
    setMsg(null);
    setIaMercadoError(null);
  };

  const generarConIA = () => {
    const perfil = loadPerfilLocal();
    if (!perfil) {
      setIaMercadoError("Guarda tu perfil en Mis datos antes de usar la IA.");
      return;
    }
    setIaMercadoCargando(true);
    setIaMercadoError(null);
    void (async () => {
      try {
        const iaItems = await generarMercadoIA(perfil, dias, personas);
        persist(iaItems, dias, personas);
        const nombreDieta: Record<string, string> = {
          keto: "cetogénica",
          mediterranea: "mediterránea",
          balanceada: "balanceada"
        };
        setMsg(`IA generó ${iaItems.length} ítems personalizados para dieta ${nombreDieta[perfil.estiloDieta] ?? perfil.estiloDieta}.`);
      } catch (e) {
        setIaMercadoError(e instanceof Error ? e.message : "Error al generar con IA.");
      } finally {
        setIaMercadoCargando(false);
      }
    })();
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

  const abrirEditCant = (it: ListaItem) => {
    setEditCantId(it.id);
    setEditCantVal(String(it.cantidad));
  };

  const guardarEditCant = (id: string) => {
    const n = parseFloat(editCantVal.replace(",", "."));
    if (Number.isFinite(n) && n > 0) {
      const next = items.map((it) => (it.id === id ? { ...it, cantidad: Math.round(n * 10) / 10 } : it));
      persist(next, dias, personas);
    }
    setEditCantId(null);
  };

  const eliminarItem = (id: string, esManual: boolean) => {
    if (!esManual && !window.confirm("¿Quitar este ítem de la lista?")) return;
    const next = items.filter((it) => it.id !== id);
    persist(next, dias, personas);
    setMsg(esManual ? "Ítem extra eliminado." : "Ítem eliminado de la lista.");
  };

  const agregarItemManual = () => {
    const nome = extraNombre.trim();
    if (nome.length < 2) {
      setMsg("Escribe al menos 2 caracteres para el ítem extra.");
      return;
    }
    const id = `manual-${crypto.randomUUID()}`;
    const cantidad = Math.max(0.5, Number(extraCant) || 1);
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
        {items.length > 0 && (
          <button
            type="button"
            onClick={copiarListaTexto}
            title="Copiar lista completa para compartir por WhatsApp, notas, etc."
            className={`ui-btn-secondary transition ${copiadoLista ? "border-emerald-300 bg-emerald-50 text-emerald-800" : ""}`}
          >
            {copiadoLista ? "¡Lista copiada!" : "📋 Copiar lista"}
          </button>
        )}
        {items.length > 0 && (
          <button
            type="button"
            title="Descargar lista como PDF con tabla detallada"
            onClick={() => {
              const p = loadPerfilLocal();
              exportarMercadoPdf({
                items,
                dias,
                personas,
                nombrePerfil: p?.nombre ?? undefined,
                estiloDieta: p?.estiloDieta
              });
            }}
            className="ui-btn-secondary"
          >
            📄 Descargar PDF
          </button>
        )}
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
        <div className="flex items-end gap-2">
          {geminiMercadoDisponible() ? (
            <button
              type="button"
              disabled={iaMercadoCargando}
              onClick={generarConIA}
              className="ui-btn-violet flex-1"
            >
              {iaMercadoCargando ? (
                <span className="flex items-center justify-center gap-1.5">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
                  Generando con IA…
                </span>
              ) : (
                "Generar con IA ✦"
              )}
            </button>
          ) : null}
          <button type="button" onClick={regenerar} className="ui-btn-secondary flex-1">
            Generar lista base
          </button>
        </div>
        {!geminiMercadoDisponible() && (
          <p className="text-xs text-slate-500">
            Para personalizar la lista con IA, configura{" "}
            <a
              href={URL_GOOGLE_AI_STUDIO_API_KEY}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-teal-800 underline"
            >
              VITE_GEMINI_API_KEY
            </a>
            .
          </p>
        )}
        {iaMercadoError && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200/80 bg-red-50/90 px-3 py-2">
            <p className="text-sm text-red-700">{iaMercadoError}</p>
            <button
              type="button"
              className="shrink-0 rounded-lg border border-red-200/80 bg-white/90 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
              onClick={generarConIA}
            >
              Reintentar
            </button>
          </div>
        )}
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
        <button
          type="button"
          onClick={() => setSoloPendientes((v) => !v)}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            soloPendientes
              ? "border-teal-400/80 bg-teal-100/90 text-teal-900 shadow-sm"
              : "border-emerald-200/90 bg-white/90 text-slate-700 hover:border-teal-300"
          }`}
        >
          {soloPendientes ? "Ver todo" : "Solo pendientes"}
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

      {items.length > 0 && (() => {
        const total = items.length;
        const comprados = items.filter((i) => i.comprado).length;
        const pct = total === 0 ? 0 : Math.round((comprados / total) * 100);
        const completo = comprados === total;
        return (
          <div className="ui-card-muted space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-teal-950">
                {completo ? "¡Lista completa!" : "Progreso de compra"}
              </span>
              <span className="tabular-nums font-mono text-sm font-bold text-teal-900">
                {comprados}/{total} ítems
              </span>
            </div>
            <div className="relative h-3 w-full overflow-hidden rounded-full bg-emerald-100/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completo ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-teal-600 to-emerald-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            {comprados > 0 && !completo && (
              <p className="text-[11px] text-slate-500">
                {total - comprados} ítem{total - comprados !== 1 ? "s" : ""} pendiente{total - comprados !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        );
      })()}

      {soloPendientes && items.filter((i) => !i.comprado).length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-emerald-300/70 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 px-6 py-10 text-center">
          <span className="text-4xl">🛒</span>
          <p className="font-display text-lg font-semibold text-teal-950">¡Todo comprado!</p>
          <p className="text-sm text-slate-600">No quedan ítems pendientes. Guarda el mercado para seguir al cronograma.</p>
          <button type="button" className="ui-btn-secondary px-4 py-2 text-sm" onClick={() => setSoloPendientes(false)}>
            Ver lista completa
          </button>
        </div>
      )}

      {grupos.size > 1 && (
        <nav
          className="sticky top-[3.4rem] z-30 -mx-3 overflow-x-auto border-b border-emerald-100/80 bg-white/85 px-3 py-2 backdrop-blur-xl sm:-mx-4 sm:px-4"
          aria-label="Categorías del mercado"
        >
          <div className="flex min-w-max gap-2">
            {Array.from(grupos.keys()).map((cat) => {
              const total = grupos.get(cat)?.length ?? 0;
              const comprados = grupos.get(cat)?.filter((i) => i.comprado).length ?? 0;
              const completo = total > 0 && comprados === total;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`mercado-cat-${cat}`);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap ${
                    completo
                      ? "border-emerald-300/80 bg-emerald-50/90 text-emerald-800"
                      : "border-emerald-200/80 bg-white/90 text-teal-900 hover:border-teal-300 hover:bg-teal-50/80"
                  }`}
                >
                  {completo && <span>✓</span>}
                  {labels[cat] ?? cat}
                  <span className="rounded-full bg-slate-100/90 px-1.5 py-0.5 text-[9px] tabular-nums text-slate-500">
                    {comprados}/{total}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      <div className="space-y-8">
        {Array.from(grupos.entries()).map(([cat, list]) => {
          const listaFiltrada = soloPendientes ? list.filter((i) => !i.comprado) : list;
          if (listaFiltrada.length === 0) return null;
          const compradosCat = list.filter((i) => i.comprado).length;
          const totalCat = list.length;
          const todosComprados = compradosCat === totalCat;
          return (
          <section key={cat} id={`mercado-cat-${cat}`} className="scroll-mt-28">
            <div className="mb-2 flex items-center gap-2">
              <h2 className="ui-section-title text-gradient-brand">{labels[cat] ?? cat}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                  todosComprados
                    ? "bg-emerald-100 text-emerald-800"
                    : compradosCat > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {compradosCat}/{totalCat}
              </span>
            </div>
            <ul className="space-y-2">
              {listaFiltrada.map((it) => (
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
                    className="mt-1 h-5 w-5 shrink-0 rounded border-emerald-300 text-teal-600 focus:ring-teal-500/30"
                    aria-label={`Marcar ${it.nombre}`}
                  />
                  <div className="flex-1 min-w-0">
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
                      ) : it.origen === "ia" ? (
                        <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-900">
                          IA
                        </span>
                      ) : null}
                    </div>
                    {editCantId === it.id ? (
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0.1}
                          step={0.5}
                          autoFocus
                          value={editCantVal}
                          onChange={(e) => setEditCantVal(e.target.value)}
                          onBlur={() => guardarEditCant(it.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEditCant(it.id);
                            if (e.key === "Escape") setEditCantId(null);
                          }}
                          className="w-20 rounded-lg border border-teal-300/80 bg-white px-2 py-0.5 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500/30"
                        />
                        <span className="text-sm text-slate-500">{it.unidad}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => abrirEditCant(it)}
                        title="Tocar para editar cantidad"
                        className="mt-0.5 rounded px-0.5 text-sm text-slate-600 hover:bg-teal-50 hover:text-teal-800 transition"
                      >
                        {it.cantidad} {it.unidad}
                        <span className="ml-1 text-[9px] text-slate-400">✎</span>
                      </button>
                    )}
                    {it.nota && <p className="mt-1 text-xs text-amber-800">{it.nota}</p>}
                  </div>
                  <button
                    type="button"
                    aria-label={`Eliminar ${it.nombre}`}
                    onClick={() => eliminarItem(it.id, it.origen === "manual")}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title={it.origen === "manual" ? "Quitar ítem extra" : "Quitar ítem de la lista"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>
          );
        })}
      </div>
    </div>
  );
}
