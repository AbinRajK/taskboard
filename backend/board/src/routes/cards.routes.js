import { Router } from 'express';
import Card from '../models/Card.js';
import { cardForUser, listForUser } from '../utils/access.js';
import { publish } from '../events/publisher.js';

const router = Router();

router.patch('/cards/:cardId/move', async (req, res) => {
  const card = await cardForUser(req.params.cardId, req.user.id);
  if (!card) return res.status(404).json({ message: 'Card not found' });

  const { listId, position, expectedVersion } = req.body || {};
  if (typeof position !== 'number' || !Number.isFinite(position)) {
    return res.status(400).json({ message: 'position must be a number' });
  }

  const target = await listForUser(listId, req.user.id);
  if (!target || target.boardId !== card.boardId) {
    return res.status(400).json({ message: 'Invalid destination list' });
  }

  // Only apply the move if nobody else changed the card since the client last saw it.
  const filter = { _id: card.id };
  if (typeof expectedVersion === 'number') filter.version = expectedVersion;

  const updated = await Card.findOneAndUpdate(
    filter,
    { $set: { listId: target.id, position }, $inc: { version: 1 } },
    { new: true }
  );
  if (!updated) {
    return res.status(409).json({ message: 'This card was changed by someone else. Reloading.' });
  }

  await publish('card.moved', updated.boardId, { card: updated.toJSON() }, req.user);
  res.json(updated);
});

router.patch('/cards/:cardId', async (req, res) => {
  const card = await cardForUser(req.params.cardId, req.user.id);
  if (!card) return res.status(404).json({ message: 'Card not found' });

  const set = {};
  if (typeof req.body?.title === 'string' && req.body.title.trim()) {
    set.title = req.body.title.trim();
  }
  if (typeof req.body?.description === 'string') {
    set.description = req.body.description;
  }
  if (!Object.keys(set).length) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const updated = await Card.findByIdAndUpdate(
    card.id,
    { $set: set, $inc: { version: 1 } },
    { new: true }
  );

  await publish('card.updated', updated.boardId, { card: updated.toJSON() }, req.user);
  res.json(updated);
});

router.delete('/cards/:cardId', async (req, res) => {
  const card = await cardForUser(req.params.cardId, req.user.id);
  if (!card) return res.status(404).json({ message: 'Card not found' });

  await Card.deleteOne({ _id: card.id });
  await publish('card.deleted', card.boardId, { cardId: card.id }, req.user);
  res.sendStatus(204);
});

export default router;
