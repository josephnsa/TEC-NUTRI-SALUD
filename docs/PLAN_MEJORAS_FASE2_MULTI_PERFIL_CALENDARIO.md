# Plan de mejoras — Fase 2: multiperfil, fechas reales y calendario

Documento de **planificación** (mayo 2026). Resume lo pedido por producto, el gap frente al código actual y un orden sugerido de implementación. La marca visible en app es **NutriSalud** (`src/lib/brand.ts`).

---

## 1. Objetivo

Permitir que **una cuenta o un dispositivo** gestione **varias personas** (perfiles), cada una con:

- Datos propios (nombre, edad, peso, etc.).
- **Mercado** y **mercado activo** propios (o referencia clara a cuál lista usa).
- **Cronograma** alineado a una **fecha de inicio** (ej. 13/05/2026 = día 1 del plan).
- **Historial**: poder revisar **qué comió en días pasados** (persistencia, no solo vista en memoria).
- **UI tipo calendario**: mes con celdas pequeñas (resumen de comidas); al hacer clic, **expandir detalle en la misma página** (drawer, modal o ruta anidada `/#/cronograma?dia=2026-05-15`) sin navegar “a ciegas” a YouTube al tocar el día.
- **Diario visual del día**: el usuario puede **adjuntar fotos y vídeos** propios del plato real, progreso o notas; se conserva la **mejor calidad posible** dentro de límites del navegador y almacenamiento; al abrir el detalle del día ve **comida planificada + evidencias + progreso** (galería y reproductor in-page).

---

| Área | Comportamiento actual |
|------|-------------------------|
| Perfil | Un solo objeto `PerfilUsuario` en `localStorage` (`tec_nutri_salud_perfil_v1`). Supabase `profiles` = **una fila por usuario** (no por familiar). |
| Mercado | Historial global; **un** `mercadoActivoParaPlan` global (`mercadoHistorial.ts`). |
| Cronograma | Días numerados 1…N relativos a “ahora”, sin anclaje a calendario civil. No se guarda histórico de comidas por fecha. |
| Medios del usuario | No existe: no hay fotos/vídeos propios ligados a un día o a una comida. |

**Ya entregado (fase 1 reciente):** campo **nombre** en perfil; inputs numéricos **sin ceros a la izquierda** (`NumericInputs.tsx`); Belleza **por categorías**; marca **NutriSalud**.

---

## 3. Modelo de datos propuesto (local primero)

### 3.1 Perfiles múltiples

```text
tec_nutri_salud_perfiles_v1          → JSON: { perfiles: PerfilMiembro[], activoId: string }
```

`PerfilMiembro` extiende `PerfilUsuario` con:

- `id: string` (uuid corto o nanoid).
- `nombreVisible: string` (ya tenemos `nombre` en perfil; puede unificarse).
- `creadoEn: string` (ISO).
- Opcional: `fechaInicioPlan: string | null` (ISO date) para anclar cronograma.

Migración: si existe `tec_nutri_salud_perfil_v1`, crear un único `PerfilMiembro` con esos datos y marcarlo activo.

### 3.2 Mercado por perfil

- Clave activa: `tec_nutri_salud_mercado_activo_plan_id_v1__{perfilId}` o un mapa en un solo JSON `mercadoActivoPorPerfil`.
- Historial: `mercados` ya es lista; añadir campo `perfilId` en cada entrada guardada.

### 3.3 Cronograma histórico por fecha

```text
tec_nutri_salud_cronograma_historial_v1 → lista de {
  perfilId, fechaInicio, dias, modo, fuente: "plantillas"|"ia",
  diasPlan: DiaPlanConFecha[]
}
```

`DiaPlanConFecha`: `fecha: "YYYY-MM-DD"` + `comidas` actuales. Al generar plan, persistir snapshot con fechas = `fechaInicio + (dia-1)`.

### 3.4 Evidencias del día: fotos, vídeo y progreso (calidad)

Objetivo: que cada **día** (y opcionalmente cada **comida**: desayuno / almuerzo / cena) pueda tener **adjuntos del usuario** además del texto del plan.

**Modelo sugerido (por día o por slot):**

