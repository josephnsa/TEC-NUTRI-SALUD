# Input de negocio — TEC Nutri Salud

## Objetivo

Unir la **lista de compra real** (**Mi mercado**: qué compró o planificó la persona) con el **cronograma alimenticio** y las **recetas + vídeo** (embed con fallback a búsqueda), manteniendo el producto gratuito (GitHub Pages + opciones gratuitas de datos/IA).

## Flujo principal

1. Usuario define periodo y personas → **lista base** según dieta del perfil o lista generada por **IA**.
2. Durante/al terminar la compra marca ítems como **comprados** o usa **“Compré todo de una vez”** si trajo la lista completa.
3. Usuario pulsa **Guardar mercado realizado** → historial + mercado activo; puede **descargar/importar JSON** de respaldo desde **Mi mercado**.
4. En **Mi plan** / **Cronograma** el usuario elige **modo** (perfil / mercado / mixto) y **días** (3–30); puede pulsar **“Generar recetas con agente IA (gratis)”** (Google AI Studio + Gemini en el navegador, misma clave que el asistente) o **Nuevas combinaciones** (plantillas).
5. Vista **plantillas** o **IA**: la IA genera JSON en trozos (hasta 10 días por llamada) con `responseMimeType: application/json`; cada comida incluye `titulo`, `receta` (ingredientes **para 1 persona** + pasos) y `videoQuery` alineado al mismo plato para **YouTube** (búsqueda en internet).
6. El detalle por día prioriza **video embebido** (YouTube `nocookie`) cuando el ID es válido; si falla, la UI ofrece **abrir la búsqueda** con título + `videoQuery` + estilo de dieta.

## Reglas de priorización (mercado / mixto)

- Solo los ítems con **comprado = true** aumentan la puntuación de las plantillas de menú cuyos textos coinciden con palabras clave del catálogo (pollo, pescado, huevo, etc.).
- Si no hay comprados en modo mercado, se aplica rotación variada equivalente al modo perfil (degradación controlada).

## Variedad

- Ampliar catálogo de **plantillas** por estilo (keto, mediterránea, balanceada).
- **Semilla** (`claveVariedad` + id de mercado) para barajar y elegir día a día evitando repetir el mismo menú completo en días consecutivos cuando el pool lo permite.

## IA de recetas (agente gratuito, Gemini)

- Misma clave gratuita de [Google AI Studio](https://aistudio.google.com/apikey) que el chat: `VITE_GEMINI_API_KEY`.
- Archivo: `src/lib/recipesGemini.ts`. Lista de modelos en `src/lib/geminiModels.ts` (fallback automático).
- Entrada: `PerfilUsuario`, `dias`, ítems del mercado activo, `ModoCronograma`.
- Salida: `DiaPlan[]` validado; cada slot con **receta en formato 1 porción** (ingredientes con cantidades + pasos) y `videoQuery` coherente con el título para YouTube; la UI compone la URL de búsqueda con `youtubeBusquedaPlato`. Errores de JSON o red deben mostrarse en UI sin romper la app.

## Fuera de alcance histórico / nota de producto

- **Antes** el alcance decía “solo búsqueda en YouTube”: hoy hay **embed opcional** validado por miniatura/postMessage y **fallback** a búsqueda.
- Sin Supabase, el historial de mercados y planes permanece en **localStorage**; con Supabase configurado puede haber **snapshots** remotos (`user_market_snapshots` / `user_plan_snapshots`) según `schema.sql` — el detalle contractual sigue en `docs/DEPLOYMENT.md`.
