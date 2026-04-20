import { router } from 'expo-router';
import type { RecentRunItem } from '@/api/types';

export function canContinue(item: RecentRunItem): boolean {
  if (item.completed) return false;
  if (item.type === 'dive') return !!item.templateSlug;
  if (item.type === 'training') return !!(item.templateSlug && item.programSlug);
  return false;
}

export function continueItem(item: RecentRunItem) {
  if (item.type === 'dive' && item.templateSlug) {
    router.push({
      pathname: '/dive/[slug]',
      params: { slug: item.templateSlug, autoStart: '1' },
    } as any);
  } else if (item.type === 'training' && item.templateSlug && item.programSlug) {
    router.push({
      pathname: '/train/[slug]/[trainingSlug]',
      params: { slug: item.programSlug, trainingSlug: item.templateSlug, autoStart: '1' },
    } as any);
  }
}
