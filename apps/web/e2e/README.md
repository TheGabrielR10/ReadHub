# E2E (Playwright)

Pruebas End-to-End de ReadHub. Viven completamente separadas de Vitest
(`packages/**/*.test.ts`) — Playwright nunca prueba lógica interna ya cubierta
por unitarias; solo verifica el comportamiento observable desde el navegador,
como lo haría un usuario real.

## Estructura

```
e2e/
├── fixtures/   datos de prueba (credenciales, textos de UI esperados)
├── pages/      Page Objects — encapsulan selectores por pantalla
├── utils/      helpers reutilizables (login, esperas, limpieza de estado)
└── *.spec.ts   las pruebas en sí, una por flujo
```

## Ejecutar

```bash
npm run test:e2e --workspace @readhub/web          # headless (CI-like)
npm run test:e2e:report --workspace @readhub/web   # ver el último reporte HTML
```

`playwright.config.ts` arranca automáticamente `npm run start` (build de
producción) contra `http://localhost:3000` — no hace falta dejar un servidor
corriendo a mano. Para apuntar a un despliegue ya existente (p. ej. Vercel):

```bash
PLAYWRIGHT_BASE_URL=https://readhub-web-eight.vercel.app npm run test:e2e --workspace @readhub/web
```

Las pruebas específicas se implementan en fases posteriores del laboratorio.
