/** Orden oficial del producto: datos → mercado → menú (cronograma). */
export type PasoRecorridoNum = 1 | 2 | 3;

export type PasoRecorridoDef = {
  paso: PasoRecorridoNum;
  tituloPagina: string;
  /** Etiqueta corta para navegación móvil */
  navCorto: string;
  /** Etiqueta escritorio (puede incluir número) */
  navDesktop: string;
  to: string;
  descripcionBanner: string;
};

export const PASOS_RECORRIDO_PRINCIPAL: readonly PasoRecorridoDef[] = [
  {
    paso: 1,
    tituloPagina: "Mis datos",
    navCorto: "Datos",
    navDesktop: "1 · Datos",
    to: "/mi-plan",
    descripcionBanner:
      "Edad, peso, gustos y estilo de dieta. Aquí se guarda tu perfil; lo usarán el mercado y el cronograma."
  },
  {
    paso: 2,
    tituloPagina: "Mercado keto",
    navCorto: "Mercado",
    navDesktop: "2 · Mercado",
    to: "/keto-mercado",
    descripcionBanner:
      "Lista por días y comensales, marca comprados y guarda el mercado realizado para vincularlo al menú."
  },
  {
    paso: 3,
    tituloPagina: "Cronograma",
    navCorto: "Menú",
    navDesktop: "3 · Menú",
    to: "/cronograma",
    descripcionBanner:
      "Menú por días (plantillas o agente IA), porciones orientativas para 1 persona y video por plato."
  }
] as const;

export const PASO_ASISTENTE = {
  n: 4 as const,
  titulo: "Asistente",
  navDesktop: "Asistente",
  navCorto: "IA",
  to: "/agente",
  descripcionBanner: "Preguntas puntuales con Gemini (orientativo; mismo sistema que las recetas IA)."
} as const;
