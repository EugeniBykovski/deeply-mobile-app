import * as FileSystem from 'expo-file-system';

export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * FileSystem-backed key/value storage (new-arch compatible). Each key is
 * written to its own JSON file under `<documentDirectory>/<subdir>/`.
 * Every operation is best-effort — failures are swallowed rather than
 * thrown, since a storage failure should never crash the app; callers
 * simply don't get durable persistence for that write/read.
 */
export function createFileSystemStorage(options?: { subdir?: string }): KeyValueStorage {
  const dir = ((FileSystem as any).documentDirectory ?? '') + (options?.subdir ?? 'store') + '/';

  async function ensureDir() {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }

  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        await ensureDir();
        const path = dir + encodeURIComponent(key) + '.json';
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) return null;
        return await FileSystem.readAsStringAsync(path);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await ensureDir();
        const path = dir + encodeURIComponent(key) + '.json';
        await FileSystem.writeAsStringAsync(path, value);
      } catch {
        // Non-fatal — write is best-effort
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        const path = dir + encodeURIComponent(key) + '.json';
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) await FileSystem.deleteAsync(path);
      } catch {
        // Non-fatal
      }
    },
  };
}

export const fileSystemStorage = createFileSystemStorage();
