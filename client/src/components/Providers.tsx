'use client';

import { AuthProvider } from '@/context/AuthContext';
import { SearchProvider } from '@/context/SearchContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SearchProvider>{children}</SearchProvider>
    </AuthProvider>
  );
}

