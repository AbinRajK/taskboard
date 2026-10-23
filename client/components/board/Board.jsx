'use client';

import { useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import List from './List';

const byPosition = (a, b) => a.position - b.position;

export default function Board({ lists, cards, onMoveCard, onAddCard, onDeleteCard, onAddList }) {
  const [newList, setNewList] = useState('');

  const sortedLists = useMemo(() => [...lists].sort(byPosition), [lists]);

  const cardsByList = useMemo(() => {
    const map = Object.fromEntries(lists.map((l) => [l.id, []]));
    for (const card of [...cards].sort(byPosition)) {
      if (map[card.listId]) map[card.listId].push(card);
    }
    return map;
  }, [lists, cards]);

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    onMoveCard(draggableId, destination.droppableId, destination.index);
  };

  const submitList = async (e) => {
    e.preventDefault();
    const title = newList.trim();
    if (!title) return;
    setNewList('');
    await onAddList(title);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-9rem)] items-start gap-4 overflow-x-auto px-6 pb-4">
        {sortedLists.map((list) => (
          <List
            key={list.id}
            list={list}
            cards={cardsByList[list.id] || []}
            onAddCard={onAddCard}
            onDeleteCard={onDeleteCard}
          />
        ))}

        <form onSubmit={submitList} className="w-72 shrink-0">
          <input
            value={newList}
            onChange={(e) => setNewList(e.target.value)}
            placeholder="+ Add another list"
            maxLength={80}
            className="w-full rounded-lg border border-dashed border-zinc-800 bg-transparent px-3 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </form>
      </div>
    </DragDropContext>
  );
}
