/**
 * Bump this when the announcement's content changes materially — every
 * user (per account, or per device for anonymous users) will see it once
 * more, regardless of having acknowledged a previous version.
 */
export const TRIAL_ANNOUNCEMENT_MODAL_VERSION = 1;

/** Route prefixes considered "another modal/critical dialog is open". */
export const BLOCKING_ROUTE_PREFIXES = [
  '/paywall',
  '/customer-center',
  '/settings',
  '/legal',
  '/signin',
] as const;

/** Route prefixes considered "inside the main authenticated app shell". */
export const MAIN_APP_ROUTE_PREFIXES = ['/train', '/dive', '/results', '/culture'] as const;
