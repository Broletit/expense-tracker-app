import './globals.css';
import Providers from './providers';
import Header from '@/components/ui/Header';
import GlobalTopLoader from '@/components/layout/GlobalTopLoader';

export const metadata = {
  title: 'Expense Tracker',
  description: 'Next.js + SQLite + React Query + Recharts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className="w-full min-h-screen overflow-x-hidden
                   transition-colors duration-500 ease-in-out
                   bg-gray-50 text-gray-900
                   dark:bg-gray-900 dark:text-gray-100"
      >
        <Providers>
          {/*  Thanh loading toàn cục, dựa trên React Query */}
          <GlobalTopLoader />

          <Header />

          {/* Không set nền riêng để ăn nền body */}
          <main className="w-full px-4 md:px-6 lg:px-10 py-6 bg-transparent">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
