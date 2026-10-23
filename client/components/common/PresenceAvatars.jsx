'use client';

export default function PresenceAvatars({ people }) {
  if (!people.length) return null;

  return (
    <div className="flex items-center gap-1.5" aria-label="People on this board">
      {people.map((person) => (
        <span
          key={person.id}
          title={person.name}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/60 bg-zinc-900 font-mono text-[11px] uppercase text-emerald-400"
        >
          {person.name.slice(0, 1) || '?'}
        </span>
      ))}
    </div>
  );
}
