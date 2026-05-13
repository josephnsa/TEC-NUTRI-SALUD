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

---

## 2. Estado actual (MVP)

| Área | Comportamiento actual |
|------|-------------------------|
| Perfil | Un solo objeto `PerfilUsuario` en `localStorage` (`tec_nutri_salud_perfil_v1`). Supabase `profiles` = **una fila por usuario** (no por familiar). |
| Mercado | Historial global; **un** `mercadoActivoParaPlan` global (`mercadoHistorial.ts`). |
| Cronograma | Días numerados 1…N relativos a “ahora”, sin anclaje a calendario civil. No se guarda histórico de comidas por fecha. |
| Video | Enlace YouTube por receta (correcto como acción secundaria). |

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

---

## 4. UI / UX

1. **Selector global de perfil** (header o Mi plan): “Estás planificando para: [Ana ▼]”.
2. **Mi plan**: pestañas o lista “Familia” + botón “Añadir persona” (límite razonable ej. 8 en local).
3. **Cronograma**: conmutador **Lista / Calendario**; calendario mensual con badges desayuno/almuerzo/cena; clic abre **detalle in-page**.
4. **YouTube**: solo botón “Buscar video” dentro del detalle (ya alineado con `youtubeBusquedaPlato`).

---

## 5. Supabase (fase posterior)

- Opción A: tabla `household_profiles` (user_id, perfil_id, payload jsonb).
- Opción B: mantener solo “dueño” en `profiles` y sync JSON de familia en una columna `family_json` (más simple, menos consultable).

Recomendación: **local primero** + export/import ya existente extendido a “familia completa”.

---

## 6. Orden de implementación sugerido

| Fase | Entrega | Riesgo |
|------|---------|--------|
| 2.1 | `perfiles[]` + selector + migración desde perfil único | Medio |
| 2.2 | Prefijar mercado activo/historial por `perfilId` | Medio |
| 2.3 | `fechaInicioPlan` + etiquetas de día con fecha en UI | Bajo–medio |
| 2.4 | Guardar snapshot de cronograma al generar (plantillas/IA) | Medio |
| 2.5 | Vista calendario + panel detalle | Alto (UX) |
| 2.6 | Sync nube opcional | Alto |

---

## 7. Criterios de aceptación (borrador)

- Cambiar de perfil no borra datos del otro; mercado/cronograma visibles respetan perfil activo.
- Con fecha de inicio, el usuario ve en UI **la fecha civil** junto a “Día 3”.
- Tras cerrar el navegador, el **último snapshot guardado** sigue consultable en calendario/historial.
- Clic en día del calendario **no** abre YouTube automáticamente.

---

## 8. Instrucciones para el agente (Cursor)

- Antes de tocar perfil/mercado/cronograma en profundidad, lee este plan y `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`.
- Mantén compatibilidad: migración automática desde claves `v1` actuales.
- Prefiere PRs pequeños: 2.1 solo perfiles, luego mercado, luego fechas, etc.

---

*Plan vivo: actualizar este archivo cuando se cierren fases o cambien prioridades.*
