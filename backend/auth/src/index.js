import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import authRoutes from './routes/auth.routes.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/', authRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'server error' });
});

await mongoose.connect(config.mongoUrl);
app.listen(config.port, () => console.log(`auth listening on ${config.port}`));
