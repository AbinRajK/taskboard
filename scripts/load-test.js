// Opens many WebSocket clients on one board, moves one card, and checks that every client
// received the event exactly once. With 2+ realtime replicas this proves the Redis adapter
// works (no missed events) and that replicas don't double-deliver (no duplicates).
//
//   cd scripts && npm install
//   BASE=http://localhost CLIENTS=50 npm run load-test
import { io } from 'socket.io-client';

const BASE = process.env.BASE || 'http://localhost';
const CLIENTS = Number(process.env.CLIENTS || 50);

async function call(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const { token } = await call('/auth/register', {
  method: 'POST',
  body: { name: 'Load Test', email: `load-${Date.now()}@example.com`, password: 'load-test-pw1' },
});

const board = await call('/boards', { method: 'POST', token, body: { title: 'Load test board' } });
const { lists } = await call(`/boards/${board.id}`, { token });
const card = await call(`/lists/${lists[0].id}/cards`, { method: 'POST', token, body: { title: 'Move me' } });

console.log(`connecting ${CLIENTS} clients...`);
const received = new Array(CLIENTS).fill(0);

const sockets = await Promise.all(
  Array.from({ length: CLIENTS }, (_, i) =>
    new Promise((resolve, reject) => {
      const socket = io(BASE, { transports: ['websocket'], auth: { token } });
      socket.on('connect_error', reject);
      socket.on('card.moved', () => received[i]++);
      socket.on('connect', () =>
        socket.emit('board:join', board.id, (res) =>
          res?.ok ? resolve(socket) : reject(new Error('could not join board room'))
        )
      );
    })
  )
);

console.log('moving one card...');
await call(`/cards/${card.id}/move`, {
  method: 'PATCH',
  token,
  body: { listId: lists[1].id, position: 1000, expectedVersion: card.version },
});

await new Promise((r) => setTimeout(r, 1500));

const exactlyOnce = received.filter((n) => n === 1).length;
const missed = received.filter((n) => n === 0).length;
const duplicated = received.filter((n) => n > 1).length;

console.log(`exactly once: ${exactlyOnce}/${CLIENTS}   missed: ${missed}   duplicated: ${duplicated}`);
sockets.forEach((s) => s.disconnect());
process.exit(exactlyOnce === CLIENTS ? 0 : 1);
