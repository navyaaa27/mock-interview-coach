/**
 * apiRetry.js — Universal exponential-backoff retry wrapper
 * P6.01: Wraps any async API call with automatic 429 / rate-limit retry
 */

/**
 * @param {Function} fn        - Async function to retry
 * @param {Object}   options
 * @param {number}   options.maxAttempts  - Max total attempts (default 3)
 * @param {number}   options.baseDelay   - Initial delay in ms (default 1000)
 * @param {number}   options.maxDelay    - Cap delay in ms (default 10000)
 * @param {Function} options.onRetry     - Called as onRetry(attempt, delayMs) before each retry
 */
export async function withRetry(fn, options = {}) {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null
  } = options;

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (err) {
      lastError = err;

      const is429 =
        err?.status === 429 ||
        err?.message?.includes('429') ||
        err?.message?.toLowerCase().includes('rate limit') ||
        err?.message?.toLowerCase().includes('too many requests') ||
        err?.message?.toLowerCase().includes('quota');

      // Only retry on 429 / rate-limit errors
      if (!is429 || attempt === maxAttempts) throw err;

      // Exponential backoff with jitter: 1s → 2s → 4s (capped at maxDelay)
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      const jitter = Math.random() * 500;
      const totalDelay = delay + jitter;

      if (onRetry) onRetry(attempt, totalDelay);

      await new Promise(r => setTimeout(r, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Returns true if the error is a 429 / rate-limit error
 */
export function is429Error(err) {
  return (
    err?.status === 429 ||
    err?.message?.includes('429') ||
    err?.message?.toLowerCase().includes('rate limit') ||
    err?.message?.toLowerCase().includes('too many requests') ||
    err?.message?.toLowerCase().includes('quota')
  );
}
