export const SOURCE_BASE = process.env.SOURCE_DATABASE_URL ?? 'https://source-database-809785351172.europe-north1.run.app';
export const TENANT = process.env.SOURCE_TENANT_ID ?? 'tanjaunlimited';

export async function sourceFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  // Allow override of X-Tenant header, otherwise use default
  if (!headers.has('X-Tenant')) {
    headers.set('X-Tenant', TENANT);
  }
  return fetch(`${SOURCE_BASE}${path}`, { ...init, headers, cache: 'no-store' });
}


