# Flujo unificado de usuario (TEC Nutri Salud)

Documento corto para alinear negocio y pantallas. La app sigue **un orden fijo en producto**: datos → mercado → menú.

## Idea central

**Mis datos → Mercado keto → Cronograma** (menú con recetas y video).  
Las cantidades del cronograma son **orientativas para 1 persona**; si cocinas para más comensales, multiplicas proporciones. El mercado puede planificarse para varias personas en la lista de compra; el texto de cada receta del menú se simplifica a **una porción** para escalar mentalmente.

La implementación expone este orden en:

- `src/lib/recorrido.ts` — definición única de pasos y rutas.
- `src/components/StepHeader.tsx` — franja "paso X de 3" en Mi plan, Mercado y Cronograma.
- `src/components/Layout.tsx` — navegación con **Resumen** (`/#/mi-espacio`) visible antes del orden Datos → Mercado → Menú (…).

---

## Mi resumen / Tu espacio

Pantalla **`/#/mi-espacio`** (`MiEspacio.tsx`): vista rápida del avance en los tres pasos (perfil guardado, mercado activo con nombre/nota, último plan de menú con título y "hace N días"), **siguiente paso sugerido**, accesos rápidos a todas las secciones y herramientas de respaldo (descargar / restaurar JSON). No sustituye los pasos numerados.

---

## Pasos numerados

```mermaid
flowchart LR
  A[Mis datos / Mi plan] --> B[Mercado keto]
  B --> C[Guardar mercado]
  C --> D[Cronograma]
  D --> E{¿Fuente de menú?}
  E --> F[Plantillas locales]
  E --> G[Agente IA Gemini]
  F --> H[Receta + video enlazado o embebido]
  G --> H
  H --> I[Guardar plan en historial]
  I --> J[Detalle del día\nFoto · Vídeo · Progreso]
```

1. **Mis datos (Mi plan)**  
   Perfil: datos corporales, gustos, estilo de dieta. Debe hacerse **primero** para que mercado y cronograma respeten exclusiones y modo nutricional orientativo.  
   Soporta **varios perfiles** (multiperfil local): selector global en la barra superior, CRUD en Mi plan; cada perfil tiene su propio mercado activo y cronogramas guardados.

2. **Mercado keto**  
   Días y comensales para la **lista de compra**. Marcas lo comprado (o "todo de una vez"). **Guardar mercado realizado** enlaza la despensa al plan y navega al cronograma.  
   Cada mercado guardado puede tener **nombre amigable** ("Semana 19 mayo") y **nota** ("Solo verdurería"), editables desde el historial.

3. **Cronograma**  
   Modo perfil / mercado / mixto; días; **Nuevas combinaciones** (plantillas) o **Agente IA recetas**.  
   Cada comida: **"Buscar video para esta receta"** (YouTube alineado al plato + estilo de dieta).  
   Los planes se **guardan en historial** con título editable, se puede marcar uno como **"plan activo de la semana"** y restaurar, renombrar o borrar cualquiera desde el panel "Planes guardados".  
   Vista **Lista** o **Calendario** mensual; clic en un día abre el detalle **sin salir de la app**.

4. **Detalle del día** (modal desde calendario o lista)  
   Tres pestañas:  
   - **Plan** — recetas sugeridas; vídeo mediante enlace externo (**hoy**); en **evolutivo Fase 3** también **reproducir dentro de la app** con embed cuando la fuente lo permita.  
   - **Tu registro** — fotos y vídeos propios por comida (IndexedDB + miniaturas); con sesión, **copia automática en la cuenta** (Storage privado del proyecto).  
   - **Progreso** — seguimiento del plan (sí / parcial / no), checklist del día y nota libre.

5. **Asistente** (opcional)  
   Misma API Gemini para **preguntas sueltas**. El menú estructurado por día es siempre el cronograma.

---

## Respaldo de datos

- `MiEspacio.tsx` ofrece **descargar / restaurar** un JSON de respaldo que incluye todas las claves `tec_nutri_salud_*` (perfiles, mercados, cronogramas, listas, claves activas).
- `KetoMercado.tsx` ofrece export/import específico del historial de mercados (fusión por id).
- Las **fotos y vídeos** del cronograma se guardan en **IndexedDB** del navegador y **no** se incluyen en el respaldo JSON (solo sus metadatos si ya se subieron a Supabase Storage).

---

## PWA y actualización

La app es instalable como PWA. Cuando hay una nueva versión del service worker lista, aparece automáticamente un **banner en la barra superior** ("Nueva versión disponible — Actualizar / ✕") implementado con `useRegisterSW` de `vite-plugin-pwa`.

---

## Qué hace el agente en recetas

- **Versión actual:** devuelve JSON con `titulo`, `receta` y `videoQuery`; receta orientada a 1 porción; consulta video alineada al plato.
- **Versión próxima (Fase 3):** mismo contrato más campos opcionales de **macros estimadas** (`kcal`, `proteinG`, `fatG`, `carbG`, etc.) y, si fuera estable, **`youtubeVideoId`** para embed sin salir del sitio. Ver **`docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`**.

---

## Evolución Fase 3 (ejecución inmediata en roadmap)

Sin cambiar el orden **datos → mercado → cronograma**, las siguientes mejoras quedaron documentadas para implementarse en PR pequeños:

| Qué cambia para la usuaria | Documento fuente |
|----------------------------|------------------|
| Sincronizar en cuenta (Supabase gratis) snapshots clave de mercados y planes + objetivos nutricionales opcionales | `PLAN_MEJORAS_FASE3_…`, Épica F en `MEJORAS_NEGOCIO_Y_PRODUCTO.md` |
| **Ítems extra** agregados a mano al mercado guardado | Idem · historias 13–14 en `USER_STORIES.md` |
| Menú con **toda** la despensa, **macros** y **saldo/resto diario orientativo** (siempre disclaimers) | Idem |
| Video **dentro de la página** donde aplique | Idem · historia 15–16 |

---

## Fuera de este flujo

- **Belleza**: contenido estático de tips por categoría.
- **Cuenta Supabase**: hoy sincroniza **perfil familiar** (`family_json`) + **medios** del diario cuando hay sesión; **plan Fase 3** amplía **mercados y planes** en formato compacto (`MEJORAS_NEGOCIO_Y_PRODUCTO.md` Épica F).

---

*Actualizado: mayo 2026 — fases 2.0–2.5b y épicas A–F; próximo hito técnico: `docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`.*
