import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client.
 * Configured for mobile usage patterns: longer stale times, retry logic.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes
      gcTime: 15 * 60 * 1000,          // 15 minutes garbage collection
      retry: (failureCount, error) => {
        // Do not retry on 4xx client errors
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status !== undefined && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
