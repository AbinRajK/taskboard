# Taskboard

![CD](https://github.com/AbinRajK/taskboard/actions/workflows/cd.yml/badge.svg)

A small real-time kanban board built as a microservices project: Next.js client, four Node
services, Redis, MongoDB, Docker, Kubernetes (kind) and a GitHub Actions pipeline.

```
browser -> ingress -+- /                  -> client   (Next.js, Tailwind, @hello-pangea/dnd)
                    +- /api, /socket.io   -> gateway -+- auth      (users, JWT)           MongoDB "auth"
                                                      +- board     (boards, lists, cards)  MongoDB "boards"
                                                      +- realtime  (Socket.io, 2 replicas)

board -- publishes events --> Redis --> every realtime replica --> browsers in that board's room
```

## Run it with Docker Compose

```bash
cp .env.example .env            # set JWT_SECRET
docker compose up --build       # mongo, redis, auth, board, realtime x2, gateway on :4000

cd client
cp .env.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

Register two users in two browsers, open the same board (use "share link", then "Join board"),
and drag a card in one window.

## Run it on local Kubernetes (kind)

```bash
kind create cluster --name taskboard --config scripts/kind-config.yaml
kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml

for s in gateway auth board realtime; do docker build -t taskboard-$s:local backend/$s; done
docker build -t taskboard-client:local client
for i in gateway auth board realtime client; do kind load docker-image taskboard-$i:local --name taskboard; done

kubectl apply -f k8s/namespace.yaml
kubectl -n taskboard create secret generic taskboard-secrets --from-literal=JWT_SECRET="$(openssl rand -hex 32)"
kubectl apply -k k8s
kubectl -n taskboard get pods          # realtime shows 2 pods

bash scripts/smoke-test.sh http://localhost
cd scripts && npm install && CLIENTS=50 node load-test.js
```

Open http://localhost. Delete everything with `kind delete cluster --name taskboard`.

## Design decisions

- **Why the realtime service is separate:** WebSocket connections are long-lived and scale on
  a different curve from REST calls, so it runs as its own deployment with 2+ replicas.
- **Redis does three jobs:** it carries events from `board` to `realtime`, backs the Socket.io
  adapter and the presence list (so replicas agree), and stores the gateway's rate-limit counters.
- **Exactly-once delivery:** every replica receives every Redis event, so the subscriber emits
  with `io.local` (this replica's own sockets only). Using `io.to()` there would deliver each
  event once per replica. `scripts/load-test.js` checks this.
- **WebSocket transport only:** long-polling would need sticky sessions across replicas.
- **Card order:** each card has a numeric `position`. A move picks a number between its new
  neighbours, so one document changes per drag.
- **Conflicts:** cards carry a `version`. A move based on a stale version is rejected with 409
  and the client reloads the board.
- **Identity:** only the gateway verifies the JWT. It strips any incoming `x-user-*` headers and
  sets its own, and the other services trust them because they are only reachable inside the cluster.
- **Optimistic UI:** the card moves immediately, then the server confirms. Events are idempotent,
  so the REST response and the socket event can both arrive.

## Known limits

- The JWT lives in `localStorage`, which is simple but readable by any XSS bug.
- Positions are floats. After roughly 50 inserts into the same gap they stop being distinct, so
  a rebalance job would be needed for heavy use.
- Anyone signed in who has a board link can join it. There are no invites or roles yet.
- Comments, labels and card descriptions are not in the UI. The API already stores `description`.
- The CD pipeline deploys to a temporary cluster for verification, not to a permanent environment.
