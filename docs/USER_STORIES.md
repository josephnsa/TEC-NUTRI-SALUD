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

8. **Asistente IA (opcional)**  
   *Como* usuaria con dudas puntuales  
   *quiero* hacer preguntas en lenguaje natural  
   *para* recibir ideas prácticas, sabiendo que no sustituyen a un profesional de la salud.

9. **Recetas por IA para todos los días (nuevo)**  
   *Como* usuaria con `VITE_GEMINI_API_KEY` (clave gratuita en Google AI Studio)  
   *quiero* pulsar **“Generar recetas con agente IA (gratis)”** y obtener **un menú completo** (desayuno, almuerzo, cena) para **cada día** que configuré (3–30 días), usando mi **perfil**, el **modo** (perfil / mercado / mixto) y los **alimentos del mercado guardado**  
   *para* tener textos de receta distintos y **consultas en YouTube** (internet) por comida, sin depender solo de plantillas fijas.

10. **Cronograma en menú y al guardar mercado (nuevo)**  
   *Como* usuaria  
   *quiero* una entrada **Cronograma** en el menú y que, al guardar el mercado, se abra **automáticamente** la pantalla del cronograma con los días alineados al mercado  
   *para* ver de inmediato el menú y las recetas sin buscar la sección a mano.

11. **PWA y móvil**  
   *Como* usuaria móvil  
   *quiero* una interfaz responsive e instalable  
   *para* usar la app con buena experiencia táctil y acceso rápido desde la pantalla de inicio.

## Criterios transversales

- Aviso visible: las estimaciones nutricionales, las recetas generadas por IA y el chat del asistente son **orientativas**.
- Despliegue gratuito en **GitHub Pages** con build reproducible en CI.
- El mercado guardado vive en **almacenamiento local** del navegador hasta que exista backend específico para listas (Supabase opcional en roadmap).
