# Historias de usuario (TEC Nutri Salud)

## Persona

María quiere comer mejor según **su tipo de dieta** (cetogénica, mediterránea, balanceada), organizar el mercado, **guardar lo que realmente compró** y que el sistema le arme un **cronograma coherente con esos ingredientes**, con recetas y vídeos. También quiere **variedad** en las sugerencias, no siempre los mismos platos.

## Historias

1. **Lista de compras / Mi mercado**  
   *Como* usuaria según mi estilo de dieta en el perfil  
   *quiero* indicar cuántos días cubre la compra y cuántas personas comen  
   *para* obtener una lista con cantidades orientativas (plantilla por dieta **o IA**), marcar ítems al comprar **o marcar toda la lista de una vez** si compré todo junto.

2. **Guardar mercado realizado (nuevo)**  
   *Como* usuaria  
   *quiero* **guardar una versión del mercado** (con lo que marqué como comprado) en un historial y designar cuál está **activa para el plan**  
   *para* volver más tarde y **generar el cronograma** alineado con lo que tengo en la despensa, y poder **exportar/importar un JSON** de respaldo entre dispositivos.

3. **Cronograma desde perfil y/o mercado (nuevo)**  
   *Como* usuaria con perfil (edad, peso, talla, salud, gustos)  
   *quiero* elegir si el cronograma se basa **solo en el perfil**, **solo en el mercado activo** o en **modo mixto**  
   *para* ver menús y recetas con videos que **prioricen los ingredientes comprados** y respeten mis exclusiones.

4. **Variedad de sugerencias (nuevo)**  
   *Como* usuaria  
   *quiero* que las combinaciones de platos **no sean siempre las mismas** y poder pulsar “nuevas combinaciones”  
   *para* explorar más opciones dentro de mi estilo de dieta.

5. **Perfil y resumen**  
   *Como* persona con datos corporales y gustos  
   *quiero* registrar edad, peso, talla, condiciones de salud y alimentos que no me gustan  
   *para* ver un resumen orientativo (no diagnóstico) junto al cronograma.

6. **Belleza natural**  
   *Como* usuaria  
   *quiero* leer tips de mascarillas y rituales caseros con ingredientes simples  
   *para* inspirarme sin depender de productos agresivos.

7. **Cuenta y sincronización**  
   *Como* usuaria  
   *quiero* registrarme con email o Google cuando configure el backend  
   *para* guardar mi perfil en la nube además del dispositivo.

   Cuando uso **correo y contraseña**, quiero poder **pedir recuperación si olvidé la contraseña** desde Iniciar sesión (enlace por email a `/#/actualizar-clave`) y **cambiar mi contraseña desde Mi espacio** estando dentro; si solo uso **Google**, el cambio de “contraseña de la app” no aplica (gestión desde Google).

8. **Asistente IA (opcional)**  
   *Como* usuaria con dudas puntuales  
   *quiero* hacer preguntas en lenguaje natural  
   *para* recibir ideas prácticas, sabiendo que no sustituyen a un profesional de la salud.

9. **Recetas por IA para todos los días (nuevo)**  
   *Como* usuaria con `VITE_GEMINI_API_KEY` (clave gratuita en Google AI Studio)  
   *quiero* pulsar **“Generar recetas con agente IA (gratis)”** y obtener **un menú completo** (desayuno, almuerzo, cena) para **cada día** que configuré (3–30 días), usando mi **perfil**, el **modo** (perfil / mercado / mixto) y los **alimentos del mercado guardado**  
   *para* tener textos de receta distintos y vídeo/consultas asociadas al plato, sin depender solo de plantillas fijas.

10. **Cronograma en menú y al guardar mercado**  
    *Como* usuaria  
    *quiero* una entrada **Cronograma** en el menú y que, al guardar el mercado, se abra **automáticamente** la pantalla del cronograma con los días alineados al mercado  
    *para* ver de inmediato el menú y las recetas sin buscar la sección a mano.

11. **Multiperfil, historiales y diario por día**  
    *Como* usuaria que organiza familia  
    *quiero* varios **perfiles**, **historial de mercados y planes nombrados**, **calendario** y **diario fotográfico** por día  
    *para* no mezclar datos y tener respaldo útil desde Mi espacio (`docs/FLUJO_USUARIO.md`).

