# TEC Nutri Salud

Web progresiva (PWA) sobre **salud alimenticia**, **mercado keto** (días, personas, checklist, **guardar mercado realizado** e historial activo para el plan), **plan personalizado** (edad, peso, talla, condiciones, alimentos a evitar, **cronograma según perfil y/o mercado**, plantillas o **recetas con agente IA gratuito** — Google Gemini vía AI Studio —, enlaces a videos en YouTube), **tips de belleza natural** y **asistente opcional** de chat con la misma clave gratuita.

Stack: **Vite + React + TypeScript + Tailwind**, **Supabase** (auth email/Google + tabla `profiles`, capa gratuita), **GitHub Pages** (hosting estático gratuito).

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

Sin Supabase, la app sigue funcionando: perfil, lista keto e **historial de mercados** se guardan en **localStorage**; en Mercado keto puedes **exportar/importar JSON** de respaldo.

## Asistente IA (opcional)

1. Crea una clave en [Google AI Studio](https://aistudio.google.com/apikey).
2. `VITE_GEMINI_API_KEY=tu_clave` en `.env` o en **GitHub Actions → Secrets** para el despliegue.

Con la misma clave: **chat** en Asistente y, en **Mi plan** o **Cronograma**, el botón **“Generar recetas con agente IA (gratis)”** arma desayuno/almuerzo/cena para cada día configurado (3–30), usando perfil, modo de cronograma y mercado activo. Restringe la clave por dominio cuando tengas la URL de Pages.

## Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub y sube este código (`main`).
2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Añade secretos opcionales del build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`.
4. Haz push a `main`; el workflow `.github/workflows/pages.yml` genera `dist/` y publica.

La app usa **HashRouter** (`/#/ruta`) para evitar errores 404 en Pages. Rutas principales: `/#/`, `/#/keto-mercado`, `/#/cronograma`, `/#/mi-plan`, etc.

## Documentación interna

- **Despliegue, variables, Supabase y agentes IA:** `docs/DEPLOYMENT.md`
- Historias de usuario: `docs/USER_STORIES.md`
- Flujo unificado (mercado → plan → cronograma + IA): `docs/FLUJO_USUARIO.md`
- Input de negocio: `docs/BUSINESS_INPUT.md`
- Skill de entrega para el agente: `.cursor/skills/tec-nutri-salud-delivery/SKILL.md`
