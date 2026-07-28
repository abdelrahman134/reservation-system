import './globals.css';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';

export const metadata: Metadata = {
  title: 'Apartment Reservation System | Management & Revenue Analytics',
  description:
    'Full-stack management dashboard for apartment reservations, users, bookings, interactive calendar, and financial analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <LanguageProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white/60 backdrop-blur py-4 text-center text-xs text-slate-500">
              Apartment Reservation Management System &bull; Next.js 14 App Router &amp; MongoDB Atlas
            </footer>
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
