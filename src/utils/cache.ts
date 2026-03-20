type CacheEnvelope<T> = {
  expiresAt: number;
  value: T;
};

const CACHE_PREFIX = 'dyesabel_cache:';
const memoryCache = new Map<string, CacheEnvelope<unknown>>();

const isBrowser = () => typeof window !== 'undefined';

const getStorageKey = (key: string) => `${CACHE_PREFIX}${key}`;

const readStoredEnvelope = <T>(key: string): CacheEnvelope<T> | null => {
  if (!isBrowser()) return null;

  const memoryEntry = memoryCache.get(key) as CacheEnvelope<T> | undefined;
  if (memoryEntry) {
    if (memoryEntry.expiresAt > Date.now()) {
      return memoryEntry;
    }
    memoryCache.delete(key);
  }

  try {
    const raw = window.localStorage.getItem(getStorageKey(key));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || parsed.expiresAt <= Date.now()) {
      window.localStorage.removeItem(getStorageKey(key));
      return null;
    }

    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return null;
  }
};

const writeStoredEnvelope = <T>(key: string, value: T, ttlMs: number) => {
  if (!isBrowser()) return;

  const envelope: CacheEnvelope<T> = {
    expiresAt: Date.now() + ttlMs,
    value
  };

  memoryCache.set(key, envelope);

  try {
    window.localStorage.setItem(getStorageKey(key), JSON.stringify(envelope));
  } catch {
    // Ignore storage quota failures and keep memory cache only.
  }
};

export const getCachedValue = <T>(key: string): T | null => {
  return readStoredEnvelope<T>(key)?.value ?? null;
};

export const withLocalCache = async <T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  shouldCache: (value: T) => boolean = () => true
): Promise<T> => {
  const cachedValue = getCachedValue<T>(key);
  if (cachedValue !== null) {
    return cachedValue;
  }

  const freshValue = await fetcher();
  if (shouldCache(freshValue)) {
    writeStoredEnvelope(key, freshValue, ttlMs);
  }
  return freshValue;
};

export const invalidateLocalCache = (matcher?: string | RegExp) => {
  const shouldDelete = (key: string) => {
    if (!matcher) return true;
    if (typeof matcher === 'string') return key.startsWith(matcher);
    return matcher.test(key);
  };

  Array.from(memoryCache.keys()).forEach((key) => {
    if (shouldDelete(key)) {
      memoryCache.delete(key);
    }
  });

  if (!isBrowser()) return;

  try {
    const keysToRemove: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const storageKey = window.localStorage.key(index);
      if (!storageKey || !storageKey.startsWith(CACHE_PREFIX)) continue;

      const cacheKey = storageKey.slice(CACHE_PREFIX.length);
      if (shouldDelete(cacheKey)) {
        keysToRemove.push(storageKey);
      }
    }

    keysToRemove.forEach((storageKey) => window.localStorage.removeItem(storageKey));
  } catch {
    // Ignore storage access failures.
  }
};
