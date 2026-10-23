'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const inputClass =
  'rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none';

export default function BoardsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  const [boards, setBoards] = useState(null);
  const [title, setTitle] = useState('');
  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) return;
    if (!user) return router.replace('/login');
    api('/boards')
      .then(setBoards)
      .catch((err) => setError(err.message));
  }, [ready, user, router]);

  const createBoard = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const board = await api('/boards', { method: 'POST', body: { title } });
      router.push(`/boards/${board.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  const joinBoard = (e) => {
    e.preventDefault();
    // The board page offers a "join" button when you aren't a member yet.
    const id = joinId.trim().split('/').pop();
    if (id) router.push(`/boards/${id}`);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Your boards</h1>

      <form onSubmit={createBoard} className="mb-3 flex gap-2">
        <input
          required
          placeholder="New board name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button className="rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-white">
          Create
        </button>
      </form>

      <form onSubmit={joinBoard} className="mb-8 flex gap-2">
        <input
          placeholder="Paste a board link to join it"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className={`${inputClass} flex-1`}
        />
        <button className="rounded border border-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-600">
          Open
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      {boards === null && !error && <p className="text-sm text-zinc-500">Loading boards…</p>}
      {boards?.length === 0 && <p className="text-sm text-zinc-500">No boards yet. Create your first one above.</p>}

      <ul className="grid gap-3 sm:grid-cols-2">
        {boards?.map((board) => (
          <li key={board.id}>
            <Link
              href={`/boards/${board.id}`}
              className="block rounded-lg border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
            >
              <span className="font-medium">{board.title}</span>
              <span className="mt-1 block font-mono text-xs text-zinc-500">
                {board.members.length} {board.members.length === 1 ? 'member' : 'members'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
