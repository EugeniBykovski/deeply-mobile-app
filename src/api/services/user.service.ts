import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { User } from '../types';

export const userService = {
  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get<User>(endpoints.user.me);
    return data;
  },
};
