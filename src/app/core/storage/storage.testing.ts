/**
 * storage.testing.ts
 *
 * Test utilities for the STORAGE_TOKEN abstraction.
 *
 * - createStorageStub(): a fresh Map-backed Storage implementation per call,
 *   guaranteeing test isolation.
 * - createThrowingStorageStub(opts): wraps createStorageStub() but overrides
 *   getItem/setItem to throw on demand, enabling quota and unavailable scenarios.
 */

/**
 * Returns a fresh, isolated, Map-backed object that satisfies the Storage interface.
 * Each call produces a new Map — no cross-test state leaks.
 */
export function createStorageStub(): Storage {
  const map = new Map<string, string>();

  return {
    get length(): number {
      return map.size;
    },
    getItem(key: string): string | null {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      map.set(key, String(value));
    },
    removeItem(key: string): void {
      map.delete(key);
    },
    clear(): void {
      map.clear();
    },
    key(index: number): string | null {
      return Array.from(map.keys())[index] ?? null;
    },
  } as Storage;
}

export interface ThrowingStorageStubOptions {
  /** If true, getItem throws a generic Error on every call. */
  onGet?: boolean;
  /**
   * If 'quota', setItem throws a DOMException with name 'QuotaExceededError'.
   * If 'other', setItem throws a plain Error.
   */
  onSet?: 'quota' | 'other';
}

/**
 * Returns a Storage stub that delegates to createStorageStub() but overrides
 * getItem and/or setItem to throw, enabling quota and unavailable error scenarios.
 */
export function createThrowingStorageStub(opts: ThrowingStorageStubOptions): Storage {
  const inner = createStorageStub();

  return {
    get length(): number {
      return inner.length;
    },
    getItem(key: string): string | null {
      if (opts.onGet) {
        throw new Error('[ThrowingStorageStub] getItem is configured to throw');
      }
      return inner.getItem(key);
    },
    setItem(key: string, value: string): void {
      if (opts.onSet === 'quota') {
        throw new DOMException('QuotaExceededError: storage quota exceeded', 'QuotaExceededError');
      }
      if (opts.onSet === 'other') {
        throw new Error('[ThrowingStorageStub] setItem threw a non-quota error');
      }
      inner.setItem(key, value);
    },
    removeItem(key: string): void {
      inner.removeItem(key);
    },
    clear(): void {
      inner.clear();
    },
    key(index: number): string | null {
      return inner.key(index);
    },
  } as Storage;
}
