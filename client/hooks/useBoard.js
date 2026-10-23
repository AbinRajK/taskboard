'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, getToken } from '@/lib/api';
import { between } from '@/lib/position';

const byPosition = (a, b) => a.position - b.position;

export function useBoard(boardId) {
  const [status, setStatus] = useState('loading'); // loading | ready | forbidden | error
  const [error, setError] = useState('');
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [people, setPeople] = useState([]);

  const cardsRef = useRef([]);
  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const load = useCallback(async () => {
    try {
      const data = await api(`/boards/${boardId}`);
      setBoard(data.board);
      setLists(data.lists);
      setCards(data.cards);
      setStatus('ready');
    } catch (err) {
      if (err.status === 404 || err.status === 403) {
        setStatus('forbidden');
      } else {
        setError(err.message);
        setStatus('error');
      }
    }
  }, [boardId]);

  useEffect(() => {
    load();
  }, [load]);

  // Replace or add a card. Events can arrive twice (REST response and socket), and a
  // stale one must never overwrite a newer version, so this is safe to call repeatedly.
  const upsertCard = useCallback((card) => {
    setCards((prev) => {
      const existing = prev.find((c) => c.id === card.id);
      if (existing && existing.version > card.version) return prev;
      return existing ? prev.map((c) => (c.id === card.id ? card : c)) : [...prev, card];
    });
  }, []);

  const upsertList = useCallback((list) => {
    setLists((prev) => (prev.some((l) => l.id === list.id) ? prev : [...prev, list]));
  }, []);

  // Live updates
  useEffect(() => {
    if (status !== 'ready') return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || undefined, {
      transports: ['websocket'],
      auth: { token: getToken() },
    });

    let firstConnect = true;
    socket.on('connect', () => {
      socket.emit('board:join', boardId, (res) => {
        if (!res?.ok) console.warn('Could not join the live board room');
      });
      // After a dropped connection we may have missed events, so fetch the board again.
      if (!firstConnect) load();
      firstConnect = false;
    });

    socket.on('card.created', ({ payload }) => upsertCard(payload.card));
    socket.on('card.moved', ({ payload }) => upsertCard(payload.card));
    socket.on('card.updated', ({ payload }) => upsertCard(payload.card));
    socket.on('card.deleted', ({ payload }) =>
      setCards((prev) => prev.filter((c) => c.id !== payload.cardId))
    );
    socket.on('list.created', ({ payload }) => upsertList(payload.list));
    socket.on('presence', setPeople);

    const heartbeat = setInterval(() => socket.emit('board:heartbeat', boardId), 10_000);

    return () => {
      clearInterval(heartbeat);
      socket.emit('board:leave', boardId);
      socket.disconnect();
    };
  }, [status, boardId, load, upsertCard, upsertList]);

  const moveCard = useCallback(
    async (cardId, destListId, destIndex) => {
      const current = cardsRef.current;
      const card = current.find((c) => c.id === cardId);
      if (!card) return;

      // The destination list without the moved card, so destIndex is the final slot.
      const dest = current
        .filter((c) => c.listId === destListId && c.id !== cardId)
        .sort(byPosition);
      const position = between(dest[destIndex - 1]?.position ?? null, dest[destIndex]?.position ?? null);

      // Optimistic update: the card moves immediately, the server confirms afterwards.
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, listId: destListId, position } : c))
      );

      try {
        const updated = await api(`/cards/${cardId}/move`, {
          method: 'PATCH',
          body: { listId: destListId, position, expectedVersion: card.version },
        });
        upsertCard(updated);
      } catch {
        // Rejected (for example someone else moved it first): show the real state.
        await load();
      }
    },
    [load, upsertCard]
  );

  const addCard = useCallback(
    async (listId, title) => {
      upsertCard(await api(`/lists/${listId}/cards`, { method: 'POST', body: { title } }));
    },
    [upsertCard]
  );

  const addList = useCallback(
    async (title) => {
      upsertList(await api(`/boards/${boardId}/lists`, { method: 'POST', body: { title } }));
    },
    [boardId, upsertList]
  );

  const removeCard = useCallback(
    async (cardId) => {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      try {
        await api(`/cards/${cardId}`, { method: 'DELETE' });
      } catch {
        await load();
      }
    },
    [load]
  );

  const join = useCallback(async () => {
    await api(`/boards/${boardId}/join`, { method: 'POST' });
    setStatus('loading');
    await load();
  }, [boardId, load]);

  return { status, error, board, lists, cards, people, moveCard, addCard, addList, removeCard, join };
}
