import Link from 'next/link';
import { Store } from 'lucide-react';

export default function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
            <Store className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-gray-900">VendPOS</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/auth/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
