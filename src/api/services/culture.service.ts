import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  CultureSection,
  CultureArticlesResponse,
  CultureArticle,
} from '../types';

export interface ArticlesParams {
  section?: string;
  lang?: string;
  pageOutput?: string;
  limit?: number;
}

export const cultureService = {
  getSections: async (): Promise<CultureSection[]> => {
    const { data } = await apiClient.get<CultureSection[]>(
      endpoints.culture.sections,
    );
    return data;
  },

  getArticles: async (
    params?: ArticlesParams,
  ): Promise<CultureArticlesResponse> => {
    const { data } = await apiClient.get<CultureArticlesResponse>(
      endpoints.culture.articles,
      { params },
    );
    return data;
  },

  getArticle: async (
    slug: string,
    params?: { lang?: string },
  ): Promise<CultureArticle> => {
    const { data } = await apiClient.get<CultureArticle>(
      endpoints.culture.article(slug),
      { params },
    );
    return data;
  },
};
