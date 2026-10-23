import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export function authenticate(socket, next) {
  try {
    const payload = jwt.verify(socket.handshake.auth?.token, config.jwtSecret);
    socket.data.user = { id: String(payload.sub), name: payload.name || 'user' };
    next();
  } catch {
    next(new Error('unauthorized'));
  }
}
