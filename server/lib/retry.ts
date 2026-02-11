/**
 * Simple retry wrapper with exponential backoff for transient failures.
 * Used primarily for external API calls (Claude, etc.)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { maxRetries = 2, baseDelayMs = 1000 } = {},
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      // Don't retry client errors (4xx) or auth issues
      const status = err?.status ?? err?.statusCode;
      if (status && status >= 400 && status < 500) throw err;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
