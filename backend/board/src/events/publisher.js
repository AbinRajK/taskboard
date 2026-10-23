import Redis from 'ioredis';
import { config } from '../config.js';

const redis = new Redis(config.redisUrl, { maxRetriesPerRequest: 2 });
redis.on('error', (err) => console.error('[redis]', err.message));

export const CHANNEL = 'board-events';

// The realtime service subscribes to this channel and pushes events to browsers.
// A failed publish must never fail the request that already saved the data.
export async function publish(type, boardId, payload, actor) {
  try {
    await redis.publish(
      CHANNEL,
      JSON.stringify({ type, boardId: String(boardId), payload, actor })
    );
  } catch (err) {
    console.error('[publish]', type, err.message);
  }
}
