import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { resultsService } from '@/api/services/results.service';
import { useLang } from '@/hooks/useLang';

export function useResultsSummary() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['results', 'summary'],
    queryFn: () => resultsService.getSummary(),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: 1,
  });
}

export function useRecentRuns() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lang = useLang();
  return useQuery({
    queryKey: ['results', 'recent', lang],
    queryFn: () => resultsService.getRecentRuns({ lang }),
    enabled: isAuthenticated,
    staleTime: 0,
    retry: 1,
  });
}