```text
adjuntos: {
  diaFecha: "YYYY-MM-DD",
  perfilId: string,
  slots?: {
    desayuno?: MediaItem[],
    almuerzo?: MediaItem[],
    cena?: MediaItem[]
  },
  /** o lista plana si no se quiere granularidad por comida */
  general?: MediaItem[]
}
```

`MediaItem` (borrador):

- `id`, `tipo: "foto" | "video"`, `creadoEn` (ISO).
- **Foto:** guardar como **Blob en IndexedDB** (recomendado) o **Data URL** solo para tamaños muy pequeños (evitar `localStorage` > ~4 MB). Opcional: una versión **miniatura** (WebP/JPEG reducido) para el calendario y **original** en IDB para el detalle (mantiene calidad al ver en grande).
- **Vídeo:** **IndexedDB** o **File System Access API** (donde exista); nunca meter vídeos largos en `localStorage`. Límite configurable (ej. 60 s / 50 MB por archivo) con mensaje claro si el dispositivo no da más.
- **Metadatos de calidad:** `ancho`, `alto`, `duracionSeg` (vídeo), `mime` para elegir `<img>` vs `<video>` y controles nativos.

**Progreso del día (UI, no clínico):**

- Campos opcionales por día: “**Seguí el plan**” (sí / parcial / no), nota corta, checklist “comí lo planificado” por slot.
- En la **celda del calendario**: icono o miniatura si hay foto; indicador si hay vídeo; chip de “progreso” (ej. 2/3 comidas registradas).
- En el **panel de detalle** (mismo clic del día): bloque superior **Plan del día** (texto receta + botón YouTube externo), bloque **Tu registro** (galería, vídeo con `controls`, lightbox o pantalla completa **sin salir de la app**), bloque **Progreso** (estado + nota).

**Privacidad y rendimiento:**

- Todo **opcional**; sin adjuntos el flujo sigue igual.
- Comprimir solo para **thumbnail** en rejilla; el detalle abre **fuente de mayor calidad** almacenada en IDB.
- Export/backup: incluir referencias o export ZIP en fase posterior (complejo).

---

## 4. UI / UX

1. **Selector global de perfil** (header o Mi plan): “Estás planificando para: [Ana ▼]”.
2. **Mi plan**: pestañas o lista “Familia” + botón “Añadir persona” (límite razonable ej. 8 en local).
3. **Cronograma**: conmutador **Lista / Calendario**; calendario mensual con badges desayuno/almuerzo/cena; **miniaturas** si el día tiene fotos; **indicador de vídeo** si hay clip propio; clic abre **detalle in-page** (drawer / panel lateral / modal ancho en móvil).
4. **Detalle del día** (un solo clic): vista única con **(a)** comidas planificadas y recetas, **(b)** **progreso** (seguimiento del plan, notas, checklist por comida), **(c)** **fotos y vídeos** del usuario en galería + reproductor integrado (`<video playsInline controls>`), zoom/lightbox para fotos **sin perder la copia de alta calidad** guardada en IndexedDB.
5. **Añadir medios**: desde el detalle, “**Añadir foto**” / “**Añadir vídeo**” (`<input type="file" accept="image/*">` / `accept="video/*">`); opcional captura con `capture` en móvil. Mostrar barra de compresión solo para **miniatura**; confirmar si se desea limitar resolución de guardado por cuota.
6. **YouTube** (receta sugerida): solo botón “Buscar video” dentro del detalle (ya alineado con `youtubeBusquedaPlato`); no confundir con los **vídeos propios** del usuario, que viven en el bloque “Tu registro”.

## 5. Supabase (fase posterior)

- Opción A: tabla `household_profiles` (user_id, perfil_id, payload jsonb).
- Opción B: mantener solo “dueño” en `profiles` y sync JSON de familia en una columna `family_json` (más simple, menos consultable).

Recomendación: **local primero** + export/import ya existente extendido a “familia completa”.

---

## 6. Orden de implementación sugerido

