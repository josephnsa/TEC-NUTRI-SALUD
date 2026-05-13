# Mejoras de negocio y producto — TEC Nutri Salud

Documento **estratégico**: describe cómo debe evolucionar la experiencia para que sea **dinámica**, **fácil de interpretar**, con **flujo intuitivo** y un modelo mental claro en torno al **perfil del usuario**, **varios mercados** y **varios cronogramas**. Sirve de base para priorizar desarrollo; no sustituye historias de usuario ya cerradas en `USER_STORIES.md`, sino que las **amplía y ordena**.

---

## 1. Visión de producto (estado deseado)

La usuaria debe sentir que tiene **un solo centro**: su **perfil**, desde donde entiende qué está pasando (quién es, qué compró, qué plan está comiendo esta semana). Las pantallas actuales (Mercado, Mi plan, Cronograma, Asistente) se mantienen como **capacidades**, pero la información **no debe repetirse** sin función; cada vista debe tener **un rol claro** en el recorrido.

**Principios:**

| Principio | Significado para negocio |
|-----------|---------------------------|
| **Un perfil, muchas decisiones** | Datos corporales y gustos son **estables**; mercados y cronogramas son **versiones en el tiempo** que cuelgan del usuario. |
| **Varios mercados** | Cada compra guardada es una **“instantánea”** con fecha y etiqueta opcional; puede haber varias vivas en historial, con una marcada como **activa para el plan**. |
| **Varios cronogramas** | Cada combinación “días + modo + fuente (plantillas / IA) + mercado de referencia” puede guardarse como **plan nombrado** (“Semana 12 mayo”, “Vacaciones”), no solo como vista efímera en pantalla. |
| **Flujo estratégico** | Orden mental: **Perfil → Mercado (opcional pero recomendado) → Cronograma → Consultas (Asistente)**; Belleza y cuenta como **satélites**. |
| **Limpieza** | Misma acción no se explica tres veces en tres pantallas; **banner de flujo** solo donde ayuda al primer uso o tras onboarding vacío. |
| **Responsive + PWA** | Misma lógica en móvil y escritorio; navegación táctil, jerarquía tipográfica clara, sin tablas anchas obligatorias; instalación como app opcional ya alineada con PWA. |

---

## 2. Situación actual frente a gaps (negocio)

### 2.1 Lo que ya cumple el MVP

- Lista keto por días y personas, marcado de comprados, guardado de mercado con **historial** y **uno activo** para el plan.
- Perfil local/remoto (Supabase) con datos para priorizar recetas.
- Cronograma con modos perfil / mercado / mixto, plantillas y agente IA (Gemini), búsqueda YouTube por plato.
- Flujo documentado en `FLUJO_USUARIO.md` y banners en UI.

### 2.2 Gaps que este documento quiere cerrar (mejoras)

1. **Perfil como “lugar” visible**: hoy el perfil vive en Mi plan mezclado con cronograma; la usuaria no tiene una **resumen-dashboard** que diga: mercado activo, último cronograma generado, próximo paso sugerido.
2. **Varios mercados como concepto de negocio explícito**: el historial existe, pero no hay narrativa fuerte de **“mis compras”** con rename, notas, ni comparación rápida (“esta semana vs la anterior”).
3. **Varios cronogramas**: hoy el cronograma generado (sobre todo IA) es **volátil**; si recarga o cambia filtros, pierde la versión anterior salvo que la usuaria haga captura externa. Negocio pediría **versiones guardadas** ligadas a perfil y opcionalmente a un mercado concreto.
4. **Redundancia**: Mercado, Mi plan y Cronograma repiten bloques similares (mercado activo, modo, días). Mejora: **componentes únicos** y **una sola fuente de verdad** en UI copy.
5. **Dinamismo interpretativo**: “Dinámico” aquí significa que la app **reacciona al estado** (sin mercado → CTA ir al mercado; sin cronograma guardado → sugerir generar; con IA sin clave → degradación clara). Eso es **lógica de producto** más que animaciones.

---

## 3. Historia de negocio detallada (mejoras por épica)