12. **PWA y móvil**  
    *Como* usuaria móvil  
    *quiero* una interfaz responsive e instalable  
    *para* usar la app con buena experiencia táctil y acceso rápido desde la pantalla de inicio.

---

## Fase 3 — evolutivo (próxima ejecución)

*Referencia técnica y orden de PRs:* [`docs/PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md`](./PLAN_MEJORAS_FASE3_NUTRICION_SUPABASE_UI.md) (**F3.0** auth contraseña, luego F3.1+). Épica de negocio **F:** `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`.

13. **Sincronizar lo esencial en la cuenta (Supabase gratis)**  
    *Como* usuaria con sesión iniciada  
    *quiero* que **mercados guardados**, **planes de menú** y **objetivos nutricionales opcionales** se respalden en la cuenta **dentro de los límites del plan gratuito**  
    *para* no perder lo importante si cambio de navegador o dispositivo (las fotos pesadas pueden seguir con la estrategia actual de Storage + local).

14. **Alimentos extra en el mercado**  
    *Como* usuaria que compra cosas fuera de la lista sugerida  
    *quiero* **añadir ítems manualmente**, marcarlos como comprados y **guardarlos** en el mismo mercado realizado  
    *para* que el cronograma y las recetas consideren **toda** mi despensa.

15. **Menú con despensa completa y metas orientativas de peso/energía**  
    *Como* usuaria que marca metas solo como **orientación** (no tratamiento médico)  
    *quiero* que el sistema use **todo** el mercado activo, proponga cantidades coherentes con **calorías y macros estimadas** respecto a un presupuesto diario aclarado en pantalla  
    *para* ver qué esperar cada día sin confundir la app con un profesional sanitario.

16. **Video y nutrición en la misma pantalla**  
    *Como* usuaria  
    *quiero* **reproducir el video de la receta dentro de la web** cuando la fuente lo permita, con **macros estimados por plato** y un **saldo/resto del día frente al presupuesto**  
    *para* no tener que saltar a otra app cada vez que cocino.

17. **Código limpio y documentación viviente**  
    *Como* desarrolladora o agente manteniendo el repo  
    *quiero* módulos acotados, tipos fuertes y que **historias**, **flujo** y **plan Fase 3** se actualicen al cerrar hitos  
    *para* poder ejecutar el evolutivo en iteraciones cortas sin perder contexto.

18. **UI más tecnológica y animada (accesible)**  
    *Como* usuaria  
    *quiero* una estética más **marcada y moderna** con animaciones **cortas y opcionales** según configuración del sistema  
    *para* disfrutar la interfaz sin sacrificar claridad ni `prefers-reduced-motion`.

---

## Fase 4 — IA de calidad, persistencia y sesión (mayo 2026)

19. **Mercado personalizado con IA**  
    *Como* usuaria con perfil guardado  
    *quiero* pulsar **"Generar con IA ✦"** en el mercado y obtener una lista de compra adaptada a mi **estilo de dieta, condiciones de salud y alimentos que evito**, con cantidades calculadas para los días y personas que indiqué  
    *para* no recibir siempre la misma lista genérica de plantilla.

20. **Cronograma calórico experto**  
    *Como* usuaria con meta de peso definida  
    *quiero* que el cronograma IA genere menús cuya **suma diaria se acerque a mis calorías objetivo** (TDEE + déficit/superávit según ritmo) y que el **agente actúe como dietista experto** en mi tipo de dieta (keto / mediterránea / balanceada) con macros precisos  
    *para* que las recetas sean coherentes con mi plan de adelgazamiento o mantenimiento.

21. **Cronograma activo persiste al navegar**  
    *Como* usuaria que genera un plan IA  
    *quiero* que al salir de la página de Cronograma y volver, **el plan que generé con IA siga activo y visible** automáticamente  
    *para* no tener que regenerar cada vez que cambio de pestaña.

22. **Limpiar datos locales al cerrar sesión**  
    *Como* usuaria en un dispositivo compartido  
    *quiero* que al cerrar sesión se borren el perfil, mercado y cronograma del dispositivo  
    *para* que la siguiente persona no vea mis datos al abrir la app.

