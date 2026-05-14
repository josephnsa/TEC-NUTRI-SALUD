# Historias de usuario (TEC Nutri Salud)

## Persona

María quiere comer mejor en estilo keto, organizar el mercado, **guardar lo que realmente compró** y que el sistema le arme un **cronograma coherente con esos ingredientes**, con recetas y enlaces a videos. También quiere **variedad** en las sugerencias, no siempre los mismos platos.

## Historias

1. **Mercado keto**  
   *Como* usuaria con dieta baja en carbos  
   *quiero* indicar cuántos días cubre la compra y cuántas personas comen  
   *para* obtener una lista con cantidades orientativas, marcar ítems al comprar **o marcar toda la lista de una vez** si compré todo junto.

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

## Criterios transversales

- Aviso visible: las estimaciones nutricionales, las recetas generadas por IA y el chat del asistente son **orientativas**.
- Despliegue gratuito en **GitHub Pages** con build reproducible en CI.
- **Hoy:** el mercado y los planes pueden vivir sobre todo en **almacenamiento local** + respaldo JSON; **Fase 3** amplía opcionalmente la **copia esencial en Supabase** según tabla `profiles` / tablas pequeñas con JSONB (ver plan F3).
