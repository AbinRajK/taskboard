import mongoose from 'mongoose';
import { jsonOptions } from './serialize.js';

const listSchema = new mongoose.Schema(
  {
    boardId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    position: { type: Number, required: true },
  },
  { timestamps: true, toJSON: jsonOptions }
);

export default mongoose.model('List', listSchema);
