import { useQuery } from '@tanstack/react-query';
import { trainService } from '@/api/services/train.service';
import { useLang } from '@/hooks/useLang';

export function useTrainingDetail(slug: string) {
  const lang = useLang();
  return useQuery({
    queryKey: ['train', 'detail', slug, lang],
    queryFn: () => trainService.getTraining(slug, { lang }),
    enabled: !!slug,
  });
}
