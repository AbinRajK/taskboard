'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import Card from './Card';

export default function List({ list, cards, onAddCard, onDeleteCard }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const value = title.trim();
    if (!value) return;
    setTitle('');
    await onAddCard(list.id, value);
  };

  return (
    <section className="flex max-h-full w-72 shrink-0 flex-col rounded-lg border border-zinc-800 bg-zinc-900">
      <header className="flex items-baseline justify-between px-3 pb-2 pt-3">
        <h2 className="text-sm font-medium text-zinc-200">{list.title}</h2>
        <span className="font-mono text-xs text-zinc-500">{cards.length}</span>
      </header>

      <Droppable droppableId={list.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-12 flex-1 overflow-y-auto px-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-zinc-800/40' : ''
            }`}
          >
            {cards.map((card, index) => (
              <Card key={card.id} card={card} index={index} onDelete={onDeleteCard} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      <div className="p-3 pt-1">
        {adding ? (
          <form onSubmit={submit} className="space-y-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              maxLength={200}
              className="w-full rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
            <div className="flex gap-2 text-xs">
              <button className="rounded bg-zinc-100 px-3 py-1.5 font-semibold text-zinc-900 hover:bg-white">
                Add
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded px-3 py-1.5 text-zinc-400 hover:text-zinc-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="w-full rounded px-2 py-1.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            + Add a card
          </button>
        )}
      </div>
    </section>
  );
}
