# Plan de mejoras — Fase 3: nube económica, mercado ampliable, nutrición guiada, video in-app y UX tech

Documento vivo (mayo 2026). Complementa `MEJORAS_NEGOCIO_Y_PRODUCTO.md` (Épica F), `USER_STORIES.md` y el skill `.cursor/skills/tec-nutri-salud-delivery/SKILL.md`. Marca UI: **NutriSalud** (`src/lib/brand.ts`).

---

## Objetivos de producto

1. **Persistir lo que más importa** en Supabase **sin salir del plan gratuito**: priorizar pocas tablas compactas / columnas JSONB con RLS por `auth.uid()`.
2. **Mercado más flexible**: alimentos “extra” fuera del generador de lista base (plantillas por tipo de dieta / IA), igualmente persistibles en el snapshot del mercado.
3. **Menú nutricionalmente coherente**: considerar **todos** los ítems del mercado activo (incluidos extras), objetivos orientativos (calorías, macros) y texto claro sobre **cantidades orientativas** hacia meta de peso (siempre como **orientación**, no prescripción médica).
4. **Experiencia de receta rica**: **video reproducible dentro de la app** (iframe embed) donde la licencia/ToS lo permita; fichas de plato con **kcal / grasa / carbos / proteína** (estimaciones) y **presupuesto diario restante**.
5. **Ingeniería**: código modular, tipos fuertes, comentarios mínimos útiles donde la lógica nutricional no sea obvia.
6. **Experiencia visual**: paleta más “tech” (sin perder contraste WCAG objetivo AA), microinteracciones con `motion-safe` / `motion-reduce`.

---

## Alcance médico/legal (obligatorio en UI y docs)

Toda estimación (peso objetivo, TMB, déficit/superávit, macros, “lo que falta por comer”) es **orientativa y educativa**. No sustituye nutricionista ni médico. Copys y pantalla de consentimiento corto donde se introduzcan metas numéricas de peso.

---

## Supabase gratuita — qué sí encaja bien

Referencia habitual del plan gratis: BD limitada, Storage ~1 GB (ya en uso para medios).

| Prioridad datos | Propuesta modelo | Por qué encaja |
|----------------|------------------|----------------|
| Alta | Ampliar `profiles` con **JSON opcional**: `nutrition_targets_json`, `prefs_json` — *o* nueva tabla angosta `nutrition_goals` (user_id PK, objetivos numéricos) | Pocas filas, RLS igual que hoy |
| Alta | Nueva tabla **`saved_snapshots`** o dos tablas **`user_markets`** / **`user_plans`** con columnas `id`, `user_id`, `perfil_local_id`, `payload jsonb`, `updated_at` | Un usuario = pocas docenas de filas; sync al login / al guardar |
| Media | Índices mínimos en `user_id` + `updated_at` | Queries baratas |

**Evitar** en primera iteración: miles de filas normalizadas (un row por cada alimento comprado salvo si se necesita reporting).

Strategia **JSONB por mercado guardado / plan guardado** replica lo que ya hace localmente pero versionado por usuario Supabase para recuperación tras cambio de dispositivo.

**RLS:** siempre `auth.uid() = user_id` en tablas nuevas; políticas análogas a `profiles`.

---

## Mercado — alimentos extra

### Modelo

- Extender `ListaItem` (o paralelo seguro para no romper importaciones) con flags opcionales, p. ej. `origen: "generador" \| "manual"` y `nombreCustom` cuando aplique.
- UI en `KetoMercado.tsx`:
  - **“Agregar ítem”** libre (texto + unidad opcional + cantidad aprox.) que se marca como comprable y aparece junto al resto por día cuando se distribuya lista.
  - Persistencia: mismo snapshot `MercadoSnapshot.items`.

### Sync nube

- Al guardar mercado activo/historial, si hay sesión, **upsert** del payload del snapshot en tabla `user_markets` clave `(user_id, mercado_snapshot_id)` o merge en array JSON en `profiles` solo si tamaño contenido (**riesgo tamaño familia grande** preferir tabla dedicada).

---

## Cronograma y nutrición

### Inputs

- Perfil activo (`PerfilUsuario` + fecha inicio opcional).
- Mercado activo: **lista completa** (`items`), distingiendo generados vs manuales.
- Objetivo orientativo opcional guardado en perfil/supabase:
  - Peso objetivo (kg), plazo opcional (“relajado / moderado”).
  - Cálculos base: ecuación habitual de gasto (**Mifflin-St Jeor** u otra documentada en código) × factor actividad suave definido por el usuario.

### Outputs por comida/plato

