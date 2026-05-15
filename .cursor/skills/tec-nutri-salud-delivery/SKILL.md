---
name: tec-nutri-salud-delivery
description: >-
  Flujo de trabajo para desarrollar y desplegar TEC Nutri Salud (Vite React PWA,
  Supabase, GitHub Pages). Úsalo cuando toques auth, perfil, cronograma, lista de
  compras (Mi mercado, ruta `#/keto-mercado`), recetas IA (Gemini), UX del recorrido
  guiado, navegación responsive o CI.
---

# NutriSalud (TEC Nutri Salud repo) — entrega ordenada (estilo “herramientas”)

Actúa en fases: cada fase tiene entrada/salida clara.

## Marca y copy

- Nombre en UI y PWA: **`MARCA_APP`** / **`MARCA_ESLOGAN`** en `src/lib/brand.ts` (hoy **NutriSalud**). No hardcodear el nombre en páginas si ya existe constante.

## Regla de oro — orden del producto

El flujo **visible y de negocio** es siempre:

1. **Datos** → `/#/mi-plan` (`PASOS_RECORRIDO_PRINCIPAL[0]` en `src/lib/recorrido.ts`)
2. **Mi mercado (lista)** → `/#/keto-mercado` (URL heredada; pantalla usa `Mi mercado` + dieta del perfil)
3. **Menú (cronograma)** → `/#/cronograma`

**Resumen del recorrido:** `/#/mi-espacio` (`RUTA_MI_ESPACIO` en `recorrido.ts`, pantalla `MiEspacio.tsx`) — estado de pasos 1–3 y siguiente paso sugerido; enlaces en **Layout** (“Resumen”) y en la home.

Opcional después: **Asistente** (`PASO_ASISTENTE`), **Belleza**, **Login**.

Al cambiar copy, rutas o orden de pasos:

- Actualiza **`src/lib/recorrido.ts`** (fuente única).
- Mantén alineados **`StepHeader`**, **`FlujoUsuarioBanner`**, **`Layout`** y la **home** (`PASOS_RECORRIDO_PRINCIPAL`).
- Revisa **`docs/FLUJO_USUARIO.md`** para documentación de negocio.

No dupliques listas de pasos en páginas sueltas sin importar `recorrido.ts`.

## Fase 1 — Contexto

- Lee `README.md`, `docs/USER_STORIES.md`, `docs/FLUJO_USUARIO.md`, `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`, **`docs/PLAN_MEJORAS_FASE2_MULTI_PERFIL_CALENDARIO.md`**, **`docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`** (evolutivo siguiente: nube económica, mercado extras, macros, embed video, UX tech) y `.env.example`.
- No commitees secretos; GitHub Actions secrets para build.

## Fase 2 — App web (Vite + React)

- `HashRouter` (`/#/ruta`) por GitHub Pages.
- `base: "./"` en Vite.
- UI en **español**, **responsive**, tactil-friendly (targets ≥44px donde aplique), **PWA** (`vite-plugin-pwa`).
- **Navegación**: desktop **Resumen** primero, luego Datos → **Mi mercado** (`/#/keto-mercado`) → Menú (+ Belleza + IA); móvil **Inicio**, **Resumen**, mismo orden de pasos e IA (Belleza solo escritorio o desde la home); barra inferior con `safe-area` vía padding en el `<nav>` fijo.
- Pantallas núcleo del recorrido usan **`StepHeader`** con `pasoActual={1|2|3}` para coherencia sin repetir párrafos largos.

## Fase 2b — Diseño visual (actualización continua)

- **Tokens** en `tailwind.config.js`: `bg-mesh`, sombras `shadow-glow` / `shadow-dock`, animaciones `animate-fade-up`, `animate-aurora-soft` (suaves, no intrusivas).
- **Global:** `index.html` usa `bg-mesh`; `index.css` define `.text-gradient-brand` para logotipo/ títulos de acento.
- **Layout:** cabecera y barra inferior tipo *glass* (`backdrop-blur`), enlaces activos con **gradiente** teal→esmeralda.
- **Movimiento:** combinar `motion-safe:` con `motion-reduce:` / `motion-reduce:animate-none` para **prefers-reduced-motion** (obligatorio en nuevas animaciones).
- **Referencia UI:** `Home.tsx` (hero con orbes y entradas escalonadas) y `StepHeader.tsx`; nuevas pantallas deben alinearse (cards blancas translúcidas, bordes suaves, hover con elevación leve).
- Plan detallado: **§8** en `docs/PLAN_MEJORAS_FASE2_MULTI_PERFIL_CALENDARIO.md` (fase **2.0** en tabla §6).

