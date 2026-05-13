---
name: tec-nutri-salud-delivery
description: >-
  Flujo de trabajo para desarrollar y desplegar TEC Nutri Salud (Vite React PWA,
  Supabase, GitHub Pages). Úsalo cuando toques auth, perfil, cronograma, mercado
  keto, recetas IA (Gemini), PWA o CI.
---

# TEC Nutri Salud — entrega ordenada (estilo “herramientas”)

Actúa en fases, como un flujo MCP: cada fase tiene entrada/salida clara.

## Fase 1 — Contexto

- Lee `README.md`, `docs/USER_STORIES.md` y `.env.example`.
- No añadas claves secretas al repo; usa GitHub Actions secrets para build.

## Fase 2 — App web (Vite + React)

- Rutas con `HashRouter` (compatible con GitHub Pages).
- `base: "./"` en Vite para assets relativos.
- Mantén UI en español, responsive y PWA (`vite-plugin-pwa`).

## Fase 3 — Datos y auth

- **Sin Supabase**: perfil, lista keto actual e **historial de mercados** en `localStorage`.
- **Con Supabase**: ejecuta `supabase/schema.sql`, activa Google OAuth en el panel,
  añade URL de redirección con `/#/login` al dominio de Pages.

## Fase 3b — Mercado → cronograma

- Tras comprar, el usuario guarda el mercado; **Mi plan** usa el mercado **activo** en modos *mercado* o *mixto*.
- En **Mercado keto**, botones **Compré todo de una vez** / **Desmarcar todo** para marcar la lista completa rápido; **Descargar/Importar JSON** del historial para respaldo entre dispositivos.
- La **clave de variedad** renueva combinaciones sin cambiar el perfil.

## Fase 4 — IA opcional

- `VITE_GEMINI_API_KEY` solo en build local o GitHub Secrets; nunca en commits.
- Si no hay clave, el asistente de chat y el botón **Cargar recetas con IA** deben degradar con mensaje claro (sin fallar).
- **Recetas multi-día**: `src/lib/recipesGemini.ts` → `generarCronogramaIA` (trozos de hasta 10 días, JSON). **Mi plan** alterna vista plantillas / IA.
- Los enlaces **videoQuery** abren búsqueda en YouTube (descubrimiento en internet); no incrustar reproductor en MVP.
## Fase 5 — Despliegue

- Workflow `.github/workflows/pages.yml` sube `dist/` a GitHub Pages.
- En el repo: Settings → Pages → Source: **GitHub Actions**.

## Salida esperada

- Cambios pequeños y revisables; prueba `npm run build` antes de PR.
