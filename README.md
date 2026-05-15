# NutriSalud

Web progresiva (PWA) para **salud alimenticia**: gestión de perfiles familiares, **lista de compras / Mi mercado** por tipo de dieta del perfil (keto, mediterránea, balanceada: días y personas, checklist, guardado con nombre y notas), **plan personalizado** y **cronograma** con plantillas o recetas asistidas por IA, diario de fotos/videos por día, historial versionado de planes y mercados, respaldo JSON local y publicación en GitHub Pages.

Stack: **Vite + React + TypeScript + Tailwind**, **Supabase** (auth email/Google + tabla `profiles`, capa gratuita), **GitHub Pages** (hosting estático gratuito).

---

## Características principales

| Área | Qué incluye |
|---|---|
| **Multi-perfil** | Hasta 8 miembros de la familia; cada uno tiene su propio mercado activo y cronograma activo |
| **Mi mercado** | Lista por días y personas según perfil (*lista base* por tipo de dieta o **generar con IA**), checklist, PDF/copia texto, historial con nombre y nota, mercado activo para el cronograma |
| **Cronograma** | Plantillas o IA (Gemini); historial de snapshots con título, "plan activo de la semana", restaurar, renombrar y borrar |
| **Diario por día** | Fotos (galería o cámara) y videos adjuntos al día del plan; lightbox integrado; ESC para cerrar |
| **Mi Espacio** | Dashboard con mercado activo y cronograma activo del perfil seleccionado; respaldo JSON |
| **PWA** | Instalable, precacheo offline, banner de actualización automático al detectar nueva versión |
| **Supabase** | Auth email + Google; sincronización de perfiles y media (opcional) |

---

## Desarrollo local

```bash
npm install
npm run dev
```

Copia `.env.example` a `.env` y rellena solo si usarás nube o IA.

## Supabase (opcional pero recomendado para cuenta Google)

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard).
2. SQL Editor → pega y ejecuta `supabase/schema.sql`.
3. Authentication → Providers → **Google** (client ID/secret de Google Cloud).
4. Authentication → URL configuration → **Redirect URLs**: añade la URL de tu GitHub Pages terminada en `/#/login` (ej. `https://TU_USUARIO.github.io/TEC-NUTRI-SALUD/#/login`).
5. Copia **Project URL** y **anon public key** a `.env` como `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Sin Supabase, la app sigue funcionando completamente en modo local: perfiles, lista de mercado e historial de mercados, historial de cronogramas, diario de fotos y respaldo completo JSON se guardan en **localStorage / IndexedDB**. Exporta/importa JSON de respaldo desde **Mi Espacio**. La pantalla está en **`/#/keto-mercado`** (ruta técnica heredada).

## Asistente IA (opcional)

1. Crea una clave en [Google AI Studio](https://aistudio.google.com/apikey).
2. `VITE_GEMINI_API_KEY=tu_clave` en `.env` o en **GitHub Actions → Secrets** para el despliegue.

Con la misma clave: **chat** en Asistente y, en **Mi plan** o **Cronograma**, el botón **"Generar recetas con agente IA (gratis)"** arma desayuno/almuerzo/cena para cada día configurado (3–30), usando perfil, modo de cronograma y mercado activo. Restringe la clave por dominio cuando tengas la URL de Pages.

## Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub y sube este código (`main`).
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Añade secretos opcionales del build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`.
4. Haz push a `main`; el workflow `.github/workflows/pages.yml` genera `dist/` y publica.

La app usa **HashRouter** (`/#/ruta`) para evitar errores 404 en Pages. Rutas principales: `/#/`, `/#/mi-espacio`, `/#/keto-mercado` (Mi mercado), `/#/cronograma`, `/#/mi-plan`, etc.

## Documentación interna

- **Despliegue, variables, Supabase y agentes IA:** `docs/DEPLOYMENT.md`
- Historias de usuario: `docs/USER_STORIES.md`
- Flujo unificado (orden datos → mercado → menú): `docs/FLUJO_USUARIO.md` · definición en código: `src/lib/recorrido.ts`
- Input de negocio: `docs/BUSINESS_INPUT.md`
- **Roadmap de mejoras (perfil, N listas Mi mercado, N cronogramas, UX):** `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`
- **Roadmap Fase 3 (nutrición guiada + nube + UX):** `docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`
- Skill del agente: `.cursor/skills/tec-nutri-salud-delivery/SKILL.md`
