import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-2xl font-semibold tracking-tight text-gray-900">
            Run a real shop on a real system.
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-base text-gray-600">
            Spin up a tenant in 60 seconds. Try every page with the seeded Owner and Cashier demos.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
            >
              Create your tenant
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              Try the demo
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} VendPOS · A merchant-side POS for modern shops.</p>
          <div className="flex items-center gap-5">
            <Link href="/auth/login" className="hover:text-gray-900">Sign in</Link>
            <Link href="/auth/register" className="hover:text-gray-900">Sign up</Link>
            <a href="https://github.com/emciiowhy/VendPOS" target="_blank" rel="noreferrer noopener" className="hover:text-gray-900">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
