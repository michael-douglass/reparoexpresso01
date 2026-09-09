// Wraps an async API call with retry + exponential backoff for rate-limit (429) errors.
// Direct SDK calls (base44.entities.X.filter/list) bypass react-query, so they need this.
const isRateLimit = (e) => {
  const msg = (e?.message || '').toLowerCase();
  const status = e?.status || e?.response?.status;
  return status === 429 || msg.includes('rate limit');
};

export async function withRateLimitRetry(fn, { retries = 4, baseDelay = 800 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!isRateLimit(e)) throw e;
      if (attempt === retries) throw e;
      const delay = Math.min(baseDelay * 2 ** attempt, 8000);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}