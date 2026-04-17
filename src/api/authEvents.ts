/**
 * Lightweight event bus that breaks the circular dependency between
 * apiClient (src/api/client.ts) and authStore (src/store/authStore.ts).
 *
 * apiClient emits 'unauthorized' when a token refresh fails.
 * authStore registers a handler that calls clearAuth().
 *
 * Neither module imports the other directly.
 */

type Handler = () => void;

let _unauthorizedHandler: Handler | null = null;

export const authEvents = {
  /**
   * Register the handler that will be called when refresh fails.
   * Called once from authStore during bootstrap.
   */
  onUnauthorized(handler: Handler): void {
    _unauthorizedHandler = handler;
  },

  /**
   * Emit the unauthorized event.
   * Called from apiClient when token refresh fails permanently.
   */
  emitUnauthorized(): void {
    _unauthorizedHandler?.();
  },
};
