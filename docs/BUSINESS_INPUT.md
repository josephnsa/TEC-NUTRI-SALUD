# Input de negocio — TEC Nutri Salud

## Objetivo

Unir el **mercado real** (qué compró la persona) con el **cronograma alimenticio** y las **recetas + búsqueda de video**, manteniendo el producto gratuito (GitHub Pages + opciones gratuitas de datos/IA).

## Flujo principal

1. Usuario define periodo y personas → lista keto sugerida.
2. Durante/al terminar la compra marca ítems como **comprados** o usa **“Compré todo de una vez”** si trajo la lista completa.
3. Usuario pulsa **Guardar mercado realizado** → historial + mercado activo; puede **descargar/importar JSON** de respaldo en Mercado keto.
4. En **Mi plan** / **Cronograma** el usuario elige **modo** (perfil / mercado / mixto) y **días** (3–30); puede pulsar **“Generar recetas con agente IA (gratis)”** (Google AI Studio + Gemini en el navegador, misma clave que el asistente) o **Nuevas combinaciones** (plantillas).
5. Vista **plantillas** o **IA**: la IA genera JSON en trozos (hasta 10 días por llamada) con `responseMimeType: application/json`; cada comida incluye `titulo`, `receta` (ingredientes **para 1 persona** + pasos) y `videoQuery` alineado al mismo plato para **YouTube** (búsqueda en internet).
6. Cada día del cronograma muestra título, receta y enlace **“Buscar video para esta receta”**, construido con título + `videoQuery` + estilo de dieta para mejor coincidencia con el plato mostrado.

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

## Fuera de alcance actual

- Videos incrustados o IDs fijos por receta (solo búsqueda en YouTube / internet).
- Sincronización del historial de mercado en Supabase (solo perfil remoto si está configurado).
