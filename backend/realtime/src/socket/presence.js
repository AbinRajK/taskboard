import { redis } from '../redis.js';

// Who is looking at a board. Stored in Redis (not in process memory) so every
// realtime replica sees the same list. Each entry's score is its last heartbeat time.
const STALE_MS = 30_000;
const key = (boardId) => `presence:${boardId}`;
const member = (user) => JSON.stringify({ id: user.id, name: user.name });

export async function touch(boardId, user) {
  await redis.zadd(key(boardId), Date.now(), member(user));
  await redis.pexpire(key(boardId), STALE_MS * 2);
}

export async function remove(boardId, user) {
  await redis.zrem(key(boardId), member(user));
}

export async function list(boardId) {
  await redis.zremrangebyscore(key(boardId), 0, Date.now() - STALE_MS);
  const rows = await redis.zrange(key(boardId), 0, -1);
  return rows.map((row) => JSON.parse(row));
}