- Sin Supabase: perfil, **lista de mercado actual por perfil** e historial de mercados en `localStorage`.
- **Perfil:** tipo `PerfilUsuario` incluye **`nombre`** (texto); sincroniza con Supabase `profiles.display_name` vía `profileRemote.ts`. Carga/guardado saneado en `perfilStorage.normalizePerfilParsed` (migra JSON antiguo sin `nombre`).
- **Números en formularios:** usar `IntField` / `DecimalField` de `src/components/NumericInputs.tsx` para edad, peso, talla y “días” (evita ceros a la izquierda y spinners incómodos).
- Con Supabase: `supabase/schema.sql`, Google OAuth, redirect URLs con `/#/login`, `/#/mi-plan` y **`/#/actualizar-clave`** (recuperación de contraseña) según panel; detalle en `docs/DEPLOYMENT.md` §5.4.

## Fase 3b — Mi mercado → cronograma

- Tras **Guardar mercado**, navegar a cronograma con estado `desdeMercado` donde aplique.
- La lista **Mi mercado** marcada como **activa** alimenta modos *mercado* / *mixto* en Mi plan y Cronograma.
- Botones **Compré todo de una vez** / **Desmarcar todo**; export/import JSON del historial.
- **Clave de variedad** rota plantillas sin cambiar perfil.

## Hotfix producción — mayo 2026 (H27–H30)

- **Vídeo multi-plataforma (H30):** dependencia `react-player`; `src/lib/recipeVideoUrl.ts` (normaliza YouTube/TikTok/Vimeo/etc.); `PlatoReceta.videoUrl`; Gemini devuelve `video_url`; `RecipeVideoEmbed` lazy con `playUrl`.
- **Mercado activo:** al montar `KetoMercado`, si no hay lista local, hidratar desde `getMercadoRealizado(activoId)`; `actualizarMercadoEnHistorial` al persistir toggles; activar = cargar snapshot + sync `family_json`.
- **Plan activo:** `activosModulo` en `EstadoPerfiles` / `family_json`; `persistPlanActivoEnFamily` / `persistMercadoActivoEnFamily`; `restaurarActivosLocalesDesdeEstado` tras login; upsert al «Marcar activo».
- Plan y pruebas: **`docs/PLAN_FIX_PROD_MAY2026.md`**.

## Fase 4 — IA personalizada + persistencia + export PDF (mayo 2026)

### Bug de persistencia del cronograma (H23)
El efecto `useEffect` de reset (`[diasCronograma, modoCronograma, mercadoActivoId, perfil.estiloDieta, perfilContextoId]`) **debe declararse ANTES** del efecto de restauración (`[snapActivoId, perfilContextoId]`) en `Cronograma.tsx`. React ejecuta efectos en orden de declaración; si el reset va después, sobreescribe la restauración. Regla:
1. **Orden efectos:** reset first → restauración después.
2. **No mutar** `diasCronograma` / `modoCronograma` desde el efecto de restauración (evita reactivar el reset).
3. Condición `cronogramaMostrado`: `vistaCronograma === "ia" && cronogramaIa && cronogramaIa.length > 0` (sin verificar longitud contra diasCronograma).

### Lista base multi-dieta (H24)
- `src/data/ketoCatalog.ts` exporta tres catálogos: `ketoCatalog`, `mediterraneoCatalog`, `balanceadoCatalog`.
- `src/lib/ketoMercado.ts` exporta `generarListaBase(dias, personas, estiloDieta?)` que elige el catálogo por dieta.
- `generarListaKeto` queda como alias `@deprecated` para no romper importaciones antiguas.
- En `KetoMercado.tsx`: botón **"Generar con IA ✦"** primero, **"Generar lista base"** después.

### Export PDF (H25 / H26)
- Módulo `src/lib/pdfExport.ts`: funciones `exportarMercadoPdf()` y `exportarCronogramaPdf()`.
- Genera HTML formateado en ventana nueva + `window.print()` (≈ "Guardar como PDF" en el diálogo).
- **Sin dependencias externas** (no jspdf, no html2canvas).
- Botón "📄 Descargar PDF" en `KetoMercado.tsx` y `Cronograma.tsx` cuando hay datos.

