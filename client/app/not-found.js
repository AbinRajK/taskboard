import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link href="/" className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300">
        Back to the start
      </Link>
    </div>
  );
}
