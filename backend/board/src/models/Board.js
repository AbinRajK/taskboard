import mongoose from 'mongoose';
import { jsonOptions } from './serialize.js';

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    owner: { type: String, required: true },
    members: { type: [String], index: true, default: [] },
  },
  { timestamps: true, toJSON: jsonOptions }
);

export default mongoose.model('Board', boardSchema);
