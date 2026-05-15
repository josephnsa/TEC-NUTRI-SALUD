# Plan evolutivo — correcciones producción (mayo 2026)

## Contexto

Tres incidencias reportadas en GitHub Pages con usuario autenticado (Supabase):

1. **Vídeo cronograma**: iframe YouTube «Video no disponible» en modal día.
2. **Mi mercado activo**: historial muestra comprados; vista principal 0/16.
3. **Plan activo**: «Marcar activo» no sobrevive a cerrar sesión.

## Fase 1 — Corrección inmediata (implementada)

| ID | Problema | Causa | Solución |
|----|----------|-------|----------|
| V1 | Embed falla | Solo YouTube iframe; IDs inventados | **react-player** multi-plataforma (YouTube, TikTok, Vimeo, Facebook, Instagram, MP4); campo `videoUrl` en IA; `recipeVideoUrl.ts`; fallback «Ver receta en vídeo» |
| M1 | 0/16 con mercado activo | Lista `keto_lista_v1` desacoplada del snapshot activo | Hidratar desde `getMercadoRealizado(activoId)` al montar y al «Activar»; `actualizarMercadoEnHistorial` al marcar comprados |
| P1 | Plan activo perdido | Solo `localStorage`; `signOut` borra `tec_nutri_salud_*` | `activosModulo` en `family_json`; restaurar tras `fetchAndApplyFamilyRemote`; upsert al marcar activo |

## Fase 2 — Pruebas funcionales

### Vídeo (cronograma) — multi-plataforma (H30)

- [ ] Plan IA con `video_url` de YouTube: reproductor embebido con controles.
- [ ] Plan con URL TikTok/Vimeo válida: reproduce en modal (badge de plataforma visible).
- [ ] Sin URL: tarjeta «Ver receta en vídeo» (búsqueda), sin pantalla negra.
- [ ] Enlace «Abrir en [plataforma]» abre el vídeo en pestaña nueva.

### Mi mercado

- [ ] Guardar mercado con ítems marcados; activar en historial.
- [ ] Recargar página: progreso coincide (ej. 31/16 → N/M del snapshot).
- [ ] Cambiar de módulo y volver: misma lista.
- [ ] «Descargar PDF» genera archivo con ítems actuales.

### Plan activo

- [ ] Marcar plan en historial → cerrar sesión → iniciar sesión.
- [ ] Plan sigue con badge «activo» y restauración de días/modo.

## Fase 3 — Evolutivo (backlog)

- Búsqueda automática de `video_url` vía API (YouTube Data, TikTok o agregador) tras generar plan.
- Validar embed con YouTube Data API (cuota) en generación IA.
- Columna `preferences_json` en `profiles` si `family_json` crece demasiado.
- No borrar claves de prefs en `signOut` (opcional; hoy se recupera vía nube).

## Prompt de regresión (agente)

```
Revisa NutriSalud en producción: (1) modal día cronograma sin «Video no disponible» sin fallback;
(2) Mi mercado con activoId debe mostrar items del snapshot, no lista vacía;
(3) plan activo en family_json tras login. Archivos: RecipeVideoEmbed, youtubeEmbed, KetoMercado,
mercadoHistorial, cronogramaHistorial, perfilStorage activosModulo, prefsActivos, profileRemote.
Ejecuta npm run test && npm run typecheck.
```
