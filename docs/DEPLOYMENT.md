# Documento técnico: despliegue, entorno y agentes IA

Este documento describe cómo desplegar **TEC Nutri Salud** en producción, qué variables de entorno existen, cómo configurar **Supabase** y **Google AI Studio (Gemini)** para los agentes de IA, y qué limitaciones tiene el diseño actual.

---

## 1. Arquitectura resumida

| Capa | Tecnología | Notas |
|------|------------|--------|
| Frontend | Vite 5, React 18, TypeScript, Tailwind | SPA empaquetada en `dist/` |
| Enrutado | `HashRouter` (`/#/ruta`) | Evita 404 en hosting estático (GitHub Pages) |
| Hosting | GitHub Pages + GitHub Actions | Workflow: build → artefacto → deploy |
| PWA | `vite-plugin-pwa` | Service worker en build |
| Auth / perfil remoto | Supabase (opcional) | Email + Google; tabla `profiles` |
| Mi mercado (lista / historial) | `localStorage` del navegador | Sin backend dedicado; export/import JSON en UI |
| Agentes IA | Google Generative AI (Gemini) en el cliente | Misma clave para chat y recetas multi-día |

No hay servidor propio de aplicación: las llamadas a Gemini van **desde el navegador del usuario** hacia Google (SDK oficial). Las variables `VITE_*` se **incrustan en el bundle en tiempo de build**; cualquiera que descargue el JS puede extraerlas. Por eso la clave debe tratarse como **pública** y restringirse en Google Cloud / AI Studio (ver sección 6).

---

## 2. Requisitos previos

- **Node.js** 20 LTS (el CI usa 20; localmente 18+ suele funcionar).
- **npm** (el repo usa `package-lock.json`; en CI se ejecuta `npm ci`).
- Cuenta **GitHub** para el repositorio y Pages.
- Opcional: proyecto **Supabase** (plan gratuito).
- Opcional: cuenta Google para **Google AI Studio** y clave de API Gemini.

---

## 3. Variables de entorno (`VITE_*`)

Vite solo expone al cliente variables que empiezan por `VITE_`. Se definen en `.env` (local) o en **GitHub Actions → Secrets** (despliegue).

| Variable | Obligatoria | Uso |
|----------|-------------|-----|
| `VITE_SUPABASE_URL` | No | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | No | Clave anónima pública de Supabase (RLS protege datos) |
| `VITE_GEMINI_API_KEY` | No | Clave de Google AI Studio para Gemini (asistente + recetas) |

Plantilla: copiar `.env.example` a `.env` y rellenar.

**Importante:** no commitear `.env`. El archivo `.gitignore` debe ignorarlo (compruébalo antes de hacer push).

---

## 4. Desarrollo local

```bash
npm install
cp .env.example .env   # Windows: copy .env.example .env
# Editar .env con Supabase y/o Gemini si aplica
npm run dev
```

La app queda en `http://localhost:5173` (puerto por defecto de Vite). Las rutas son por hash: `http://localhost:5173/#/mi-plan`.

Build de comprobación:

```bash
npm run build
npm run preview    # sirve dist/ en local
```

---

## 5. Supabase (auth y perfil remoto)

### 5.1 Crear proyecto

