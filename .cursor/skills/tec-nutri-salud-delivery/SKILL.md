---
name: tec-nutri-salud-delivery
description: >-
  Flujo de trabajo para desarrollar y desplegar TEC Nutri Salud (Vite React PWA,
  Supabase, GitHub Pages). Úsalo cuando toques auth, perfil, cronograma, mercado
  keto, recetas IA (Gemini), UX del recorrido guiado, navegación responsive o CI.
---

# TEC Nutri Salud — entrega ordenada (estilo “herramientas”)

Actúa en fases: cada fase tiene entrada/salida clara.

## Regla de oro — orden del producto

El flujo **visible y de negocio** es siempre:

1. **Datos** → `/#/mi-plan` (`PASOS_RECORRIDO_PRINCIPAL[0]` en `src/lib/recorrido.ts`)
2. **Mercado** → `/#/keto-mercado`
3. **Menú (cronograma)** → `/#/cronograma`

Opcional después: **Asistente** (`PASO_ASISTENTE`), **Belleza**, **Login**.

Al cambiar copy, rutas o orden de pasos:

- Actualiza **`src/lib/recorrido.ts`** (fuente única).
- Mantén alineados **`StepHeader`**, **`FlujoUsuarioBanner`**, **`Layout`** y la **home** (`PASOS_RECORRIDO_PRINCIPAL`).
- Revisa **`docs/FLUJO_USUARIO.md`** para documentación de negocio.

No dupliques listas de pasos en páginas sueltas sin importar `recorrido.ts`.

## Fase 1 — Contexto

- Lee `README.md`, `docs/USER_STORIES.md`, `docs/FLUJO_USUARIO.md`, `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md` (roadmap) y `.env.example`.
- No commitees secretos; GitHub Actions secrets para build.

## Fase 2 — App web (Vite + React)

- `HashRouter` (`/#/ruta`) por GitHub Pages.
- `base: "./"` en Vite.
- UI en **español**, **responsive**, tactil-friendly (targets ≥44px donde aplique), **PWA** (`vite-plugin-pwa`).
- **Navegación**: desktop y móvil siguen el orden Datos → Mercado → Menú (+ Belleza + IA); barra inferior con `safe-area` vía padding en el `<nav>` fijo.
- Pantallas núcleo del recorrido usan **`StepHeader`** con `pasoActual={1|2|3}` para coherencia sin repetir párrafos largos.

## Fase 3 — Datos y auth

- Sin Supabase: perfil, lista keto actual e historial de mercados en `localStorage`.
- Con Supabase: `supabase/schema.sql`, Google OAuth, redirect URLs con `/#/login` y `/#/mi-plan` según panel.

## Fase 3b — Mercado → cronograma

- Tras **Guardar mercado**, navegar a cronograma con estado `desdeMercado` donde aplique.
- Mercado **activo** alimenta modos *mercado* / *mixto* en Mi plan y Cronograma.
- Botones **Compré todo de una vez** / **Desmarcar todo**; export/import JSON del historial.
- **Clave de variedad** rota plantillas sin cambiar perfil.

## Fase 4 — IA opcional (Gemini)

- `VITE_GEMINI_API_KEY` solo en `.env` local o GitHub Secrets.
- Sin clave: degradar con mensaje claro (Asistente + botón recetas IA).
- Recetas multi-día: `src/lib/recipesGemini.ts` + `src/lib/geminiModels.ts` (fallback de modelos).
- Prompt exige **1 porción**, formato ingredientes + pasos, `videoQuery` alineado al plato.
- UI usa `youtubeBusquedaPlato` en `nutritionPlan.ts` para la URL de YouTube.

## Fase 5 — Despliegue

- Workflow `.github/workflows/pages.yml` → GitHub Pages con Source **GitHub Actions**.
- Secretos: `VITE_SUPABASE_*`, `VITE_GEMINI_API_KEY` según necesidad.

## Salida esperada

- Cambios pequeños y revisables; `npm run build` antes de PR.
- No romper el orden del recorrido ni duplicar definiciones de pasos fuera de `recorrido.ts`.
