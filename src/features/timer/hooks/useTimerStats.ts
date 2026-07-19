import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { timerService } from '../api/timerService';

/** /timer routes require auth (a session/attempt is inherently per-user),
 *  matching the existing dive/train run-creation convention — so this is
 *  only fetched once signed in, never fired doomed-to-401 for anonymous users. */
export function useTimerStats() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['timer', 'stats'],
    queryFn: () => timerService.getStats(),
    enabled: isAuthenticated,
  });
}
