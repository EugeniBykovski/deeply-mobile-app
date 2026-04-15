/**
 * Minimal className merge utility for NativeWind.
 * Concatenates truthy class strings, skipping falsy values.
 * For complex merging with conflict resolution, install `tailwind-merge`.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
