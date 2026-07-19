import { apiClient } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type {
  CreateTimerAttemptPayload,
  CreateTimerSessionPayload,
  CreateTimerSessionResponse,
  TimerAttempt,
  TimerMode,
  TimerSessionDetail,
  TimerSessionListResponse,
  TimerStatsResponse,
} from '@/api/types';

export const timerService = {
  createSession: async (payload: CreateTimerSessionPayload): Promise<CreateTimerSessionResponse> => {
    const { data } = await apiClient.post<CreateTimerSessionResponse>(endpoints.timer.sessions, payload);
    return data;
  },

  addAttempt: async (sessionId: string, payload: CreateTimerAttemptPayload): Promise<TimerAttempt> => {
    const { data } = await apiClient.post<TimerAttempt>(endpoints.timer.attempts(sessionId), payload);
    return data;
  },

  listSessions: async (params?: {
    mode?: TimerMode;
    limit?: number;
    cursor?: string;
  }): Promise<TimerSessionListResponse> => {
    const { data } = await apiClient.get<TimerSessionListResponse>(endpoints.timer.sessions, { params });
    return data;
  },

  getSession: async (sessionId: string): Promise<TimerSessionDetail> => {
    const { data } = await apiClient.get<TimerSessionDetail>(endpoints.timer.session(sessionId));
    return data;
  },

  getStats: async (): Promise<TimerStatsResponse> => {
    const { data } = await apiClient.get<TimerStatsResponse>(endpoints.timer.stats);
    return data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(endpoints.timer.session(sessionId));
  },
};
