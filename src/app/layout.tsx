import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Gourmet Express - QR Table Ordering & Dining',
  description: 'Fast, frictionless QR table ordering platform with live order tracking and online/cash payments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-sans bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 min-h-screen">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
