'use client'; // This must be a Client Component

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// The provider component wraps children and provides the QueryClient
export const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  // Use state to ensure the QueryClient is only created once per application lifecycle
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Example: Global options for all queries
        staleTime: 60 * 1000, // Data considered fresh for 1 minute
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Optional: Add devtools for easier debugging in development */}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
};