### Épica A — Centro de perfil (“Mi espacio”)

**Narrativa:**  
María abre la app y lo primero que quiere saber es *“¿en qué voy?”*: datos actualizados, mercado que está usando para cocinar esta semana, y si ya tiene un menú armado. No quiere recordar si eso estaba en Mi plan o en Cronograma.

**Mejoras de negocio:**

- Nueva entrada mental **“Mi espacio” / “Resumen”** (puede ser la propia home logada o una pestaña dedicada): tarjetas **Perfil resumido**, **Mercado activo**, **Cronograma actual** (último guardado o borrador), **Atajo Asistente**.
- Indicadores de estado: “Falta mercado para modo mixto óptimo”, “Última lista guardada hace X días”, “Cronograma IA generado el …”.
- Opción **editar perfil** desde ese centro sin scroll largo; cronograma detallado sigue en pantalla dedicada.

**Criterios de aceptación (negocio):**

- En ≤3 pulsaciones desde el centro se llega a: editar perfil, cambiar mercado activo, abrir cronograma completo.
- No hay tres párrafos distintos que expliquen el mismo flujo en la misma sesión sin jerarquía (principal vs “¿necesitas ayuda?”).

---

### Épica B — Varios mercados (historial rico)

**Narrativa:**  
María hace compra grande los domingos y compra pequeña el miércoles. Quiere **guardar ambas**, ponerles nombre (“Semana 19”, “Top-up miércoles”) y **activar** la que refleja lo que tiene **hoy** en la nevera. Si prepara un cronograma para la semana siguiente con la lista del domingo, quiere **ligar** ese cronograma a ese mercado sin borrar la lista del miércoles.

**Mejoras de negocio:**

- Cada mercado guardado: **nombre editable**, **fecha**, **días cubiertos**, **personas**, **recuento comprados**, opcional **nota** (“solo verdurería”).
- Lista filtrable/ordenable (por fecha, por activo).
- **Activar** explícito con feedback (“Ahora el cronograma usará esta despensa”).
- Reglas claras: modo mercado/mixto usa **solo el mercado activo**; modo perfil ignora mercado para priorización pero puede seguir mostrando contexto opcional.

**Criterios de aceptación:**

- Puede coexistir **N ≥ 1** mercados guardados; siempre hay como mucho **uno activo**.
- Cambiar activo **no borra** cronogramas ya guardados (ver Épica C), pero puede marcar cronogramas como “desactualizado respecto al mercado” si se desea en una fase posterior.

---

### Épica C — Varios cronogramas (planes versionados)

**Narrativa:**  
María genera un menú con IA para 7 días y le gusta. Al día siguiente quiere probar **otra semilla de variedad** sin perder el menú anterior para comparar con su pareja. Quiere **guardar planes** con nombre y saber cuál es el que está **siguiendo esta semana**.

**Mejoras de negocio:**

- Entidad **Cronograma guardado**: nombre, fecha creación, **fuente** (plantillas / IA), **días**, **modo**, referencia opcional al **id del mercado** usado, eventualmente hash de **claveVariedad** para reproducibilidad aproximada.
- **Cronograma “en uso”** o **destacado** para la semana actual (similar a mercado activo).
- Acciones: duplicar, renombrar, eliminar, exportar JSON (alineado con filosofía de respaldo actual).

**Criterios de aceptación:**

- La usuaria puede tener **al menos varios** cronogramas guardados localmente; si hay Supabase en futuro, sincronización opcional como roadmap.
- Al abrir Cronograma, puede elegir **ver borrador** (no guardado) o **abrir plan guardado**.

---

### Épica D — Flujo intuitivo y diseño limpio

**Narrativa:**  
María usa el móvil en el supermercado y el portátil el domingo. No quiere leer texto repetido ni perderse entre tabs que dicen lo mismo.

**Mejoras de negocio:**

