import { useQuery } from '@tanstack/react-query';
import { trainService } from '@/api/services/train.service';
import { useLang } from '@/hooks/useLang';

export function useProgramTrainings(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ['train', 'program', slug, lang],
    queryFn: () => trainService.getProgramTrainings(slug, { lang }),
    enabled: !!slug,
  });
}
