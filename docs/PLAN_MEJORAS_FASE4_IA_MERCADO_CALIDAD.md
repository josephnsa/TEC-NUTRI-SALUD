# Plan Fase 4 — Mercado IA · Cronograma experto · Persistencia · Sesión limpia

## Contexto y motivación

El recorrido base (datos → mercado → cronograma) está completo y desplegado. Esta fase mejora la **calidad de la IA** y la **solidez de la experiencia**:

| # | Problema reportado | Impacto |
|---|-------------------|---------|
| 1 | La lista del mercado se genera con plantillas fijas, no con el perfil real del usuario | Lista genérica, ignora tipo de dieta, condiciones y alimentos a evitar |
| 2 | El cronograma IA no calcula las calorías objetivo del usuario | Recetas no se alinean con la meta de peso / déficit calórico |
| 3 | Al salir y volver a Cronograma, el plan IA activo desaparece | Pérdida de contexto de trabajo |
| 4 | Al cerrar sesión, el perfil y datos persisten en la UI | Datos de otro usuario visibles en dispositivos compartidos |

---

## Historias de usuario — Fase 4

### H19 · Mercado personalizado con IA
*Como* usuaria con perfil guardado
*quiero* pulsar **"Generar mercado con IA"** y obtener una lista de compra adaptada a mi **estilo de dieta, condiciones de salud y alimentos que evito**, con cantidades calculadas para los días y personas que indiqué
*para* no recibir un mercado genérico igual para todo el mundo.

**Criterios de aceptación:**
- El botón IA solo aparece cuando `VITE_GEMINI_API_KEY` está configurada.
- La lista generada por IA respeta `estiloDieta`, `alimentosEvitar`, `enfermedades` del perfil.
- Muestra barra de progreso y mensaje de estado durante la generación.
- Los ítems generados por IA pueden editarse, eliminarse y marcarse como comprados igual que los generados por plantilla.
- Si falla, muestra error claro con botón **Reintentar**.
- El usuario puede seguir usando el botón de plantillas sin IA como alternativa.

---

### H20 · Cronograma calórico experto
*Como* usuaria con meta de peso definida
*quiero* que el cronograma IA genere menús cuya suma diaria se acerque a mis **calorías objetivo** (calculadas con Mifflin-St Jeor + déficit/superávit según ritmo)
*para* que las recetas sean coherentes con mi plan de adelgazamiento o mantenimiento.

**Criterios de aceptación:**
- Si hay `objetivosNutricion.pesoObjetivoKg`, el prompt incluye el objetivo calórico diario calculado y la distribución de macros del estilo de dieta.
- El agente actúa como **dietista experto** en keto / mediterránea / balanceada (no clínico).
- Cada día IA debe tener `kcal_estimate` ≥ 1 en todos los slots si hay presupuesto.
- El detalle del día ya muestra comparativa vs presupuesto (funcionalidad existente).

---

### H21 · Cronograma activo persiste al navegar
*Como* usuaria que genera un plan IA
*quiero* que al salir de la página de Cronograma y volver, el plan que generé con IA siga activo y visible
*para* no tener que regenerar cada vez que cambio de pestaña.

**Criterios de aceptación:**
- Al montar `Cronograma.tsx`, si hay un snapshot activo con `fuente: "ia"`, se restaura en `cronogramaIa` y se muestra la vista IA automáticamente.
- Cambiar de perfil activo limpia la restauración automáticamente.
- Los planes de plantillas también se restauran (ya funcionaba, solo afectar IA).

---

### H22 · Limpiar datos locales al cerrar sesión
*Como* usuaria en un dispositivo compartido
*quiero* que al cerrar sesión se borre el perfil, mercado y cronograma del dispositivo
*para* que la siguiente persona no vea mis datos al abrir la app.

**Criterios de aceptación:**
- Al llamar `signOut()` con Supabase configurado, se borran todas las claves `tec_nutri_salud_*` de `localStorage`.
- Solo aplica cuando `supabaseConfigured === true` (los datos están respaldados en la nube).
- En modo sin cuenta (solo local), los datos NO se borran al salir.
- Tras el borrado, la app navega a `/` en estado limpio.

---

## Plan de ejecución

### F4.0 — Mercado IA

**Archivo nuevo:** `src/lib/mercadoIA.ts`
- Función `generarMercadoIA(perfil, dias, personas, onProgress?): Promise<ListaItem[]>`
- Prompt JSON que pide array de `{nombre, unidad, cantidad, categoria, nota?}` personalizado al perfil
- Validación robusta del JSON de respuesta; fallback a ítem genérico si campo inválido
- Usa `GEMINI_MODEL_IDS` con reintentos como en `recipesGemini.ts`

**Modificar:** `src/lib/ketoMercado.ts`
- Añadir `"ia"` a la unión de `origen` en `ListaItem`

**Modificar:** `src/pages/KetoMercado.tsx`
- Nuevos estados: `iaMercadoCargando`, `iaMercadoError`, `iaMercadoProgreso`
- Botón "Generar con IA" junto al botón de plantillas existente
- Barra de progreso y mensaje de error con reintentar

