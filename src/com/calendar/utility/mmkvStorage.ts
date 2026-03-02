type StorageLike = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
};

// Lightweight in-memory storage to keep the QR screen from crashing when MMKV
// isn't configured. Swap this with a persistent store (MMKV/AsyncStorage) when
// available.
const memoryStore: Record<string, string> = {};

export const storage: StorageLike = {
  getString: key => memoryStore[key],
  set: (key, value) => {
    memoryStore[key] = value;
  },
};
