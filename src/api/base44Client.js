import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

const _base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

// ── Global rate-limit retry wrapper ─────────────────────────────────────────
// Wraps entity CRUD + auth + integrations methods so that "Rate limit exceeded"
// errors are automatically retried with exponential backoff (max 3 retries).
// `subscribe` is excluded — it returns an unsubscribe function synchronously.
const RATE_LIMIT_MSG = 'Rate limit exceeded';
const MAX_RETRIES = 3;
const BASE_DELAY = 800; // ms
const SKIP_METHODS = new Set(['subscribe']);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRateLimitError(err) {
  return err?.message?.includes(RATE_LIMIT_MSG) || err?.error?.message?.includes(RATE_LIMIT_MSG);
}

async function withRetry(fn, retries = MAX_RETRIES) {
  try {
    return await fn();
  } catch (err) {
    if (retries > 0 && isRateLimitError(err)) {
      const delay = BASE_DELAY * Math.pow(2, MAX_RETRIES - retries);
      await sleep(delay);
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

function wrapProxy(obj) {
  return new Proxy(obj, {
    get(target, prop) {
      const val = target[prop];
      if (typeof val === 'function' && !SKIP_METHODS.has(prop)) {
        return (...args) => withRetry(() => val.apply(target, args));
      }
      if (val && typeof val === 'object') {
        return wrapProxy(val);
      }
      return val;
    },
  });
}

export const base44 = {
  ..._base44,
  entities: wrapProxy(_base44.entities),
  auth: wrapProxy(_base44.auth),
  integrations: wrapProxy(_base44.integrations),
  users: wrapProxy(_base44.users),
};