import { redis } from '../redis.js';

const CHANNEL = 'board-events';

export function startSubscriber(io) {
  const sub = redis.duplicate();
  sub.on('error', (err) => console.error('[redis:sub]', err.message));
  sub.subscribe(CHANNEL);

  sub.on('message', (_channel, raw) => {
    try {
      const { type, boardId, payload, actor } = JSON.parse(raw);
      // Every replica receives every message. io.local only emits to this replica's own
      // sockets, so each browser gets the event exactly once.
      io.local.to(`board:${boardId}`).emit(type, { payload, actor });
    } catch (err) {
      console.error('[subscriber]', err.message);
    }
  });
}
