@AGENTS.md

## Convenciones del proyecto
- Respeta las capas: `domain` no importa nada de `infrastructure`, `app` ni librerías externas.
- Toda dependencia externa entra por un puerto en `application/ports` y se conecta en `infrastructure/container.ts`.
- Precios en centavos (`Money`). Nunca floats.
- Copy/SEO en `src/content/copy.json`; datos de marca en `src/config/site.ts`.
- `npm run check` debe pasar antes de cualquier commit.
