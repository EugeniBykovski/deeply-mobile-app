import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { ResultsSummary, RecentRunItem } from '../types';

export type ResultsRange = 'week' | 'month' | 'all';

export const resultsService = {
  getRecentRuns: async (params?: { lang?: string }): Promise<RecentRunItem[]> => {
    const { data } = await apiClient.get<RecentRunItem[]>(
      endpoints.results.recent,
      { params },
    );
    return data;
  },

  getSummary: async (params?: { lang?: string }): Promise<ResultsSummary> => {
    const { data } = await apiClient.get<ResultsSummary>(
      endpoints.results.summary,
      { params },
    );
    return data;
  },

  getTrainingReport: async (
    slug: string,
    params?: { range?: ResultsRange; lang?: string },
  ) => {
    const { data } = await apiClient.get(endpoints.results.training(slug), {
      params,
    });
    return data;
  },

  getProgramReport: async (
    slug: string,
    params?: { lang?: string },
  ) => {
    const { data } = await apiClient.get(endpoints.results.program(slug), {
      params,
    });
    return data;
  },

  getPrivateReport: async (
    id: string,
    params?: { range?: ResultsRange },
  ) => {
    const { data } = await apiClient.get(endpoints.results.private(id), {
      params,
    });
    return data;
  },
};
