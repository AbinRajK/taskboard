import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { config } from './config.js';
import { redis } from './redis.js';
import { authenticate } from './socket/auth.js';
import { registerRoomHandlers } from './socket/rooms.js';
import { startSubscriber } from './events/subscriber.js';

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end('{"status":"ok"}');
  }
  res.writeHead(404).end();
});

// WebSocket only. Long-polling would need sticky sessions across replicas.
const io = new Server(httpServer, {
  transports: ['websocket'],
  cors: { origin: true },
});
io.adapter(createAdapter(redis, redis.duplicate()));

io.use(authenticate);
io.on('connection', (socket) => registerRoomHandlers(io, socket));
startSubscriber(io);

httpServer.listen(config.port, () => console.log(`realtime listening on ${config.port}`));
