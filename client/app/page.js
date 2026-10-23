'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && user) router.replace('/boards');
  }, [ready, user, router]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-4xl font-semibold tracking-tight">A kanban board that updates as you type.</h1>
      <p className="mt-4 text-zinc-400">
        Create a board, share the link, and watch cards move between lists for everyone at once.
      </p>
      <div className="mt-8 flex gap-3 text-sm">
        <Link href="/register" className="rounded bg-zinc-100 px-4 py-2 font-semibold text-zinc-900 hover:bg-white">
          Get started
        </Link>
        <Link href="/login" className="rounded border border-zinc-800 px-4 py-2 text-zinc-300 hover:border-zinc-600">
          Sign in
        </Link>
      </div>
    </div>
  );
}
