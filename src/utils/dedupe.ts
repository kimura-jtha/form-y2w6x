/**
 * Queued promise with resolve and reject handlers
 */
type QueuedPromise<T> = {
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
};

/**
 * AsyncDeduplicator interface
 */
export interface AsyncDeduplicator {
  /**
   * Execute an async operation with deduplication.
   * If the same key is already in progress, waits for that operation instead of starting a new one.
   *
   * @param key - Unique identifier for the operation
   * @param fn - Async function to execute
   * @returns Promise resolving to the function result
   *
   * @example
   * const dedup = createAsyncDeduplicator();
   *
   * // All three calls share the same execution
   * const [a, b, c] = await Promise.all([
   *   dedup.call('fetch-user', () => fetchUser(123)),
   *   dedup.call('fetch-user', () => fetchUser(123)),
   *   dedup.call('fetch-user', () => fetchUser(123))
   * ]);
   * // Only one fetchUser call is made
   */
  call<T>(key: string, fn: () => Promise<T>): Promise<T>;

  /**
   * Clear a specific key from the deduplicator.
   * Useful for manual invalidation or testing.
   *
   * @param key - The key to clear
   */
  clear(key: string): void;

  /**
   * Clear all keys from the deduplicator.
   * Useful for cleanup or testing.
   */
  clearAll(): void;
}

/**
 * Create an AsyncDeduplicator instance.
 *
 * Prevents duplicate async operations from running simultaneously.
 * When multiple calls are made with the same key, only the first executes
 * while others wait for its result.
 *
 * @returns AsyncDeduplicator instance
 *
 * @example
 * const dedup = createAsyncDeduplicator();
 *
 * async function fetchUser(id: number) {
 *   console.log('Fetching user', id);
 *   const response = await fetch(`/api/users/${id}`);
 *   return response.json();
 * }
 *
 * // Only one fetch executes despite 3 calls
 * const [user1, user2, user3] = await Promise.all([
 *   dedup.call('user:123', () => fetchUser(123)),
 *   dedup.call('user:123', () => fetchUser(123)),
 *   dedup.call('user:123', () => fetchUser(123))
 * ]);
 */
export function createAsyncDeduplicator(): AsyncDeduplicator {
  // Private state maintained through closure
  const queue = new Map<string, QueuedPromise<unknown>[]>();
  const pending = new Map<string, Promise<unknown>>();

  return Object.freeze({
    async call<T>(key: string, fn: () => Promise<T>): Promise<T> {
      // Check if operation already in progress
      const existing = pending.get(key);
      if (existing) {
        // Wait for existing operation by adding to queue
        return new Promise<T>((resolve, reject) => {
          const queued = queue.get(key) ?? [];
          queued.push({ resolve, reject } as QueuedPromise<unknown>);
          queue.set(key, queued);
        });
      }

      // Start new operation
      const promise = (async () => {
        try {
          const result = await fn();

          // Resolve all queued promises with the same result
          const queued = queue.get(key) ?? [];
          queued.forEach(({ resolve }) => resolve(result));

          return result;
        } catch (error) {
          // Reject all queued promises with the same error
          const queued = queue.get(key) ?? [];
          queued.forEach(({ reject }) => reject(error));

          throw error;
        } finally {
          // Cleanup - always runs regardless of success/failure
          queue.delete(key);
          pending.delete(key);
        }
      })();

      // Track pending operation and initialize queue
      pending.set(key, promise);
      queue.set(key, []);

      return promise as Promise<T>;
    },

    clear(key: string): void {
      queue.delete(key);
      pending.delete(key);
    },

    clearAll(): void {
      queue.clear();
      pending.clear();
    },
  });
}

// Singleton instance (lazy initialization)
let singletonInstance: AsyncDeduplicator | null = null;

/**
 * Get the singleton AsyncDeduplicator instance.
 *
 * Use this for global deduplication across your entire application.
 * For isolated deduplication or testing, use `createAsyncDeduplicator()` instead.
 *
 * @returns The singleton AsyncDeduplicator instance
 *
 * @example
 * import { asyncDeduplicator } from '@an-oct/vani-kit';
 *
 * // All calls across your app share the same deduplicator
 * const user = await asyncDeduplicator.call('user:123', () => fetchUser(123));
 */
export const asyncDeduplicator = {
  call: <T>(key: string, fn: () => Promise<T>) => {
    if (!singletonInstance) singletonInstance = createAsyncDeduplicator();
    return singletonInstance.call(key, fn);
  },
  clear: (key: string) => {
    if (!singletonInstance) singletonInstance = createAsyncDeduplicator();
    return singletonInstance.clear(key);
  },
  clearAll: () => {
    if (!singletonInstance) singletonInstance = createAsyncDeduplicator();
    return singletonInstance.clearAll();
  },
} as const;
