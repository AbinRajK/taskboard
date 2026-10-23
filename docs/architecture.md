# Architecture notes

## Moving a card

1. The browser updates its own state immediately, then calls `PATCH /api/cards/:id/move`.
2. The gateway checks the JWT, adds `x-user-id`, and forwards to the board service.
3. The board service saves the move only if `version` still matches, then publishes
   `card.moved` on the Redis channel `board-events`.
4. Each realtime replica receives the message and emits it to its own sockets in room
   `board:<id>`.
5. Other browsers update their state. The mover's browser applies the same event again,
   which changes nothing because updates are keyed by card id and version.

## Services and ports

| Service  | Port | Owns                                    |
|----------|------|-----------------------------------------|
| client   | 3000 | UI only                                 |
| gateway  | 4000 | routing, JWT check, rate limit          |
| auth     | 4001 | users (MongoDB `auth`)                  |
| board    | 4002 | boards, lists, cards (MongoDB `boards`) |
| realtime | 4003 | sockets, presence (Redis)               |
