/**
 * Minimal event-logging stub — there is no analytics SDK wired into this
 * app yet. This exists so call sites (onboarding, etc.) have one stable
 * import to depend on now; swapping in a real provider later only means
 * changing this one file, not every call site.
 *
 * Never pass free-text/PII here — event names and property values should
 * be fixed enum-like strings (screen names, option keys), never user input.
 */
export type AnalyticsPropertyValue = string | number | boolean;

export function trackEvent(name: string, properties?: Record<string, AnalyticsPropertyValue>): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', name, properties ?? {});
  }
}