1. [Supabase Dashboard](https://supabase.com/dashboard) → New project.
2. Anotar **Project URL** y **anon public key** → mapear a `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### 5.2 Esquema SQL

En **SQL Editor**, ejecutar el contenido de `supabase/schema.sql` del repositorio. Crea la tabla `public.profiles`, las tablas **`user_market_snapshots`** y **`user_plan_snapshots`** (historial **listas de compra / planes** en JSON con RLS) y políticas RLS para `profiles` y Storage (`tec-nutri-media`).

### 5.3 Proveedor Google (opcional)

1. **Authentication → Providers → Google**: Client ID y Client Secret de Google Cloud Console (OAuth consent + credenciales OAuth 2.0).
2. En Google Cloud, **URI de redirección** del cliente web: solo la callback de Supabase (`https://<ref>.supabase.co/auth/v1/callback`). **Orígenes JS**: `http://localhost:5173` y tu dominio de Pages.
3. **Authentication → URL configuration → Redirect URLs** (allowlist de `redirectTo` de la app). Con **HashRouter** la app usa la URL base **sin** `#/ruta` (PKCE devuelve `?code=` en el query). Añade comodines por puerto de Vite:

- `http://localhost:5173/**`
- `http://localhost:5174/**`
- `http://localhost:5175/**`
- `http://127.0.0.1:5173/**`
- Producción: `https://<usuario>.github.io/<repositorio>/**`

Tras el login, la app limpia la URL y navega a `#/mi-plan`.

### 5.4 Recuperación y cambio de contraseña (email)

Para **olvido de contraseña** (`resetPasswordForEmail`) la app envía como `redirectTo` la **URL actual sustituyendo solo el hash** por `#/actualizar-clave`.

Añade en **Authentication → URL configuration → Redirect URLs** todas las URLs base que puedan abrir el usuario más ese hash:

- Local: `http://localhost:5173/#/actualizar-clave` (y también `http://127.0.0.1:5173/#/actualizar-clave` si lo usáis).
- Producción GitHub Pages: `https://<usuario>.github.io/<repositorio>/#/actualizar-clave` (misma base que `#/login`).

Sin incluir estas entradas, el enlace del correo puede llevar al usuario fuera del flujo o fallar según configuración del proyecto.

### 5.5 Sin Supabase

La aplicación funciona: perfil y mercado se guardan en **localStorage**. El login en nube no estará operativo hasta configurar URL y claves.

---

## 6. Agentes IA (Google Gemini / AI Studio)

### 6.1 Qué componentes usan la clave

| Funcionalidad | Código principal | Pantalla |
|---------------|------------------|----------|
| Chat nutricional | `src/lib/geminiAgent.ts` | `#/agente` |
| Recetas multi-día (JSON, trozos de hasta 10 días) | `src/lib/recipesGemini.ts` | `#/mi-plan`, `#/cronograma` |

Modelos usados para recetas (en orden de intento): `gemini-2.0-flash`, `gemini-1.5-flash`. El asistente usa `gemini-1.5-flash`.

### 6.2 Obtener la clave gratuita

1. [Google AI Studio – API keys](https://aistudio.google.com/apikey).
2. Crear clave de API (el plan gratuito de desarrollo tiene límites; revisar cuotas en la consola de Google).

### 6.3 Configuración en build

- Local: `VITE_GEMINI_API_KEY=...` en `.env`, luego `npm run build`.
- Producción: mismo nombre como **Secret** de GitHub (`VITE_GEMINI_API_KEY`) para que el workflow de Pages lo inyecte en el paso `npm run build` (ver `.github/workflows/pages.yml`).

### 6.4 Seguridad de la clave en cliente

Como la clave viaja en el bundle del frontend:

- En Google Cloud / restricciones de la API key, limitar por **HTTP referrer** a tu dominio de Pages (y `localhost` para desarrollo).
- Rotar la clave si se filtra o se abusa de cuota.
- No usar claves con permisos de facturación desatados sin cuotas y alertas.

### 6.5 Limitaciones de diseño

- **No hay proxy backend** en este repo: no se puede ocultar la clave al usuario avanzado.
- Otros proveedores LLM “gratis” desde el navegador suelen fallar por **CORS**; Gemini con el SDK de Google está pensado para este caso.

---

## 7. Despliegue en GitHub Pages

### 7.1 Configuración del repositorio

1. Subir el código a la rama `main` (o la que dispare el workflow; el workflow actual usa `main`).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### 7.2 Secretos del repositorio

**Settings → Secrets and variables → Actions → New repository secret**

Opcionales pero recomendados si usas esas funciones:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

El workflow `Desplegar GitHub Pages` (`.github/workflows/pages.yml`):

1. `npm ci`
2. `npm run build` con las variables anteriores en `env`
3. Sube `dist/` como artefacto de Pages
4. Job `deploy` usa `actions/deploy-pages@v4`

Permisos del workflow: `contents: read`, `pages: write`, `id-token: write` (ya definidos en el YAML).

### 7.3 Base path

En `vite.config.ts`, `base: "./"` permite que los assets carguen correctamente bajo la subruta de GitHub Pages (`/<repo>/`).

### 7.4 Verificación post-deploy

- Abrir `https://<usuario>.github.io/<repo>/#/`.
- Probar `#/login` si Supabase está configurado.
- Probar **Asistente** y **Generar recetas con agente IA** si `VITE_GEMINI_API_KEY` se inyectó en el último build (si falta, los botones muestran ayuda con enlace a AI Studio).

---

## 8. CI/CD (resumen)

| Evento | Acción |
|--------|--------|
| Push a `main` | Build + deploy a Pages |

Para cambiar ramas o añadir PR preview, habría que extender el workflow (no incluido por defecto).

---

## 9. Datos y privacidad (técnico)

- **Perfil / mercado en localStorage**: persisten en el dispositivo; borrar datos del sitio en el navegador los elimina.
- **Supabase**: solo el perfil mapeado a `profiles` según el esquema SQL; el historial de mercados **no** está sincronizado en Supabase en la versión actual del proyecto.
- **Gemini**: el texto del perfil, la lista de comprados resumida y el prompt se envían a Google al generar recetas o chat; revisar políticas de Google AI para uso clínico (la app declara carácter educativo).

---

## 10. Incidencias frecuentes

| Síntoma | Causa probable | Acción |
|---------|----------------|--------|
| Pantalla en blanco o assets 404 en Pages | `base` incorrecto o ruta sin hash | Usar URLs con `/#/`; mantener `base: "./"` |
| Login Google no vuelve a la app | Redirect URL mal configurada en Supabase | Añadir URL exacta de Pages + `/#/login` |
| Tras «olvidé contraseña» no abre el formulario de nueva clave | Falta `#/actualizar-clave` en Redirect URLs | Añadir las URLs indicadas en **§5.4** |
| “Sin clave” en IA tras deploy | Secret no creado o build anterior | Añadir secret y **volver a ejecutar** el workflow (push vacío o re-run) |
| JSON inválido en recetas | Modelo o cuota | Reintentar; revisar consola de red/errores |
| `npm ci` falla en Actions | `package-lock.json` desincronizado | Ejecutar `npm install` local y commitear lockfile |

---

## 11. Referencias en el repositorio

- Workflow Pages: `.github/workflows/pages.yml`
- Esquema Supabase: `supabase/schema.sql`
- Historias de usuario: `docs/USER_STORIES.md`
- Flujo de negocio / IA: `docs/BUSINESS_INPUT.md`
- README general: `README.md`

---

*Última revisión alineada con el stack del repo (Vite + React + HashRouter + Pages + Supabase opcional + Gemini en cliente).*
