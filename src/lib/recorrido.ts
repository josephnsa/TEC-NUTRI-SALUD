/** Orden oficial del producto: datos → mercado → menú (cronograma). */
export type PasoRecorridoNum = 1 | 2 | 3;

export type PasoRecorridoDef = {
  paso: PasoRecorridoNum;
  tituloPagina: string;
  /** Etiqueta corta para navegación móvil */
  navCorto: string;
  /** Etiqueta escritorio (sin números; el orden ya lo marca el flujo) */
  navDesktop: string;
  to: string;
  descripcionBanner: string;
};

export const PASOS_RECORRIDO_PRINCIPAL: readonly PasoRecorridoDef[] = [
  {
    paso: 1,
    tituloPagina: "Mis datos",
    navCorto: "Datos",
    navDesktop: "Datos",
    to: "/mi-plan",
    descripcionBanner: "Perfil para mercado y menú (orientativo, no clínico)."
  },
  {
    paso: 2,
    tituloPagina: "Mercado keto",
    navCorto: "Mercado",
    navDesktop: "Mercado",
    to: "/keto-mercado",
    descripcionBanner: "Lista, marca comprados y guarda para enlazar al menú."
  },
  {
    paso: 3,
    tituloPagina: "Cronograma",
    navCorto: "Menú",
    navDesktop: "Menú",
    to: "/cronograma",
    descripcionBanner: "Menú por días: plantillas o IA; ~1 porción; video por plato."
  }
] as const;

export const PASO_ASISTENTE = {
  n: 4 as const,
  titulo: "Asistente",
  navDesktop: "Asistente",
  navCorto: "IA",
  to: "/agente",
  descripcionBanner: "Dudas de nutrición o menús (orientativo; no sustituye consejo médico)."
} as const;

/** Centro tipo dashboard: estado del recorrido sin repetir formularios. */
export const RUTA_MI_ESPACIO = "/mi-espacio" as const;
