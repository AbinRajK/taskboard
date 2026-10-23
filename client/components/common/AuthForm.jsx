'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const inputClass =
  'w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-zinc-600 focus:outline-none';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const router = useRouter();
  const { signIn } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: isRegister ? form : { email: form.email, password: form.password },
      });
      signIn(data);
      router.push('/boards');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mb-6 text-sm text-zinc-400">
        {isRegister ? 'Start organising work on shared boards.' : 'Sign in to open your boards.'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        {isRegister && (
          <input
            required
            placeholder="Name"
            autoComplete="name"
            value={form.name}
            onChange={update('name')}
            className={inputClass}
          />
        )}
        <input
          required
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          className={inputClass}
        />
        <input
          required
          type="password"
          placeholder="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          minLength={isRegister ? 8 : undefined}
          value={form.password}
          onChange={update('password')}
          className={inputClass}
        />

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
        >
          {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-400">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link href={isRegister ? '/login' : '/register'} className="text-emerald-400 hover:text-emerald-300">
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </div>
  );
}