| Fase | Entrega | Riesgo |
|------|---------|--------|
| 2.0 | **Refresh visual global** (tokens, mesh, nav, micro-motion con `motion-reduce`) | Bajo |
| 2.1 | `perfiles[]` + selector + migración desde perfil único | Medio |
| 2.2 | Prefijar mercado activo/historial por `perfilId` | Medio |
| 2.3 | `fechaInicioPlan` + etiquetas de día con fecha en UI | Bajo–medio |
| 2.4 | Guardar snapshot de cronograma al generar (plantillas/IA) | Medio |
| 2.5 | Vista calendario + panel detalle (plan + fecha) | Alto (UX) |
| 2.5b | **Adjuntos**: fotos/vídeo por día (o por comida), IDB + miniaturas, detalle con galería y progreso | Alto (almacenamiento + UX) |
| 2.6 | Sync nube opcional (incl. media: Storage Supabase S3, políticas y cuotas) | Muy alto |

> **Nota:** 2.5 y 2.5b pueden partirse en PRs (primero detalle texto+progreso sin media, luego media).

---

## 7. Criterios de aceptación (borrador)

- Cambiar de perfil no borra datos del otro; mercado/cronograma visibles respetan perfil activo.
- Con fecha de inicio, el usuario ve en UI **la fecha civil** junto a “Día 3”.
- Tras cerrar el navegador, el **último snapshot guardado** sigue consultable en calendario/historial.
- Clic en día del calendario **no** abre YouTube automáticamente.
- El usuario puede **ver el detalle completo** de su comida del día y su **progreso** en la misma vista (scroll o pestañas: Plan | Tu registro | Progreso).
- Puede **subir o capturar fotos y vídeos**; en rejilla se ve **preview**; al ampliar, la app usa la **mejor copia disponible** (original en IndexedDB cuando exista).
- Los vídeos propios se **reproducen en la página** (controles nativos); no sustituyen el enlace opcional a YouTube de la receta sugerida.

---

## 8. Rediseño visual, animación y look actual (transversal)

Objetivo: una interfaz **más moderna y vistosa** sin sacrificar legibilidad ni accesibilidad.

**Dirección de diseño**

- **Paleta:** gradientes suaves (teal / esmeralda / toques fríos), acentos en botones primarios; fondo con **mesh** ligero en lugar de plano único.
- **Profundidad:** sombras difusas (`shadow-*` / “glow” muy suave), **glass** en cabecera y barra inferior (`backdrop-blur`, bordes semitransparentes).
- **Movimiento:** microinteracciones (`transition`, `hover:scale` leve en tarjetas), **entrada en stagger** en home; usar siempre **`motion-reduce:`** / `prefers-reduced-motion` para desactivar o acortar animaciones.
- **Tipografía:** mantener DM Sans + Fraunces; jerarquía clara (display solo en títulos).
- **Componentes futuros (calendario, galería):** cards con radio grande, estados hover/focus visibles, skeleton loaders donde haya carga.

**Entregables incrementales**

1. **Tokens globales** (Tailwind `extend`: sombras, keyframes `fade-up`, `mesh` en `backgroundImage`).
2. **Layout + Home** como vitrina del nuevo lenguaje visual.
3. **StepHeader** y bloques repetidos alineados al mismo sistema.
4. **Auditoría rápida** contraste texto/fondo en hero y CTAs.

**Fase en la tabla de implementación (§6):** puede iniciarse en **paralelo** a 2.1 como **2.0 — refresh visual global** (PR dedicado, bajo riesgo si no toca lógica de negocio).

---

## 9. Instrucciones para el agente (Cursor)

- Antes de tocar perfil/mercado/cronograma en profundidad, lee este plan y `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`.
- Mantén compatibilidad: migración automática desde claves `v1` actuales.
- Prefiere PRs pequeños: 2.1 solo perfiles, luego mercado, luego fechas, etc.
- Para **fotos/vídeo**: priorizar **IndexedDB** + miniaturas; documentar límites de tamaño y fallback si el navegador agota cuota.
- Para **UI / diseño**: seguir **§8** (tokens, contraste, `motion-reduce`); no añadir animaciones pesadas sin variante reducida.

---

*Plan vivo: actualizar este archivo cuando se cierren fases o cambien prioridades.*
