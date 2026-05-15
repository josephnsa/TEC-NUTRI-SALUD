# Checklist de cierre — NutriSalud (mayo 2026)

## Hecho en código y publicado en `main`

- Multiperfil, Mi mercado por perfil, cronograma con fechas y calendario.
- Vídeo embed + fallback; respaldo JSON v1; **respaldo completo v2** (datos + medios del cronograma cuando caben).
- Límites de tamaño al adjuntar fotos/vídeo; sync opcional mercados/planes y Storage.
- **66+ tests** Vitest; CI ejecuta `typecheck` + `test` antes del build.

## Acción manual (una vez por proyecto)

1. [Supabase](https://supabase.com/dashboard) → **SQL Editor** → pegar y ejecutar `supabase/schema.sql`.
2. **Authentication** → Redirect URLs: `https://TU_USUARIO.github.io/TEC-NUTRI-SALUD/#/login` y `#/actualizar-clave`.
3. Secrets en GitHub (repo): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY` (opcional).
4. **Settings → Pages** → Source: GitHub Actions.

## Verificación rápida en producción

- [ ] Login / registro (email o Google).
- [ ] Crear perfil → Mi mercado → guardar lista → Cronograma (plantillas o IA).
- [ ] Mi espacio → **Descargar respaldo completo** → en otro navegador **Restaurar respaldo (v1 o v2)**.
- [ ] Detalle de día: adjuntar foto pequeña; si hay cuenta, comprobar que no falla la subida a Storage.

## Backlog (no bloquea el núcleo)

- Export ZIP binario (hoy v2 es JSON con base64).
- QA exhaustiva en móvil y PWA offline.
- Mejoras de negocio en `docs/MEJORAS_NEGOCIO_Y_PRODUCTO.md`.
