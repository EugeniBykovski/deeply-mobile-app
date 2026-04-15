import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type {
  DiveListResponse,
  DiveTemplate,
  CreateDiveRunPayload,
  DiveRunResponse,
} from '../types';

export const diveService = {
  getTemplates: async (params?: { lang?: string }): Promise<DiveListResponse> => {
    const { data } = await apiClient.get<DiveListResponse>(
      endpoints.dive.templates,
      { params },
    );
    return data;
  },

  getTemplate: async (
    slug: string,
    params?: { lang?: string },
  ): Promise<DiveTemplate> => {
    const { data } = await apiClient.get<DiveTemplate>(
      endpoints.dive.template(slug),
      { params },
    );
    return data;
  },

  saveRun: async (payload: CreateDiveRunPayload): Promise<DiveRunResponse> => {
    const { data } = await apiClient.post<DiveRunResponse>(
      endpoints.dive.run,
      payload,
    );
    return data;
  },
};
