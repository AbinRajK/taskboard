import mongoose from 'mongoose';
import { jsonOptions } from './serialize.js';

const cardSchema = new mongoose.Schema(
  {
    boardId: { type: String, required: true, index: true },
    listId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 2000 },
    position: { type: Number, required: true },
    // Bumped on every change. A move that carries a stale version is rejected.
    version: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: jsonOptions }
);

export default mongoose.model('Card', cardSchema);
