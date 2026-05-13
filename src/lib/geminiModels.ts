/**
 * Orden de prueba: Google cambia o retira IDs de modelo; el primero que responda se usa.
 * gemini-1.5-* suele dar 404 en API nuevas; priorizar 2.5 / 3 preview.
 * @see https://ai.google.dev/gemini-api/docs/models/gemini
 */
export const GEMINI_MODEL_IDS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-3-flash-preview"
] as const;