- Porciones en gramos cuando sea posible; si solo IA, valores **estimados** con disclaimers.
- Vector nutrición por plato: `kcal`, `proteinG`, `fatG`, `carbG`, `fiberG` opcional — alineados con etiquetado habitual.
- Por día: **suma vs presupuesto** (déficit/mantenimiento configurable con copy claro).

### Generación plantillas vs IA

- **Plantillas:** ampliar estructuras en `nutritionPlan.ts` donde sea viable incluir placeholders numéricos; si no hay datos confiables, mostrar rangos cualitativos.
- **Gemini (`recipesGemini.ts`):**
  - El prompt debe exigir **JSON estructurado** (schema documentado abajo en skill) más texto receta para el usuario.
  - Inyectar texto plano consolidado del mercado (nombres de ítems y extras) obligatorio cuando modo mercado/mixto.

---

## Video dentro de la app

- Preferir **`youtube-nocookie.com/embed/`** cuando `videoUrl` sea de YouTube, parseando ID desde `youtubeBusquedaPlato` actual o nueva propiedad estable `youtubeVideoId` devuelta por IA.
- UI: componente **`RecipeVideoEmbed.tsx`** dentro del modal/detalle (`aspect-video`, cargar lazy, `privacy-enhanced`).
- Fallback: mantener botón secundario “Abrir en YouTube” para accesibilidad y cuando embed falle.

**Fuente futura opcional:** almacenar URL de servidor propio/hosting sólo lectura fuera del alcance de esta fase.

---

## Diseño UX “más tecnológico”

Alineado a **fase §8** ya existente y al skill:

- Nueva paleta de acento: **cyan / teal eléctrico + violet** en gradientes contenidos (`tailwind.config.js`): no sustituir accesibilidad.
- Tokens extra: `--glow-accent`, quizá `backdrop-blur` más marcado solo en hero y modal.
- Animaciones nuevas sólo con variantes **`motion-safe:`** y **`motion-reduce:`** cortas (<400 ms): pulsos sólo en badges de estado, no en scroll infinito.
- Documentar antes de código: tabla de contrastes rápidos texto/fondo para CTAs.

---

## Documentación obligatoria al cerrar cada sub-fase F3

| Entregable | Archivo |
|------------|---------|
| Historias y criterios | `docs/USER_STORIES.md` |
| Negocio y priorización | `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md` |
| Flujo visual | `docs/FLUJO_USUARIO.md` |
| Este plan técnico | este archivo |
| Orden ejecución agente | skill `tec-nutri-salud-delivery/SKILL.md` |

---

## Orden de implementación sugerido (PRs pequeños)

| Orden | Entrega | Notas |
|------|---------|--------|
| F3.0 | **Auth accesible:** olvidé mi contraseña desde `/#/login` (`resetPasswordForEmail`), pantalla `/#/actualizar-clave` (evento `PASSWORD_RECOVERY` + `updateUser`), cambio de contraseña logada en Mi espacio **solo cuenta email** | Redirect URLs Supabase incluyendo `#/actualizar-clave`; ver `docs/DEPLOYMENT.md` |
| F3.1 | Esquema Supabase nuevo + tipos TS + cliente sync pull/push opcional mercados/planes como JSON | Medir tamaño payloads |
| F3.2 | Mercado: UI “Ítems extra” + migración ListaItem | Tests manuales import backup |
| F3.3 | Objetivos nutricionales en perfil + cálculos documentados (`src/lib/` nuevo módulo) | Sin Gemini primero OK |
| F3.4 | Prompt Gemini + tipos nutr + UI tabla macros + presupuesto diario | Fallback sin clave |
| F3.5 | Embed de video en modal/detalle | Error boundary iframe |
| F3.6 | Refresh visual Tailwind tokens + revisión Lighthouse contraste | Checklist |

**Estado mayo 2026:** F3.0–F3.6 implementados y en `main`. Últimas mejoras adicionales:
- `fiber_g` y `porciones` en el contrato JSON de Gemini y en la UI (tarjetas por macro con colores, etiqueta porciones).
- Prompt de Gemini recibe **lista completa del mercado con cantidades** (no solo comprados); instrucción varía por modo perfil/mercado/mixto; segunda pasada para vídeos faltantes con verificación de miniatura.
- Borrado remoto (Supabase) al eliminar mercados o planes locales cuando hay sesión.
- Error boundary en `RecipeVideoEmbed` y fallback visual de acceso YouTube.
- Fix: `Login.tsx` importaba `supabase` sin declararlo (ReferenceError en prod); solucionado junto con null-safety en `ActualizarClave` y `MiEspacio`.

Falta ejecutar **`supabase/schema.sql`** en tu proyecto Supabase si aún no existen las tablas `user_market_snapshots` / `user_plan_snapshots`.

---

*Actualizar cuando se marquen fases como cerradas.*
