import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Toast from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VendPOS — Point of sale for modern merchants',
  description:
    'A merchant-side POS with race-safe stock decrement, tenant isolation, and append-only sales history.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
        <Toast />
      </body>
    </html>
  );
}