import { config } from '../config.js';
import { touch, remove, list } from './presence.js';

const BOARD_ID = /^[a-f0-9]{24}$/;
const room = (boardId) => `board:${boardId}`;

async function broadcastPresence(io, boardId) {
  // io.to() goes through the Redis adapter, so sockets on every replica get it.
  io.to(room(boardId)).emit('presence', await list(boardId));
}

async function canAccess(boardId, userId) {
  const res = await fetch(`${config.boardUrl}/boards/${boardId}/access`, {
    headers: { 'x-user-id': userId },
  });
  return res.ok;
}

export function registerRoomHandlers(io, socket) {
  const user = socket.data.user;
  const joined = new Set();

  const leave = async (boardId) => {
    if (!joined.delete(boardId)) return;
    await socket.leave(room(boardId));

    // Same person with another tab still open? Keep them in the presence list.
    const others = await io.in(room(boardId)).fetchSockets();
    const stillHere = others.some((s) => s.id !== socket.id && s.data.user?.id === user.id);
    if (!stillHere) await remove(boardId, user);
    await broadcastPresence(io, boardId);
  };

  socket.on('board:join', async (boardId, ack) => {
    try {
      if (typeof boardId !== 'string' || !BOARD_ID.test(boardId)) return ack?.({ ok: false });
      if (!(await canAccess(boardId, user.id))) return ack?.({ ok: false });

      await socket.join(room(boardId));
      joined.add(boardId);
      await touch(boardId, user);
      await broadcastPresence(io, boardId);
      ack?.({ ok: true });
    } catch (err) {
      console.error('[board:join]', err.message);
      ack?.({ ok: false });
    }
  });

  socket.on('board:leave', (boardId) => {
    leave(boardId).catch((err) => console.error('[board:leave]', err.message));
  });

  socket.on('board:heartbeat', (boardId) => {
    if (joined.has(boardId)) touch(boardId, user).catch(() => {});
  });

  socket.on('disconnect', () => {
    for (const boardId of [...joined]) {
      leave(boardId).catch((err) => console.error('[disconnect]', err.message));
    }
  });
}
