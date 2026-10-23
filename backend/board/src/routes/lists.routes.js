import { Router } from 'express';
import Card from '../models/Card.js';
import { listForUser } from '../utils/access.js';
import { nextPosition } from '../utils/position.js';
import { publish } from '../events/publisher.js';

const router = Router();

router.post('/lists/:listId/cards', async (req, res) => {
  const list = await listForUser(req.params.listId, req.user.id);
  if (!list) return res.status(404).json({ message: 'List not found' });

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ message: 'Enter a card title' });

  const last = await Card.findOne({ listId: list.id }).sort({ position: -1 });
  const card = await Card.create({
    boardId: list.boardId,
    listId: list.id,
    title,
    position: nextPosition(last?.position),
  });

  await publish('card.created', list.boardId, { card: card.toJSON() }, req.user);
  res.status(201).json(card);
});

export default router;