23. **Persistencia real del plan activo entre sesiones** _(fix crítico)_  
    *Como* usuaria  
    *quiero* que el cronograma que dejé activo se mantenga al recargar la página o cambiar de pestaña y volver  
    *para* no perder mi menú generado con IA entre visitas.  
    **Criterios de aceptación:**  
    - Al navegar fuera y regresar al cronograma, se muestra el plan IA activo (no las plantillas por defecto).  
    - El plan activo persiste en `localStorage` con el `snapActivoId`; se restaura en el montaje.  
    - Los efectos React se ordenan: *reset* → *restauración* para que la restauración gane.  
    - El plan solo se descarta si el usuario activamente cambia días/modo/dieta/mercado.

24. **Lista base personalizada por tipo de dieta**  
    *Como* usuaria con dieta mediterránea o balanceada  
    *quiero* que "Generar lista base" me entregue alimentos de MI tipo de dieta con cantidades coherentes  
    *para* no recibir siempre una **lista plantilla equivocada** (p. ej. solo keto) que no corresponde a lo que como.  
    **Criterios de aceptación:**  
    - Hay **catálogos distintos** por `estiloDieta` del perfil (**cetogénica**, **mediterránea**, **balanceada**) vía `generarListaBase`.
    - La función `generarListaBase(dias, personas, estiloDieta)` selecciona el catálogo correcto.  
    - El botón "Generar con IA ✦" aparece **primero**; "Generar lista base" aparece después.  
    - Las cantidades base se calculan multiplicando `basePorPersonaDia × días × personas`.

25. **Exportar lista de compras a PDF**  
    *Como* usuaria  
    *quiero* descargar mi lista de compras como un PDF con tabla detallada  
    *para* llevarlo impreso al supermercado o compartirlo.  
    **Criterios de aceptación:**  
    - Botón "📄 Descargar PDF" visible en Mi mercado (`KetoMercado.tsx`) cuando hay ítems.  
    - PDF muestra: nombre/perfil, tipo de dieta, días/personas, tabla agrupada por categoría (ítem, cantidad, unidad, estado comprado/pendiente, origen IA/manual/base).  
    - Se genera abriendo una ventana de impresión formateada (sin dependencias externas).

26. **Exportar cronograma a PDF**  
    *Como* usuaria  
    *quiero* descargar mi menú semanal como PDF con el detalle de cada comida  
    *para* tenerlo a mano sin necesidad de estar conectada.  
    **Criterios de aceptación:**  
    - Botón "📄 Descargar PDF" visible en el cronograma cuando hay días de plan.  
    - PDF muestra: nombre del plan, perfil, tipo de dieta, objetivo calórico, por cada día: desayuno/almuerzo/cena con ingredientes truncados y macros (kcal, P, G, C).  
    - Incluye promedio de kcal/día del plan completo.

## Hotfix producción — vídeo, mercado activo, plan activo (mayo 2026)

| ID | Como usuario | Quiero | Para que |
|----|--------------|--------|----------|
| **H27** | persona con plan IA | ver un vídeo o un enlace claro en el modal del día | no me quede con pantalla negra «Video no disponible» |
| **H28** | comprador | que al marcar un mercado como activo se carguen sus ítems y comprados | el progreso (ej. 31/16) coincida al volver a Mi mercado |
| **H29** | usuario con cuenta | que el plan «Marcar activo» sobreviva al cerrar sesión | retome el mismo menú tras iniciar sesión en otro dispositivo |

**Criterios de aceptación H27–H29:** ver `docs/PLAN_FIX_PROD_MAY2026.md` (fase 2).

## Hotfix producción + vídeo multi-plataforma (mayo 2026)

| ID | Como usuario | Quiero | Para que |
|----|--------------|--------|----------|
| **H27** | persona con plan IA | ver un vídeo o enlace claro en el modal del día | no quede pantalla negra «Video no disponible» |
| **H28** | comprador | que el mercado activo cargue sus ítems y comprados | el progreso coincida al volver a Mi mercado |
| **H29** | usuario con cuenta | que «Marcar activo» del plan persista tras cerrar sesión | retome el mismo menú al volver a entrar |
| **H30** | cocinero | ver el tutorial en la app aunque esté en TikTok, YouTube u otra red | reproduzca en el modal sin depender solo de YouTube |

**H30 — criterios:** `react-player` con URL en `videoUrl`; búsqueda automática (`recipeVideoResolve`) con validación embed (`videoEmbedValidate` + noembed); badge de plataforma; fallback de búsqueda. Ver `docs/PLAN_FIX_PROD_MAY2026.md`.

