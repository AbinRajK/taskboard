import mongoose from 'mongoose';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

// Each helper returns the document, or null when it doesn't exist or the user isn't a member.
export async function boardForUser(boardId, userId) {
  if (!mongoose.isValidObjectId(boardId)) return null;
  return Board.findOne({ _id: boardId, members: userId });
}

export async function listForUser(listId, userId) {
  if (!mongoose.isValidObjectId(listId)) return null;
  const list = await List.findById(listId);
  if (!list) return null;
  const board = await boardForUser(list.boardId, userId);
  return board ? list : null;
}

export async function cardForUser(cardId, userId) {
  if (!mongoose.isValidObjectId(cardId)) return null;
  const card = await Card.findById(cardId);
  if (!card) return null;
  const board = await boardForUser(card.boardId, userId);
  return board ? card : null;
}
