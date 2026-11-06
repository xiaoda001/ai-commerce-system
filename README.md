# AI Commerce System

An npm-workspaces monorepo for the commerce platform.

## Workspaces

- `apps/api`: NestJS HTTP API (planned port 3001)
- `apps/worker`: background worker process
- `apps/storefront`: Next.js customer storefront (planned port 3000)
- `apps/admin`: React administration SPA (planned port 3002)
- `packages/contracts`: shared request and response types
- `packages/data-access`: shared TypeORM configuration

## Commands

Run `npm install` once at the repository root. The root scripts delegate to each workspace when that workspace defines the corresponding script:

```sh
npm run build
npm run typecheck
npm run lint
npm test
```

Application startup scripts will be added as the application slices are implemented.
