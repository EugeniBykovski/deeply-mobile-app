import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEntitlement } from '@/features/entitlement/useEntitlement';
import { getAcknowledgedVersion, setAcknowledgedVersion } from '../storage/trial-announcement-storage';
import {
  BLOCKING_ROUTE_PREFIXES,
  MAIN_APP_ROUTE_PREFIXES,
  TRIAL_ANNOUNCEMENT_MODAL_VERSION,
} from '../constants';

function isMainAppRoute(pathname: string): boolean {
  return MAIN_APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isBlockingRoute(pathname: string): boolean {
  return BLOCKING_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export interface UseTrialAnnouncementResult {
  visible: boolean;
  acknowledge: () => void;
}

/**
 * Evaluates once (per mount) whether the trial-announcement modal is
 * eligible to show, and exposes an `acknowledge()` action that closes it
 * and durably persists the acknowledgement so it never shows again for
 * this user/device at the current TRIAL_ANNOUNCEMENT_MODAL_VERSION.
 *
 * Mount this hook (via <TrialAnnouncementModal />) exactly once, at the
 * authenticated app-shell root — not per-tab/per-screen — so eligibility
 * is evaluated a single time rather than independently everywhere.
 */
export function useTrialAnnouncement(): UseTrialAnnouncementResult {
  const pathname = usePathname();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { isLoading: entitlementLoading, hasFullAccess } = useEntitlement();

  const [visible, setVisible] = useState(false);
  const acknowledgedRef = useRef(false);

  useEffect(() => {
    if (acknowledgedRef.current) return;
    if (entitlementLoading) return;
    if (hasFullAccess) return;
    if (!isMainAppRoute(pathname) || isBlockingRoute(pathname)) return;

    let cancelled = false;
    getAcknowledgedVersion(userId).then((acknowledgedVersion) => {
      if (cancelled) return;
      if (acknowledgedVersion === TRIAL_ANNOUNCEMENT_MODAL_VERSION) return;
      setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, userId, entitlementLoading, hasFullAccess]);

  const acknowledge = useCallback(() => {
    acknowledgedRef.current = true;
    setVisible(false);
    setAcknowledgedVersion(userId, TRIAL_ANNOUNCEMENT_MODAL_VERSION).catch(() => {});
  }, [userId]);

  return { visible, acknowledge };
}
