# SKILL — TEC Nutri Salud Fase 4: IA en Mi mercado · Cronograma experto · Persistencia · Sesión

## Cuándo usar este skill

Actívalo cuando trabajas en:
- Generación de lista de mercado personalizada con Gemini (`mercadoIA.ts`)
- Fortalecimiento del prompt del cronograma IA (calorías objetivo, macros, persona experta)
- Restauración automática del plan IA activo al navegar entre páginas
- Limpieza de localStorage al cerrar sesión con Supabase

## Contexto del proyecto

Stack: **Vite + React + TypeScript + Tailwind CSS** — desplegado en **GitHub Pages** como PWA.
Backend opcional: **Supabase** (auth + tablas `user_market_snapshots`, `user_plan_snapshots`).
IA: **Google Gemini** via `@google/generative-ai` — clave `VITE_GEMINI_API_KEY` (gratuita, sin backend propio).

## Arquitectura de datos

```
localStorage
  tec_nutri_salud_perfiles_v1          → EstadoPerfiles (multi-perfil)
  tec_nutri_salud_keto_lista_v1__<id>  → ListaGuardada (items actuales)
  tec_nutri_salud_mercados_v1          → MercadoSnapshot[] (historial de listas Mi mercado)
  tec_nutri_salud_cronograma_historial_v1 → CronogramaSnapshot[]
  tec_nutri_salud_cronograma_activo_v1__<perfilId> → id del snapshot activo
```

## Reglas de implementación

### F4.0 — IA lista de compras / Mi mercado (`src/lib/mercadoIA.ts` + `KetoMercado.tsx`)

```typescript
// Prompt — salida esperada
[
  { "nombre": "string", "unidad": "g|ml|unidades|kg|l", "cantidad": number,
    "categoria": "proteina|grasa|verdura|lacteo|extras", "nota": "string?" }
]
```

- Importar `GEMINI_MODEL_IDS` desde `./geminiModels` y reintentar con cada modelo.
- Usar `responseMimeType: "application/json"`.
- Normalizar categoria inválida → `"extras"`.
- Generar `id` como `"ia-" + crypto.randomUUID().slice(0,8)`.
- Asignar `basePorPersonaDia = cantidad / dias / personas` (orientativo).
- `origen: "ia"` (requiere añadir "ia" a la unión en `ketoMercado.ts`).
- Exportar `geminiMercadoDisponible(): boolean` (misma lógica que `geminiRecetasDisponible`).

### F4.1 — Prompt experto (`src/lib/recipesGemini.ts`)

Inyectar justo antes del bloque JSON del prompt:

```
OBJETIVO CALÓRICO DIARIO (orientativo, no terapéutico): ~{kcalObjetivo} kcal
Distribución de macros para dieta {estiloDieta}:
  Proteína: ~{protG}g · Grasa: ~{grasaG}g · Carbos: ~{carbG}g
Persona del agente: Eres un dietista-nutricionista experto en {estiloDieta}.
Cada día DEBE intentar sumar ~{kcalObjetivo} kcal distribuidas en los 3 platos.
```

Macros por dieta (a partir de kcalObjetivo):
- **keto**: grasa 70%, proteína 25%, carb 5% (ej. 2000 kcal → G 156g · P 125g · C 25g)
- **mediterránea**: grasa 35%, proteína 20%, carb 45%
- **balanceada**: grasa 30%, proteína 20%, carb 50%

Importar `presupuestoKcalOrientativoDiario` y `calcularTdeePerfil` de `./nutritionPlan`. Si no hay objetivo de peso, usar TDEE como presupuesto base.

### F4.2 — Restaurar plan IA (`src/pages/Cronograma.tsx`)

**Reglas críticas (bug de persistencia ya corregido):**

1. Declarar **antes** un `useEffect` que hace *reset* cuando cambian `diasCronograma`, `modoCronograma`, `mercadoActivoId`, `perfil.estiloDieta`, `perfilContextoId` (`setCronogramaIa(null)`, `setVistaCronograma("plantillas")`).
2. Declarar **después** otro `useEffect` que restaura desde el snapshot activo (`fuente === "ia"`) con `setCronogramaIa`, `setVistaCronograma("ia")`. **No** llamar aquí a `setDiasCronograma` / `setModoCronograma` (evita re-disparar el reset en bucle).
3. `cronogramaMostrado`: usar vista IA cuando hay `cronogramaIa.length > 0`, sin exigir `length === diasCronograma`.
4. `iaYaRestoradaRef`: resetear a `false` en `bootDesdeAlmacenamiento` al cambiar perfil; marcar `true` tras restaurar.

Fragmento orientativo del efecto de restauración:

```typescript
const iaYaRestoradaRef = useRef(false);

useEffect(() => {
  if (!snapActivoId || !perfilContextoId || iaYaRestoradaRef.current) return;
  const snap = listarSnapshots(perfilContextoId).find((s) => s.id === snapActivoId);
  if (snap?.fuente === "ia" && snap.diasPlan.length > 0) {
    setCronogramaIa(snap.diasPlan);
    setVistaCronograma("ia");
    iaYaRestoradaRef.current = true;
  }
}, [snapActivoId, perfilContextoId]);
```

### F4.3 — Limpiar localStorage en signout (`src/context/AuthContext.tsx`)

```typescript
function clearTecNutriLocalData() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("tec_nutri_salud_")) keysToRemove.push(k);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  // Notificar componentes reactivos
  try {
    window.dispatchEvent(new CustomEvent("tec-nutri-salud-perfiles", { detail: {} }));
    window.dispatchEvent(new CustomEvent("tec-nutri-salud-cronograma-historial", { detail: {} }));
  } catch { /* ignore */ }
}

const signOut = useCallback(async () => {
  if (supabase) await supabase.auth.signOut();
  if (supabaseConfigured) {
    clearTecNutriLocalData();
    navigate("/", { replace: true });
  }
}, [navigate]);
```

## Pruebas funcionales antes de push

1. **Mi mercado (IA lista)**: Con clave → generar → verificar lista personalizada. Sin clave → botón oculto.
2. **Cronograma calórico**: Perfil con `pesoObjetivoKg` → generar IA → verificar `kcal_estimate` ≈ objetivo.
3. **Persistencia**: Generar IA → navegar → volver → plan visible sin regenerar.
4. **Logout**: Login → generar datos → logout → recargar → localStorage vacío.
5. **Logout sin Supabase**: Misma prueba sin `VITE_SUPABASE_*` → datos intactos.

## Comando de validación

```bash
npx tsc --noEmit && npm run build
```

Ambos deben salir sin errores antes de hacer `git push`.