## Belleza (contenido)

- Tips en `src/data/beautyTips.ts`: campo **`categoria`**, orden de secciones **`ORDEN_CATEGORIAS`**, página **`Belleza.tsx`** agrupa por bloque (rutina diaria, rostro, cabello, ojeras, acné, labios/manos). Ampliar tips en el mismo archivo manteniendo precauciones.

## Fase 3e — Evolutivo Fase 3 (prioridad ejecutable siguiente)

Seguir el orden de **`docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`**: primer hit **F3.0** (cambiar / olvidar contraseña con Supabase Auth), después **F3.1–F3.6**. Épica **F** en `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`; historias **13–18** en `docs/USER_STORIES.md`.

| Bloque | Contenido mínimo |
|--------|------------------|
| **Auth (email)** | **F3.0:** olvidé contraseña desde login, recuperación → `/#/actualizar-clave`, cambiar contraseña logada desde Mi espacio (no OAuth-only); Redirect URLs en Supabase |
| **Supabase económico** | Tablas o columnas JSONB con **RLS** `auth.uid()`; payloads compactos por mercado/plan/nutrition_goals; evitar explosión de filas |
| **Mi mercado (extras)** | `ListaItem`/equivalente con origen manual vs generador; mismo snapshot guardado |
| **Nutrición orientativa** | Módulo puro (ej. `nutritionTargets.ts`) con fórmula documentada (**Mifflin-St Jeor** + disclaimers obligatorios en UI); no es diagnóstico |
| **Gemini macros** | Ampliar parseo JSON en `recipesGemini.ts` con **schema estable** (ver prompt abajo) |
| **Video in-app** | Componente iframe `youtube-nocookie` + extracción de ID; fallback botón externo |
| **UI tech** | Nuevos tokens en `tailwind.config.js`; **solo** animaciones `motion-safe:` + `motion-reduce:` cortas |

### Prompt — extensión JSON para recetas (Fase 3, orientativo para el modelo)

Pedir respuesta JSON **válido** donde cada comida pueda incluir (además de campos actuales):

```json
{
  "kcal_estimate": number,
  "protein_g": number,
  "fat_g": number,
  "carb_g": number,
  "portion_notes": string,
  "youtube_video_id": string | null
}
```

Si el modelo no devuelve estos campos, degradar elegante (solo texto + `videoQuery` como hoy).

### Estándares de código al tocar esta fase

- Tipos nuevos exportados desde un solo archivo o carpeta (`src/lib/nutritionTypes.ts` ejemplo); evitar duplicar lógica entre plantillas y IA.
- Funciones nutricionales **puras** unit-testeables donde sea posible; comentarios breves sólo donde la fuente sea paper/guía (ej. nombre de ecuación).
- Tras cerrar cada sub-hit F3: **actualizar** `USER_STORIES`, este skill si cambia trabajo del agente, y `FLUJO_USUARIO.md` párrafos afectados.

### Canvas (Cursor)

Prototipos visuales o dashboard de sólo exploración pueden vivir en **`.canvas.tsx`** usando el skill `canvas`; no sustituir páginas reales hasta validar jerarquía con `recorrido.ts`.


- `VITE_GEMINI_API_KEY` solo en `.env` local o GitHub Secrets.
- Sin clave: degradar con mensaje claro (Asistente + botón recetas IA).
- Recetas multi-día: `src/lib/recipesGemini.ts` + `src/lib/geminiModels.ts` (fallback de modelos).
- Prompt exige **1 porción**, formato ingredientes + pasos, `videoQuery` alineado al plato; en **Fase 3** añadir al prompt el **schema opcional de macros** y límites de tokens razonables.
- UI puede combinar **`youtubeBusquedaPlato`** con **embed interno** cuando exista `youtube_video_id`; siempre opción fallback explícita.

## Fase 5 — Despliegue

- Workflow `.github/workflows/pages.yml` → GitHub Pages con Source **GitHub Actions**.
- Secretos: `VITE_SUPABASE_*`, `VITE_GEMINI_API_KEY` según necesidad.

## Salida esperada

- Cambios pequeños y revisables; `npm run build` antes de PR.
- No romper el orden del recorrido ni duplicar definiciones de pasos fuera de `recorrido.ts`.
