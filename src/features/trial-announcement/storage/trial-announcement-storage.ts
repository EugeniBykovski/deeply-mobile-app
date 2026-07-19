import { fileSystemStorage } from '@/shared/lib/fileSystemStorage';

const ANONYMOUS_BUCKET = 'anonymous';

interface StoredAcknowledgement {
  acknowledgedVersion: number;
}

/**
 * Namespaced by user id (or a fixed device-level bucket for anonymous
 * users) so acknowledging on one account never hides the announcement
 * for another account signed in on the same device.
 */
function storageKey(userId: string | null): string {
  return `trial-announcement-ack:${userId ?? ANONYMOUS_BUCKET}`;
}

export async function getAcknowledgedVersion(userId: string | null): Promise<number | null> {
  const raw = await fileSystemStorage.getItem(storageKey(userId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredAcknowledgement;
    return typeof parsed.acknowledgedVersion === 'number' ? parsed.acknowledgedVersion : null;
  } catch {
    return null;
  }
}

export async function setAcknowledgedVersion(userId: string | null, version: number): Promise<void> {
  const payload: StoredAcknowledgement = { acknowledgedVersion: version };
  await fileSystemStorage.setItem(storageKey(userId), JSON.stringify(payload));
}