---

### F4.1 — Prompt experto con calorías

**Modificar:** `src/lib/recipesGemini.ts` — función `generarChunkModelo`
- Calcular TDEE y presupuesto calórico usando `presupuestoKcalOrientativoDiario` (importar de `nutritionPlan`)
- Calcular distribución de macros por tipo de dieta:
  - **keto**: ≥ 65% kcal de grasa, ~25% proteína, ≤ 10% carbos (< 50 g/día)
  - **mediterránea**: ~35% grasa, ~20% proteína, ~45% carbos
  - **balanceada**: ~30% grasa, ~20% proteína, ~50% carbos
- Inyectar en el prompt como restricción dura: "Cada día debe sumar ~X kcal. Distribuye: P Xg · G Xg · C Xg"
- Fortalecer la persona del agente: "Eres un dietista-nutricionista con especialización en dieta [tipo]. Hablas con precisión técnica y adaptas las proporciones exactas al perfil."

---

### F4.2 — Restaurar cronograma IA al navegar

**Modificar:** `src/pages/Cronograma.tsx`
- Añadir `useEffect` que observe `snapActivoId`:
  ```typescript
  useEffect(() => {
    if (!snapActivoId || !perfilContextoId) return;
    const snap = listarSnapshots(perfilContextoId).find(s => s.id === snapActivoId);
    if (snap?.fuente === "ia" && snap.diasPlan.length > 0) {
      setCronogramaIa(snap.diasPlan);
      setVistaCronograma("ia");
      setDiasCronograma(snap.dias);
      setModoCronograma(snap.modo);
    }
  }, [snapActivoId, perfilContextoId]);
  ```
- Proteger el efecto para no sobreescribir si el usuario ya generó un nuevo plan en la misma sesión

---

### F4.3 — Limpiar localStorage al cerrar sesión

**Modificar:** `src/context/AuthContext.tsx`
- Añadir `clearLocalData()` que borra todas las keys `tec_nutri_salud_*`
- Llamarla desde `signOut()` solo cuando `supabaseConfigured`
- Emitir `PERFILES_STORAGE_EVENT` post-borrado para sincronizar componentes reactivos

---

## Validación y pruebas

### Pruebas funcionales (manual)

| Escenario | Pasos | Esperado |
|-----------|-------|---------|
| Mercado IA | Rellenar perfil keto → ir a Mercado → pulsar "Generar con IA" | Lista con proteínas/grasas keto, sin alimentos marcados en "evitar", cantidades coherentes |
| Mercado IA sin clave | Igual sin `VITE_GEMINI_API_KEY` | Botón oculto o disabled con aviso claro |
| Cronograma calórico | Perfil con `pesoObjetivoKg`, pulsar "Agente IA" | `kcal_estimate` suma ~objetivo diario ±20% en cada día |
| Persistencia cronograma | Generar IA → navegar a Mercado → volver a Cronograma | Plan IA visible automáticamente, sin regenerar |
| Persistencia múltiples perfiles | Generar IA en perfil A → cambiar a perfil B → volver a Cronograma | Plan de perfil B (o vacío), no el de A |
| Logout limpia datos | Iniciar sesión → generar datos → cerrar sesión | localStorage vacío de `tec_nutri_salud_*`; app en estado inicial |
| Logout sin Supabase | App sin `VITE_SUPABASE_*` → cerrar sesión no aplica | Datos locales intactos |

### Pruebas unitarias sugeridas (Vitest)

```typescript
// src/lib/mercadoIA.test.ts
describe("parseMercadoIAResponse", () => {
  it("normaliza unidades válidas", () => { ... });
  it("rechaza categorías inválidas y usa 'extras'", () => { ... });
  it("genera id único por ítem", () => { ... });
});

// src/context/AuthContext.test.tsx
describe("signOut with Supabase configured", () => {
  it("clears all tec_nutri_salud_ keys from localStorage", async () => {
    localStorage.setItem("tec_nutri_salud_perfil_v1", "{}");
    await signOut();
    expect(localStorage.getItem("tec_nutri_salud_perfil_v1")).toBeNull();
  });
  it("does not clear when supabase not configured", async () => { ... });
});
```

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/lib/mercadoIA.ts` | **NUEVO** — generación de mercado con Gemini |
| `src/lib/ketoMercado.ts` | Añadir `"ia"` a unión de `origen` |
| `src/pages/KetoMercado.tsx` | Botón IA + estados de progreso/error |
| `src/lib/recipesGemini.ts` | Prompt experto con TDEE y macros |
| `src/pages/Cronograma.tsx` | Restaurar IA activo al montar |
| `src/context/AuthContext.tsx` | Limpiar localStorage en signout |
| `docs/USER_STORIES.md` | Historias H19–H22 |
| `.cursor/skills/tec-nutri-salud-fase4/SKILL.md` | Skill de referencia para el agente |

---

*Fase 4 — mayo 2026*
