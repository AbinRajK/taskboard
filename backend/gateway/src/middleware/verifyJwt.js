import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Verifies the token, then passes the identity to downstream services as headers.
// Downstream services are only reachable inside the cluster, so they trust these headers.
export function verifyJwt(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'missing token' });

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.headers['x-user-id'] = String(payload.sub);
    req.headers['x-user-name'] = encodeURIComponent(payload.name || '');
    next();
  } catch {
    res.status(401).json({ message: 'invalid or expired token' });
  }
}