- **Jerarquía de navegación**: nivel 1 — Inicio / Mi espacio, Mercado, Plan & Cronograma (o fusionar en “Menú” con subpasos), Belleza, Asistente, Cuenta.
- **Eliminar redundancia**: un solo bloque “Mercado activo” reutilizable; Mi plan se enfoca en **datos personales + preferencias de generación**; Cronograma en **visualización y generación** de menús.
- **Microcopy único**: mensajes legales/orientativos una vez por pantalla o en modal “ℹ️”.
- **Estados vacíos guiados**: ilustración o texto corto + CTA (“Aún no tienes mercados guardados → Crear lista”).
- **PWA**: mantener manifest y SW; revisar que actualización de versión no deje usuarios en JS viejo sin mensaje (“Hay una nueva versión — actualizar”).

**Criterios de aceptación:**

- Lighthouse / uso manual: formularios y botones usables con pulgar en viewport típico móvil.
- Flujo principal comprueba sin pérdida: Mercado → Guardar → (opcional Mi espacio) → Cronograma → Guardar plan.

---

### Épica E — Cuenta y límites (sin romper gratuidad)

**Narrativa:**  
Si María usa cuenta, espera que **perfil** suba a la nube; mercados y cronogramas múltiples pueden seguir en **local** en una primera fase para no disparar coste Supabase, o migrar a tablas con RLS en fase 2.

**Mejoras de negocio (fases):**

- **Fase 1 (local enriquecido):** arrays versionados en `localStorage` con límites razonables (ej. últimos 20 mercados, últimos 15 cronogramas) para no llenar el dispositivo.
- **Fase 2 (nube opcional):** tablas `saved_markets`, `saved_schedules` con `user_id`, políticas RLS; backup automático al iniciar sesión.

---

## 4. Mapa estratégico del flujo (mejorado)

```
           ┌─────────────┐
           │  Mi espacio │  ← resumen: perfil + activos + CTAs
           └──────┬──────┘
                  │
     ┌────────────┼────────────┐
     ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌──────────────┐
│ Perfil  │  │ Mercados│  │ Cronogramas  │
│ (datos) │  │ (lista  │  │ (planes      │
│         │  │  N)     │  │  guardados N)│
└─────────┘  └────┬────┘  └──────┬───────┘
                  │              │
                  └──────┬───────┘
                         ▼
                  ┌─────────────┐
                  │ Generador   │  plantillas / IA / modo / días
                  │ (pantalla   │
                  │  Cronograma)│
                  └─────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ Asistente   │  preguntas puntuales (Gemini)
                  └─────────────┘
```

**Regla:** Belleza y Cuenta no participan en el núcleo alimentario; no compiten por atención en el primer onboarding.

---

## 5. Priorización sugerida (solo negocio)

| Prioridad | Épica | Valor usuario | Complejidad técnica estimada |
|-----------|--------|----------------|------------------------------|
| P1 | D — Limpiar redundancia y estados vacíos | Alto | Media |
| P2 | A — Centro “Mi espacio” | Alto | Media |
| P3 | C — Guardar N cronogramas | Alto | Media–alta |
| P4 | B — Enriquecer N mercados (nombre, notas) | Medio–alto | Baja–media |
| P5 | E — Sync nube mercados/cronogramas | Medio (cuenta) | Alta |

---

## 6. Riesgos y líneas rojas

- **Coste:** más filas en Supabase y llamadas IA aumentan uso; mantener límites y degradación elegante.
- **Complejidad cognitiva:** “demasiadas listas” puede confundir; siempre mostrar **activo** y **en uso** prominentes.
- **Privacidad:** mercados y planes pueden inferir hábitos; política de datos clara si se sincronizan.

---

## 7. Relación con otros documentos

- `docs/USER_STORIES.md` — historias actuales; las épicas aquí **actualizan** el backlog cuando se conviertan en historias nuevas numeradas.
- `docs/BUSINESS_INPUT.md` — reglas de priorización mercado/plantillas; siguen válidas dentro de cada mercado activo.
- `docs/FLUJO_USUARIO.md` — flujo lineal actual; evolucionará a **flujo con nodos** (perfil ↔ mercados ↔ cronogramas) cuando se implemente Mi espacio.

---

*Versión 1 — documento de mejora de negocio (sin implementación obligatoria en este paso).*
