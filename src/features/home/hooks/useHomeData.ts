import { useQuery } from '@tanstack/react-query';
import { trainService } from '@/api/services/train.service';
import { diveService } from '@/api/services/dive.service';
import { cultureService } from '@/api/services/culture.service';

// ─── Query keys — centralized so cache invalidation is predictable ────────────

export const queryKeys = {
  trainBlocks: ['train', 'blocks'] as const,
  diveTemplates: ['dive', 'templates'] as const,
  cultureSections: ['culture', 'sections'] as const,
} as const;

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTrainBlocks() {
  return useQuery({
    queryKey: queryKeys.trainBlocks,
    queryFn: () => trainService.getBlocks(),
  });
}

export function useDiveTemplates() {
  return useQuery({
    queryKey: queryKeys.diveTemplates,
    queryFn: () => diveService.getTemplates(),
    select: (data) => data.items,
  });
}

export function useCultureSections() {
  return useQuery({
    queryKey: queryKeys.cultureSections,
    queryFn: () => cultureService.getSections(),
  });
}
