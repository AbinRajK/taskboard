import { Router } from 'express';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import mongoose from 'mongoose';
import { boardForUser } from '../utils/access.js';
import { nextPosition } from '../utils/position.js';
import { publish } from '../events/publisher.js';

const router = Router();

const cleanTitle = (value) => (typeof value === 'string' ? value.trim() : '');

router.get('/boards', async (req, res) => {
  const boards = await Board.find({ members: req.user.id }).sort({ createdAt: -1 });
  res.json(boards);
});

router.post('/boards', async (req, res) => {
  const title = cleanTitle(req.body?.title);
  if (!title) return res.status(400).json({ message: 'Enter a board name' });

  const board = await Board.create({
    title,
    owner: req.user.id,
    members: [req.user.id],
  });

  await List.insertMany(
    ['To do', 'In progress', 'Done'].map((listTitle, i) => ({
      boardId: board.id,
      title: listTitle,
      position: (i + 1) * 1000,
    }))
  );

  res.status(201).json(board);
});

router.get('/boards/:boardId', async (req, res) => {
  const board = await boardForUser(req.params.boardId, req.user.id);
  if (!board) return res.status(404).json({ message: 'Board not found' });

  const [lists, cards] = await Promise.all([
    List.find({ boardId: board.id }).sort({ position: 1 }),
    Card.find({ boardId: board.id }).sort({ position: 1 }),
  ]);

  res.json({ board, lists, cards });
});

// Called by the realtime service before it lets a socket join a board room.
router.get('/boards/:boardId/access', async (req, res) => {
  const board = await boardForUser(req.params.boardId, req.user.id);
  res.sendStatus(board ? 204 : 403);
});

// Simple sharing: anyone signed in who has the board link can join it.
router.post('/boards/:boardId/join', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.boardId)) {
    return res.status(404).json({ message: 'Board not found' });
  }
  const board = await Board.findByIdAndUpdate(
    req.params.boardId,
    { $addToSet: { members: req.user.id } },
    { new: true }
  );
  if (!board) return res.status(404).json({ message: 'Board not found' });
  res.json(board);
});

router.post('/boards/:boardId/lists', async (req, res) => {
  const board = await boardForUser(req.params.boardId, req.user.id);
  if (!board) return res.status(404).json({ message: 'Board not found' });

  const title = cleanTitle(req.body?.title);
  if (!title) return res.status(400).json({ message: 'Enter a list name' });

  const last = await List.findOne({ boardId: board.id }).sort({ position: -1 });
  const list = await List.create({
    boardId: board.id,
    title,
    position: nextPosition(last?.position),
  });

  await publish('list.created', board.id, { list: list.toJSON() }, req.user);
  res.status(201).json(list);
});

export default router;
