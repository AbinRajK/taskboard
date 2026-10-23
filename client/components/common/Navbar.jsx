'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <Link href={user ? '/boards' : '/'} className="font-mono text-sm font-bold text-zinc-100">
          taskboard
        </Link>

        {user && (
          <div className="flex items-center gap-4 font-mono text-xs text-zinc-400">
            <span>{user.name}</span>
            <button
              type="button"
              onClick={() => {
                signOut();
                router.push('/login');
              }}
              className="rounded border border-zinc-800 px-3 py-1.5 transition-colors hover:border-zinc-600 hover:text-zinc-100"
            >
              sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
