import { useQuery } from '@tanstack/react-query';
import { diveService } from '@/api/services/dive.service';
import { useLang } from '@/hooks/useLang';

export function useDiveTemplates() {
  const lang = useLang();
  return useQuery({
    queryKey: ['dive', 'templates', lang],
    queryFn: () => diveService.getTemplates({ lang }),
    select: (d) => d.items,
  });
}
