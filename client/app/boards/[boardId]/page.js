'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useBoard } from '@/hooks/useBoard';
import Board from '@/components/board/Board';
import PresenceAvatars from '@/components/common/PresenceAvatars';

export default function BoardPage() {
  const { boardId } = useParams();
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  if (!ready || !user) return null;
  return <BoardView boardId={boardId} />;
}

function BoardView({ boardId }) {
  const { status, error, board, lists, cards, people, moveCard, addCard, addList, removeCard, join } =
    useBoard(boardId);
  const [copied, setCopied] = useState(false);

  if (status === 'loading') {
    return <p className="px-6 py-10 text-sm text-zinc-500">Loading board…</p>;
  }

  if (status === 'forbidden') {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-xl font-semibold">You are not on this board yet</h1>
        <p className="mt-2 text-sm text-zinc-400">
          If someone shared this link with you, you can join and start working on it.
        </p>
        <div className="mt-6 flex gap-3 text-sm">
          <button onClick={join} className="rounded bg-zinc-100 px-4 py-2 font-semibold text-zinc-900 hover:bg-white">
            Join board
          </button>
          <Link href="/boards" className="rounded border border-zinc-800 px-4 py-2 text-zinc-300 hover:border-zinc-600">
            Back to my boards
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return <p className="px-6 py-10 text-sm text-rose-400">{error}</p>;
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-baseline gap-3">
          <Link href="/boards" className="font-mono text-xs text-zinc-500 hover:text-zinc-300">
            boards /
          </Link>
          <h1 className="text-lg font-semibold">{board.title}</h1>
        </div>

        <div className="flex items-center gap-4">
          <PresenceAvatars people={people} />
          <button
            type="button"
            onClick={copyLink}
            className="rounded border border-zinc-800 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-100"
          >
            {copied ? 'link copied' : 'share link'}
          </button>
        </div>
      </div>

      <Board
        lists={lists}
        cards={cards}
        onMoveCard={moveCard}
        onAddCard={addCard}
        onDeleteCard={removeCard}
        onAddList={addList}
      />
    </>
  );
}
