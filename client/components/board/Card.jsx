'use client';

import { Draggable } from '@hello-pangea/dnd';

export default function Card({ card, index, onDelete }) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group mb-2 flex items-start justify-between gap-2 rounded-md border bg-zinc-950 p-3 text-sm text-zinc-300 ${
            snapshot.isDragging ? 'border-emerald-400 shadow-lg shadow-black/40' : 'border-zinc-800'
          }`}
        >
          <span className="min-w-0 break-words">{card.title}</span>
          <button
            type="button"
            aria-label={`Delete ${card.title}`}
            onClick={() => onDelete(card.id)}
            className="shrink-0 rounded px-1 font-mono text-xs text-zinc-600 opacity-0 transition-opacity hover:text-rose-400 focus:opacity-100 group-hover:opacity-100"
          >
            x
          </button>
        </div>
      )}
    </Draggable>
  );
}
