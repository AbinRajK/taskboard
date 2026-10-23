import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { identity } from './middleware/identity.js';
import boardsRoutes from './routes/boards.routes.js';
import listsRoutes from './routes/lists.routes.js';
import cardsRoutes from './routes/cards.routes.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '50kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(identity);
app.use(boardsRoutes);
app.use(listsRoutes);
app.use(cardsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'server error' });
});

await mongoose.connect(config.mongoUrl);
app.listen(config.port, () => console.log(`board listening on ${config.port}`));
