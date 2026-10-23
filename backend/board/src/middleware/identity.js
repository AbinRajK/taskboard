// The gateway has already verified the JWT and forwards the identity as headers.
export function identity(req, res, next) {
  const id = req.headers['x-user-id'];
  if (!id) return res.status(401).json({ message: 'unauthorized' });

  let name = '';
  try {
    name = decodeURIComponent(req.headers['x-user-name'] || '');
  } catch {
    name = '';
  }
  req.user = { id: String(id), name };
  next();
}
