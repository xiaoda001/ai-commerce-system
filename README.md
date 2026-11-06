# AI Commerce System

An npm-workspaces monorepo for the commerce platform.

## Applications and ports

- `apps/storefront`: Next.js customer storefront at `http://127.0.0.1:3000`
- `apps/api`: NestJS HTTP API at `http://127.0.0.1:3001`
- `apps/admin`: React administration SPA at `http://127.0.0.1:3002`
- `apps/worker`: background worker process; it has no HTTP port
- `packages/contracts`: shared request and response types
- `packages/data-access`: shared TypeORM configuration

## Local development

Run `npm install` once from the repository root. Copy `.env.example` to the ignored root `.env` and replace `DB_PASSWORD` with a local development password. Start MySQL, Redis, and Kafka using the host addresses documented in [Local services](docs/development/local-services.md).

Start each application in its own terminal from the repository root:

```sh
npm run dev --workspace @commerce/storefront
npm run start:dev --workspace @commerce/api
npm run dev --workspace @commerce/admin
npm run start:dev --workspace @commerce/worker
```

The API liveness endpoint is `GET http://127.0.0.1:3001/health/live`. Its readiness endpoint is `GET http://127.0.0.1:3001/health/ready`; it returns dependency status for MySQL, Redis, and Kafka and responds with HTTP 503 if any dependency is unavailable.

Root scripts run the corresponding command in every workspace that defines it:

```sh
npm run build
npm run typecheck
npm run lint
npm test
```