| **H31** | usuario del cronograma | descargar el menú en PDF con receta completa e imagen del plato | cocinar sin abrir la app |

**H31 — criterios:** PDF async con ingredientes + pasos (`parseRecetaDetalle`), miniatura YouTube o TheMealDB (`platoImagen`), botón «Preparando PDF…» en Cronograma.

## Estado implementación (historias 13–26, mayo 2026)

| Historia | Criterios clave implementados |
|----------|-------------------------------|
| **13** (sync Supabase) | Push/pull mercados y planes; borrado remoto al borrar local |
| **14** (ítems extra) | Campo `origen: "manual"` en `ListaItem`; UI agregar ítem en **Mi mercado** (`KetoMercado.tsx`); delete individual |
| **15** (despensa completa + macros) | Prompt recibe lista entera con cantidades y unidades; `porciones`; `fiber_g` |
| **16** (video + nutrición) | Embed nocookie verificado con miniatura; fallback visual; tarjetas macro por color |
| **17** (código limpio) | `tsc --noEmit` pasa estricto; fix import `supabase` en `Login`; script `npm run typecheck` |
| **18** (UI tech) | Tarjetas macro con gradientes y hover; tokens Tailwind; `motion-safe:`/`motion-reduce:` |
| **19** (mercado IA) | `mercadoIA.ts` con `generarMercadoIA()`; botón "Generar con IA ✦" en **Mi mercado**; badge IA; reintentar |
| **20** (cronograma calórico) | TDEE + déficit/superávit; macros por dieta; persona "dietista experto" en prompt; macros obligatorios |
| **21** (persistencia IA) | `useEffect` restaura plan IA activo al montar; ref flag para no sobreescribir en sesión activa |
| **22** (logout limpio) | `signOut` borra `tec_nutri_salud_*` de localStorage cuando Supabase está configurado; navega a `/` |
| **23** (persistencia fix) | Efectos reordenados (reset → restauración); eliminada condición de longitud en `cronogramaMostrado`; restauración no modifica `diasCronograma`/`modoCronograma` para evitar bucle |
| **24** (lista base por dieta) | Catálogos `mediterraneoCatalog` + `balanceadoCatalog` en `ketoCatalog.ts`; `generarListaBase(dias, personas, estiloDieta)` selecciona catálogo; botones reordenados en **Mi mercado** |
| **25** (PDF mercado) | `exportarMercadoPdf()` en `pdfExport.ts`; botón "📄 Descargar PDF" en **Mi mercado**; tabla HTML agrupada por categoría |
| **26** (PDF cronograma) | `exportarCronogramaPdf()` en `pdfExport.ts`; botón "📄 Descargar PDF" en Cronograma; tabla por día con macros |

## UX polish adicional (mayo 2026)

| Área | Implementado |
|------|-------------|
| **Cronograma** | Barra de progreso IA (por chunks + %) y botón Reintentar; botón Copiar plan; empty state guiado; badges kcal/macros/vídeo/IA por día en lista |
| **Modal día** | Botones ◀ ▶ para navegar entre días (+ teclas ArrowLeft / ArrowRight); botón Copiar receta por slot |
| **Mi mercado** | Barra progreso compras global; navegación por categoría (incl. cereales/frutas/legumbres donde aplique); contador X/Y por categoría; edición cantidad en línea; eliminar ítem; filtro "solo pendientes"; copiar texto y PDF |
| **Asistente** | Respuestas en Markdown; chips de sugerencias; historial reciente en localStorage |
| **Mis datos** | Barra de completitud del perfil (Básico / Recomendado / Detallado) |
| **Mi espacio** | CTA "Siguiente paso" como banner con gradiente en la parte superior; badges de antigüedad en mercado y plan |
| **Belleza** | Barra sticky de categorías con scroll anclado |
| **Login** | Toggle mostrar/ocultar contraseña |
| **404** | Página propia con CTAs al inicio y al cronograma |

## Criterios transversales

- Aviso visible: las estimaciones nutricionales, las recetas generadas por IA y el chat del asistente son **orientativas**.
- Despliegue gratuito en **GitHub Pages** con build reproducible en CI.
- **Hoy:** el mercado y los planes pueden vivir sobre todo en **almacenamiento local** + respaldo JSON; **Fase 3** amplía opcionalmente la **copia esencial en Supabase** según tabla `profiles` / tablas pequeñas con JSONB (ver plan F3).
