import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from './config.js';
import { verifyJwt } from './middleware/verifyJwt.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

const health = (_req, res) => res.json({ status: 'ok' });
app.get('/health', health);
app.get('/api/health', health);

// Never trust identity headers that come from outside the cluster.
app.use((req, _res, next) => {
  delete req.headers['x-user-id'];
  delete req.headers['x-user-name'];
  next();
});

app.use('/api/auth', rateLimit({ windowSec: 60, max: 20, prefix: 'rl:auth' }));
app.use('/api', rateLimit({ windowSec: 60, max: 300, prefix: 'rl:api' }));

const boardPaths = ['/api/boards', '/api/lists', '/api/cards'];
app.use(boardPaths, verifyJwt);

const onError = (err, _req, res) => {
  console.error('[proxy]', err.message);
  if (typeof res.writeHead === 'function' && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'service unavailable' }));
  }
};

// No body parser here on purpose: the proxy must stream the raw request body.
app.use(
  createProxyMiddleware({
    target: config.authUrl,
    pathFilter: '/api/auth',
    pathRewrite: { '^/api/auth': '' },
    changeOrigin: true,
    on: { error: onError },
  })
);

app.use(
  createProxyMiddleware({
    target: config.boardUrl,
    pathFilter: boardPaths,
    pathRewrite: { '^/api': '' },
    changeOrigin: true,
    on: { error: onError },
  })
);

const socketProxy = createProxyMiddleware({
  target: config.realtimeUrl,
  pathFilter: '/socket.io',
  ws: true,
  changeOrigin: true,
  on: { error: onError },
});
app.use(socketProxy);

const server = app.listen(config.port, () => {
  console.log(`gateway listening on ${config.port}`);
});
server.on('upgrade', socketProxy.upgrade);
