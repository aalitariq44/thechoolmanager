'use client';

import { Inter } from 'next/font/google';
import { AuthProvider } from '../contexts/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.className} bg-gray-100`}>
        <AuthProvider>
          {!isLoginPage && (
            <>
              <Header />
              <Sidebar />
            </>
          )}
          <main className={`transition-all duration-200 ${!isLoginPage ? 'mr-64 mt-16' : ''} p-6 overflow-y-auto`}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
