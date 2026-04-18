import { apiClient } from '../client';
import { endpoints } from '../endpoints';
import type { SubscriptionStatus } from '../types';

export const purchaseService = {
  /** Get cached subscription status from our backend */
  getStatus(): Promise<SubscriptionStatus> {
    return apiClient
      .get<SubscriptionStatus>(endpoints.purchases.status)
      .then((r) => r.data);
  },

  /**
   * Sync the subscription status from RevenueCat via our backend.
   * Call this after a successful in-app purchase or restore.
   */
  sync(): Promise<SubscriptionStatus> {
    return apiClient
      .post<SubscriptionStatus>(endpoints.purchases.sync)
      .then((r) => r.data);
  },
};
