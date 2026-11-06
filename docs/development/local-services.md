# Local service connections

The API and Worker connect to MySQL, Redis, and Kafka using the root `.env` configuration. For applications running directly on the host, use these local addresses:

| Service | Host-run address | Configuration |
| --- | --- | --- |
| MySQL | `127.0.0.1:3306` | `DB_HOST`, `DB_PORT` |
| Redis | `127.0.0.1:6379` | `REDIS_URL=redis://127.0.0.1:6379` |
| Kafka | `127.0.0.1:9092` | `KAFKA_BROKERS=127.0.0.1:9092` |

The expected local MySQL database is `commerce`, with application user `commerce_app`. These are sample development values; set a local password before starting the API or Worker. Do not commit a populated `.env` or production credentials.

Copy `.env.example` to the ignored repository-root `.env`, then replace `DB_PASSWORD=replace-local-only` with your local MySQL password. The template contains these service/session keys and safe local examples (one-time admin keys are commented out):

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=commerce
DB_USER=commerce_app
DB_PASSWORD=replace-local-only
REDIS_URL=redis://127.0.0.1:6379
KAFKA_BROKERS=127.0.0.1:9092
API_PORT=3001
SESSION_SECRET=replace-with-a-random-secret-at-least-32-bytes-long
SESSION_TTL_SECONDS=86400
SESSION_COOKIE_SECURE=false
WEB_ALLOWED_ORIGINS=http://127.0.0.1:3000,http://127.0.0.1:3002
```

Run the API migration with `npm run db:migrate --workspace @commerce/api`. To create the first administrator, temporarily add `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` to `.env`, run `npm run admin:bootstrap --workspace @commerce/api`, then remove those two values and restart the API so its Casbin enforcer reloads the new policies. The initializer grants the `super_admin` role in both markets and refuses a duplicate admin email. Never use a production password in local development.

These loopback addresses are for processes running on the host. If NestJS runs in a container, `127.0.0.1` points to that container itself. Configure MySQL and Redis with their Docker network service names and ports, and configure Kafka with broker addresses advertised by Kafka that are reachable from the NestJS container. Kafka's advertised listeners must be reachable from the client network; setting only the initial bootstrap address is insufficient when the broker returns unreachable advertised addresses.
